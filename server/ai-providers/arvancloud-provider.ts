import OpenAI from 'openai';
import { OpenAIProvider } from './openai-provider';

export class ArvanCloudProvider extends OpenAIProvider {
  override name = 'ArvanCloud';

  constructor() {
    super();
    const apiKey = process.env.ARVANCLOUD_API_KEY;
    const baseURL = process.env.ARVANCLOUD_BASE_URL;
    this.model = process.env.ARVANCLOUD_MODEL || 'qwen2.5';
    this.isEnabled = !!(apiKey && baseURL);
    this.client = undefined;

    if (this.isEnabled && apiKey && baseURL) {
      this.client = new OpenAI({ apiKey, baseURL });
    }
  }

  override async initialize(): Promise<void> {
    if (!this.isEnabled) {
      console.log('🔒 ArvanCloud provider disabled (ARVANCLOUD_API_KEY or ARVANCLOUD_BASE_URL not set)');
      return;
    }
    console.log(`☁️  ArvanCloud provider initialized (model: ${this.model})`);
  }
}
