# RoboCode Jr

Educational robotics programming platform that enables young learners to program Sparky robots using visual drag-and-drop blocks.

## Features

- **Visual Programming**: Drag-and-drop block-based interface
- **Cross-Platform**: Web browser and Android app support  
- **Bluetooth Connectivity**: Direct connection to Sparky robots via BLE
- **Real-Time Control**: Execute movement, LED, and sensor commands
- **Educational Focus**: Designed for young learners and robotics education

## Getting Started

### Web Version
1. Open the application in Chrome or Edge browser
2. Click "Connect Sparky" to find your robot
3. Start programming with visual blocks!

### Android Version
1. Build the APK using: `npx cap build android`
2. Install on your Android device
3. Grant Bluetooth permissions and connect to Sparky

### ESP32 Firmware
- Upload `esp32_firmware/sparky_robot_ble.ino` to your ESP32
- See `esp32_firmware/README.md` for hardware setup

## Development

```bash
npm install
npm run dev
```

## Architecture

- **Frontend**: React + TypeScript with visual block programming
- **Mobile**: Capacitor for cross-platform Android support
- **Bluetooth**: Abstracted client supporting Web Bluetooth and Android BLE
- **Robot**: ESP32-based Sparky robots with BLE communication

Built with educational robotics in mind! 🤖
