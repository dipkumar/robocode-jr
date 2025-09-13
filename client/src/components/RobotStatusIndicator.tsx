import { Badge } from "@/components/ui/badge";
import { Bluetooth, Battery, Wifi, AlertCircle } from "lucide-react";

interface RobotStatusIndicatorProps {
  isConnected?: boolean;
  batteryLevel?: number;
  signalStrength?: "weak" | "medium" | "strong";
  robotName?: string;
  isExecuting?: boolean;
}

export default function RobotStatusIndicator({
  isConnected = false,
  batteryLevel = 85,
  signalStrength = "strong",
  robotName = "RoboBot-001",
  isExecuting = false
}: RobotStatusIndicatorProps) {
  const getSignalColor = () => {
    switch (signalStrength) {
      case "strong": return "text-success";
      case "medium": return "text-warning";
      case "weak": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  const getBatteryColor = () => {
    if (batteryLevel > 50) return "text-success";
    if (batteryLevel > 20) return "text-warning";
    return "text-destructive";
  };

  const getConnectionStatus = () => {
    if (!isConnected) return { text: "Disconnected", variant: "secondary" as const };
    if (isExecuting) return { text: "Running Program", variant: "default" as const };
    return { text: "Connected", variant: "outline" as const };
  };

  const status = getConnectionStatus();

  return (
    <div className="flex items-center gap-4 p-4 bg-card rounded-lg border" data-testid="robot-status">
      <div className="flex items-center gap-2">
        <Bluetooth className={`w-4 h-4 ${isConnected ? 'text-primary' : 'text-muted-foreground'}`} />
        <div className="text-sm">
          <p className="font-medium">{isConnected ? robotName : "No Robot"}</p>
          <Badge variant={status.variant} className="text-xs">
            {status.text}
          </Badge>
        </div>
      </div>

      {isConnected && (
        <>
          <div className="flex items-center gap-1 text-sm">
            <Wifi className={`w-4 h-4 ${getSignalColor()}`} />
            <span className="text-muted-foreground capitalize">{signalStrength}</span>
          </div>

          <div className="flex items-center gap-1 text-sm">
            <Battery className={`w-4 h-4 ${getBatteryColor()}`} />
            <span className="text-muted-foreground">{batteryLevel}%</span>
          </div>

          {batteryLevel < 20 && (
            <AlertCircle className="w-4 h-4 text-destructive" />
          )}
        </>
      )}

      {isExecuting && (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <span className="text-xs text-muted-foreground">Active</span>
        </div>
      )}
    </div>
  );
}