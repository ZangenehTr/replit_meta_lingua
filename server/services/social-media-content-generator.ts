import { ollamaService } from '../ollama-service';
import { z } from 'zod';

export const SocialContentRequestSchema = z.object({
  platform: z.enum(['Instagram', 'Telegram', 'Email', 'YouTube', 'LinkedIn', 'Twitter', 'Facebook', 'instagram', 'telegram', 'email', 'youtube', 'linkedin', 'twitter', 'facebook']),
  topic: z.string().min(1),
  language: z.enum(['fa', 'en', 'ar']),
  tone: z.enum(['professional', 'casual', 'educational', 'promotional', 'inspirational']).optional(),
  length: z.enum(['short', 'medium', 'long']).optional(),
  includeHashtags: z.boolean().optional(),
  includeCallToAction: z.boolean().optional(),
  targetAudience: z.string().optional(),
  keywords: z.array(z.string()).optional(),
});

export type SocialContentRequest = z.infer<typeof SocialContentRequestSchema>;

export interface SocialContentResult {
  content: string;
  hashtags?: string[];
  suggestedMediaType?: 'image' | 'video' | 'carousel' | 'none';
  estimatedEngagement?: string;
}

const PLATFORM_LIMITS = {
  Instagram: { max: 2200, hashtagLimit: 30 },
  Telegram: { max: 4096, hashtagLimit: 20 },
  Email: { max: 10000, hashtagLimit: 0 },
  YouTube: { max: 5000, hashtagLimit: 15 },
  LinkedIn: { max: 3000, hashtagLimit: 10 },
  Twitter: { max: 280, hashtagLimit: 3 },
  Facebook: { max: 63206, hashtagLimit: 20 },
};

const LENGTH_MULTIPLIERS = {
  short: 0.3,
  medium: 0.6,
  long: 1.0,
};

export class SocialMediaContentGenerator {
  private normalizePlatform(platform: string): 'Instagram' | 'Telegram' | 'Email' | 'YouTube' | 'LinkedIn' | 'Twitter' | 'Facebook' {
    const platformMap: Record<string, 'Instagram' | 'Telegram' | 'Email' | 'YouTube' | 'LinkedIn' | 'Twitter' | 'Facebook'> = {
      'instagram': 'Instagram',
      'telegram': 'Telegram',
      'email': 'Email',
      'youtube': 'YouTube',
      'linkedin': 'LinkedIn',
      'twitter': 'Twitter',
      'facebook': 'Facebook',
    };
    const normalized = platformMap[platform.toLowerCase()];
    return normalized || platform as any;
  }

  async generateContent(request: SocialContentRequest): Promise<SocialContentResult> {
    try {
      const validatedRequest = SocialContentRequestSchema.parse(request);
      const normalizedPlatform = this.normalizePlatform(validatedRequest.platform);
      const normalizedRequest = { ...validatedRequest, platform: normalizedPlatform };

      const prompt = this.buildPrompt(normalizedRequest);
      const response = await ollamaService.generateText(prompt, {
        temperature: 0.7,
        max_tokens: 2000,
      });

      const result = this.parseResponse(response, normalizedRequest);
      
      return this.validateAndTruncate(result, normalizedPlatform);
    } catch (error) {
      console.error('Social media content generation failed:', error);
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid request: ${error.errors.map(e => e.message).join(', ')}`);
      }
      const normalizedPlatform = this.normalizePlatform(request.platform);
      return this.getFallbackContent({ ...request, platform: normalizedPlatform });
    }
  }

  async generateBulkContent(
    requests: SocialContentRequest[]
  ): Promise<SocialContentResult[]> {
    const results = await Promise.all(
      requests.map(req => this.generateContent(req))
    );
    return results;
  }

  async improveContent(
    originalContent: string,
    platform: string,
    language: string,
    improvements: string[]
  ): Promise<string> {
    try {
      const improvementList = improvements.join(', ');
      const prompt = `Improve the following ${language} social media content for ${platform}.

Original content:
${originalContent}

Required improvements: ${improvementList}

Provide ONLY the improved content without explanations. Maintain the same language and tone.`;

      const improved = await ollamaService.generateText(prompt, {
        temperature: 0.5,
        max_tokens: 1500,
      });

      return improved.trim();
    } catch (error) {
      console.error('Content improvement failed:', error);
      return originalContent;
    }
  }

  async generateHashtags(
    content: string,
    platform: string,
    language: string,
    count: number = 10
  ): Promise<string[]> {
    try {
      const prompt = `Generate ${count} relevant hashtags for this ${language} ${platform} post:

${content}

Rules:
- Return ONLY hashtags, one per line
- No explanations or numbers
- Mix of popular and niche tags
- ${language === 'fa' ? 'Use Persian language hashtags' : 'Use English hashtags'}
- No duplicates`;

      const response = await ollamaService.generateText(prompt, {
        temperature: 0.6,
        max_tokens: 300,
      });

      const hashtags = response
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('#'))
        .map(tag => tag.replace(/[^\w\u0600-\u06FF#_]/g, ''))
        .slice(0, count);

      return hashtags;
    } catch (error) {
      console.error('Hashtag generation failed:', error);
      return [];
    }
  }

  private buildPrompt(request: SocialContentRequest): string {
    const {
      platform,
      topic,
      language,
      tone = 'professional',
      length = 'medium',
      includeHashtags = true,
      includeCallToAction = true,
      targetAudience,
      keywords = [],
    } = request;

    const limits = PLATFORM_LIMITS[platform];
    const targetLength = Math.floor(limits.max * LENGTH_MULTIPLIERS[length]);

    const languageInstructions = {
      fa: 'Write in Persian (فارسی). Use proper Persian grammar and cultural references appropriate for Iranian audiences.',
      en: 'Write in English. Use clear, professional language.',
      ar: 'Write in Arabic (العربية). Use proper Arabic grammar and cultural references.',
    };

    const toneInstructions = {
      professional: 'Maintain a professional, authoritative tone.',
      casual: 'Use a friendly, conversational tone.',
      educational: 'Focus on teaching and providing value.',
      promotional: 'Emphasize benefits and create urgency.',
      inspirational: 'Motivate and inspire the audience.',
    };

    let prompt = `You are an expert social media content creator for language learning institutes. Generate ${platform} content about: ${topic}

REQUIREMENTS:
- Platform: ${platform}
- Language: ${languageInstructions[language]}
- Tone: ${toneInstructions[tone]}
- Target length: approximately ${targetLength} characters (maximum ${limits.max})
- Target audience: ${targetAudience || 'language learners and education enthusiasts'}`;

    if (keywords.length > 0) {
      prompt += `\n- Include these keywords naturally: ${keywords.join(', ')}`;
    }

    if (includeCallToAction) {
      prompt += `\n- Include a clear call-to-action at the end`;
    }

    if (includeHashtags && limits.hashtagLimit > 0) {
      prompt += `\n- Add ${Math.min(5, limits.hashtagLimit)} relevant hashtags at the end`;
    }

    prompt += `\n\nPlatform-specific guidelines:`;

    switch (platform) {
      case 'Instagram':
        prompt += `
- Start with an attention-grabbing hook
- Use line breaks for readability
- Include emoji sparingly
- Suggest image type at the end`;
        break;
      case 'Telegram':
        prompt += `
- Use Telegram markdown formatting
- Include bullet points if listing features
- Make it scannable and informative`;
        break;
      case 'Email':
        prompt += `
- Write a compelling subject line (first line)
- Structure with clear sections
- Include personalization elements`;
        break;
      case 'YouTube':
        prompt += `
- Write video title (first line)
- Write video description
- Include timestamps if relevant`;
        break;
      case 'LinkedIn':
        prompt += `
- Start with a professional insight
- Focus on value and expertise
- Use professional terminology`;
        break;
      case 'Twitter':
        prompt += `
- Be concise and impactful (max 280 chars)
- Use thread format if needed
- Include 1-2 relevant hashtags`;
        break;
      case 'Facebook':
        prompt += `
- Create engaging opening
- Tell a story if possible
- Encourage comments and shares`;
        break;
    }

    prompt += `\n\nGenerate the complete ${platform} content now:`;

    return prompt;
  }

  private parseResponse(
    response: string,
    request: SocialContentRequest
  ): SocialContentResult {
    const lines = response.trim().split('\n');
    
    const hashtagPattern = /#[\w\u0600-\u06FF_]+/g;
    const hashtags: string[] = [];
    let content = response;

    const lastLine = lines[lines.length - 1];
    if (lastLine.includes('#')) {
      const foundHashtags = lastLine.match(hashtagPattern);
      if (foundHashtags) {
        hashtags.push(...foundHashtags);
        content = lines.slice(0, -1).join('\n');
      }
    }

    const suggestedMediaType = this.detectMediaType(content);

    return {
      content: content.trim(),
      hashtags: hashtags.length > 0 ? hashtags : undefined,
      suggestedMediaType,
      estimatedEngagement: this.estimateEngagement(content, request.platform),
    };
  }

  private detectMediaType(content: string): 'image' | 'video' | 'carousel' | 'none' {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('video') || lowerContent.includes('ویدیو')) {
      return 'video';
    }
    if (lowerContent.includes('carousel') || lowerContent.includes('slide')) {
      return 'carousel';
    }
    if (lowerContent.includes('image') || lowerContent.includes('photo') || lowerContent.includes('تصویر')) {
      return 'image';
    }
    
    return 'none';
  }

  private estimateEngagement(content: string, platform: string): string {
    const hasHashtags = content.includes('#');
    const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(content);
    const hasQuestion = content.includes('?') || content.includes('؟');
    const hasCallToAction = /click|learn|join|register|download|subscribe/i.test(content);

    let score = 50;
    if (hasHashtags) score += 10;
    if (hasEmoji) score += 5;
    if (hasQuestion) score += 15;
    if (hasCallToAction) score += 20;

    if (score >= 80) return 'High';
    if (score >= 60) return 'Medium-High';
    if (score >= 40) return 'Medium';
    return 'Low-Medium';
  }

  private validateAndTruncate(
    result: SocialContentResult,
    platform: string
  ): SocialContentResult {
    const limits = PLATFORM_LIMITS[platform as keyof typeof PLATFORM_LIMITS];
    
    if (result.content.length > limits.max) {
      result.content = result.content.slice(0, limits.max - 3) + '...';
    }

    if (result.hashtags && result.hashtags.length > limits.hashtagLimit) {
      result.hashtags = result.hashtags.slice(0, limits.hashtagLimit);
    }

    return result;
  }

  private getFallbackContent(request: SocialContentRequest): SocialContentResult {
    const fallbackTexts = {
      fa: `محتوای جذاب در مورد ${request.topic}. برای کسب اطلاعات بیشتر با ما در تماس باشید.`,
      en: `Engaging content about ${request.topic}. Contact us to learn more.`,
      ar: `محتوى جذاب حول ${request.topic}. اتصل بنا لمعرفة المزيد.`,
    };

    const content = fallbackTexts[request.language];
    const normalizedPlatform = this.normalizePlatform(request.platform);
    const limits = PLATFORM_LIMITS[normalizedPlatform];

    return {
      content,
      hashtags: (request.includeHashtags && limits.hashtagLimit > 0) ? ['#education', '#language'] : undefined,
      suggestedMediaType: 'image',
      estimatedEngagement: 'Medium',
    };
  }
}

export const socialMediaContentGenerator = new SocialMediaContentGenerator();
