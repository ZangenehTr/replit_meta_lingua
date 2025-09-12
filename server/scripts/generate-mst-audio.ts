#!/usr/bin/env tsx

/**
 * Generate MST Audio Files using Microsoft Edge TTS
 * This script creates audio files for all MST listening items
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface MSTItem {
  id: string;
  skill: string;
  stage: string;
  cefr: string;
  assets?: {
    audio?: string;
    transcript?: string;
  };
}

interface ItemBank {
  skills: {
    listening: {
      S1: MSTItem[];
      S2_up: MSTItem[];
      S2_stay: MSTItem[];
      S2_down: MSTItem[];
      S3_down: MSTItem[];
    };
  };
}

async function generateAudioFile(text: string, outputPath: string, voice: string = 'en-US-AriaNeural'): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      // Use edge-tts to generate audio
      const process = spawn('edge-tts', [
        '--voice', voice,
        '--text', text,
        '--write-media', outputPath
      ]);

      process.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ Generated: ${outputPath}`);
          resolve(true);
        } else {
          console.log(`❌ Failed to generate: ${outputPath} (exit code: ${code})`);
          resolve(false);
        }
      });

      process.on('error', (error) => {
        console.error(`❌ Error generating ${outputPath}:`, error.message);
        resolve(false);
      });
    } catch (error) {
      console.error(`❌ Exception generating ${outputPath}:`, error);
      resolve(false);
    }
  });
}

async function main() {
  console.log('🎵 Starting MST Audio Generation with Microsoft Edge TTS...');
  
  // Read MST item bank
  const itemBankPath = join(__dirname, '../../data/mst_item_bank.json');
  
  if (!existsSync(itemBankPath)) {
    console.error('❌ MST item bank not found at:', itemBankPath);
    process.exit(1);
  }

  const itemBank: ItemBank = JSON.parse(readFileSync(itemBankPath, 'utf-8'));
  
  // Create audio directories
  const audioDir = join(__dirname, '../../client/public/assets/audio');
  if (!existsSync(audioDir)) {
    mkdirSync(audioDir, { recursive: true });
    console.log(`📁 Created directory: ${audioDir}`);
  }

  // Voice mapping for different accents/domains
  const voiceMap: Record<string, string> = {
    'genAm': 'en-US-AriaNeural',      // General American
    'britEng': 'en-GB-SoniaNeural',   // British English
    'default': 'en-US-AriaNeural'
  };

  let totalGenerated = 0;
  let totalFailed = 0;

  // Process all listening items
  const listeningSkills = itemBank.skills.listening;
  
  for (const [stage, items] of Object.entries(listeningSkills)) {
    console.log(`\n📂 Processing ${stage} items...`);
    
    for (const item of items) {
      if (item.assets?.transcript) {
        // Determine voice based on metadata
        const accent = (item as any).metadata?.accent || 'default';
        const voice = voiceMap[accent] || voiceMap.default;
        
        // Generate audio filename
        const audioFileName = `${item.id.toLowerCase()}.mp3`;
        const audioPath = join(audioDir, audioFileName);
        
        console.log(`🎙️  Generating audio for ${item.id} with ${voice}...`);
        
        const success = await generateAudioFile(item.assets.transcript, audioPath, voice);
        
        if (success) {
          totalGenerated++;
          
          // Update item bank with audio path
          item.assets.audio = `/assets/audio/${audioFileName}`;
        } else {
          totalFailed++;
        }
        
        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  // Save updated item bank
  if (totalGenerated > 0) {
    writeFileSync(itemBankPath, JSON.stringify(itemBank, null, 2));
    console.log(`\n💾 Updated item bank with ${totalGenerated} audio file paths`);
  }

  console.log(`\n🎵 Audio generation complete!`);
  console.log(`✅ Generated: ${totalGenerated} files`);
  console.log(`❌ Failed: ${totalFailed} files`);
  
  if (totalFailed > 0) {
    console.log(`\n⚠️  Some audio files failed to generate. You can re-run this script to retry.`);
  }
}

// Run the script
main().catch(console.error);