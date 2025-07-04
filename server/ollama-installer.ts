import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

const execAsync = promisify(exec);

export interface InstallationStatus {
  isInstalled: boolean;
  isRunning: boolean;
  version?: string;
  error?: string;
}

export interface BootstrapResult {
  success: boolean;
  message: string;
  modelsInstalled?: string[];
  error?: string;
}

export class OllamaInstaller {
  private readonly OLLAMA_URL = 'http://localhost:11434';
  private readonly INSTALL_SCRIPT_URL = 'https://ollama.ai/install.sh';
  private readonly BOOTSTRAP_MODELS = ['llama3.2:1b']; // Minimal model for bootstrap

  /**
   * Check if Ollama is installed and running
   */
  async checkInstallationStatus(): Promise<InstallationStatus> {
    try {
      // Check if ollama command exists
      const { stdout: versionOutput } = await execAsync('ollama --version');
      const version = versionOutput.trim();
      
      // Check if service is running
      try {
        const response = await axios.get(`${this.OLLAMA_URL}/api/version`, { timeout: 5000 });
        return {
          isInstalled: true,
          isRunning: true,
          version: response.data?.version || version
        };
      } catch (serviceError) {
        return {
          isInstalled: true,
          isRunning: false,
          version,
          error: 'Ollama is installed but service is not running'
        };
      }
    } catch (installError) {
      return {
        isInstalled: false,
        isRunning: false,
        error: 'Ollama is not installed'
      };
    }
  }

  /**
   * Install Ollama using the official installation script
   */
  async installOllama(): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      console.log('Installing Ollama using official script...');
      
      // Download and execute the installation script
      const { stdout, stderr } = await execAsync('curl -fsSL https://ollama.ai/install.sh | sh');
      
      if (stderr && !stderr.includes('warning')) {
        throw new Error(`Installation failed: ${stderr}`);
      }

      console.log('Ollama installation completed:', stdout);
      
      // Verify installation
      const status = await this.checkInstallationStatus();
      if (status.isInstalled) {
        return {
          success: true,
          message: `Ollama installed successfully. Version: ${status.version}`
        };
      } else {
        throw new Error('Installation completed but Ollama not found');
      }
    } catch (error) {
      console.error('Ollama installation failed:', error);
      return {
        success: false,
        message: 'Failed to install Ollama',
        error: error.message
      };
    }
  }

  /**
   * Start Ollama service in the background
   */
  async startOllamaService(): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      console.log('Starting Ollama service...');
      
      // Start Ollama service in background
      const ollamaProcess = spawn('ollama', ['serve'], {
        detached: true,
        stdio: 'ignore'
      });
      
      ollamaProcess.unref(); // Allow parent process to exit independently
      
      // Wait a moment for service to start
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verify service is running
      const status = await this.checkInstallationStatus();
      if (status.isRunning) {
        return {
          success: true,
          message: 'Ollama service started successfully'
        };
      } else {
        throw new Error('Service started but not responding');
      }
    } catch (error) {
      console.error('Failed to start Ollama service:', error);
      return {
        success: false,
        message: 'Failed to start Ollama service',
        error: error.message
      };
    }
  }

  /**
   * Download a minimal model to bootstrap the system
   */
  async downloadBootstrapModel(modelName: string = 'llama3.2:1b'): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      console.log(`Downloading bootstrap model: ${modelName}...`);
      
      // Use ollama pull command directly (this works even without models installed)
      const { stdout, stderr } = await execAsync(`ollama pull ${modelName}`, {
        timeout: 300000 // 5 minutes timeout for model download
      });
      
      if (stderr && !stderr.includes('progress') && !stderr.includes('pulling')) {
        throw new Error(`Model download failed: ${stderr}`);
      }

      console.log(`Bootstrap model ${modelName} downloaded successfully`);
      return {
        success: true,
        message: `Bootstrap model ${modelName} downloaded successfully`
      };
    } catch (error) {
      console.error(`Failed to download bootstrap model ${modelName}:`, error);
      return {
        success: false,
        message: `Failed to download bootstrap model ${modelName}`,
        error: error.message
      };
    }
  }

  /**
   * Complete bootstrap process: install, start service, and download minimal model
   */
  async bootstrap(): Promise<BootstrapResult> {
    try {
      console.log('Starting Ollama bootstrap process...');
      
      const status = await this.checkInstallationStatus();
      
      // Step 1: Install Ollama if not installed
      if (!status.isInstalled) {
        console.log('Ollama not installed, installing...');
        const installResult = await this.installOllama();
        if (!installResult.success) {
          return {
            success: false,
            message: 'Bootstrap failed: Could not install Ollama',
            error: installResult.error
          };
        }
      }

      // Step 2: Start service if not running
      if (!status.isRunning) {
        console.log('Ollama service not running, starting...');
        const startResult = await this.startOllamaService();
        if (!startResult.success) {
          return {
            success: false,
            message: 'Bootstrap failed: Could not start Ollama service',
            error: startResult.error
          };
        }
      }

      // Step 3: Download bootstrap models
      const modelsInstalled = [];
      for (const model of this.BOOTSTRAP_MODELS) {
        console.log(`Downloading bootstrap model: ${model}...`);
        const downloadResult = await this.downloadBootstrapModel(model);
        if (downloadResult.success) {
          modelsInstalled.push(model);
        } else {
          console.warn(`Failed to download ${model}, continuing...`);
        }
      }

      if (modelsInstalled.length === 0) {
        return {
          success: false,
          message: 'Bootstrap failed: Could not download any models',
          error: 'All model downloads failed'
        };
      }

      console.log('Ollama bootstrap completed successfully');
      return {
        success: true,
        message: `Ollama bootstrap completed successfully. Models installed: ${modelsInstalled.join(', ')}`,
        modelsInstalled
      };
    } catch (error) {
      console.error('Bootstrap process failed:', error);
      return {
        success: false,
        message: 'Bootstrap process failed',
        error: error.message
      };
    }
  }

  /**
   * Verify Ollama is working by testing a simple completion
   */
  async verifyInstallation(): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      console.log('Verifying Ollama installation...');
      
      const response = await axios.post(`${this.OLLAMA_URL}/api/generate`, {
        model: this.BOOTSTRAP_MODELS[0],
        prompt: 'Hello! Say "Installation verified" if you can read this.',
        stream: false
      }, { timeout: 30000 });

      if (response.data && response.data.response) {
        return {
          success: true,
          message: `Ollama installation verified. Response: ${response.data.response.slice(0, 100)}...`
        };
      } else {
        throw new Error('No response from model');
      }
    } catch (error) {
      console.error('Verification failed:', error);
      return {
        success: false,
        message: 'Verification failed',
        error: error.message
      };
    }
  }
}

export const ollamaInstaller = new OllamaInstaller();