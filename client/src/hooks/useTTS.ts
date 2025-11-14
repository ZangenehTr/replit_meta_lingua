import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface TTSAudioCache {
  [key: string]: string; // word-language -> audioUrl
}

const audioCache: TTSAudioCache = {};

export function useTTS(language: string = 'en') {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Generate audio for a single word
   */
  const generateWordAudio = useCallback(async (word: string): Promise<string | null> => {
    const cacheKey = `${word}-${language}`;
    
    // Return cached audio if available
    if (audioCache[cacheKey]) {
      return audioCache[cacheKey];
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await apiRequest('/api/tts/generate', {
        method: 'POST',
        body: {
          text: word,
          language,
          speed: 0.9 // Slightly slower for learning
        }
      });

      if (response.success && response.audioUrl) {
        // Cache the audio URL
        audioCache[cacheKey] = response.audioUrl;
        return response.audioUrl;
      } else {
        throw new Error(response.error || 'Failed to generate audio');
      }
    } catch (err: any) {
      console.error('TTS generation error:', err);
      setError(err.message || 'Failed to generate audio');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  /**
   * Generate audio for multiple words (batch)
   */
  const generateVocabularyAudio = useCallback(async (words: string[]): Promise<Record<string, string>> => {
    const audioUrls: Record<string, string> = {};
    
    try {
      setIsLoading(true);
      setError(null);

      // Check cache first
      const uncachedWords: string[] = [];
      words.forEach(word => {
        const cacheKey = `${word}-${language}`;
        if (audioCache[cacheKey]) {
          audioUrls[word] = audioCache[cacheKey];
        } else {
          uncachedWords.push(word);
        }
      });

      // Generate audio for uncached words
      if (uncachedWords.length > 0) {
        const response = await apiRequest('/api/tts/vocabulary', {
          method: 'POST',
          body: {
            words: uncachedWords,
            language,
            level: 'normal'
          }
        });

        if (response.success && response.audioFiles) {
          response.audioFiles.forEach((audioFile: any) => {
            if (audioFile.word && audioFile.audioUrl) {
              const cacheKey = `${audioFile.word}-${language}`;
              audioCache[cacheKey] = audioFile.audioUrl;
              audioUrls[audioFile.word] = audioFile.audioUrl;
            }
          });
        }
      }

      return audioUrls;
    } catch (err: any) {
      console.error('Vocabulary TTS generation error:', err);
      setError(err.message || 'Failed to generate vocabulary audio');
      return audioUrls; // Return partial results
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  /**
   * Play audio for a word
   */
  const playWord = useCallback(async (word: string) => {
    const audioUrl = await generateWordAudio(word);
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(err => {
        console.error('Audio playback error:', err);
        setError('Failed to play audio');
      });
    }
  }, [generateWordAudio]);

  /**
   * Clear audio cache
   */
  const clearCache = useCallback(() => {
    Object.keys(audioCache).forEach(key => delete audioCache[key]);
  }, []);

  return {
    generateWordAudio,
    generateVocabularyAudio,
    playWord,
    clearCache,
    isLoading,
    error
  };
}
