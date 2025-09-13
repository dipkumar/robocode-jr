/*
 * Sparky Robot - ESP32 BLE Firmware
 * Compatible with RoboCode Jr web application via Web Bluetooth (BLE GATT)
 * 
 * Implements BLE GATT services for robot control and sensor feedback
 */

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// Service and Characteristic UUIDs (must match web app bluetoothService)
#define SERVICE_UUID           "12345678-1234-1234-1234-123456789abc"
#define COMMAND_CHAR_UUID      "87654321-4321-4321-4321-cba987654321"
#define RESPONSE_CHAR_UUID     "11111111-2222-3333-4444-555555555555"

// Hardware Pin Definitions
const int MOTOR_LEFT_A = 12;   // Left motor pin A
const int MOTOR_LEFT_B = 14;   // Left motor pin B
const int MOTOR_RIGHT_A = 27;  // Right motor pin A
const int MOTOR_RIGHT_B = 26;  // Right motor pin B

const int LED_PIN = 2;         // Built-in LED (GPIO 2)
const int BUZZER_PIN = 25;     // Buzzer/speaker pin

const int DISTANCE_TRIG = 5;   // Ultrasonic sensor trigger
const int DISTANCE_ECHO = 18;  // Ultrasonic sensor echo
const int LIGHT_SENSOR = 34;   // Light sensor (analog)

// PWM Configuration
const int PWM_FREQ = 1000;     // 1kHz frequency
const int PWM_RESOLUTION = 8;  // 8-bit resolution (0-255)
const int PWM_CHANNEL_L1 = 0;  // Left motor channel 1
const int PWM_CHANNEL_L2 = 1;  // Left motor channel 2
const int PWM_CHANNEL_R1 = 2;  // Right motor channel 1
const int PWM_CHANNEL_R2 = 3;  // Right motor channel 2
const int PWM_CHANNEL_LED = 4; // LED brightness control

// Robot State
bool ledState = false;
int ledBrightness = 0;
int currentSpeed = 0;
String lastCommand = "";
unsigned long commandTimeout = 0;
bool deviceConnected = false;

// BLE Variables
BLEServer* pServer = nullptr;
BLECharacteristic* pCommandCharacteristic = nullptr;
BLECharacteristic* pResponseCharacteristic = nullptr;

String deviceName = "Sparky-001";  // Will be customizable

// BLE Server Callbacks
class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      Serial.println("BLE Client connected");
      
      // Welcome sequence when connected
      welcomeSequence();
    };

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      Serial.println("BLE Client disconnected");
      
      // Stop all motors when disconnected for safety
      stopMotors();
      commandTimeout = 0;
      
      // Restart advertising
      BLEDevice::startAdvertising();
      Serial.println("Restarted BLE advertising");
    }
};

// BLE Characteristic Callbacks
class MyCommandCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
      String command = pCharacteristic->getValue().c_str();
      command.trim();
      
      if (command.length() > 0) {
        Serial.println("Received BLE command: " + command);
        executeCommand(command);
      }
    }
};

void setup() {
  Serial.begin(115200);
  
  // Initialize hardware pins
  setupMotors();
  setupSensors();
  setupLED();
  setupBuzzer();
  
  // Initialize BLE
  setupBLE();
  
  Serial.println("Sparky Robot BLE initialized!");
  Serial.println("Device name: " + deviceName);
  Serial.println("Ready for BLE connections...");
}

void loop() {
  // Handle command timeouts
  if (commandTimeout > 0 && millis() > commandTimeout) {
    stopMotors();
    commandTimeout = 0;
    sendResponse("TIMEOUT:MOTOR_STOP");
  }
  
  // Small delay to prevent overwhelming the processor
  delay(10);
}

void setupBLE() {
  // Initialize BLE Device
  BLEDevice::init(deviceName.c_str());
  
  // Create BLE Server
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  // Create BLE Service
  BLEService *pService = pServer->createService(SERVICE_UUID);

  // Create Command Characteristic (Write)
  pCommandCharacteristic = pService->createCharacteristic(
                             COMMAND_CHAR_UUID,
                             BLECharacteristic::PROPERTY_WRITE |
                             BLECharacteristic::PROPERTY_WRITE_NR
                           );
  pCommandCharacteristic->setCallbacks(new MyCommandCallbacks());

  // Create Response Characteristic (Read + Notify)
  pResponseCharacteristic = pService->createCharacteristic(
                              RESPONSE_CHAR_UUID,
                              BLECharacteristic::PROPERTY_READ |
                              BLECharacteristic::PROPERTY_NOTIFY
                            );
  
  // Add descriptor for notifications
  pResponseCharacteristic->addDescriptor(new BLE2902());

  // Start the service
  pService->start();

  // Start advertising
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(false);
  pAdvertising->setMinPreferred(0x0);  // Set value to 0x00 to not advertise this parameter
  BLEDevice::startAdvertising();
  
  Serial.println("BLE Service started and advertising");
}

void setupMotors() {
  // Configure PWM channels for motor control
  ledcSetup(PWM_CHANNEL_L1, PWM_FREQ, PWM_RESOLUTION);
  ledcSetup(PWM_CHANNEL_L2, PWM_FREQ, PWM_RESOLUTION);
  ledcSetup(PWM_CHANNEL_R1, PWM_FREQ, PWM_RESOLUTION);
  ledcSetup(PWM_CHANNEL_R2, PWM_FREQ, PWM_RESOLUTION);
  
  // Attach pins to PWM channels
  ledcAttachPin(MOTOR_LEFT_A, PWM_CHANNEL_L1);
  ledcAttachPin(MOTOR_LEFT_B, PWM_CHANNEL_L2);
  ledcAttachPin(MOTOR_RIGHT_A, PWM_CHANNEL_R1);
  ledcAttachPin(MOTOR_RIGHT_B, PWM_CHANNEL_R2);
  
  // Initialize motors to stopped state
  stopMotors();
  
  Serial.println("Motors initialized");
}

void setupSensors() {
  pinMode(DISTANCE_TRIG, OUTPUT);
  pinMode(DISTANCE_ECHO, INPUT);
  pinMode(LIGHT_SENSOR, INPUT);
  
  Serial.println("Sensors initialized");
}

void setupLED() {
  // Setup PWM for LED brightness control
  ledcSetup(PWM_CHANNEL_LED, PWM_FREQ, PWM_RESOLUTION);
  ledcAttachPin(LED_PIN, PWM_CHANNEL_LED);
  ledcWrite(PWM_CHANNEL_LED, 0);
  
  Serial.println("LED initialized with PWM brightness control");
}

void setupBuzzer() {
  pinMode(BUZZER_PIN, OUTPUT);
  
  Serial.println("Buzzer initialized");
}

void welcomeSequence() {
  if (!deviceConnected) return;
  
  // LED fade in/out sequence
  for (int brightness = 0; brightness <= 255; brightness += 5) {
    ledcWrite(PWM_CHANNEL_LED, brightness);
    delay(10);
  }
  for (int brightness = 255; brightness >= 0; brightness -= 5) {
    ledcWrite(PWM_CHANNEL_LED, brightness);
    delay(10);
  }
  
  // Welcome beep using ledcWriteTone
  ledcWriteTone(PWM_CHANNEL_LED, 1000);  // 1kHz tone on LED channel
  delay(300);
  ledcWriteTone(PWM_CHANNEL_LED, 0);     // Stop tone
  
  // Reset LED
  ledcWrite(PWM_CHANNEL_LED, 0);
  
  sendResponse("READY:SPARKY_CONNECTED");
}

void executeCommand(String command) {
  lastCommand = command;
  
  // Parse command format: TYPE:PARAM1:PARAM2:PARAM3
  int firstColon = command.indexOf(':');
  if (firstColon == -1) {
    sendResponse("ERROR:INVALID_FORMAT");
    return;
  }
  
  String type = command.substring(0, firstColon);
  String params = command.substring(firstColon + 1);
  
  // Execute based on command type
  if (type == "MOVE") {
    handleMoveCommand(params);
  } else if (type == "TURN") {
    handleTurnCommand(params);
  } else if (type == "STOP") {
    handleStopCommand();
  } else if (type == "LED") {
    handleLEDCommand(params);
  } else if (type == "BEEP") {
    handleBeepCommand(params);
  } else if (type == "SENSOR") {
    handleSensorCommand(params);
  } else {
    sendResponse("ERROR:UNKNOWN_COMMAND:" + type);
  }
}

void handleMoveCommand(String params) {
  // Format: MOVE:F:50:1000 (direction:speed:duration)
  String direction = getValue(params, ':', 0);
  int speed = getValue(params, ':', 1).toInt();
  int duration = getValue(params, ':', 2).toInt();
  
  // Validate parameters
  speed = constrain(speed, 0, 100);
  duration = constrain(duration, 0, 10000);  // Max 10 seconds
  
  Serial.println("Move " + direction + " at " + String(speed) + "% for " + String(duration) + "ms");
  
  if (direction == "F") {
    moveForward(speed);
  } else if (direction == "B") {
    moveBackward(speed);
  } else {
    sendResponse("ERROR:INVALID_DIRECTION:" + direction);
    return;
  }
  
  // Set timeout for automatic stop
  commandTimeout = millis() + duration;
  currentSpeed = speed;
  
  sendResponse("OK:MOVE:" + direction + ":" + String(speed) + ":" + String(duration));
}

void handleTurnCommand(String params) {
  // Format: TURN:R:90:30 (direction:angle:speed)
  String direction = getValue(params, ':', 0);
  int angle = getValue(params, ':', 1).toInt();
  int speed = getValue(params, ':', 2).toInt();
  
  // Validate parameters
  angle = constrain(angle, 0, 360);
  speed = constrain(speed, 0, 100);
  
  // Estimate duration based on angle (calibrate for your robot)
  int duration = (angle / 90.0) * 1000;  // ~1 second per 90 degrees
  
  Serial.println("Turn " + direction + " " + String(angle) + " degrees at " + String(speed) + "%");
  
  if (direction == "L") {
    turnLeft(speed);
  } else if (direction == "R") {
    turnRight(speed);
  } else {
    sendResponse("ERROR:INVALID_DIRECTION:" + direction);
    return;
  }
  
  // Set timeout for automatic stop
  commandTimeout = millis() + duration;
  currentSpeed = speed;
  
  sendResponse("OK:TURN:" + direction + ":" + String(angle) + ":" + String(speed));
}

void handleStopCommand() {
  Serial.println("Stop all motors");
  stopMotors();
  commandTimeout = 0;
  currentSpeed = 0;
  
  sendResponse("OK:STOP");
}

void handleLEDCommand(String params) {
  // Format: LED:ON:100:white or LED:OFF
  String state = getValue(params, ':', 0);
  
  if (state == "ON") {
    int brightness = getValue(params, ':', 1).toInt();
    String color = getValue(params, ':', 2);
    
    brightness = constrain(brightness, 0, 100);
    ledBrightness = map(brightness, 0, 100, 0, 255);
    
    Serial.println("LED ON at " + String(brightness) + "% (" + color + ")");
    
    // Set LED brightness using PWM
    ledcWrite(PWM_CHANNEL_LED, ledBrightness);
    ledState = true;
    
  } else if (state == "OFF") {
    Serial.println("LED OFF");
    ledcWrite(PWM_CHANNEL_LED, 0);
    ledState = false;
    ledBrightness = 0;
    
  } else {
    sendResponse("ERROR:INVALID_LED_STATE:" + state);
    return;
  }
  
  sendResponse("OK:LED:" + state);
}

void handleBeepCommand(String params) {
  // Format: BEEP:1000:500 (frequency:duration)
  int frequency = getValue(params, ':', 0).toInt();
  int duration = getValue(params, ':', 1).toInt();
  
  frequency = constrain(frequency, 100, 5000);
  duration = constrain(duration, 50, 3000);
  
  Serial.println("Beep at " + String(frequency) + "Hz for " + String(duration) + "ms");
  
  // Use a separate PWM channel for buzzer (reuse one of the motor channels when not moving)
  ledcWriteTone(PWM_CHANNEL_L1, frequency);
  delay(duration);
  ledcWriteTone(PWM_CHANNEL_L1, 0);
  
  sendResponse("OK:BEEP:" + String(frequency) + ":" + String(duration));
}

void handleSensorCommand(String params) {
  // Format: SENSOR:DISTANCE or SENSOR:LIGHT or SENSOR:OBSTACLE
  String sensorType = params;
  sensorType.toUpperCase();
  
  if (sensorType == "DISTANCE") {
    float distance = readDistanceSensor();
    Serial.println("Distance reading: " + String(distance) + " cm");
    sendResponse("SENSOR:DISTANCE:" + String(distance) + ":cm");
    
  } else if (sensorType == "LIGHT") {
    int lightLevel = readLightSensor();
    Serial.println("Light reading: " + String(lightLevel));
    sendResponse("SENSOR:LIGHT:" + String(lightLevel) + ":lux");
    
  } else if (sensorType == "OBSTACLE") {
    float distance = readDistanceSensor();
    bool obstacle = distance < 20.0;  // Obstacle if closer than 20cm
    Serial.println("Obstacle detection: " + String(obstacle ? "YES" : "NO"));
    sendResponse("SENSOR:OBSTACLE:" + String(obstacle ? 1 : 0) + ":boolean");
    
  } else {
    sendResponse("ERROR:UNKNOWN_SENSOR:" + sensorType);
  }
}

void moveForward(int speed) {
  int pwmValue = map(speed, 0, 100, 0, 255);
  
  // Left motor forward
  ledcWrite(PWM_CHANNEL_L1, pwmValue);
  ledcWrite(PWM_CHANNEL_L2, 0);
  
  // Right motor forward
  ledcWrite(PWM_CHANNEL_R1, pwmValue);
  ledcWrite(PWM_CHANNEL_R2, 0);
}

void moveBackward(int speed) {
  int pwmValue = map(speed, 0, 100, 0, 255);
  
  // Left motor backward
  ledcWrite(PWM_CHANNEL_L1, 0);
  ledcWrite(PWM_CHANNEL_L2, pwmValue);
  
  // Right motor backward
  ledcWrite(PWM_CHANNEL_R1, 0);
  ledcWrite(PWM_CHANNEL_R2, pwmValue);
}

void turnLeft(int speed) {
  int pwmValue = map(speed, 0, 100, 0, 255);
  
  // Left motor backward, right motor forward
  ledcWrite(PWM_CHANNEL_L1, 0);
  ledcWrite(PWM_CHANNEL_L2, pwmValue);
  ledcWrite(PWM_CHANNEL_R1, pwmValue);
  ledcWrite(PWM_CHANNEL_R2, 0);
}

void turnRight(int speed) {
  int pwmValue = map(speed, 0, 100, 0, 255);
  
  // Left motor forward, right motor backward
  ledcWrite(PWM_CHANNEL_L1, pwmValue);
  ledcWrite(PWM_CHANNEL_L2, 0);
  ledcWrite(PWM_CHANNEL_R1, 0);
  ledcWrite(PWM_CHANNEL_R2, pwmValue);
}

void stopMotors() {
  // Stop all motors
  ledcWrite(PWM_CHANNEL_L1, 0);
  ledcWrite(PWM_CHANNEL_L2, 0);
  ledcWrite(PWM_CHANNEL_R1, 0);
  ledcWrite(PWM_CHANNEL_R2, 0);
}

float readDistanceSensor() {
  // Trigger ultrasonic sensor
  digitalWrite(DISTANCE_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(DISTANCE_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(DISTANCE_TRIG, LOW);
  
  // Read echo duration with timeout
  long duration = pulseIn(DISTANCE_ECHO, HIGH, 30000); // 30ms timeout
  
  if (duration == 0) {
    return 400.0;  // Return max range if timeout
  }
  
  // Calculate distance in centimeters
  float distance = (duration * 0.034) / 2;
  
  // Return reasonable values (2-400cm range)
  return constrain(distance, 2, 400);
}

int readLightSensor() {
  // Read analog light sensor (0-4095 on ESP32)
  int rawValue = analogRead(LIGHT_SENSOR);
  
  // Convert to more meaningful light level (0-1023)
  return map(rawValue, 0, 4095, 0, 1023);
}

void sendResponse(String response) {
  if (deviceConnected && pResponseCharacteristic) {
    pResponseCharacteristic->setValue(response.c_str());
    pResponseCharacteristic->notify();
    Serial.println("BLE Sent: " + response);
  } else {
    Serial.println("Not connected - Response not sent: " + response);
  }
}

String getValue(String data, char separator, int index) {
  int found = 0;
  int strIndex[] = {0, -1};
  int maxIndex = data.length() - 1;
  
  for (int i = 0; i <= maxIndex && found <= index; i++) {
    if (data.charAt(i) == separator || i == maxIndex) {
      found++;
      strIndex[0] = strIndex[1] + 1;
      strIndex[1] = (i == maxIndex) ? i + 1 : i;
    }
  }
  
  return found > index ? data.substring(strIndex[0], strIndex[1]) : "";
}