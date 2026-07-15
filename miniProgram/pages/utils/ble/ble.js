// 实现cozylife  部分蓝牙协议，主要是"send cmd"
let {
  show_success_toast,
  show_error_toast,
  show_none_toast,
  show_loading_toast
} = require('../common.js')
import * as decrypt from "./decrypt.js"
import eventBus from '../eventBus.js'
let pid_list=['1eAKYY']
// 只搜索主服务 UUID 为下面的设备
const main_service = '0000A201-0000-1000-8000-00805F9B34FB'
let ble_dev_list = []
let device_id = "D7:D7:D7:42:51:EB"
let service_uuid = "00001910-0000-1000-8000-00805F9B34FB"
let character_uuid = "00002B11-0000-1000-8000-00805F9B34FB"
let value_change_character_uui = "00002B10-0000-1000-8000-00805F9B34FB"

let bleDatasSendArr = [] // 发送的蓝牙数据组包
let timer = null // 发送蓝牙数据的定时器
let isSending = false;
let sendFun = null
let dev_id = "" //设备返回的id
let bleDatasList = []
let bleDatasBackArr = [] // 接收多包蓝牙数据的组包缓存
let is_scanning = false
let is_connecting = false;
let is_connecting_timer=null
let current_connect = new Set()
let active_bind_success_cb = null
let value_change_listener_registered = false
let dev_mac_list=new Set()//记录发现设备mac地址，苹果系统会发现同一个设备两次
const CHECKSUM_TABLE = [
  0x00, 0x07, 0x0e, 0x09, 0x1c, 0x1b,
  0x12, 0x15, 0x38, 0x3f, 0x36, 0x31, 0x24, 0x23, 0x2a,
  0x2d, 0x70, 0x77, 0x7e, 0x79, 0x6c, 0x6b, 0x62, 0x65,
  0x48, 0x4f, 0x46, 0x41, 0x54, 0x53, 0x5a, 0x5d, 0xe0,
  0xe7, 0xee, 0xe9, 0xfc, 0xfb, 0xf2, 0xf5, 0xd8, 0xdf,
  0xd6, 0xd1, 0xc4, 0xc3, 0xca, 0xcd, 0x90, 0x97, 0x9e,
  0x99, 0x8c, 0x8b, 0x82, 0x85, 0xa8, 0xaf, 0xa6, 0xa1,
  0xb4, 0xb3, 0xba, 0xbd, 0xc7, 0xc0, 0xc9, 0xce, 0xdb,
  0xdc, 0xd5, 0xd2, 0xff, 0xf8, 0xf1, 0xf6, 0xe3, 0xe4,
  0xed, 0xea, 0xb7, 0xb0, 0xb9, 0xbe, 0xab, 0xac, 0xa5,
  0xa2, 0x8f, 0x88, 0x81, 0x86, 0x93, 0x94, 0x9d, 0x9a,
  0x27, 0x20, 0x29, 0x2e, 0x3b, 0x3c, 0x35, 0x32, 0x1f,
  0x18, 0x11, 0x16, 0x03, 0x04, 0x0d, 0x0a, 0x57, 0x50,
  0x59, 0x5e, 0x4b, 0x4c, 0x45, 0x42, 0x6f, 0x68, 0x61,
  0x66, 0x73, 0x74, 0x7d, 0x7a, 0x89, 0x8e, 0x87, 0x80,
  0x95, 0x92, 0x9b, 0x9c, 0xb1, 0xb6, 0xbf, 0xb8, 0xad,
  0xaa, 0xa3, 0xa4, 0xf9, 0xfe, 0xf7, 0xf0, 0xe5, 0xe2,
  0xeb, 0xec, 0xc1, 0xc6, 0xcf, 0xc8, 0xdd, 0xda, 0xd3,
  0xd4, 0x69, 0x6e, 0x67, 0x60, 0x75, 0x72, 0x7b, 0x7c,
  0x51, 0x56, 0x5f, 0x58, 0x4d, 0x4a, 0x43, 0x44, 0x19,
  0x1e, 0x17, 0x10, 0x05, 0x02, 0x0b, 0x0c, 0x21, 0x26,
  0x2f, 0x28, 0x3d, 0x3a, 0x33, 0x34, 0x4e, 0x49, 0x40,
  0x47, 0x52, 0x55, 0x5c, 0x5b, 0x76, 0x71, 0x78, 0x7f,
  0x6a, 0x6d, 0x64, 0x63, 0x3e, 0x39, 0x30, 0x37, 0x22,
  0x25, 0x2c, 0x2b, 0x06, 0x01, 0x08, 0x0f, 0x1a, 0x1d,
  0x14, 0x13, 0xae, 0xa9, 0xa0, 0xa7, 0xb2, 0xb5, 0xbc,
  0xbb, 0x96, 0x91, 0x98, 0x9f, 0x8a, 0x8d, 0x84, 0x83,
  0xde, 0xd9, 0xd0, 0xd7, 0xc2, 0xc5, 0xcc, 0xcb, 0xe6,
  0xe1, 0xe8, 0xef, 0xfa, 0xfd, 0xf4, 0xf3
];
let init_success = false
let init_in_progress = false
let platform = ''
//13:A6:53:29:AA:6B
const init_ble = () => {
  if (init_success) {
    start_ble_discovery()
    return
  }
  if (init_in_progress) {
    return
  }
  init_in_progress = true
  platform = wx.getStorageSync('platform')
  // 初始化蓝牙模块
  wx.openBluetoothAdapter({
    mode: 'central',
    success: (res) => {
      init_in_progress = false
      init_success = true
      wx.onBLEConnectionStateChange(function (res) {
        // 该方法回调中可以用于处理连接意外断开等异常情况
        console.log(`device ${res.deviceId} state has changed, connected: ${res.connected}`)
        // show_none_toast('设备连接状态发生变化',res.deviceId)
        if (res.connected) {
          // show_success_toast('设备已连接')
        } else {
          show_none_toast('与设备断开连接',3000)
          // 连接新设备失败也会触发与设备断开连接
          if (current_connect.has(res.deviceId)) {
            current_connect.delete(res.deviceId)
            setTimeout(() => {
              wx.reLaunch({
                url: '/pages/connect/connect'
              })
            }, 1200)
          }

        }
      })
      // 监听扫描到新设备事件
      wx.onBluetoothDeviceFound((res) => {

        // console.log('qwe',ble_dev_list);
        res.devices.forEach((device) => {
          // 这里可以做一些过滤
          // if (device.deviceId == device_id) {
          //   connect_device(device.deviceId)
          // }
          const serviceDataMap = device.serviceData || {}
          const serviceDataKey = Object.keys(serviceDataMap).find(key => key.toUpperCase() === main_service)
          const serviceData = serviceDataMap[main_service] || serviceDataMap[main_service.toLowerCase()] || (serviceDataKey ? serviceDataMap[serviceDataKey] : null)
          const info = _getClInfo(serviceData)
          if (!info || pid_list.indexOf(info.pid) < 0) {
            return
          }

          device.mac = info.mac
          const deviceIndex = ble_dev_list.findIndex(item => item.mac === info.mac)
          if (deviceIndex >= 0) {
            Object.assign(ble_dev_list[deviceIndex], device)
          } else {
            dev_mac_list.add(info.mac)
            ble_dev_list.push(device)
            console.log('Device Found', device)
          }
         
          // if (platform == 'ios') {
          //   const info = _getClInfo(device.serviceData["0000A201-0000-1000-8000-00805F9B34FB"])
          //   device.mac = info.mac
          //   console.log(info);
          //   ble_dev_list.push(device)
          // } else if (platform == 'android') {
          //   ble_dev_list.push(device)
          // } else {
          //   console.log('未知操作系统');
          // }

          
        })
        // 找到要搜索的设备后，及时停止扫描
        // wx.stopBluetoothDevicesDiscovery()
      })
      // 开始搜索附近的蓝牙外围设备
      is_scanning = false
      start_ble_discovery()
    },
    fail: (res) => {
      init_in_progress = false
      if (res.errCode !== 10001) {
        ble_common_error_handle(res.errCode)
        return
      }
      wx.showToast({
        title: '手机蓝牙未开启或不支持蓝牙',
        icon: 'none'
      })
      wx.onBluetoothAdapterStateChange((res) => {
        if (!res.available) {
          wx.showToast({
            title: '你已关闭蓝牙',
            icon: 'none'
          })
          return
        }

        wx.showToast({
          title: '蓝牙已开启',
          icon: 'none'
        })
        init_ble()
      })
    }
  })
  // 苹果系统需两次初始化
  wx.openBluetoothAdapter({
    mode: 'peripheral',
    success: (res) => {
      console.log('外围设备模式初始化成功',res);   
    },
    fail: (res) => {
      console.log('外围设备模式初始化失败',res);
    }
  })
}

function character_value_change(result, bind_success_cb) {
  let deviceId = result.deviceId
  let value = result.value
  console.log('data change', value);
  let datas = Array.from(new Uint8Array(value));
  console.log('data', datas);
  if (datas.length < 20) {
    console.log('忽略长度不足的蓝牙通知包', datas.length)
    return
  }
  //先校验CRC8
  if (crc8(datas.slice(0, 19)) != datas[19]) {
    console.log("CRC8校验异常：", crc8(datas.slice(0, 19)))
    return
  }
  // 包序号从 0 重新开始时清空旧缓存，避免异常残包污染下一条消息
  const packetIndex = datas[1] & 0x7F
  if (packetIndex === 0) {
    bleDatasBackArr = []
  }

  // 蓝牙数据包组包
  bleDatasBackArr = [...bleDatasBackArr, ...datas.slice(2, 19)]

  // 如果是最后一包，交给协议层解析
  if (datas[1] >= 128) {
    const message = decrypt.decryptBluetoothMessage(bleDatasBackArr)
    console.log('lmsg...', message)

    if (message) {
      is_connecting = false
      clearTimeout(is_connecting_timer)

      if (message.cmd == 1) {
        if (message.res == 0) {
          console.log('设备绑定成功')
          show_success_toast('连接成功')
          if (typeof bind_success_cb === 'function') {
            bind_success_cb()
          }
        } else {
          show_error_toast('设备连接确认失败')
        }
      } else if (message.cmd == 10) {
        console.log('lmsg111...', message)
        console.log('lmsg1101...', message.data == 4)
        if (message.data == 1) {
        //   wx.showToast({ title: '设备下载失败', icon: 'none' })
        wx.showModal({
            title: "提示",
            content: "设备下载失败",
            showCancel: false
        })
        } else if (message.data == 2) {
        //   wx.showToast({ title: '设备忙，请稍后重试', icon: 'none', duration: 3000 })
          wx.showModal({
            title: "提示",
            content: "设备忙，请稍后重试",
            showCancel: false
        })
        } else if (message.data == 3) {
        //   wx.showToast({ title: '设备未联网，请共享手机网络给设备', icon: 'none', duration: 3000 })
        wx.showModal({
            title: "提示",
            content: "设备未联网，请共享手机网络给设备",
            showCancel: false
        })
        } else if (message.data == 4) {
        //   wx.showToast({ title: '请通过蓝牙连接设备并共享网络', icon: 'none', 
        //   duration: 3000 })
            wx.showModal({
                title: "提示",
                content: "请通过蓝牙连接设备并共享网络",
                showCancel: false
            })
        } else if (message.data == 0) {
        //   wx.showToast({ title: '上传成功', icon: 'success' })
            wx.showModal({
                title: "提示",
                content: "上传成功",
                showCancel: false
            })
        }
        eventBus.emit('upload', { success: message.data == 0, message })
      } else if (message.cmd == 0) {
        dev_id = message.dev_id
      }

      setTimeout(() => {
        wx.hideLoading()
      }, 800)
    }

    bleDatasBackArr = []
  }
}
/**
 * 将微信API转换为Promise
 * @private
 */
function _promisify(fn, params = {}) {
  return new Promise((resolve, reject) => {
    fn({
      ...params,
      success: resolve,
      fail: reject
    });
  });
}
const connect_device = (deviceId, mac, connect_success_cb, bind_success_cb) => {
  if (is_connecting) {
    return
  }
  const target = ble_dev_list.filter(item => item.deviceId == deviceId)
  if (target.length == 0) {
    show_none_toast('未搜索到设备')
    return
  }
  if (current_connect.has(deviceId)) {
    wx.navigateTo({
      url: `/pages/upload/upload?mac=${mac}&devid=${deviceId}`,
    })
    return
  }
  is_connecting = true
  // 保证一段时间后设备处于未连接状态，防止设备不下发连接成功指令
  is_connecting_timer = setTimeout(() => {
    is_connecting = false
    wx.hideLoading()
  }, 12000)
  wx.showLoading({
    title: '连接中',
  })

  //安卓微信蓝牙会出现设置连接timeout不生效bug，2025-10-26仍未修复
  // let timer=setTimeout(()=>{
  //   wx.hideLoading()
  //   show_error_toast('连接超时，请确认设备已开启')
  //   wx.closeBLEConnection({
  //     deviceId: deviceId,
  //   })
  // },5000)
  // 操作之前先监听，保证第一时间获取数据；全局只注册一次，重连时更新当前绑定回调
  active_bind_success_cb = bind_success_cb
  if (!value_change_listener_registered) {
    wx.onBLECharacteristicValueChange((result) => {
      character_value_change(result, active_bind_success_cb)
    })
    value_change_listener_registered = true
  }
  wx.createBLEConnection({
    deviceId, // 搜索到设备的 deviceId
    timeout: 5000,
    success: async () => {
      try {
        // 获取服务和特征值，确认固定协议 UUID 可用
        const servicesRes = await _promisify(wx.getBLEDeviceServices, {
          deviceId
        })
        console.log('获取服务列表:', servicesRes.services)

        const charsRes = await _promisify(wx.getBLEDeviceCharacteristics, {
          deviceId,
          serviceId: service_uuid
        })
        console.log('获取特征值列表:', charsRes.characteristics)

        // 必须先启用通知，再发送绑定命令，避免设备快速应答时丢包
        await _promisify(wx.notifyBLECharacteristicValueChange, {
          deviceId,
          serviceId: service_uuid,
          characteristicId: value_change_character_uui,
          state: true
        })
        console.log('启用事件监听成功')

        current_connect.add(deviceId)
        if (typeof connect_success_cb === 'function') {
          connect_success_cb()
        }
      } catch (err) {
        console.error('初始化蓝牙服务失败', err)
        is_connecting = false
        clearTimeout(is_connecting_timer)
        wx.hideLoading()
        ble_common_error_handle(err.errCode)
        wx.closeBLEConnection({ deviceId })
      }
    },
    fail: (err) => {
      console.log(err);
      if (err.errCode == -1) {
        console.error('con cb');
        // show_success_toast('已连接')
        current_connect.add(deviceId)
        if (typeof connect_success_cb === 'function') {
          connect_success_cb()
        }
      } else {
        console.error(err)
        ble_common_error_handle(err.errCode)
      }
      is_connecting = false
      clearTimeout(is_connecting_timer)
      wx.hideLoading()
      // show_error_toast('连接失败，请重试')
    },
    complete: (res) => {

      setTimeout(res => {

        // show_none_toast('连接超时')
        wx.hideLoading()
      }, 10000)
    }
  })
}
const getcharacter = (device_id) => {
  wx.getBLEDeviceCharacteristics({
    deviceId: device_id, // 搜索到设备的 deviceId
    serviceId: service_uuid, // 上一步中找到的某个服务
    success: (res) => {
      console.log(res.characteristics);
      console.log('character length', res.characteristics.length);
      for (let i = 0; i < res.characteristics.length; i++) {
        let item = res.characteristics[i]
        if (item.properties.write) { // 该特征值可写
          character_uuid = item.uuid
          console.log('chara', character_uuid);
          console.log('可写');
          // 本示例是向蓝牙设备发送一个 0x00 的 16 进制数据
          // 实际使用时，应根据具体设备协议发送数据
          let buffer = new ArrayBuffer(1)
          let dataView = new DataView(buffer)
          dataView.setUint8(0, 0)
          wx.writeBLECharacteristicValue({
            deviceId: device_id,
            serviceId: service_uuid,
            characteristicId: item.uuid,
            value: buffer,
            success: (res) => {
              console.log('send success', res);
            },
            fail: (err) => {
              console.log('send fail', err);
            }
          })
        }
        if (item.properties.read) { // 该特征值可读
          console.log('可读');
          wx.readBLECharacteristicValue({
            device_id,
            service_uuid,
            characteristicId: item.uuid,
          })
        }
        if (item.properties.notify || item.properties.indicate) {
          // 必须先启用 wx.notifyBLECharacteristicValueChange 才能监听到设备 onBLECharacteristicValueChange 事件
          console.log('启用事件监听');
          wx.notifyBLECharacteristicValueChange({
            deviceId: device_id,
            serviceId: service_uuid,
            characteristicId: item.uuid,
            state: true,
            success: (res) => {
              console.log("启用事件监听成功", res);
              // 操作之前先监听，保证第一时间获取数据
              wx.onBLECharacteristicValueChange((result) => {
                let bleDatasBackArr = [];
                let deviceId = result.deviceId
                let value = result.value
                console.log('data change', result);
                let datas = Array.from(new Uint8Array(value));
                //先校验CRC8
                if (crc8(datas.slice(0, 19)) != datas[19]) {
                  console.log("CRC8校验异常：", crc8(datas.slice(0, 19)))
                  return
                }

                //蓝牙数据包组包
                bleDatasBackArr = [...bleDatasBackArr, ...datas.slice(2, 19)]

                //如果是最后一包那就清空并返回给页面处理方法
                if (datas[1] >= 128) {
                  const message = decrypt.decryptBluetoothMessage(bleDatasBackArr);
                  console.log('lmsg', message);
                  if (message.cmd == 0) {
                    dev_id = message.dev_id
                  }
                  // fn(message, deviceId)
                  bleDatasBackArr = [];
                }
                // 使用完成后在合适的时机断开连接和关闭蓝牙适配器
                // wx.closeBLEConnection({
                //   deviceId,
                // })
                // wx.closeBluetoothAdapter({})
              })
            },
            fail: (err) => {
              console.log("启用事件监听失败", err);
            }
          })

        }
      }
    },
    fail: (res) => {
      console.error(res);
      ble_common_error_handle(res.errCode)
    }
  })
}
// 获取广播包信息
function _getClInfo(buffer) {
  if (buffer == null || buffer.byteLength < 14) {
    return null
  }
  const dv = new DataView(buffer);
  let offset = 0;
  const version = dv.getUint8(offset);
  offset += 1;
  const type = dv.getUint8(offset);
  offset += 1;

  const pidBytes = new Uint8Array(buffer, offset, 6);
  offset += 6;
  let pid = '';
  for (let i = 0; i < pidBytes.length; i++) {
    if (pidBytes[i] === 0) break; // C字符串结束符
    pid += String.fromCharCode(pidBytes[i]);
  }
  let macBytes = new Uint8Array(buffer, offset, 6);
  let mac = Array.from(macBytes).reverse()
    .map(b => b.toString(16).padStart(2, '0'))
    .join(':')
    .toUpperCase();
  return {
    ver: version,
    type: type,
    pid: pid,
    mac: mac
  };
}

function send_msg(order, mac) {
  isSending = true;
  let sendDatas = new Uint8Array(order.length);
  for (let i = 0; i < order.length; i++) {
    sendDatas[i] = order[i]
  }

  wx.writeBLECharacteristicValue({
    characteristicId: character_uuid,
    deviceId: mac,
    serviceId: service_uuid,
    value: sendDatas.buffer,
    success: (res) => {
      console.log('发送成功');
      isSending = false;
    },
    fail: (err) => {
      console.log("[2][error]3.sendMsg 发送指令失败:", err);
      isSending = false;
      ble_common_error_handle(err.errCode)
    }
  })
}

function ble_common_error_handle(code) {
  switch (code) {
    case 10000:
      show_error_toast('蓝牙适配器未初始化')
      break;
    case 10001:
      show_error_toast('当前蓝牙适配器不可用')
      break
    case 10002:
      show_error_toast('没有找到指定蓝牙设备')
      break
    case 10003:
      show_error_toast('发起通信连接失败');
      break
    case 10004:
      show_error_toast('没有找到指定服务');
      break
    case 10005:
      show_error_toast('没有找到指定特征');
      break
    case 10006:
      show_error_toast('当前连接已断开');
      break
    case 10007:
      show_error_toast('当前设备不支持发送数据');
      break
    case 10008:
      // show_error_toast('系统错误');
      break
    case 10009:
      show_error_toast('系统版本不支持BLE');
      break
    case 10012:
      show_error_toast('连接超时');
      break
    case 10013:
      show_error_toast('设备id有误，请重新连接');
      break
    default:
      show_error_toast('未知错误')
      break;
  }
}
const getservice = (deviceId) => {
  wx.getBLEDeviceServices({
    deviceId, // 搜索到设备的 deviceId
    success: (res) => {
      console.log(res.services);
      for (let i = 0; i < res.services.length; i++) {
        if (res.services[i].isPrimary) {
          // 可根据具体业务需要，选择一个主服务进行通信
          if (res.services[i].uuid == service_uuid) {
            getcharacter(deviceId)
            return
          }

        }
      }
    },
    fail: (err) => {
      console.log(err);
      ble_common_error_handle(err.errCode)
    }
  })
}
//CMD:1, 发送配网信息（随便发送wifi和密码，只是让设备确认配网了）由于要兼容旧协议，两个命令都要发送
function send_cmd1(mac) {
  // show_loading_toast('绑定中')
  let cmd = 1,
    len = 163,
    ssid = new Array(32).fill(1),
    passwd = new Array(64).fill(1),
    bssid = new Array(6).fill(1),
    dev_key = new Array(10).fill(68),
    open_id = new Array(33).fill(1),
    lat = new Array(4).fill(1),
    lng = new Array(4).fill(1),
    domain = new Array(10).fill(1);


//   const hasDomainGrouppackage = [cmd, len, ...ssid, ...passwd, ...bssid, ...dev_key, ...open_id, ...lat, ...lng, ...domain];
//   console.log("hasDomainGrouppackage...",hasDomainGrouppackage)
  const noDomainGrouppackage = [cmd, 153, ...ssid, ...passwd, ...bssid, ...dev_key, ...open_id, ...lat, ...lng, ];


  // 分包
//   const hasDomainSubpackageArr = getSubpackage(hasDomainGrouppackage);
  const noDomainSubpackageArr = getSubpackage(noDomainGrouppackage);

//   sendSubpackageArr(hasDomainSubpackageArr, mac)
  sendSubpackageArr(noDomainSubpackageArr, mac);
}

function ab2hex(buffer) {
  var hexArr = Array.prototype.map.call(
    new Uint8Array(buffer),
    function (bit) {
      return ('00' + bit.toString(16)).slice(-2)
    }
  )
  return hexArr.join('');
}

const start_ble_discovery = () => {
  if (!init_success) {
    init_ble()
    return
  }
  if (is_scanning) {
    return
  }

  is_scanning = true
  wx.startBluetoothDevicesDiscovery({
    services: [main_service],
    success: () => {
      is_scanning = true
    },
    fail: (res) => {
      is_scanning = res.errCode === 10008
      console.error(res)
      ble_common_error_handle(res.errCode)
    }
  })
}
const stop_ble_discovery = () => {
  if (!init_success || !is_scanning) {
    return
  }

  wx.stopBluetoothDevicesDiscovery({
    success: () => {
      is_scanning = false
    },
    fail: (res) => {
      is_scanning = false
      console.error(res)
      ble_common_error_handle(res.errCode)
    }
  })
}
/**
 * //获取当前时间戳的16进制数
 */
function timestampToHexIntArray() {
  // @ts-ignore
  let b = parseInt(new Date().getTime() / 1000).toString(16)
  let c = [1, 1, 1, 1]
  c[3] = parseInt(b.substring(0, 2), 16)
  c[2] = parseInt(b.substring(2, 4), 16)
  c[1] = parseInt(b.substring(4, 6), 16)
  c[0] = parseInt(b.substring(6, 8), 16)
  return c;
}
/**
 * CMD0:查询设备信息 
 */
const queryDevice = () => {
  const cmd = 0,
    len = 4;
  const cmd0 = [cmd, len, ...timestampToHexIntArray()];
  // 分包
  const cmd0SubpackageArr = getSubpackage(cmd0);
  // 发包
  console.log("发送cmd0查询设备信息..", cmd0SubpackageArr);
  sendSubpackageArr(cmd0SubpackageArr)
}

function strToIntCharArr(str) {
  return [...str].map(char => char.charCodeAt(0));
}
const setDevice = (url, mac, type) => {
  const cmd = 3
  console.log(url);
  const charArray = strToIntCharArr(url)
  let len = charArray.length
  console.log('char array', charArray, len);
  const cmd0 = [cmd, len + 1, type, ...charArray];
  console.log('cmd0', cmd0);
  // 分包
  const cmd0SubpackageArr = getSubpackage(cmd0);
  // 发包
  console.log("发送cmd3设置设备信息..", cmd0SubpackageArr);
  sendSubpackageArr(cmd0SubpackageArr, mac)
}

function sendSubpackageArr(subpackageArr, mac) {
  // 将待发送的数据放入栈内
  bleDatasSendArr = [...bleDatasSendArr, ...subpackageArr];
  // 将栈内数据全部发送给蓝牙
  clearInterval(timer);
  timer = setInterval(() => {
    if (!bleDatasSendArr.length) {
      clearInterval(timer);
      return;
    }
    // 阻止并行：等待上一个发送成功再发送下一个
    !isSending && send_msg(bleDatasSendArr.shift(), mac);
  }, 100)

}
/**
 * crc8校验
 * @param buffer 
 */
function crc8(buffer) {
  let crc = 0;
  for (let i = 0; i < buffer.length; i++) {
    crc = CHECKSUM_TABLE[(crc ^ (buffer[i] & 0xFF)) & 0xFF];
  }
  return (crc & 0xff);
}

function getSubpackage(grouppackage) {
  // 协议版本号
  const version = 3;
  // 包序号
  let pkg_sn = 0;
  // 本次命令的所有分包
  let subpackageArr = [];

  for (let i = 0; i < grouppackage.length; i += 17) {
    // 分包数据
    let subpackage = [version, pkg_sn, ...grouppackage.slice(i, i + 17)];
    // @ts-ignore
    console.log('pksn', parseInt(grouppackage.length / 17));
    //当length是17的整数倍时，单独讨论（因为最后一个包的第二个字节必须进下面判断，不然7014解析不了）
    if (pkg_sn == parseInt(grouppackage.length / 17) || (pkg_sn == parseInt(grouppackage.length / 17) - 1 && grouppackage.length % 17 == 0)) {
      subpackage[1] = subpackage[1] + 128
    }
    // 补全为19个
    if (subpackage.length != 19) {
      let cha = 19 - subpackage.length
      for (let j = 0; j < cha; j++) {
        subpackage.push(0)
      }
    }
    // 包序号++
    pkg_sn += 1;
    // 加入crc8校验位
    subpackage.push(crc8(subpackage));
    // 分包成功，放入总分包数组
    subpackageArr.push(subpackage);
  }
  return subpackageArr;
}
function isconnect(mac){
  return current_connect.has(mac)
}

export {
  init_ble,
  queryDevice,
  setDevice,
  ble_dev_list,
  send_cmd1,
  connect_device,
  start_ble_discovery,
  stop_ble_discovery,
  current_connect,
  pid_list,
  isconnect
}