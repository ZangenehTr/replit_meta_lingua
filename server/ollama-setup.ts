import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export interface OllamaConfiguration {
  baseUrl: string;
  modelsPath: string;
  defaultModel: string;
  models: string[];
  isInstalled: boolean;
  isRunning: boolean;
  installationPath?: string;
}

export class OllamaSetupService {
  private config: OllamaConfiguration = {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    modelsPath: process.env.OLLAMA_MODELS || '~/.ollama/models',
    defaultModel: 'llama3.2:1b',
    models: ['llama3.2:1b', 'mistral:7b', 'codellama:7b'],
    isInstalled: false,
    isRunning: false
  };

  async checkOllamaStatus(): Promise<OllamaConfiguration> {
    try {
      // Check if Ollama is installed
      const { stdout: whichOllama } = await execAsync('which ollama');
      this.config.isInstalled = !!whichOllama.trim();
      this.config.installationPath = whichOllama.trim();

      // Check if Ollama service is running
      try {
        const response = await fetch(`${this.config.baseUrl}/api/tags`);
        this.config.isRunning = response.ok;
      } catch {
        this.config.isRunning = false;
      }

      // Get installed models if running
      if (this.config.isRunning) {
        const installedModels = await this.getInstalledModels();
        this.config.models = installedModels.length > 0 ? installedModels : this.config.models;
      }

    } catch (error) {
      this.config.isInstalled = false;
      this.config.isRunning = false;
    }

    return this.config;
  }

  async installOllama(): Promise<{ success: boolean; message: string; logs: string[] }> {
    const logs: string[] = [];
    
    try {
      // Check if we're in Replit environment
      if (process.env.REPLIT_ENVIRONMENT || process.env.REPL_ID || process.env.REPLIT_DEV_DOMAIN) {
        logs.push('Replit environment detected - Ollama installation not supported');
        return {
          success: false,
          message: 'Ollama installation not supported in Replit environment',
          logs: [
            'Replit has permission restrictions that prevent Ollama installation.',
            'For production deployment, install Ollama on your server using:',
            'curl -fsSL https://ollama.ai/install.sh | sh',
            '',
            'This AI Services interface will work correctly once deployed to a production server.'
          ]
        };
      }
      
      logs.push('Starting Ollama installation...');
      
      // Detect operating system
      const { stdout: osInfo } = await execAsync('uname -s');
      const os = osInfo.trim().toLowerCase();
      
      let installCommand = '';
      
      if (os === 'linux') {
        // Linux installation
        installCommand = 'curl -fsSL https://ollama.ai/install.sh | sh';
        logs.push('Installing Ollama for Linux...');
      } else if (os === 'darwin') {
        // macOS installation
        logs.push('macOS detected. Please install Ollama manually from https://ollama.ai/download');
        return {
          success: false,
          message: 'macOS installation requires manual download',
          logs
        };
      } else {
        logs.push('Unsupported operating system for automatic installation');
        return {
          success: false,
          message: 'Unsupported OS for automatic installation',
          logs
        };
      }

      // Execute installation
      const { stdout, stderr } = await execAsync(installCommand);
      logs.push(`Installation output: ${stdout}`);
      if (stderr) logs.push(`Installation warnings: ${stderr}`);

      // Verify installation
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for installation
      const status = await this.checkOllamaStatus();
      
      if (status.isInstalled) {
        logs.push('Ollama installed successfully');
        
        // Start Ollama service
        await this.startOllamaService();
        logs.push('Ollama service started');
        
        return {
          success: true,
          message: 'Ollama installed and started successfully',
          logs
        };
      } else {
        return {
          success: false,
          message: 'Installation verification failed',
          logs
        };
      }

    } catch (error) {
      logs.push(`Installation error: ${error.message}`);
      return {
        success: false,
        message: `Installation failed: ${error.message}`,
        logs
      };
    }
  }

  async startOllamaService(): Promise<{ success: boolean; message: string }> {
    try {
      // Start Ollama service in background
      execAsync('ollama serve > /dev/null 2>&1 &');
      
      // Wait for service to start
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Verify service is running
      const status = await this.checkOllamaStatus();
      
      if (status.isRunning) {
        return {
          success: true,
          message: 'Ollama service started successfully'
        };
      } else {
        return {
          success: false,
          message: 'Failed to start Ollama service'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to start service: ${error.message}`
      };
    }
  }

  async downloadModel(modelName: string): Promise<{ success: boolean; message: string; progress?: string }> {
    try {
      // Check if Ollama is running
      const status = await this.checkOllamaStatus();
      if (!status.isRunning) {
        return {
          success: false,
          message: 'Ollama service is not running'
        };
      }

      // Download model
      const { stdout, stderr } = await execAsync(`ollama pull ${modelName}`);
      
      if (stderr && stderr.includes('error')) {
        return {
          success: false,
          message: `Failed to download model: ${stderr}`
        };
      }

      return {
        success: true,
        message: `Model ${modelName} downloaded successfully`,
        progress: stdout
      };

    } catch (error) {
      return {
        success: false,
        message: `Download failed: ${error.message}`
      };
    }
  }

  async getInstalledModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`);
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.models?.map((model: any) => model.name) || [];
    } catch {
      return [];
    }
  }

  async removeModel(modelName: string): Promise<{ success: boolean; message: string }> {
    try {
      const { stdout, stderr } = await execAsync(`ollama rm ${modelName}`);
      
      if (stderr && stderr.includes('error')) {
        return {
          success: false,
          message: `Failed to remove model: ${stderr}`
        };
      }

      return {
        success: true,
        message: `Model ${modelName} removed successfully`
      };
    } catch (error) {
      return {
        success: false,
        message: `Removal failed: ${error.message}`
      };
    }
  }

  async generateCompletion(prompt: string, modelName?: string): Promise<string> {
    const model = modelName || this.config.defaultModel;
    
    try {
      const response = await fetch(`${this.config.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt,
          stream: false
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      throw new Error(`Failed to generate completion: ${error.message}`);
    }
  }

  getConfiguration(): OllamaConfiguration {
    return { ...this.config };
  }

  async updateConfiguration(updates: Partial<OllamaConfiguration>): Promise<void> {
    this.config = { ...this.config, ...updates };
    
    // Update environment variables if needed
    if (updates.baseUrl) {
      process.env.OLLAMA_BASE_URL = updates.baseUrl;
    }
    if (updates.modelsPath) {
      process.env.OLLAMA_MODELS = updates.modelsPath;
    }
  }
}

// Export singleton instance
export const ollamaSetup = new OllamaSetupService();