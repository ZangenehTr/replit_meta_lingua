import { Request, Response, NextFunction } from 'express';
import { PlatformFactory } from '../social-platforms/platform-factory';
import type { IStorage } from '../storage';

export function createPlatformAuthMiddleware(storage: IStorage) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const platform = req.params.platform || req.body.platform;
      
      if (!platform) {
        return res.status(400).json({
          success: false,
          error: 'Platform parameter is required',
        });
      }

      if (!PlatformFactory.isPlatformSupported(platform)) {
        return res.status(400).json({
          success: false,
          error: `Unsupported platform: ${platform}`,
          supportedPlatforms: PlatformFactory.getSupportedPlatforms(),
        });
      }

      const credential = await storage.getPlatformCredentialByPlatform(platform);
      
      if (!credential) {
        return res.status(404).json({
          success: false,
          error: `No credentials found for platform: ${platform}`,
          message: 'Please configure platform credentials first',
        });
      }

      if (!credential.isActive) {
        return res.status(403).json({
          success: false,
          error: `Credentials for ${platform} are inactive`,
          message: 'Please activate platform credentials before use',
        });
      }

      (req as any).platformCredential = credential;
      (req as any).platform = platform;

      next();
    } catch (error: any) {
      console.error('Platform authentication error:', error);
      res.status(500).json({
        success: false,
        error: 'Platform authentication failed',
        message: error.message,
      });
    }
  };
}

export async function validatePlatformCredential(
  storage: IStorage,
  platform: string,
  credentialId: number
): Promise<{ valid: boolean; error?: string }> {
  try {
    const credential = await storage.getPlatformCredentialById(credentialId);
    
    if (!credential) {
      return { valid: false, error: 'Credential not found' };
    }

    if (credential.platform !== platform) {
      return { valid: false, error: 'Platform mismatch' };
    }

    if (!PlatformFactory.isPlatformSupported(platform)) {
      return { valid: false, error: 'Unsupported platform' };
    }

    const credentials = {
      apiKey: credential.apiKey,
      apiSecret: credential.apiSecret,
      accessToken: credential.accessToken,
      refreshToken: credential.refreshToken,
      accountId: credential.accountId,
      channelId: credential.channelId,
      additionalData: credential.additionalData as Record<string, any>,
    };

    const strategy = PlatformFactory.createPlatform(platform as any, credentials);
    const isValid = await strategy.validateCredentials();

    if (!isValid) {
      await storage.updatePlatformCredential(credentialId, { isActive: false });
      return { valid: false, error: 'Credential validation failed with platform API' };
    }

    await storage.updatePlatformCredential(credentialId, { isActive: true });
    return { valid: true };
  } catch (error: any) {
    console.error('Platform credential validation error:', error);
    return { valid: false, error: error.message };
  }
}
