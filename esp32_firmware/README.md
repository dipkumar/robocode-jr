# Sparky Robot ESP32 Firmware

Arduino firmware for ESP32-based Sparky robots that communicates with the RoboCode Jr web application via Bluetooth.

## Features

- **Bluetooth Communication**: Compatible with Web Bluetooth API
- **Motor Control**: Dual DC motor control with PWM speed control
- **LED Control**: Built-in LED control with brightness support
- **Sensor Reading**: Ultrasonic distance sensor and light sensor support
- **Sound Generation**: Buzzer control for beeps and tones
- **Command Protocol**: Structured command parsing and execution
- **Safety Features**: Command timeouts and parameter validation

## Hardware Requirements

### Microcontroller
- ESP32 development board (any variant with Bluetooth)

### Motors
- 2x DC geared motors (3-6V)
- Motor driver board (e.g., L298N, TB6612FNG)

### Sensors
- HC-SR04 ultrasonic distance sensor
- LDR (Light Dependent Resistor) or photoresistor
- 10kΩ resistor for LDR voltage divider

### Other Components
- Buzzer or small speaker
- LEDs (built-in ESP32 LED used by default)
- Chassis and wheels
- Battery pack (7.4V Li-Po or 6x AA batteries)

## Pin Configuration

| Component | ESP32 Pin | Description |
|-----------|-----------|-------------|
| Left Motor A | GPIO 12 | Left motor pin A (PWM) |
| Left Motor B | GPIO 14 | Left motor pin B (PWM) |
| Right Motor A | GPIO 27 | Right motor pin A (PWM) |
| Right Motor B | GPIO 26 | Right motor pin B (PWM) |
| LED | GPIO 2 | Built-in LED |
| Buzzer | GPIO 25 | Buzzer/speaker |
| Distance Trigger | GPIO 5 | Ultrasonic sensor trigger |
| Distance Echo | GPIO 18 | Ultrasonic sensor echo |
| Light Sensor | GPIO 34 | Analog light sensor input |

## Installation

1. **Install Arduino IDE** and ESP32 board support
2. **Install required libraries**:
   - ESP32 BLE Arduino (included with ESP32 core v2.0+)
   - No additional libraries needed
3. **Configure hardware** according to pin layout
4. **Upload BLE firmware** (`sparky_robot_ble.ino`) to ESP32
5. **Power on** and connect via RoboCode Jr app (no pairing needed)

## Command Protocol

The firmware implements a text-based command protocol over Bluetooth:

### Movement Commands
```
MOVE:F:50:1000    # Move forward at 50% speed for 1000ms
MOVE:B:30:500     # Move backward at 30% speed for 500ms
TURN:L:90:25      # Turn left 90 degrees at 25% speed
TURN:R:180:30     # Turn right 180 degrees at 30% speed
STOP              # Stop all motors immediately
```

### LED Commands
```
LED:ON:100:white  # Turn LED on at 100% brightness (white)
LED:OFF           # Turn LED off
```

### Sound Commands
```
BEEP:1000:500     # Beep at 1000Hz for 500ms
```

### Sensor Commands
```
SENSOR:DISTANCE   # Read distance sensor → "SENSOR:DISTANCE:25.4:cm"
SENSOR:LIGHT      # Read light sensor → "SENSOR:LIGHT:512:lux"
SENSOR:OBSTACLE   # Check for obstacle → "SENSOR:OBSTACLE:1:boolean"
```

### Utility Commands
```
WAIT:1000         # Wait for 1000ms (handled by app, not firmware)
```

## Response Format

The firmware sends responses in the format:
```
OK:COMMAND:PARAMS          # Successful command execution
ERROR:TYPE:DETAILS         # Command error
SENSOR:TYPE:VALUE:UNIT     # Sensor data response
```

Examples:
```
OK:MOVE:F:50:1000
OK:LED:ON
ERROR:INVALID_DIRECTION:X
SENSOR:DISTANCE:25.4:cm
```

## Bluetooth Configuration

- **Device Name**: "Sparky-001" (configurable in code)
- **Protocol**: Bluetooth Low Energy (BLE) GATT
- **Service UUID**: `12345678-1234-1234-1234-123456789abc`
- **Command Characteristic**: `87654321-4321-4321-4321-cba987654321` (Write)
- **Response Characteristic**: `11111111-2222-3333-4444-555555555555` (Read + Notify)
- **Compatible**: Web Bluetooth API via BLE GATT

## Calibration

### Motor Speed
Adjust PWM values in the motor control functions if your motors run too fast/slow.

### Turn Angles
Modify the angle-to-duration calculation in `handleTurnCommand()` based on your robot's dimensions and motor characteristics.

### Sensor Readings
Calibrate sensor thresholds in the sensor reading functions for your specific sensors.

## Safety Features

1. **Command Timeouts**: Movement commands automatically stop after specified duration
2. **Parameter Validation**: All parameters are constrained to safe ranges
3. **Error Handling**: Invalid commands return error messages
4. **Emergency Stop**: STOP command immediately halts all motors

## Troubleshooting

### Bluetooth Connection Issues
- Ensure ESP32 is powered and running
- Check device name matches app expectations
- Verify Bluetooth pairing if required

### Motor Not Moving
- Check motor driver connections
- Verify power supply voltage
- Test motor driver with simple code

### Sensor Not Working
- Check sensor wiring and power
- Test sensors with example code
- Verify analog pin configuration

### No Response to Commands
- Check serial monitor for received commands
- Verify command format matches protocol
- Test with simple commands first

## Development

### Adding New Commands
1. Add command type to `executeCommand()` switch statement
2. Implement handler function following existing pattern
3. Update protocol documentation

### Modifying Hardware
1. Update pin definitions at top of code
2. Modify setup functions as needed
3. Test thoroughly with new hardware

## Web App Integration

This firmware is designed to work with the RoboCode Jr web application. The command protocol exactly matches what the web app's command system generates, ensuring seamless integration between visual programming blocks and robot actions.

The web app's `CommandProtocolEncoder` generates commands that this firmware parses and executes, creating a complete visual programming to hardware execution pipeline.