import {
  init_ble,
  setDevice
} from '../utils/ble/ble.js'
import eventBus from '../utils/eventBus.js'

const {
  show_success_toast,
  show_error_toast,
  show_none_toast
} = require('../utils/common.js')

const appG = getApp().globalData

const TYPE_META = {
  0: {
    name: '单图显示',
    badge: 'IMAGE',
    description: '图片会裁剪为正方形，并压缩至设备适配尺寸。',
    chooseText: '选择一张图片',
    accentClass: 'accent-blue'
  },
  1: {
    name: '动图显示',
    badge: 'GIF',
    description: '选择 GIF 动图，服务器处理后发送到设备。',
    chooseText: '选择一个 GIF 动图',
    accentClass: 'accent-purple'
  },
  2: {
    name: '视频显示',
    badge: 'VIDEO',
    description: '视频会先压缩，再由服务器转换为设备格式。',
    chooseText: '选择一段视频',
    accentClass: 'accent-orange'
  }
}

Page({
  data: {
    type: 0,
    typeName: TYPE_META[0].name,
    typeBadge: TYPE_META[0].badge,
    typeDescription: TYPE_META[0].description,
    chooseText: TYPE_META[0].chooseText,
    accentClass: TYPE_META[0].accentClass,
    url: '',
    fbl: 368,
    mac: '',
    devid: '',
    isUploadingFile: false,
    isSending: false,
    stage: 'empty',
    statusText: '等待选择内容'
  },

  onLoad(options) {
    const type = Number(options.type || 0)
    const meta = TYPE_META[type] || TYPE_META[0]
    const path = this.safeDecode(options.path)
    const url = path ? `${appG.doit_api}${path}` : ''

    this.setData({
      type,
      typeName: meta.name,
      typeBadge: meta.badge,
      typeDescription: meta.description,
      chooseText: meta.chooseText,
      accentClass: meta.accentClass,
      url,
      mac: this.safeDecode(options.mac),
      devid: this.safeDecode(options.devid),
      stage: url ? 'ready' : 'empty',
      statusText: url ? '内容已就绪，可以发送' : '等待选择内容'
    })

    this._uploadFinishHandler = (payload) => this.handleDeviceResponse(payload)
    eventBus.on('upload', this._uploadFinishHandler)
  },

  onReady() {
    init_ble()
  },

  onUnload() {
    clearTimeout(this._sendTimeout)
    if (this._uploadFinishHandler) {
      eventBus.off('upload', this._uploadFinishHandler)
    }
    wx.hideLoading()
  },

  safeDecode(value = '') {
    try {
      return decodeURIComponent(value)
    } catch (err) {
      return value
    }
  },

  chooseSingleFile() {
    if (this.data.isUploadingFile || this.data.isSending) return

    const mediaType = this.data.type === 2 ? ['video'] : ['image']
    wx.chooseMedia({
      count: 1,
      mediaType,
      sourceType: ['album', 'camera'],
      maxDuration: 60,
      sizeType: this.data.type === 1 ? ['original'] : ['original', 'compressed'],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0]
        if (!file) return

        if (this.data.type === 0) {
          this.cropImage(file.tempFilePath)
        } else if (this.data.type === 2) {
          this.compressVideo(file.tempFilePath)
        } else {
          this.uploadSingleFile(file)
        }
      },
      fail: (err) => {
        if (err && err.errMsg && err.errMsg.includes('cancel')) return
        console.error('选择文件失败', err)
        show_none_toast('选择文件失败')
      }
    })
  },

  cropImage(tempFilePath) {
    this.setData({
      isUploadingFile: true,
      stage: 'processing',
      statusText: '正在裁剪图片'
    })
    wx.showLoading({ title: '裁剪中', mask: true })

    wx.cropImage({
      src: tempFilePath,
      cropScale: '1:1',
      success: (cropRes) => {
        this.setData({ statusText: '正在压缩图片' })
        wx.compressImage({
          src: cropRes.tempFilePath,
          quality: 80,
          compressedWidth: 368,
          compressedHeight: 368,
          success: (compressRes) => {
            this.uploadSingleFile(compressRes)
          },
          fail: (err) => {
            console.error('压缩图片失败', err)
            this.resetAfterProcessFailure('图片压缩失败')
          }
        })
      },
      fail: (err) => {
        if (err && err.errMsg && err.errMsg.includes('cancel')) {
          this.setData({ isUploadingFile: false, stage: this.data.url ? 'ready' : 'empty', statusText: this.data.url ? '内容已就绪，可以发送' : '等待选择内容' })
          wx.hideLoading()
          return
        }
        console.error('裁剪图片失败', err)
        this.resetAfterProcessFailure('图片裁剪失败')
      }
    })
  },

  compressVideo(tempFilePath) {
    this.setData({
      isUploadingFile: true,
      stage: 'processing',
      statusText: '正在压缩视频'
    })
    wx.showLoading({ title: '压缩中', mask: true })

    wx.compressVideo({
      src: tempFilePath,
      quality: 'medium',
      success: (compressRes) => {
        this.uploadSingleFile(compressRes)
      },
      fail: (err) => {
        console.error('压缩视频失败', err)
        this.resetAfterProcessFailure('视频压缩失败')
      }
    })
  },

  uploadSingleFile(file) {
    const filePath = file && (file.tempFilePath || file.path)
    if (!filePath) {
      this.resetAfterProcessFailure('没有获取到文件路径')
      return
    }

    this.setData({
      isUploadingFile: true,
      stage: 'uploading',
      statusText: '正在上传到服务器'
    })
    wx.showLoading({ title: '上传中', mask: true })

    const timestamp = Math.floor(Date.now() / 1000)
    wx.uploadFile({
      url: `${appG.doit_api}fileUpload.php`,
      filePath,
      name: 'file',
      formData: {
        type: this.data.type,
        fbl: this.data.fbl,
        uid: timestamp,
        did: this.data.mac
      },
      success: (res) => {
        console.log("r...",res)
        if (res.statusCode !== 200) {
          this.resetAfterProcessFailure('文件上传失败')
          return
        }

        try {
          const result = JSON.parse(res.data)
          if (!result.file) throw new Error('服务端未返回文件路径')

          this.setData({
            url: `${appG.doit_api}${result.file}`,
            isUploadingFile: false,
            stage: 'ready',
            statusText: '内容已就绪，可以发送'
          })
          wx.hideLoading()
          show_success_toast('文件准备完成')
        } catch (err) {
          console.error('解析上传结果失败', err)
          this.resetAfterProcessFailure('服务器返回异常')
        }
      },
      fail: (err) => {
        console.error('上传文件失败', err)
        this.resetAfterProcessFailure('文件上传失败')
      }
    })
  },

  resetAfterProcessFailure(message) {
    wx.hideLoading()
    this.setData({
      isUploadingFile: false,
      stage: this.data.url ? 'ready' : 'empty',
      statusText: this.data.url ? '内容已就绪，可以发送' : '等待选择内容'
    })
    show_error_toast(message)
  },

  sendToDevice() {
    if (!this.data.url) {
      show_none_toast('请先选择内容')
      return
    }

    // 完全保持旧版本上传按钮发送逻辑
    // 仅增加日志，方便确认实际下发参数
    const url = this.data.url.replace('https', 'http')
    const mac = this.data.devid

    console.log('[SEND DEVICE]', {
      url: url,
      mac: mac,
      type: this.data.type
    })

    if (!mac) {
      show_error_toast('设备ID为空，请重新连接设备')
      return
    }

    if (this.data.type == 0) {
      console.log('[CMD102]', url)
      setDevice(url, mac, 102)
    } else {
      const filePath = url.replace(/\.[^/.]+$/, '') + '.vpg'
      console.log('[CMD106]', filePath)
      setDevice(filePath, mac, 106)
    }

    wx.showLoading({
      title: '发送中...',
    })

    this.setData({
      stage: 'sending',
      statusText: '正在发送到设备'
    })
  },

  handleDeviceResponse(payload) {
    clearTimeout(this._sendTimeout)
    wx.hideLoading()
    const success = Boolean(payload && payload.success)
    this.setData({
      isSending: false,
      stage: success ? 'done' : 'ready',
      statusText: success ? '发送完成，设备正在更新显示' : '设备处理未完成，可再次发送'
    })
  }
})
