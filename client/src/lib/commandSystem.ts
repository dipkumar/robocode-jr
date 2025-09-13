// Robot Command System
// Defines command types and compiles blocks into executable robot commands

export interface RobotCommand {
  type: 'move' | 'turn' | 'stop' | 'led' | 'beep' | 'wait' | 'sensor';
  action: string;
  parameters?: Record<string, any>;
  duration?: number; // milliseconds
  expectedResponse?: boolean;
}

export interface Block {
  id: string;
  type: string;
  category: "movement" | "sensors" | "actions";
  label: string;
  icon: string;
  parameters?: Record<string, any>;
}

export interface CommandExecutionResult {
  success: boolean;
  response?: any;
  error?: string;
  timestamp: number;
}

export interface ProgramExecutionState {
  isRunning: boolean;
  currentStep: number;
  totalSteps: number;
  progress: number;
  results: CommandExecutionResult[];
  startTime?: number;
  endTime?: number;
}

/**
 * Converts visual programming blocks into robot commands
 */
export class BlockToCommandCompiler {
  
  /**
   * Compile a program (array of blocks) into executable robot commands
   */
  static compileProgram(blocks: Block[]): RobotCommand[] {
    return blocks.map((block, index) => this.compileBlock(block, index));
  }

  /**
   * Compile a single block into a robot command
   */
  static compileBlock(block: Block, blockIndex: number): RobotCommand {
    switch (block.id.split('-')[0]) {
      // Movement commands
      case 'move':
        return this.compileMoveCommand(block);
      case 'turn':
        return this.compileTurnCommand(block);
      case 'stop':
        return {
          type: 'stop',
          action: 'motors',
          duration: 100
        };

      // LED commands  
      case 'led':
        return this.compileLedCommand(block);

      // Sound commands
      case 'beep':
        return {
          type: 'beep',
          action: 'sound',
          parameters: { frequency: 1000, duration: 500 },
          duration: 500
        };

      // Wait/delay commands
      case 'wait':
        return {
          type: 'wait',
          action: 'delay',
          parameters: { time: block.parameters?.duration || 1000 },
          duration: block.parameters?.duration || 1000
        };

      // Sensor commands
      case 'read':
      case 'check':
        return this.compileSensorCommand(block);

      default:
        console.warn(`Unknown block type: ${block.id}`);
        return {
          type: 'wait',
          action: 'noop',
          duration: 100
        };
    }
  }

  /**
   * Compile movement commands (forward, backward)
   */
  private static compileMoveCommand(block: Block): RobotCommand {
    const direction = block.id.includes('forward') ? 'forward' : 'backward';
    const speed = block.parameters?.speed || 50; // Default 50% speed
    const duration = block.parameters?.duration || 1000; // Default 1 second

    return {
      type: 'move',
      action: direction,
      parameters: { 
        speed: Math.max(0, Math.min(100, speed)), // Clamp between 0-100
        duration 
      },
      duration
    };
  }

  /**
   * Compile turn commands (left, right)
   */
  private static compileTurnCommand(block: Block): RobotCommand {
    const direction = block.id.includes('left') ? 'left' : 'right';
    const angle = block.parameters?.angle || 90; // Default 90 degrees
    const speed = block.parameters?.speed || 30; // Slower for turns
    
    // Estimate duration based on angle (rough calculation)
    const duration = Math.max(500, (angle / 90) * 1000);

    return {
      type: 'turn',
      action: direction,
      parameters: { 
        angle: Math.max(0, Math.min(360, angle)), // Clamp between 0-360
        speed: Math.max(0, Math.min(100, speed))
      },
      duration
    };
  }

  /**
   * Compile LED commands (on, off)
   */
  private static compileLedCommand(block: Block): RobotCommand {
    const state = block.id.includes('on') ? 'on' : 'off';
    const color = block.parameters?.color || 'white';
    const brightness = block.parameters?.brightness || 100;

    return {
      type: 'led',
      action: state,
      parameters: { 
        color,
        brightness: Math.max(0, Math.min(100, brightness))
      },
      duration: 100
    };
  }

  /**
   * Compile sensor commands (distance, obstacle, light)
   */
  private static compileSensorCommand(block: Block): RobotCommand {
    let sensorType = 'distance';
    
    if (block.id.includes('distance')) {
      sensorType = 'distance';
    } else if (block.id.includes('obstacle')) {
      sensorType = 'obstacle';
    } else if (block.id.includes('light')) {
      sensorType = 'light';
    }

    return {
      type: 'sensor',
      action: 'read',
      parameters: { sensor: sensorType },
      duration: 200,
      expectedResponse: true
    };
  }

  /**
   * Estimate total program execution time
   */
  static estimateExecutionTime(commands: RobotCommand[]): number {
    return commands.reduce((total, cmd) => total + (cmd.duration || 0), 0);
  }

  /**
   * Validate a compiled program
   */
  static validateProgram(commands: RobotCommand[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (commands.length === 0) {
      errors.push("Program is empty");
    }

    if (commands.length > 50) {
      errors.push("Program too long (max 50 commands)");
    }

    // Check for potentially dangerous sequences
    const moveCommands = commands.filter(cmd => cmd.type === 'move');
    if (moveCommands.length > 20) {
      errors.push("Too many movement commands - may drain battery quickly");
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Converts robot commands into Bluetooth protocol messages
 */
export class CommandProtocolEncoder {
  
  /**
   * Encode a robot command into a Bluetooth message string
   */
  static encodeCommand(command: RobotCommand): string {
    switch (command.type) {
      case 'move':
        return this.encodeMoveCommand(command);
      case 'turn':
        return this.encodeTurnCommand(command);
      case 'stop':
        return 'STOP';
      case 'led':
        return this.encodeLedCommand(command);
      case 'beep':
        return this.encodeBeepCommand(command);
      case 'wait':
        return `WAIT:${command.duration}`;
      case 'sensor':
        return this.encodeSensorCommand(command);
      default:
        return 'NOOP';
    }
  }

  private static encodeMoveCommand(command: RobotCommand): string {
    const { action, parameters } = command;
    const speed = parameters?.speed || 50;
    const duration = parameters?.duration || 1000;
    
    const direction = action === 'forward' ? 'F' : 'B';
    return `MOVE:${direction}:${speed}:${duration}`;
  }

  private static encodeTurnCommand(command: RobotCommand): string {
    const { action, parameters } = command;
    const angle = parameters?.angle || 90;
    const speed = parameters?.speed || 30;
    
    const direction = action === 'left' ? 'L' : 'R';
    return `TURN:${direction}:${angle}:${speed}`;
  }

  private static encodeLedCommand(command: RobotCommand): string {
    const { action, parameters } = command;
    const brightness = parameters?.brightness || 100;
    const color = parameters?.color || 'white';
    
    if (action === 'off') {
      return 'LED:OFF';
    }
    
    return `LED:ON:${brightness}:${color}`;
  }

  private static encodeBeepCommand(command: RobotCommand): string {
    const frequency = command.parameters?.frequency || 1000;
    const duration = command.parameters?.duration || 500;
    return `BEEP:${frequency}:${duration}`;
  }

  private static encodeSensorCommand(command: RobotCommand): string {
    const sensor = command.parameters?.sensor || 'distance';
    return `SENSOR:${sensor.toUpperCase()}`;
  }
}