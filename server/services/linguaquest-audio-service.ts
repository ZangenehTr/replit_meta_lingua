import { db } from '../db.js';
import { linguaquestAudioAssets, linguaquestContentBank } from '../../shared/schema.js';
import { eq, and, isNull } from 'drizzle-orm';
import { MetaLinguaTTSService } from '../tts-service.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface AudioGenerationResult {
  success: boolean;
  audioAssetId?: number;
  contentHash?: string;
  filePath?: string;
  duration?: number;
  error?: string;
}

export interface AudioGenerationStats {
  totalItems: number;
  generated: number;
  cached: number;
  failed: number;
  errors: Array<{ contentId: number; error: string }>;
}

export class LinguaquestAudioService {
  private ttsService: MetaLinguaTTSService;

  constructor() {
    this.ttsService = new MetaLinguaTTSService();
  }

  /**
   * Generate audio for a LinguaQuest content item
   * Returns existing audio if already generated (based on hash)
   */
  async generateAudioForContent(
    contentId: number,
    contentText: string,
    language: string,
    contentType: 'word' | 'sentence' | 'question' | 'explanation' | 'feedback',
    cefrLevel?: string,
    gameType?: string,
    voice?: string
  ): Promise<AudioGenerationResult> {
    try {
      // Generate content hash (same algorithm as TTS service)
      const speed = 1.0;
      const selectedVoice = voice || this.getDefaultVoice(language);
      const contentHash = this.generateContentHash(contentText, language, speed, selectedVoice);

      // Check if audio already exists for this hash
      const existingAudio = await db
        .select()
        .from(linguaquestAudioAssets)
        .where(eq(linguaquestAudioAssets.contentHash, contentHash))
        .limit(1);

      if (existingAudio.length > 0) {
        // Audio exists - link it to content if not already linked
        await this.linkAudioToContent(contentId, contentHash);
        
        console.log(`✓ Audio cache hit for content ${contentId}: ${contentHash}`);
        
        return {
          success: true,
          audioAssetId: existingAudio[0].id,
          contentHash: contentHash,
          filePath: existingAudio[0].filePath,
          duration: existingAudio[0].duration || undefined
        };
      }

      // Generate new audio
      console.log(`⊙ Generating audio for content ${contentId}: "${contentText.substring(0, 40)}..."`);
      
      const ttsResult = await this.ttsService.generateSpeech({
        text: contentText,
        language: language,
        speed: speed,
        voice: selectedVoice
      });

      if (!ttsResult.success) {
        return {
          success: false,
          error: ttsResult.error || 'TTS generation failed'
        };
      }

      // Get file info
      const filePath = `uploads/tts/${ttsResult.audioFile}`;
      const fullPath = path.join(process.cwd(), filePath);
      const fileStats = fs.existsSync(fullPath) ? fs.statSync(fullPath) : null;
      const fileSize = fileStats ? fileStats.size : null;
      const duration = ttsResult.duration ? ttsResult.duration * 1000 : null; // Convert to ms

      // Upsert audio asset to database
      const audioAsset = await this.upsertAudioAsset({
        contentType,
        contentText,
        contentHash,
        language,
        voice: selectedVoice,
        filePath,
        fileSize,
        duration,
        cefrLevel,
        gameType
      });

      // Link audio to content
      await this.linkAudioToContent(contentId, contentHash);

      console.log(`✅ Audio generated for content ${contentId}: ${contentHash}`);

      return {
        success: true,
        audioAssetId: audioAsset.id,
        contentHash: contentHash,
        filePath: filePath,
        duration: duration || undefined
      };

    } catch (error) {
      console.error(`Error generating audio for content ${contentId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Upsert audio asset to database
   */
  async upsertAudioAsset(data: {
    contentType: string;
    contentText: string;
    contentHash: string;
    language: string;
    voice: string;
    filePath: string;
    fileSize: number | null;
    duration: number | null;
    cefrLevel?: string;
    gameType?: string;
  }) {
    // Check if exists
    const existing = await db
      .select()
      .from(linguaquestAudioAssets)
      .where(eq(linguaquestAudioAssets.contentHash, data.contentHash))
      .limit(1);

    if (existing.length > 0) {
      // Update usage count
      await db
        .update(linguaquestAudioAssets)
        .set({
          usageCount: (existing[0].usageCount || 0) + 1,
          updatedAt: new Date()
        })
        .where(eq(linguaquestAudioAssets.id, existing[0].id));

      return existing[0];
    }

    // Insert new
    const [newAsset] = await db
      .insert(linguaquestAudioAssets)
      .values({
        contentType: data.contentType,
        contentText: data.contentText,
        contentHash: data.contentHash,
        language: data.language,
        voice: data.voice,
        filePath: data.filePath,
        fileSize: data.fileSize,
        duration: data.duration,
        cefrLevel: data.cefrLevel,
        gameType: data.gameType,
        usageCount: 1
      })
      .returning();

    return newAsset;
  }

  /**
   * Link audio asset to content bank item by updating audioHash
   */
  async linkAudioToContent(contentId: number, audioHash: string): Promise<void> {
    await db
      .update(linguaquestContentBank)
      .set({
        audioHash: audioHash,
        hasAudio: true,
        updatedAt: new Date()
      })
      .where(eq(linguaquestContentBank.id, contentId));
  }

  /**
   * Get all content items that need audio generation
   */
  async getContentNeedingAudio() {
    return await db
      .select()
      .from(linguaquestContentBank)
      .where(
        and(
          eq(linguaquestContentBank.isActive, true),
          isNull(linguaquestContentBank.audioHash)
        )
      );
  }

  /**
   * Get audio generation statistics
   */
  async getGenerationStats(): Promise<{
    totalContent: number;
    withAudio: number;
    withoutAudio: number;
    totalAudioAssets: number;
    totalFileSize: number;
    totalDuration: number;
  }> {
    const totalContent = await db
      .select({ count: linguaquestContentBank.id })
      .from(linguaquestContentBank)
      .where(eq(linguaquestContentBank.isActive, true));

    const withAudio = await db
      .select({ count: linguaquestContentBank.id })
      .from(linguaquestContentBank)
      .where(
        and(
          eq(linguaquestContentBank.isActive, true),
          eq(linguaquestContentBank.hasAudio, true)
        )
      );

    const audioAssets = await db
      .select()
      .from(linguaquestAudioAssets);

    const totalFileSize = audioAssets.reduce((sum, asset) => sum + (asset.fileSize || 0), 0);
    const totalDuration = audioAssets.reduce((sum, asset) => sum + (asset.duration || 0), 0);

    return {
      totalContent: totalContent.length,
      withAudio: withAudio.length,
      withoutAudio: totalContent.length - withAudio.length,
      totalAudioAssets: audioAssets.length,
      totalFileSize,
      totalDuration
    };
  }

  /**
   * Generate content hash using same algorithm as TTS service
   */
  private generateContentHash(text: string, language: string, speed: number, voice: string): string {
    const content = `${text.toLowerCase().trim()}_${language}_${speed}_${voice}`;
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Get default voice for a language
   */
  private getDefaultVoice(language: string): string {
    const voiceMap: Record<string, string> = {
      'en': 'en-US-AriaNeural',
      'english': 'en-US-AriaNeural',
      'fa': 'fa-IR-DilaraNeural',
      'farsi': 'fa-IR-DilaraNeural',
      'persian': 'fa-IR-DilaraNeural',
      'ar': 'ar-SA-HamedNeural',
      'arabic': 'ar-SA-HamedNeural'
    };
    return voiceMap[language.toLowerCase()] || 'en-US-AriaNeural';
  }

  /**
   * Batch generate audio for multiple content items
   * Returns stats about the generation process
   */
  async batchGenerateAudio(
    contentIds?: number[],
    delayMs: number = 500,
    jobId?: number
  ): Promise<AudioGenerationStats> {
    const stats: AudioGenerationStats = {
      totalItems: 0,
      generated: 0,
      cached: 0,
      failed: 0,
      errors: []
    };

    // Get content items to process
    let contentItems;
    if (contentIds && contentIds.length > 0) {
      // Process specific items
      contentItems = await db
        .select()
        .from(linguaquestContentBank)
        .where(eq(linguaquestContentBank.isActive, true));
      contentItems = contentItems.filter(item => contentIds.includes(item.id));
    } else {
      // Process all items without audio
      contentItems = await this.getContentNeedingAudio();
    }

    stats.totalItems = contentItems.length;
    console.log(`\n🎵 Starting batch audio generation for ${stats.totalItems} items...\n`);

    // Update job with total items count
    if (jobId) {
      const { linguaquestAudioJobs } = await import('../../shared/schema.js');
      await db
        .update(linguaquestAudioJobs)
        .set({ totalItems: stats.totalItems })
        .where(eq(linguaquestAudioJobs.id, jobId));
    }

    for (const item of contentItems) {
      // Determine content type and text
      let contentType: 'word' | 'sentence' | 'question' | 'explanation' | 'feedback';
      let contentText: string;

      if (item.contentType === 'vocabulary') {
        contentType = 'word';
        contentText = item.primaryText;
      } else if (item.contentType === 'sentence' || item.contentType === 'phrase') {
        contentType = 'sentence';
        contentText = item.primaryText;
      } else if (item.contentType === 'question') {
        contentType = 'question';
        contentText = item.questionText || item.primaryText;
      } else if (item.contentType === 'grammar') {
        contentType = 'explanation';
        contentText = item.primaryText;
      } else {
        contentType = 'word';
        contentText = item.primaryText;
      }

      // Generate audio
      const result = await this.generateAudioForContent(
        item.id,
        contentText,
        item.language,
        contentType,
        item.cefrLevel,
        item.gameTypes?.[0]
      );

      if (result.success) {
        // Check if it was cached or newly generated
        if (result.audioAssetId) {
          const asset = await db
            .select()
            .from(linguaquestAudioAssets)
            .where(eq(linguaquestAudioAssets.id, result.audioAssetId))
            .limit(1);
          
          if (asset.length > 0 && asset[0].usageCount > 1) {
            stats.cached++;
          } else {
            stats.generated++;
          }
        } else {
          stats.generated++;
        }
      } else {
        stats.failed++;
        stats.errors.push({
          contentId: item.id,
          error: result.error || 'Unknown error'
        });
      }

      // Update job progress in real-time
      if (jobId) {
        const { linguaquestAudioJobs } = await import('../../shared/schema.js');
        const processedItems = stats.generated + stats.cached + stats.failed;
        await db
          .update(linguaquestAudioJobs)
          .set({
            processedItems: processedItems,
            generatedItems: stats.generated,
            cachedItems: stats.cached,
            failedItems: stats.failed,
            errors: stats.errors.length > 0 ? stats.errors : null
          })
          .where(eq(linguaquestAudioJobs.id, jobId));
      }

      // Delay to prevent overwhelming the system
      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    console.log(`\n✅ Batch audio generation complete!`);
    console.log(`   Generated: ${stats.generated}`);
    console.log(`   Cached: ${stats.cached}`);
    console.log(`   Failed: ${stats.failed}`);
    if (stats.errors.length > 0) {
      console.log(`\n❌ Errors:`);
      stats.errors.forEach(err => {
        console.log(`   Content ${err.contentId}: ${err.error}`);
      });
    }

    return stats;
  }
}

export const linguaquestAudioService = new LinguaquestAudioService();
