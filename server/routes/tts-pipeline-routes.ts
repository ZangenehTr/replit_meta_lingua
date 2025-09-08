/**
 * API routes for the advanced TTS/ASR pipeline integration
 */
import { Router } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const router = Router();
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const access = promisify(fs.access);

interface PipelineRequest {
  goal: 'general' | 'toefl' | 'ielts' | 'pte' | 'business';
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  topic: string;
  duration_sec: number;
  l1?: 'fa' | 'ar' | 'other';
  vocab_count?: number;
  seed?: number;
}

interface PipelineResponse {
  success: boolean;
  outputs?: {
    listening_audio?: string;
    vocabulary_audio?: string;
    transcript?: string;
    report?: string;
  };
  error?: string;
  processing_time?: number;
}

/**
 * Generate advanced TTS audio using the Coqui pipeline
 */
router.post('/advanced/generate', async (req, res) => {
  try {
    const request: PipelineRequest = req.body;
    
    // Validate request
    const validation = validatePipelineRequest(request);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: `Invalid request: ${validation.errors.join(', ')}`
      });
    }
    
    console.log(`🎤 Starting advanced TTS pipeline for ${request.goal} ${request.level}`);
    const startTime = Date.now();
    
    // Check if Python pipeline is available
    const pipelinePath = path.join(__dirname, '../../tts_pipeline');
    const mainScript = path.join(pipelinePath, 'main.py');
    
    try {
      await access(mainScript);
    } catch (error) {
      return res.status(503).json({
        success: false,
        error: 'Advanced TTS pipeline not available. Using fallback system.',
        fallback_suggested: true
      });
    }
    
    // Run the Python pipeline
    const result = await runPythonPipeline(request, pipelinePath);
    
    if (result.success) {
      const processingTime = Date.now() - startTime;
      
      // Move outputs to public directory for serving
      const publicOutputs = await moveOutputsToPublic(result.outputs);
      
      console.log(`✅ Advanced TTS pipeline completed in ${processingTime}ms`);
      
      res.json({
        success: true,
        outputs: publicOutputs,
        processing_time: processingTime,
        pipeline_type: 'advanced_coqui',
        accent_policy_applied: true,
        quality_assured: true
      });
    } else {
      console.error('❌ Advanced TTS pipeline failed:', result.error);
      
      res.status(500).json({
        success: false,
        error: result.error,
        processing_time: Date.now() - startTime,
        fallback_suggested: true
      });
    }
    
  } catch (error) {
    console.error('Advanced TTS pipeline error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal pipeline error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get pipeline status and capabilities
 */
router.get('/status', async (req, res) => {
  try {
    const pipelinePath = path.join(__dirname, '../../tts_pipeline');
    const mainScript = path.join(pipelinePath, 'main.py');
    const voicesConfig = path.join(pipelinePath, 'voices.yaml');
    
    // Check component availability
    const components = {
      python_pipeline: await checkFileExists(mainScript),
      voices_config: await checkFileExists(voicesConfig),
      output_directory: await checkDirectoryExists(path.join(pipelinePath, 'out')),
    };
    
    // Test basic imports
    const pythonModules = await testPythonModules(pipelinePath);
    
    const status = {
      available: components.python_pipeline,
      components,
      python_modules: pythonModules,
      supported_goals: ['general', 'toefl', 'ielts', 'pte', 'business'],
      supported_levels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
      supported_languages: ['fa', 'ar', 'other'],
      features: {
        accent_aware_synthesis: true,
        multi_speaker_conversations: true,
        vocabulary_extraction: true,
        quality_assurance: true,
        whisper_transcription: true,
        cefr_level_adaptation: true
      }
    };
    
    res.json(status);
    
  } catch (error) {
    res.status(500).json({
      available: false,
      error: 'Failed to check pipeline status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get available voice accents and configurations
 */
router.get('/voices', async (req, res) => {
  try {
    const voicesConfigPath = path.join(__dirname, '../../tts_pipeline/voices.yaml');
    
    try {
      const configContent = await readFile(voicesConfigPath, 'utf8');
      // Parse YAML (basic parsing - in production use proper YAML parser)
      const voicesInfo = parseVoicesYaml(configContent);
      
      res.json({
        success: true,
        voices: voicesInfo,
        accent_policies: {
          general: 'American English (US)',
          toefl: 'American English (US)', 
          ielts: 'British English (UK) with some variety',
          pte: 'Mix of UK, Australian, US accents',
          business: 'Global variety (US, UK, Indian, L2 speakers)'
        }
      });
      
    } catch (error) {
      res.json({
        success: false,
        error: 'Voices configuration not available',
        default_fallback: true
      });
    }
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load voice configuration'
    });
  }
});

// Helper functions

function validatePipelineRequest(request: PipelineRequest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!request.goal || !['general', 'toefl', 'ielts', 'pte', 'business'].includes(request.goal)) {
    errors.push('Invalid goal. Must be one of: general, toefl, ielts, pte, business');
  }
  
  if (!request.level || !['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(request.level)) {
    errors.push('Invalid level. Must be one of: A1, A2, B1, B2, C1, C2');
  }
  
  if (!request.topic || request.topic.trim().length === 0) {
    errors.push('Topic is required');
  }
  
  if (!request.duration_sec || request.duration_sec < 30 || request.duration_sec > 600) {
    errors.push('Duration must be between 30-600 seconds');
  }
  
  if (request.vocab_count && (request.vocab_count < 1 || request.vocab_count > 50)) {
    errors.push('Vocabulary count must be between 1-50');
  }
  
  return { valid: errors.length === 0, errors };
}

async function runPythonPipeline(request: PipelineRequest, pipelinePath: string): Promise<PipelineResponse> {
  return new Promise((resolve) => {
    const args = [
      path.join(pipelinePath, 'main.py'),
      '--goal', request.goal,
      '--level', request.level,
      '--topic', request.topic,
      '--duration_sec', request.duration_sec.toString(),
    ];
    
    if (request.l1) args.push('--l1', request.l1);
    if (request.vocab_count) args.push('--vocab_count', request.vocab_count.toString());
    if (request.seed) args.push('--seed', request.seed.toString());
    
    args.push('--voices', path.join(pipelinePath, 'voices.yaml'));
    
    const pythonProcess = spawn('python3.11', args, {
      cwd: pipelinePath,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log(`Pipeline: ${data.toString().trim()}`);
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error(`Pipeline Error: ${data.toString().trim()}`);
    });
    
    pythonProcess.on('close', async (code) => {
      if (code === 0) {
        // Parse outputs from the pipeline
        const outputs = await parseOutputsFromPipeline(pipelinePath, request);
        resolve({
          success: true,
          outputs: outputs
        });
      } else {
        resolve({
          success: false,
          error: `Pipeline failed with code ${code}: ${stderr || 'Unknown error'}`
        });
      }
    });
    
    // Timeout after 5 minutes
    setTimeout(() => {
      pythonProcess.kill();
      resolve({
        success: false,
        error: 'Pipeline timeout - took longer than 5 minutes'
      });
    }, 5 * 60 * 1000);
  });
}

async function parseOutputsFromPipeline(pipelinePath: string, request: PipelineRequest) {
  const outputDir = path.join(pipelinePath, 'out');
  const outputs: any = {};
  
  try {
    const files = await fs.promises.readdir(outputDir);
    
    // Find generated files (they should contain the goal and topic)
    const goalFilter = request.goal;
    const topicSafe = request.topic.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    
    for (const file of files) {
      const filePath = path.join(outputDir, file);
      const stat = await fs.promises.stat(filePath);
      
      if (!stat.isFile()) continue;
      
      if (file.startsWith('listening_') && file.includes(goalFilter)) {
        outputs.listening_audio = filePath;
      } else if (file.startsWith('vocab_') && file.includes(goalFilter)) {
        outputs.vocabulary_audio = filePath;
      } else if (file.startsWith('transcript_') && file.includes(goalFilter)) {
        outputs.transcript = filePath;
      } else if (file.startsWith('report_') && file.includes(goalFilter)) {
        outputs.report = filePath;
      }
    }
    
    return outputs;
    
  } catch (error) {
    console.error('Error parsing pipeline outputs:', error);
    return {};
  }
}

async function moveOutputsToPublic(outputs: any): Promise<any> {
  const publicOutputs: any = {};
  
  for (const [key, filePath] of Object.entries(outputs)) {
    if (typeof filePath !== 'string') continue;
    
    try {
      const fileName = path.basename(filePath as string);
      const publicPath = path.join(__dirname, '../../../uploads/tts', fileName);
      
      // Ensure upload directory exists
      await fs.promises.mkdir(path.dirname(publicPath), { recursive: true });
      
      // Copy file to public location
      await fs.promises.copyFile(filePath as string, publicPath);
      
      // Return public URL
      publicOutputs[key] = `/uploads/tts/${fileName}`;
      
    } catch (error) {
      console.error(`Failed to move output file ${filePath}:`, error);
    }
  }
  
  return publicOutputs;
}

async function checkFileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function checkDirectoryExists(dirPath: string): Promise<boolean> {
  try {
    const stat = await fs.promises.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

async function testPythonModules(pipelinePath: string): Promise<{ [key: string]: boolean }> {
  return new Promise((resolve) => {
    const testScript = `
import sys
modules = {}
try:
    import pydub
    modules['pydub'] = True
except ImportError:
    modules['pydub'] = False

try:
    import librosa  
    modules['librosa'] = True
except ImportError:
    modules['librosa'] = False
    
try:
    import numpy
    modules['numpy'] = True
except ImportError:
    modules['numpy'] = False

try:
    import yaml
    modules['yaml'] = True
except ImportError:
    modules['yaml'] = False

print(str(modules).replace("'", '"'))
`;
    
    const pythonProcess = spawn('python3.11', ['-c', testScript], {
      cwd: pipelinePath,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let result = '';
    
    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      try {
        const modules = JSON.parse(result.trim());
        resolve(modules);
      } catch {
        resolve({});
      }
    });
    
    setTimeout(() => {
      pythonProcess.kill();
      resolve({});
    }, 10000);
  });
}

function parseVoicesYaml(content: string): any {
  // Basic YAML parsing for voices config
  // In production, use a proper YAML parser
  const lines = content.split('\n');
  const voices: any = {};
  
  let currentVoice = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.endsWith(':') && !trimmed.startsWith(' ') && !trimmed.startsWith('voices:')) {
      currentVoice = trimmed.slice(0, -1);
      voices[currentVoice] = {};
    } else if (trimmed.startsWith('description:')) {
      if (currentVoice) {
        voices[currentVoice].description = trimmed.split('description:')[1].trim().replace(/"/g, '');
      }
    } else if (trimmed.startsWith('gender:')) {
      if (currentVoice) {
        voices[currentVoice].gender = trimmed.split('gender:')[1].trim().replace(/"/g, '');
      }
    }
  }
  
  return voices;
}

export default router;