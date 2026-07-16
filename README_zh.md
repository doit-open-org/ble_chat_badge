# Ble Chat Badge（电子吧唧 · 蓝牙版）

[English](README.md)

一款基于 ESP32 的开源智能电子吧唧，支持 BLE 配置、AI 对话、图片/GIF/视频播放、蓝牙音箱、MP3、本地资源管理等功能。

面向开发者开放完整硬件与软件生态，可用于 AI 硬件、电子胸牌、会展互动、智能桌搭、教育开发等场景。

</p>

---

## 功能特点

- 🤖 AI Agent 接入
- 💬 AI 语音对话
- 📱 BLE（Bluetooth Low Energy）通信
- 📲 微信小程序管理
- 🖼 图片显示
- 🎞 GIF 动画播放
- 🎥 视频播放
- 🎵 本地 MP3 播放
- 🔊 蓝牙音箱
- ⏰ AI 闹钟
- 🌈 应援灯效果
- 🧠 自定义 AI 智能体
- 📂 USB 导入资源
- 💾 TF 卡资源管理
- 🔋 锂电池供电
- 🔌 USB 在线升级（OTA 可扩展）

---

## 应用场景

- AI Companion
- AI Badge
- AI Wearable
- Smart Desk Gadget
- Developer Platform
- Exhibition Badge
- Education
- BLE Display Terminal

---

## 硬件组成

- ESP32 系列 MCU
- 彩色显示屏
- Bluetooth Low Energy
- 扬声器
- 麦克风
- TF Card
- USB Type-C
- 锂电池
- RGB 灯

> 不同硬件版本可能略有差异。

---

## 软件架构

```
┌────────────────────────────┐
│      WeChat Mini Program    │
└──────────────┬─────────────┘
               │ BLE
               ▼
┌────────────────────────────┐
│       Ble Chat Badge        │
├────────────────────────────┤
│ UI                          │
│ BLE Service                 │
│ Media Manager               │
│ AI Assistant                │
│ Audio Player                │
│ Image Decoder               │
│ GIF Player                  │
│ Video Player                │
│ Storage Manager             │
└────────────────────────────┘
```

---

## 功能展示

支持：

- AI 对话
- 图片浏览
- GIF 动画
- 视频播放
- MP3 播放
- 蓝牙音乐
- AI 闹钟
- 首页轮播
- 应援灯
- 自定义智能体

---

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/doit-open-org/esp32s3_chat_badge.git
```

### 2. 安装 ESP-IDF

建议：

- ESP-IDF v5.x

### 3. 编译

```bash
idf.py build
```

### 4. 烧录

```bash
idf.py flash monitor
```

---

## 手机端

通过微信小程序可完成：

- BLE 配对
- AI 配置
- 图片上传
- GIF 上传
- 视频上传
- 音乐上传
- 智能体管理
- 设备设置

---

## 项目目录

```
.
├── docs/
├── firmware/
├── hardware/
├── tools/
├── examples/
└── README.md
```

---

## Roadmap

- [ ] BLE OTA
- [ ] Wi-Fi OTA
- [ ] 更多 AI Provider
- [ ] MQTT
- [ ] Matter
- [ ] Home Assistant
- [ ] Plugin SDK
- [ ] Custom App SDK

---


## License

MIT License

---

## 联系咨询

邮箱：

📧 lihonggang@doit.am

微信：

![微信联系方式](wx.jpg)

GitHub：

https://github.com/doit-open-org/esp32s3_chat_badge