const apiClient = (options) => new Promise((resolve, reject) => {
  wx.request({
    ...options,
    success: (res) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        resolve(res.data)
        return
      }

      const message = res.data && res.data.message ? res.data.message : '请求失败'
      wx.showToast({ title: message, icon: 'none' })
      reject(new Error(`请求失败，状态码：${res.statusCode}`))
    },
    fail: (err) => {
      wx.showToast({ title: '网络请求失败', icon: 'none' })
      reject(err)
    }
  })
})

module.exports = {
  apiClient
}
