# CozyLife ble_chat_badge BLE Protocol Specification

## 1. BLE Product DP Control Protocol

Under the BLE platform, the underlying communication is handled by `CozyLife_ble_v1`. The device template layer only processes DP ID, type, and value.

### 1.1 DP Types

| Type | Code Representation | Description |
| --- | --- | --- |
| Value | `DP_TP_VALUE` | Read and write as integer values |
| String | `DP_TP_STR` | Read and write as hexadecimal ASCII strings |
| JSON String | `DP_TP_JSON_STR` | Currently used as a normal string |

### 1.2 DP List

| DPID | Identifier | Type | Direction | Description / Value |
| ---: | --- | --- | --- | --- |
| 102 | `img_url` | String | Bidirectional |  |
| 106 | `video_url` | String | Bidirectional |  |
| 110 | `device_res` | Int | Unidirectional | 1: Device download failed; 2: Device busy, please try again later; 3: Device is not connected to the network, please share the mobile network with the device; 4: Please connect the device via Bluetooth and share the network. Example: `{cmd: 10, len: 5, res: 110, data: 1, 2, 3, 4}` |
