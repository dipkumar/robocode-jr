import RobotControlPanel from '../RobotControlPanel';
import { useState } from 'react';

export default function RobotControlPanelExample() {
  const [isConnected, setIsConnected] = useState(true);

  const handleCommand = (command: string, params?: any) => {
    console.log('Robot command:', command, params);
  };

  return (
    <div className="p-6 min-h-screen bg-background">
      <div className="max-w-md mx-auto space-y-4">
        <div className="text-center">
          <button 
            onClick={() => setIsConnected(!isConnected)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            Toggle Connection ({isConnected ? 'Connected' : 'Disconnected'})
          </button>
        </div>
        
        <RobotControlPanel 
          isConnected={isConnected}
          onCommand={handleCommand}
        />
      </div>
    </div>
  );
}