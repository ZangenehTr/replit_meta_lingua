#!/usr/bin/env tsx

/**
 * Generate MST Audio Files using Microsoft Edge TTS
 * Creates audio files for all MST listening items.
 *
 * Usage:
 *   npx tsx server/scripts/generate-mst-audio.ts                  (reads from DB — default)
 *   npx tsx server/scripts/generate-mst-audio.ts --source json     (reads JSON file only)
 *   npx tsx server/scripts/generate-mst-audio.ts --source db       (explicit DB mode)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Default to DB-first (auto-detects seeded DB items); use --source json to force JSON-only
const sourceArg = process.argv.includes('--source')
  ? process.argv[process.argv.indexOf('--source') + 1]
  : 'db';
const useDB = sourceArg !== 'json';

interface MSTItem {
  id: string;
  skill: string;
  stage: string;
  cefr: string;
  assets?: {
    audio?: string;
    transcript?: string;
  };
  metadata?: {
    accent?: string;
  };
}

interface ItemBank {
  skills: {
    listening: Record<string, MSTItem[]>;
  };
}

async function generateAudioFile(
  text: string,
  outputPath: string,
  voice: string = 'en-US-AriaNeural'
): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const proc = spawn('edge-tts', [
        '--voice', voice,
        '--text', text,
        '--write-media', outputPath,
      ]);

      proc.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ Generated: ${outputPath}`);
          resolve(true);
        } else {
          console.log(`❌ Failed to generate: ${outputPath} (exit code: ${code})`);
          resolve(false);
        }
      });

      proc.on('error', (error) => {
        console.error(`❌ Error generating ${outputPath}:`, error.message);
        resolve(false);
      });
    } catch (error) {
      console.error(`❌ Exception generating ${outputPath}:`, error);
      resolve(false);
    }
  });
}

async function loadItemsFromDB(): Promise<MSTItem[]> {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set. Cannot load items from DB.');
    console.error('   Use --source json to generate audio from the static item bank instead:');
    console.error('   npm run generate:mst-audio -- --source json');
    process.exit(1);
  }

  const { neonConfig, Pool } = await import('@neondatabase/serverless');
  const ws = (await import('ws')).default;
  neonConfig.webSocketConstructor = ws;

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  const result = await pool.query(
    `SELECT mst_item_id, content
       FROM placement_test_questions
      WHERE skill = 'listening'
        AND mst_item_id IS NOT NULL
        AND is_active = true
      ORDER BY mst_item_id`
  );

  await pool.end();

  interface DBRow { mst_item_id: string; content: string | MSTItem }
  return result.rows.map((row: DBRow) => {
    const content: unknown = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
    return content as MSTItem;
  });
}

async function loadItemsFromJSON(): Promise<MSTItem[]> {
  const itemBankPath = join(__dirname, '../../data/mst_item_bank.json');

  if (!existsSync(itemBankPath)) {
    console.error('❌ MST item bank not found at:', itemBankPath);
    process.exit(1);
  }

  const itemBank: ItemBank = JSON.parse(readFileSync(itemBankPath, 'utf-8'));
  const items: MSTItem[] = [];

  for (const stageItems of Object.values(itemBank.skills.listening)) {
    items.push(...stageItems);
  }

  return items;
}

async function main() {
  console.log(`🎵 MST Audio Generation — source: ${useDB ? 'database' : 'JSON file'}`);

  const items = useDB ? await loadItemsFromDB() : await loadItemsFromJSON();
  console.log(`📦 Found ${items.length} listening items`);

  const audioDir = join(__dirname, '../../client/public/assets/audio');
  if (!existsSync(audioDir)) {
    mkdirSync(audioDir, { recursive: true });
    console.log(`📁 Created directory: ${audioDir}`);
  }

  const voiceMap: Record<string, string> = {
    genAm:    'en-US-AriaNeural',
    britEng:  'en-GB-SoniaNeural',
    default:  'en-US-AriaNeural',
  };

  let totalGenerated = 0;
  let totalFailed = 0;
  const updatedPaths: Map<string, string> = new Map();

  for (const item of items) {
    if (!item.assets?.transcript) continue;

    const accent = item.metadata?.accent || 'default';
    const voice = voiceMap[accent] || voiceMap.default;
    const audioFileName = `${item.id.toLowerCase()}.mp3`;
    const audioPath = join(audioDir, audioFileName);

    console.log(`🎙️  Generating audio for ${item.id} (${item.cefr} ${item.stage}) with ${voice}…`);

    const success = await generateAudioFile(item.assets.transcript, audioPath, voice);

    if (success) {
      totalGenerated++;
      updatedPaths.set(item.id, `/assets/audio/${audioFileName}`);
      item.assets.audio = `/assets/audio/${audioFileName}`;
    } else {
      totalFailed++;
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Persist audio paths back to source
  if (totalGenerated > 0 && !useDB) {
    const itemBankPath = join(__dirname, '../../data/mst_item_bank.json');
    const itemBank: ItemBank = JSON.parse(readFileSync(itemBankPath, 'utf-8'));

    for (const stageItems of Object.values(itemBank.skills.listening)) {
      for (const item of stageItems) {
        const path = updatedPaths.get(item.id);
        if (path) {
          item.assets = item.assets || {};
          item.assets.audio = path;
        }
      }
    }

    writeFileSync(itemBankPath, JSON.stringify(itemBank, null, 2));
    console.log(`\n💾 Updated JSON item bank with ${totalGenerated} audio file paths`);
  }

  if (totalGenerated > 0 && useDB) {
    // Update DB audio paths
    const { neonConfig, Pool } = await import('@neondatabase/serverless');
    const ws = (await import('ws')).default;
    neonConfig.webSocketConstructor = ws;
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    for (const [mstItemId, audioPath] of updatedPaths) {
      const result = await pool.query(
        `SELECT id, content FROM placement_test_questions WHERE mst_item_id = $1`,
        [mstItemId]
      );
      if (result.rows.length > 0) {
        const row = result.rows[0];
        const content = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
        content.assets = content.assets || {};
        content.assets.audio = audioPath;
        await pool.query(
          `UPDATE placement_test_questions SET content = $1, updated_at = NOW() WHERE id = $2`,
          [JSON.stringify(content), row.id]
        );
      }
    }

    await pool.end();
    console.log(`\n💾 Updated DB content with ${totalGenerated} audio file paths`);
  }

  console.log(`\n🎵 Audio generation complete!`);
  console.log(`✅ Generated: ${totalGenerated} files`);
  console.log(`❌ Failed:    ${totalFailed} files`);

  if (totalFailed > 0) {
    console.log(`\n⚠️  Some files failed. Re-run this script to retry.`);
  }
}

main().catch(console.error);
