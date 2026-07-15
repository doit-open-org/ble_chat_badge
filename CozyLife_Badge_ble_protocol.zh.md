# CozyLife ble_chat_badge 蓝牙协议说明

## 1. BLE 产品 DP 控制协议

BLE 平台下，底层由 `CozyLife_ble_v1` 负责承载，设备模板层只处理 DP ID、类型和值。

### 1.1 DP 类型

| 类型 | 代码表现 | 说明 |
| --- | --- | --- |
| 数值 | `DP_TP_VALUE` | 以整数读写 |
| 字符串 | `DP_TP_STR` | 以十六进制 ASCII 字符串读写 |
| JSON 字符串 | `DP_TP_JSON_STR` | 当前使用普通字符串 |

### 1.2 DP 列表

| DPID | 标识 | 类型 | 方向 | 说明/取值 |
| ---: | --- | --- | --- | --- |
| 102 | `img_url` | String | 双向 |  |
| 106 | `video_url` | String | 双向 |  |
| 110 | `device_res` | Int | 单向 | 1、设备下载失败，2、设备忙，请稍后重试 ，3、设备未联网，请共享手机网络给设备，4、请通过蓝牙连接设备并共享网络 示例：{cmd: 10, len: 5, res: 110, data: 1、2、3、4} |
