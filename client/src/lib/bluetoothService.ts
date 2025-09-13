// Web Bluetooth API service for connecting to Sparky robots

export interface SparkyDevice {
  id: string;
  name: string;
  rssi: number;
  device?: BluetoothDevice;
  server?: BluetoothRemoteGATTServer;
  characteristic?: BluetoothRemoteGATTCharacteristic;
}

export interface BluetoothCommand {
  type: string;
  data?: any;
}

class BluetoothService {
  private connectedDevice: SparkyDevice | null = null;
  private commandCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private responseCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private responseCallbacks: Array<(response: string) => void> = [];
  
  // UUID for our custom Sparky robot service  
  private readonly SERVICE_UUID = "12345678-1234-1234-1234-123456789abc";
  private readonly COMMAND_CHARACTERISTIC_UUID = "87654321-4321-4321-4321-cba987654321";
  private readonly RESPONSE_CHARACTERISTIC_UUID = "11111111-2222-3333-4444-555555555555";

  // Check if Web Bluetooth is supported
  isBluetoothSupported(): boolean {
    return 'bluetooth' in navigator && !!navigator.bluetooth;
  }

  // Check if browser is served over HTTPS (required for Web Bluetooth)
  isSecureContext(): boolean {
    return window.isSecureContext;
  }

  // Request Bluetooth device connection
  async requestDevice(): Promise<SparkyDevice> {
    if (!this.isBluetoothSupported()) {
      throw new Error('Web Bluetooth is not supported in this browser');
    }

    if (!this.isSecureContext()) {
      throw new Error('Web Bluetooth requires HTTPS connection');
    }

    try {
      console.log('Requesting Bluetooth device...');
      
      const device = await navigator.bluetooth!.requestDevice({
        filters: [
          { namePrefix: 'Sparky' },
          { services: [this.SERVICE_UUID] }
        ],
        optionalServices: [this.SERVICE_UUID]
      });

      if (!device) {
        throw new Error('No device selected');
      }

      const bluetoothDevice: SparkyDevice = {
        id: device.id,
        name: device.name || 'Unknown Sparky',
        rssi: -50, // RSSI not available in requestDevice, estimate
        device: device
      };

      console.log('Bluetooth device selected:', bluetoothDevice.name);
      return bluetoothDevice;
    } catch (error: any) {
      console.error('Error requesting Bluetooth device:', error);
      throw new Error(error.message || 'Failed to request Bluetooth device');
    }
  }

  // Connect to the selected device
  async connectToDevice(bluetoothDevice: SparkyDevice): Promise<SparkyDevice> {
    if (!bluetoothDevice.device) {
      throw new Error('Invalid device');
    }

    try {
      console.log('Connecting to GATT server...');
      
      const server = await bluetoothDevice.device.gatt?.connect();
      if (!server) {
        throw new Error('Failed to connect to GATT server');
      }

      console.log('Connected to GATT server, discovering services...');
      
      const service = await server.getPrimaryService(this.SERVICE_UUID);
      
      // Get command characteristic (for sending commands)
      const commandChar = await service.getCharacteristic(this.COMMAND_CHARACTERISTIC_UUID);
      
      // Get response characteristic (for receiving responses)
      const responseChar = await service.getCharacteristic(this.RESPONSE_CHARACTERISTIC_UUID);
      
      // Set up notifications for responses
      await responseChar.startNotifications();
      responseChar.addEventListener('characteristicvaluechanged', this.handleResponse.bind(this));
      console.log('Set up response notifications');

      bluetoothDevice.server = server;
      bluetoothDevice.characteristic = commandChar;
      this.connectedDevice = bluetoothDevice;
      this.commandCharacteristic = commandChar;
      this.responseCharacteristic = responseChar;

      console.log('Successfully connected to Sparky robot');
      return bluetoothDevice;
    } catch (error: any) {
      console.error('Error connecting to device:', error);
      throw new Error(error.message || 'Failed to connect to device');
    }
  }

  // Disconnect from the current device
  async disconnect(): Promise<void> {
    if (this.connectedDevice?.server?.connected) {
      console.log('Disconnecting from Sparky robot...');
      this.connectedDevice.server.disconnect();
    }
    
    this.connectedDevice = null;
    this.commandCharacteristic = null;
    this.responseCharacteristic = null;
    this.responseCallbacks = [];
    console.log('Disconnected from Sparky robot');
  }

  // Send command to the connected robot (text format expected by firmware)
  async sendCommand(command: BluetoothCommand): Promise<void> {
    if (!this.commandCharacteristic) {
      throw new Error('No device connected');
    }

    try {
      // Convert command to text format expected by firmware
      const commandText = command.data || command.type;
      const encoder = new TextEncoder();
      const data = encoder.encode(commandText);
      
      console.log('Sending text command to robot:', commandText);
      await this.commandCharacteristic.writeValue(data);
      console.log('Command sent successfully');
    } catch (error: any) {
      console.error('Error sending command:', error);
      throw new Error(error.message || 'Failed to send command');
    }
  }

  // Get connection status
  isConnected(): boolean {
    return this.connectedDevice?.server?.connected || false;
  }

  // Get connected device info
  getConnectedDevice(): SparkyDevice | null {
    return this.connectedDevice;
  }

  // Handle response notifications from robot
  private handleResponse(event: Event): void {
    const target = event.target as unknown as BluetoothRemoteGATTCharacteristic;
    const decoder = new TextDecoder();
    const response = decoder.decode(target.value!);
    
    console.log('Received response from robot:', response);
    
    // Notify all subscribers
    this.responseCallbacks.forEach(callback => {
      try {
        callback(response);
      } catch (error) {
        console.error('Error in response callback:', error);
      }
    });
  }

  // Subscribe to response notifications
  onResponse(callback: (response: string) => void): void {
    this.responseCallbacks.push(callback);
  }

  // Unsubscribe from response notifications
  offResponse(callback: (response: string) => void): void {
    const index = this.responseCallbacks.indexOf(callback);
    if (index > -1) {
      this.responseCallbacks.splice(index, 1);
    }
  }

  // Simulate scanning for development/testing
  async simulateDeviceScan(): Promise<SparkyDevice[]> {
    console.log('Simulating device scan for development...');
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockDevices: SparkyDevice[] = [
          { id: "sparky-sim-001", name: "Sparky-001", rssi: -45 },
          { id: "sparky-sim-002", name: "Sparky-002", rssi: -67 },
          { id: "sparky-sim-003", name: "Sparky-003", rssi: -89 },
        ];
        console.log('Simulated scan completed');
        resolve(mockDevices);
      }, 1500);
    });
  }
}

// Create a singleton instance
export const bluetoothService = new BluetoothService();
export default bluetoothService;