import { PlatformStrategy, type PlatformCredentials } from './platform-strategy';
import { InstagramStrategy } from './instagram-strategy';
import { TelegramStrategy } from './telegram-strategy';
import { EmailStrategy } from './email-strategy';
import { YouTubeStrategy } from './youtube-strategy';
import { LinkedInStrategy } from './linkedin-strategy';
import { TwitterStrategy } from './twitter-strategy';
import { FacebookStrategy } from './facebook-strategy';

type PlatformName = 'Instagram' | 'Telegram' | 'Email' | 'YouTube' | 'LinkedIn' | 'Twitter' | 'Facebook' | 'WhatsApp' | 'SMS';

export class PlatformFactory {
  private static strategies: Map<PlatformName, typeof PlatformStrategy> = new Map([
    ['Instagram', InstagramStrategy as any],
    ['Telegram', TelegramStrategy as any],
    ['Email', EmailStrategy as any],
    ['YouTube', YouTubeStrategy as any],
    ['LinkedIn', LinkedInStrategy as any],
    ['Twitter', TwitterStrategy as any],
    ['Facebook', FacebookStrategy as any],
  ]);

  static createPlatform(platform: PlatformName, credentials: PlatformCredentials): PlatformStrategy {
    const StrategyClass = this.strategies.get(platform);
    
    if (!StrategyClass) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    return new (StrategyClass as any)(credentials);
  }

  static getSupportedPlatforms(): PlatformName[] {
    return Array.from(this.strategies.keys());
  }

  static isPlatformSupported(platform: string): platform is PlatformName {
    return this.strategies.has(platform as PlatformName);
  }

  static registerPlatform(name: PlatformName, strategyClass: typeof PlatformStrategy): void {
    this.strategies.set(name, strategyClass);
  }
}

export async function getPlatformStrategy(
  platform: PlatformName,
  credentials: PlatformCredentials
): Promise<PlatformStrategy> {
  const strategy = PlatformFactory.createPlatform(platform, credentials);
  
  const isValid = await strategy.validateCredentials();
  if (!isValid) {
    throw new Error(`Invalid credentials for platform: ${platform}`);
  }

  return strategy;
}
