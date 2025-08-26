/**
 * Advanced Call Recording Service
 * Features:
 * - Automatic transcript generation
 * - Searchable recording library
 * - Highlight reel creation
 * - Synchronized playback with timestamps
 */

import { DatabaseStorage } from '../database-storage';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface RecordingMetadata {
  id: string;
  sessionId: number;
  studentId: number;
  teacherId: number;
  fileName: string;
  fileSize: number;
  duration: number;
  recordedAt: Date;
  transcript?: TranscriptData;
  highlights?: HighlightSegment[];
  tags?: string[];
  language?: string;
  searchableText?: string;
}

interface TranscriptData {
  segments: TranscriptSegment[];
  fullText: string;
  keywords: string[];
  speakerLabels?: SpeakerLabel[];
  confidence: number;
  generatedAt: Date;
}

interface TranscriptSegment {
  startTime: number;
  endTime: number;
  text: string;
  speaker?: 'student' | 'teacher';
  confidence: number;
  keywords?: string[];
}

interface SpeakerLabel {
  speaker: 'student' | 'teacher';
  segments: number[];
}

interface HighlightSegment {
  id: string;
  startTime: number;
  endTime: number;
  title: string;
  description: string;
  type: 'vocabulary' | 'grammar' | 'pronunciation' | 'discussion' | 'feedback';
  importance: 'low' | 'medium' | 'high';
  thumbnail?: string;
  tags?: string[];
}

interface SearchQuery {
  query?: string;
  studentId?: number;
  teacherId?: number;
  dateFrom?: Date;
  dateTo?: Date;
  tags?: string[];
  minDuration?: number;
  maxDuration?: number;
  hasTranscript?: boolean;
  language?: string;
}

export class RecordingService {
  private storage: DatabaseStorage;
  private recordingsPath: string;
  private transcriptsPath: string;
  private highlightsPath: string;

  constructor(storage: DatabaseStorage) {
    this.storage = storage;
    this.recordingsPath = path.join(process.cwd(), 'recordings');
    this.transcriptsPath = path.join(process.cwd(), 'transcripts');
    this.highlightsPath = path.join(process.cwd(), 'highlights');
    
    // Ensure directories exist
    this.initializeDirectories();
  }

  private async initializeDirectories() {
    await fs.mkdir(this.recordingsPath, { recursive: true });
    await fs.mkdir(this.transcriptsPath, { recursive: true });
    await fs.mkdir(this.highlightsPath, { recursive: true });
  }

  /**
   * Save recording and generate metadata
   */
  async saveRecording(
    sessionId: number,
    studentId: number,
    teacherId: number,
    recordingBuffer: Buffer,
    language?: string
  ): Promise<RecordingMetadata> {
    const recordingId = `rec_${Date.now()}_${sessionId}`;
    const fileName = `${recordingId}.webm`;
    const filePath = path.join(this.recordingsPath, fileName);

    // Save recording file
    await fs.writeFile(filePath, recordingBuffer);

    // Get file metadata
    const stats = await fs.stat(filePath);
    const duration = await this.getVideoDuration(filePath);

    // Create metadata
    const metadata: RecordingMetadata = {
      id: recordingId,
      sessionId,
      studentId,
      teacherId,
      fileName,
      fileSize: stats.size,
      duration,
      recordedAt: new Date(),
      language,
      tags: []
    };

    // Store metadata in database
    await this.storage.saveRecordingMetadata(metadata);

    // Start async processing
    this.processRecordingAsync(recordingId, filePath, language);

    return metadata;
  }

  /**
   * Process recording asynchronously
   * - Generate transcript
   * - Extract highlights
   * - Generate thumbnails
   */
  private async processRecordingAsync(
    recordingId: string,
    filePath: string,
    language?: string
  ) {
    try {
      // Generate transcript
      const transcript = await this.generateTranscript(filePath, language);
      await this.storage.updateRecordingTranscript(recordingId, transcript);

      // Extract highlights based on transcript
      const highlights = await this.extractHighlights(transcript, filePath);
      await this.storage.updateRecordingHighlights(recordingId, highlights);

      // Generate searchable text
      const searchableText = this.createSearchableText(transcript, highlights);
      await this.storage.updateRecordingSearchableText(recordingId, searchableText);

      console.log(`Recording ${recordingId} processed successfully`);
    } catch (error) {
      console.error(`Failed to process recording ${recordingId}:`, error);
    }
  }

  /**
   * Generate transcript using speech-to-text
   */
  async generateTranscript(
    filePath: string,
    language: string = 'en'
  ): Promise<TranscriptData> {
    // Extract audio from video
    const audioPath = filePath.replace('.webm', '.wav');
    await execAsync(
      `ffmpeg -i ${filePath} -vn -acodec pcm_s16le -ar 16000 -ac 1 ${audioPath}`
    );

    // Use OpenAI/Ollama for transcription (simplified example)
    const segments: TranscriptSegment[] = [];
    const fullText: string[] = [];
    
    // Mock implementation - replace with actual STT service
    // In production, use OpenAI Whisper API or similar
    const mockSegments = [
      {
        startTime: 0,
        endTime: 5,
        text: "Hello, today we'll practice conversation skills.",
        speaker: 'teacher' as const,
        confidence: 0.95,
        keywords: ['conversation', 'skills', 'practice']
      },
      {
        startTime: 5,
        endTime: 10,
        text: "Hi teacher, I'm ready to start.",
        speaker: 'student' as const,
        confidence: 0.92,
        keywords: ['ready', 'start']
      }
    ];

    segments.push(...mockSegments);
    fullText.push(...mockSegments.map(s => s.text));

    // Extract keywords from full text
    const keywords = this.extractKeywords(fullText.join(' '));

    // Clean up audio file
    await fs.unlink(audioPath);

    return {
      segments,
      fullText: fullText.join(' '),
      keywords,
      confidence: 0.93,
      generatedAt: new Date(),
      speakerLabels: [
        { speaker: 'teacher', segments: [0] },
        { speaker: 'student', segments: [1] }
      ]
    };
  }

  /**
   * Extract highlight segments from transcript
   */
  async extractHighlights(
    transcript: TranscriptData,
    videoPath: string
  ): Promise<HighlightSegment[]> {
    const highlights: HighlightSegment[] = [];

    // Analyze transcript for important segments
    for (let i = 0; i < transcript.segments.length; i++) {
      const segment = transcript.segments[i];
      
      // Check for teaching moments
      if (this.isTeachingMoment(segment)) {
        highlights.push({
          id: `hl_${Date.now()}_${i}`,
          startTime: segment.startTime,
          endTime: segment.endTime,
          title: 'Teaching Moment',
          description: segment.text.substring(0, 100),
          type: this.determineSegmentType(segment),
          importance: 'high',
          tags: segment.keywords
        });
      }

      // Check for feedback segments
      if (this.isFeedbackSegment(segment)) {
        highlights.push({
          id: `hl_${Date.now()}_${i}`,
          startTime: segment.startTime,
          endTime: segment.endTime,
          title: 'Feedback',
          description: segment.text.substring(0, 100),
          type: 'feedback',
          importance: 'medium',
          tags: segment.keywords
        });
      }
    }

    // Generate thumbnails for highlights
    for (const highlight of highlights) {
      highlight.thumbnail = await this.generateThumbnail(
        videoPath,
        highlight.startTime,
        highlight.id
      );
    }

    return highlights;
  }

  /**
   * Search recordings with filters
   */
  async searchRecordings(query: SearchQuery): Promise<RecordingMetadata[]> {
    // Build search criteria
    const criteria: any = {};

    if (query.studentId) criteria.studentId = query.studentId;
    if (query.teacherId) criteria.teacherId = query.teacherId;
    if (query.dateFrom) criteria.recordedAt = { $gte: query.dateFrom };
    if (query.dateTo) criteria.recordedAt = { ...criteria.recordedAt, $lte: query.dateTo };
    if (query.language) criteria.language = query.language;
    if (query.hasTranscript !== undefined) {
      criteria.transcript = query.hasTranscript ? { $exists: true } : { $exists: false };
    }

    // Text search in transcripts and highlights
    if (query.query) {
      criteria.$text = { $search: query.query };
    }

    // Tag search
    if (query.tags && query.tags.length > 0) {
      criteria.tags = { $in: query.tags };
    }

    // Duration filters
    if (query.minDuration) {
      criteria.duration = { $gte: query.minDuration };
    }
    if (query.maxDuration) {
      criteria.duration = { ...criteria.duration, $lte: query.maxDuration };
    }

    return this.storage.searchRecordings(criteria);
  }

  /**
   * Get synchronized playback data
   */
  async getSynchronizedPlayback(recordingId: string): Promise<{
    recording: RecordingMetadata;
    transcript: TranscriptData;
    highlights: HighlightSegment[];
    playbackUrl: string;
  }> {
    const recording = await this.storage.getRecording(recordingId);
    if (!recording) {
      throw new Error('Recording not found');
    }

    return {
      recording,
      transcript: recording.transcript!,
      highlights: recording.highlights || [],
      playbackUrl: `/api/recordings/stream/${recordingId}`
    };
  }

  /**
   * Create highlight reel from multiple segments
   */
  async createHighlightReel(
    recordingId: string,
    segmentIds: string[]
  ): Promise<string> {
    const recording = await this.storage.getRecording(recordingId);
    if (!recording || !recording.highlights) {
      throw new Error('Recording or highlights not found');
    }

    const selectedSegments = recording.highlights.filter(h => 
      segmentIds.includes(h.id)
    );

    if (selectedSegments.length === 0) {
      throw new Error('No valid segments selected');
    }

    // Sort segments by start time
    selectedSegments.sort((a, b) => a.startTime - b.startTime);

    // Generate FFmpeg command for concatenating segments
    const outputPath = path.join(
      this.highlightsPath,
      `reel_${recordingId}_${Date.now()}.mp4`
    );

    const inputPath = path.join(this.recordingsPath, recording.fileName);
    
    // Create filter complex for concatenation
    let filterComplex = '';
    const segments = selectedSegments.map((seg, idx) => {
      const duration = seg.endTime - seg.startTime;
      return `[0:v]trim=start=${seg.startTime}:duration=${duration},setpts=PTS-STARTPTS[v${idx}];` +
             `[0:a]atrim=start=${seg.startTime}:duration=${duration},asetpts=PTS-STARTPTS[a${idx}];`;
    }).join('');

    const concatInputs = selectedSegments.map((_, idx) => `[v${idx}][a${idx}]`).join('');
    filterComplex = segments + `${concatInputs}concat=n=${selectedSegments.length}:v=1:a=1[outv][outa]`;

    // Execute FFmpeg command
    await execAsync(
      `ffmpeg -i ${inputPath} -filter_complex "${filterComplex}" -map "[outv]" -map "[outa]" ${outputPath}`
    );

    // Save reel metadata
    await this.storage.saveHighlightReel({
      id: `reel_${Date.now()}`,
      recordingId,
      segments: selectedSegments,
      createdAt: new Date(),
      filePath: outputPath
    });

    return outputPath;
  }

  /**
   * Stream recording for playback
   */
  async streamRecording(recordingId: string, range?: string): Promise<{
    stream: fs.ReadStream;
    contentType: string;
    contentLength: number;
    contentRange?: string;
  }> {
    const recording = await this.storage.getRecording(recordingId);
    if (!recording) {
      throw new Error('Recording not found');
    }

    const filePath = path.join(this.recordingsPath, recording.fileName);
    const stat = await fs.stat(filePath);
    const fileSize = stat.size;

    if (range) {
      // Handle range requests for video streaming
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;

      const stream = (await import('fs')).createReadStream(filePath, { start, end });

      return {
        stream: stream as any,
        contentType: 'video/webm',
        contentLength: chunksize,
        contentRange: `bytes ${start}-${end}/${fileSize}`
      };
    } else {
      // Stream entire file
      const stream = (await import('fs')).createReadStream(filePath);
      
      return {
        stream: stream as any,
        contentType: 'video/webm',
        contentLength: fileSize
      };
    }
  }

  // Helper methods
  private async getVideoDuration(filePath: string): Promise<number> {
    try {
      const { stdout } = await execAsync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${filePath}`
      );
      return parseFloat(stdout);
    } catch {
      return 0;
    }
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - in production use NLP library
    const commonWords = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an']);
    const words = text.toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 3 && !commonWords.has(word));
    
    // Count word frequency
    const wordFreq = new Map<string, number>();
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });

    // Return top keywords
    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  private isTeachingMoment(segment: TranscriptSegment): boolean {
    const teachingKeywords = ['explain', 'understand', 'example', 'practice', 'remember', 'important'];
    return segment.speaker === 'teacher' && 
           teachingKeywords.some(keyword => 
             segment.text.toLowerCase().includes(keyword)
           );
  }

  private isFeedbackSegment(segment: TranscriptSegment): boolean {
    const feedbackKeywords = ['good', 'excellent', 'correct', 'try again', 'almost', 'better'];
    return segment.speaker === 'teacher' && 
           feedbackKeywords.some(keyword => 
             segment.text.toLowerCase().includes(keyword)
           );
  }

  private determineSegmentType(segment: TranscriptSegment): HighlightSegment['type'] {
    const text = segment.text.toLowerCase();
    
    if (text.includes('vocabulary') || text.includes('word')) return 'vocabulary';
    if (text.includes('grammar') || text.includes('sentence')) return 'grammar';
    if (text.includes('pronunciation') || text.includes('sound')) return 'pronunciation';
    if (text.includes('discuss') || text.includes('talk')) return 'discussion';
    
    return 'feedback';
  }

  private createSearchableText(
    transcript: TranscriptData,
    highlights: HighlightSegment[]
  ): string {
    const texts = [
      transcript.fullText,
      ...transcript.keywords,
      ...highlights.map(h => h.title + ' ' + h.description),
      ...highlights.flatMap(h => h.tags || [])
    ];
    
    return texts.join(' ').toLowerCase();
  }

  private async generateThumbnail(
    videoPath: string,
    timestamp: number,
    id: string
  ): Promise<string> {
    const thumbnailPath = path.join(this.highlightsPath, `thumb_${id}.jpg`);
    
    try {
      await execAsync(
        `ffmpeg -ss ${timestamp} -i ${videoPath} -vframes 1 -q:v 2 ${thumbnailPath}`
      );
      return thumbnailPath;
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
      return '';
    }
  }
}