import {
  init_ble,
  ble_dev_list,
  send_cmd1,
  connect_device,
  stop_ble_discovery,
  start_ble_discovery,
  isconnect
} from '../utils/ble/ble.js'

Page({
  data: {
    devicesList: [],
    scanning: true,
    connectingId: '',
    scanText: '正在搜索附近设备'
  },

  onLoad() {
    const deviceInfo = wx.getDeviceInfo ? wx.getDeviceInfo() : wx.getSystemInfoSync()
    wx.setStorageSync('platform', deviceInfo.platform || '')
    init_ble()
  },

  onShow() {
    this.startListRefresh()
    this.beginScan(false)
  },

  onHide() {
    this.stopPageTasks()
  },

  onUnload() {
    this.stopPageTasks()
    clearTimeout(this._connectTimer)
  },

  startListRefresh() {
    this.refreshDeviceList()
    clearInterval(this._refreshTimer)
    this._refreshTimer = setInterval(() => {
      this.refreshDeviceList()
    }, 1000)
  },

  refreshDeviceList() {
    const devicesList = ble_dev_list.map((device) => {
      const rssi = Number(device.RSSI || -100)
      return {
        ...device,
        displayName: device.localName || device.name || '四博显示设备',
        displayMac: device.mac || device.deviceId || '--',
        signalClass: this.getSignalClass(rssi),
        signalText: this.getSignalText(rssi),
        isConnect: isconnect(device.deviceId)
      }
    }).sort((a, b) => Number(b.RSSI || -100) - Number(a.RSSI || -100))

    this.setData({ devicesList })
  },

  getSignalClass(rssi) {
    if (rssi >= -60) return 'strong'
    if (rssi >= -70) return 'medium'
    if (rssi >= -80) return 'weak'
    return 'very-weak'
  },

  getSignalText(rssi) {
    if (rssi >= -60) return '信号很好'
    if (rssi >= -70) return '信号良好'
    if (rssi >= -80) return '信号一般'
    return '信号较弱'
  },

  beginScan(showToast = true) {
    clearTimeout(this._scanStartTimer)
    clearTimeout(this._scanStopTimer)
    stop_ble_discovery()

    this.setData({
      scanning: true,
      scanText: '正在搜索附近设备'
    })

    this._scanStartTimer = setTimeout(() => {
      start_ble_discovery()
    }, 400)

    this._scanStopTimer = setTimeout(() => {
      stop_ble_discovery()
      this.refreshDeviceList()
      this.setData({
        scanning: false,
        scanText: this.data.devicesList.length ? '扫描完成' : '暂未发现设备'
      })
    }, 12000)

    if (showToast) {
      wx.showToast({ title: '正在重新扫描', icon: 'none' })
    }
  },

  manualRefresh() {
    if (this.data.connectingId) return
    this.beginScan(true)
  },

  connectDevice(e) {
    const { deviceId, mac } = e.currentTarget.dataset
    if (!deviceId) {
      wx.showToast({ title: '设备信息不完整', icon: 'none' })
      return
    }

    if (this.data.connectingId) {
      wx.showToast({ title: '正在连接，请稍候', icon: 'none' })
      return
    }

    if (isconnect(deviceId)) {
      wx.navigateTo({
        url: `/pages/upload/upload?mac=${encodeURIComponent(mac || deviceId)}&devid=${encodeURIComponent(deviceId)}`
      })
      return
    }

    stop_ble_discovery()
    this.setData({ connectingId: deviceId })

    clearTimeout(this._connectTimer)
    this._connectTimer = setTimeout(() => {
      if (this.data.connectingId === deviceId) {
        this.setData({ connectingId: '' })
        wx.hideLoading()
        wx.showToast({ title: '连接超时，请靠近设备重试', icon: 'none' })
      }
    }, 13000)

    connect_device(
      deviceId,
      mac,
      () => {
        send_cmd1(deviceId)
      },
      () => {
        clearTimeout(this._connectTimer)
        this.setData({ connectingId: '' })
        wx.navigateTo({
          url: `/pages/upload/upload?mac=${encodeURIComponent(mac || deviceId)}&devid=${encodeURIComponent(deviceId)}`
        })
      }
    )
  },

  stopPageTasks() {
    clearInterval(this._refreshTimer)
    clearTimeout(this._scanStartTimer)
    clearTimeout(this._scanStopTimer)
    stop_ble_discovery()
  },

  onPullDownRefresh() {
    this.beginScan(false)
    setTimeout(() => wx.stopPullDownRefresh(), 600)
  }
})
