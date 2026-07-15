const { apiClient } = require('../../js/http_request.js')
const {
  show_success_toast,
  show_none_toast
} = require('../utils/common.js')

const appG = getApp().globalData

Page({
  data: {
    visible: false,
    selectIndex: -1,
    selectedItem: null,
    mac: '',
    devid: '',
    history: [],
    loadingHistory: false
  },

  onLoad(options) {
    this.setData({
      mac: this.safeDecode(options.mac),
      devid: this.safeDecode(options.devid)
    })
  },

  onShow() {
    this.setData({ visible: false })
    this.getHistory()
  },

  safeDecode(value = '') {
    try {
      return decodeURIComponent(value)
    } catch (err) {
      return value
    }
  },

  getTypeName(type) {
    const value = Number(type)
    if (value === 0) return '单图'
    if (value === 1) return '动图'
    return '视频'
  },

  getHistory() {
    if (!this.data.mac) {
      this.setData({ history: [] })
      return Promise.resolve()
    }

    this.setData({ loadingHistory: true })
    return apiClient({
      url: `${appG.doit_api}getfiles.php?did=${encodeURIComponent(this.data.mac)}`,
      method: 'GET'
    }).then((res) => {
      const source = Array.isArray(res && res.msg) ? res.msg : []
      const history = source.map((item) => ({
        ...item,
        type: Number(item.type),
        typeName: this.getTypeName(item.type),
        fullUrl: `${appG.doit_api}${item.path}`
      }))
      this.setData({ history })
    }).catch((err) => {
      console.error('获取历史记录失败', err)
      this.setData({ history: [] })
    }).then(() => {
      this.setData({ loadingHistory: false })
    })
  },

  goToUpload(e) {
    const type = Number(e.currentTarget.dataset.type)
    wx.navigateTo({
      url: `/pages/selectfile/selectfile?type=${type}&mac=${encodeURIComponent(this.data.mac)}&devid=${encodeURIComponent(this.data.devid)}`
    })
  },

  openHistoryMenu(e) {
    const selectIndex = Number(e.currentTarget.dataset.index)
    const selectedItem = this.data.history[selectIndex]
    if (!selectedItem) return

    this.setData({
      selectIndex,
      selectedItem,
      visible: true
    })
  },

  closeHistoryMenu() {
    this.setData({ visible: false })
  },

  preventBubble() {},

  useHistoryItem() {
    const item = this.data.selectedItem
    if (!item) return

    this.setData({ visible: false })
    wx.navigateTo({
      url: `/pages/selectfile/selectfile?type=${item.type}&path=${encodeURIComponent(item.path)}&mac=${encodeURIComponent(this.data.mac)}&devid=${encodeURIComponent(this.data.devid)}`
    })
  },

  deleteHistoryItem() {
    const item = this.data.selectedItem
    if (!item) return

    wx.showModal({
      title: '删除记录',
      content: '删除后无法恢复，确定删除这条内容记录吗？',
      confirmColor: '#E5484D',
      success: (modalRes) => {
        if (!modalRes.confirm) return

        const markerIndex = item.path.indexOf('uploads')
        const filePath = markerIndex >= 0
          ? item.path.slice(markerIndex + 'uploads'.length)
          : item.path

        wx.showLoading({ title: '正在删除', mask: true })
        apiClient({
          url: `${appG.doit_api}delFileById.php?did=${encodeURIComponent(item.did)}&id=${encodeURIComponent(item.id)}&path=${encodeURIComponent(filePath)}&type=${encodeURIComponent(item.type)}`,
          method: 'GET'
        }).then((res) => {
          show_none_toast((res && res.msg) || '删除完成')
          this.setData({ visible: false })
          return this.getHistory()
        }).catch((err) => {
          console.error('删除文件失败', err)
        }).then(() => {
          wx.hideLoading()
        })
      }
    })
  },

  onPullDownRefresh() {
    this.getHistory().then(() => {
      wx.stopPullDownRefresh()
      show_success_toast('已刷新')
    })
  }
})
