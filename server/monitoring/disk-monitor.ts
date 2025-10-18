import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { logger } from './logger.js';

const execAsync = promisify(exec);

export interface DiskSpaceInfo {
  total: number;
  used: number;
  available: number;
  usedPercent: number;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
}

export interface OrphanedFilesReport {
  linguaquestAudio: {
    count: number;
    sizeBytes: number;
    files: string[];
  };
  recordings: {
    count: number;
    sizeBytes: number;
    files: string[];
  };
  total: {
    count: number;
    sizeBytes: number;
  };
}

export class DiskMonitor {
  private readonly WARNING_THRESHOLD = 0.8; // 80%
  private readonly CRITICAL_THRESHOLD = 0.9; // 90%
  private readonly UPLOADS_DIR = path.join(process.cwd(), 'uploads');
  
  async checkDiskSpace(): Promise<DiskSpaceInfo> {
    try {
      // Use df command to check disk space
      const { stdout } = await execAsync('df -k /');
      const lines = stdout.trim().split('\n');
      const data = lines[1].split(/\s+/);
      
      // Parse disk space (in KB)
      const total = parseInt(data[1]) * 1024; // Convert KB to bytes
      const used = parseInt(data[2]) * 1024;
      const available = parseInt(data[3]) * 1024;
      const usedPercent = parseInt(data[4].replace('%', '')) / 100;
      
      return {
        total,
        used,
        available,
        usedPercent,
        status: this.getStatus(usedPercent),
      };
    } catch (error) {
      logger.error('Error checking disk space', { error });
      return {
        total: 0,
        used: 0,
        available: 0,
        usedPercent: 0,
        status: 'unknown',
      };
    }
  }
  
  private getStatus(usedPercent: number): 'healthy' | 'warning' | 'critical' {
    if (usedPercent >= this.CRITICAL_THRESHOLD) {
      return 'critical';
    } else if (usedPercent >= this.WARNING_THRESHOLD) {
      return 'warning';
    }
    return 'healthy';
  }
  
  async scanOrphanedFiles(): Promise<OrphanedFilesReport> {
    const report: OrphanedFilesReport = {
      linguaquestAudio: { count: 0, sizeBytes: 0, files: [] },
      recordings: { count: 0, sizeBytes: 0, files: [] },
      total: { count: 0, sizeBytes: 0 },
    };
    
    try {
      // Scan LinguaQuest audio files
      const audioDir = path.join(this.UPLOADS_DIR, 'linguaquest-audio');
      try {
        await fs.access(audioDir);
        const audioFiles = await this.scanDirectory(audioDir);
        report.linguaquestAudio.count = audioFiles.length;
        report.linguaquestAudio.sizeBytes = audioFiles.reduce((sum, f) => sum + f.size, 0);
        report.linguaquestAudio.files = audioFiles.map(f => f.name);
      } catch (err) {
        // Directory doesn't exist or not accessible
        logger.info('LinguaQuest audio directory not found', { audioDir });
      }
      
      // Scan recordings
      const recordingsDir = path.join(this.UPLOADS_DIR, 'recordings');
      try {
        await fs.access(recordingsDir);
        const recordingFiles = await this.scanDirectory(recordingsDir);
        report.recordings.count = recordingFiles.length;
        report.recordings.sizeBytes = recordingFiles.reduce((sum, f) => sum + f.size, 0);
        report.recordings.files = recordingFiles.map(f => f.name);
      } catch (err) {
        // Directory doesn't exist or not accessible
        logger.info('Recordings directory not found', { recordingsDir });
      }
      
      // Calculate totals
      report.total.count = report.linguaquestAudio.count + report.recordings.count;
      report.total.sizeBytes = report.linguaquestAudio.sizeBytes + report.recordings.sizeBytes;
      
      return report;
    } catch (error) {
      logger.error('Error scanning orphaned files', { error });
      return report;
    }
  }
  
  private async scanDirectory(dirPath: string): Promise<Array<{ name: string; size: number; path: string }>> {
    const files: Array<{ name: string; size: number; path: string }> = [];
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isFile()) {
          const stats = await fs.stat(fullPath);
          files.push({
            name: entry.name,
            size: stats.size,
            path: fullPath,
          });
        } else if (entry.isDirectory()) {
          // Recursively scan subdirectories
          const subFiles = await this.scanDirectory(fullPath);
          files.push(...subFiles);
        }
      }
    } catch (error) {
      logger.error('Error scanning directory', { dirPath, error });
    }
    
    return files;
  }
  
  async cleanupOrphanedFiles(olderThanDays: number = 30): Promise<{ deleted: number; freedBytes: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    let deleted = 0;
    let freedBytes = 0;
    
    try {
      // Cleanup old LinguaQuest audio files
      const audioDir = path.join(this.UPLOADS_DIR, 'linguaquest-audio');
      try {
        await fs.access(audioDir);
        const audioResult = await this.cleanupDirectory(audioDir, cutoffDate);
        deleted += audioResult.deleted;
        freedBytes += audioResult.freedBytes;
      } catch (err) {
        logger.info('LinguaQuest audio directory not found for cleanup');
      }
      
      // Cleanup old recordings
      const recordingsDir = path.join(this.UPLOADS_DIR, 'recordings');
      try {
        await fs.access(recordingsDir);
        const recordingsResult = await this.cleanupDirectory(recordingsDir, cutoffDate);
        deleted += recordingsResult.deleted;
        freedBytes += recordingsResult.freedBytes;
      } catch (err) {
        logger.info('Recordings directory not found for cleanup');
      }
      
      logger.info('Orphaned files cleanup completed', { deleted, freedBytes, olderThanDays });
      
      return { deleted, freedBytes };
    } catch (error) {
      logger.error('Error during orphaned files cleanup', { error });
      return { deleted, freedBytes };
    }
  }
  
  private async cleanupDirectory(dirPath: string, cutoffDate: Date): Promise<{ deleted: number; freedBytes: number }> {
    let deleted = 0;
    let freedBytes = 0;
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isFile()) {
          const stats = await fs.stat(fullPath);
          
          if (stats.mtime < cutoffDate) {
            await fs.unlink(fullPath);
            deleted++;
            freedBytes += stats.size;
            logger.info('Deleted orphaned file', { file: fullPath, size: stats.size });
          }
        } else if (entry.isDirectory()) {
          // Recursively cleanup subdirectories
          const subResult = await this.cleanupDirectory(fullPath, cutoffDate);
          deleted += subResult.deleted;
          freedBytes += subResult.freedBytes;
        }
      }
    } catch (error) {
      logger.error('Error cleaning directory', { dirPath, error });
    }
    
    return { deleted, freedBytes };
  }
  
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

export const diskMonitor = new DiskMonitor();
