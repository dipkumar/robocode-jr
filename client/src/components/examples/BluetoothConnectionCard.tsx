import BluetoothConnectionCard from '../BluetoothConnectionCard';
import { useState } from 'react';

export default function BluetoothConnectionCardExample() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState(null);

  const handleConnect = (device: any) => {
    console.log('Connecting to device:', device);
    setConnectedDevice(device);
    setIsConnected(true);
  };

  return (
    <div className="p-6 min-h-screen bg-background">
      <BluetoothConnectionCard 
        onConnect={handleConnect}
        isConnected={isConnected}
        connectedDevice={connectedDevice}
      />
    </div>
  );
}