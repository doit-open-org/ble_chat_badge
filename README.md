# Ble Chat Badge (Bluetooth Edition)

[中文](README_zh.md)

An open-source smart badge powered by ESP32, featuring BLE communication, AI interaction, image/GIF/video playback, Bluetooth speaker, MP3 player, and extensible application development.

Designed for makers, developers, educators, and AI hardware enthusiasts.

</p>

---

# Features

- 🤖 AI Agent Integration
- 💬 AI Voice Chat
- 📱 Bluetooth Low Energy (BLE)
- 📲 WeChat Mini Program Configuration
- 🖼 Image Viewer
- 🎞 GIF Animation
- 🎥 Video Playback
- 🎵 Local MP3 Player
- 🔊 Bluetooth Speaker
- ⏰ AI Alarm Clock
- 🌈 RGB Cheer Light
- 🧠 Custom AI Agents
- 📂 USB Media Import
- 💾 TF Card Storage
- 🔋 Rechargeable Battery
- 🔌 OTA Ready

---

# Applications

- AI Companion
- Smart Badge
- AI Wearable
- Smart Display
- Developer Platform
- Exhibition Badge
- Education
- BLE Display Terminal

---

# Hardware

- ESP32 Series MCU
- Color Display
- Bluetooth Low Energy
- Speaker
- Microphone
- TF Card
- USB Type-C
- Rechargeable Battery
- RGB LED

> Hardware specifications may vary across different versions.

---

# Software Architecture

```
┌────────────────────────────┐
│     WeChat Mini Program     │
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

# Capabilities

Supports:

- AI Chat
- Image Display
- GIF Playback
- Video Playback
- MP3 Playback
- Bluetooth Audio
- AI Alarm
- Home Carousel
- RGB Cheer Light
- Custom AI Agents

---

# Getting Started

## Clone

```bash
git clone https://github.com/doit-open-org/esp32s3_chat_badge.git
```

## Install ESP-IDF

Recommended:

- ESP-IDF v5.x

## Build

```bash
idf.py build
```

## Flash

```bash
idf.py flash monitor
```

---

# Mobile Application

Using the WeChat Mini Program, you can:

- Pair over BLE
- Configure AI
- Upload Images
- Upload GIFs
- Upload Videos
- Upload Music
- Manage AI Agents
- Configure Device Settings

---

# Repository Structure

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

# Roadmap

- [ ] BLE OTA
- [ ] Wi-Fi OTA
- [ ] More AI Providers
- [ ] MQTT
- [ ] Matter
- [ ] Home Assistant
- [ ] Plugin SDK
- [ ] Custom App SDK

---

# License

MIT License

---

# Contact

Email：

📧 lihonggang@doit.am

WeChat：

![WeChat](wx.jpg)

GitHub

https://github.com/doit-open-org/esp32s3_chat_badge