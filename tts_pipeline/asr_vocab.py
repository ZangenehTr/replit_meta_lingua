"""
ASR transcription and vocabulary extraction system.
"""
import os
import json
import re
from typing import List, Dict, Any, Tuple, Optional
import numpy as np
from pathlib import Path

try:
    import whisper
    from faster_whisper import WhisperModel
except ImportError as e:
    print(f"Warning: Whisper not available: {e}")
    print("Please install with: pip install openai-whisper faster-whisper")


class TranscriptionService:
    """Handles audio transcription with word-level timestamps."""
    
    def __init__(self, model_size: str = "base", use_faster_whisper: bool = True):
        self.model_size = model_size
        self.use_faster_whisper = use_faster_whisper
        self.model = None
        self._load_model()
    
    def _load_model(self):
        """Load the appropriate Whisper model."""
        try:
            if self.use_faster_whisper:
                self.model = WhisperModel(self.model_size, device="cpu", compute_type="int8")
                print(f"✓ Loaded faster-whisper model: {self.model_size}")
            else:
                self.model = whisper.load_model(self.model_size)
                print(f"✓ Loaded OpenAI Whisper model: {self.model_size}")
                
        except Exception as e:
            print(f"✗ Failed to load Whisper model: {e}")
            self.model = None
    
    def transcribe_audio(self, audio_path: str, language: str = "en") -> Dict[str, Any]:
        """Transcribe audio with word-level timestamps."""
        
        if self.model is None:
            return {'error': 'Whisper model not available'}
        
        try:
            print(f"Transcribing audio: {audio_path}")
            
            if self.use_faster_whisper:
                segments, info = self.model.transcribe(
                    audio_path, 
                    language=language,
                    word_timestamps=True,
                    vad_filter=True,  # Voice activity detection
                    vad_parameters={"threshold": 0.5}
                )
                
                # Convert to standard format
                result = self._process_faster_whisper_result(segments, info)
                
            else:
                result = self.model.transcribe(
                    audio_path, 
                    language=language,
                    word_timestamps=True
                )
            
            print(f"✓ Transcription completed: {len(result.get('segments', []))} segments")
            return result
            
        except Exception as e:
            print(f"✗ Transcription failed: {e}")
            return {'error': str(e)}
    
    def _process_faster_whisper_result(self, segments, info) -> Dict[str, Any]:
        """Process faster-whisper result into standard format."""
        
        processed_segments = []
        all_words = []
        
        for segment in segments:
            segment_dict = {
                'id': len(processed_segments),
                'start': segment.start,
                'end': segment.end,
                'text': segment.text.strip(),
                'words': []
            }
            
            # Add word-level timestamps if available
            if hasattr(segment, 'words') and segment.words:
                for word in segment.words:
                    word_dict = {
                        'start': word.start,
                        'end': word.end,
                        'word': word.word.strip(),
                        'probability': getattr(word, 'probability', 1.0)
                    }
                    segment_dict['words'].append(word_dict)
                    all_words.append(word_dict)
            
            processed_segments.append(segment_dict)
        
        return {
            'text': ' '.join(seg['text'] for seg in processed_segments),
            'segments': processed_segments,
            'words': all_words,
            'language': info.language if hasattr(info, 'language') else 'en'
        }


class VocabularyExtractor:
    """Extracts and prioritizes vocabulary from transcribed audio."""
    
    def __init__(self):
        self.cefr_levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
        self.pos_priorities = {
            'NOUN': 3,
            'VERB': 3, 
            'ADJ': 2,
            'ADV': 2,
            'PREP': 1,
            'CONJ': 1
        }
        # Load word frequency data (simplified)
        self.word_frequencies = self._load_word_frequencies()
        self.cefr_mappings = self._load_cefr_mappings()
    
    def extract_vocabulary(self, transcription: Dict[str, Any], 
                          target_level: str, vocab_count: int = 10,
                          exclude_proper_nouns: bool = True) -> List[Dict[str, Any]]:
        """Extract vocabulary appropriate for the target level."""
        
        text = transcription.get('text', '')
        words_with_timestamps = transcription.get('words', [])
        
        print(f"Extracting {vocab_count} vocabulary items for level {target_level}")
        
        # Tokenize and analyze words
        candidate_words = self._analyze_words(text, words_with_timestamps)
        
        # Filter by appropriateness
        filtered_words = self._filter_words(candidate_words, target_level, exclude_proper_nouns)
        
        # Score and rank words
        ranked_words = self._rank_words(filtered_words, target_level)
        
        # Select top words
        selected_words = ranked_words[:vocab_count]
        
        # Enhance with definitions and examples
        vocabulary_items = []
        for word_info in selected_words:
            vocab_item = self._create_vocabulary_item(word_info, transcription)
            vocabulary_items.append(vocab_item)
        
        print(f"✓ Selected {len(vocabulary_items)} vocabulary items")
        return vocabulary_items
    
    def _analyze_words(self, text: str, words_with_timestamps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Analyze words for part of speech and other features."""
        
        # Simple tokenization (in production, use spaCy or NLTK)
        words = re.findall(r'\b[a-zA-Z]+\b', text.lower())
        word_positions = {word['word'].lower().strip(): word for word in words_with_timestamps}
        
        candidate_words = []
        seen_words = set()
        
        for word in words:
            if word in seen_words or len(word) < 3:
                continue
                
            seen_words.add(word)
            
            # Get timestamp info if available
            timestamp_info = word_positions.get(word, {})
            
            word_info = {
                'word': word,
                'length': len(word),
                'frequency': self.word_frequencies.get(word, 1000000),  # High number = rare
                'pos': self._estimate_pos(word),  # Simplified POS estimation
                'timestamp': timestamp_info.get('start', 0),
                'context': self._extract_context(word, text)
            }
            
            candidate_words.append(word_info)
        
        return candidate_words
    
    def _filter_words(self, words: List[Dict[str, Any]], target_level: str, 
                     exclude_proper_nouns: bool) -> List[Dict[str, Any]]:
        """Filter words based on appropriateness criteria."""
        
        filtered = []
        
        for word_info in words:
            word = word_info['word']
            
            # Skip if too common or too basic
            if word in self._get_basic_words():
                continue
            
            # Skip proper nouns if requested
            if exclude_proper_nouns and word[0].isupper():
                continue
            
            # Skip inappropriate content
            if not self._is_appropriate_word(word):
                continue
            
            # Check if word is suitable for level
            word_level = self._get_word_cefr_level(word)
            if self._is_level_appropriate(word_level, target_level):
                word_info['cefr_level'] = word_level
                filtered.append(word_info)
        
        return filtered
    
    def _rank_words(self, words: List[Dict[str, Any]], target_level: str) -> List[Dict[str, Any]]:
        """Rank words by learning value for the target level."""
        
        for word_info in words:
            score = 0
            
            # Frequency score (less frequent = more valuable)
            freq = word_info['frequency']
            if freq > 10000:
                score += 3  # Rare words
            elif freq > 5000:
                score += 2  # Uncommon words
            else:
                score += 1  # Common words
            
            # POS score
            pos = word_info.get('pos', 'UNKNOWN')
            score += self.pos_priorities.get(pos, 0)
            
            # Level appropriateness score
            word_level = word_info.get('cefr_level', 'B1')
            if word_level == target_level:
                score += 3  # Perfect match
            elif abs(self.cefr_levels.index(word_level) - self.cefr_levels.index(target_level)) == 1:
                score += 2  # Close level
            
            # Length bonus (longer words often more advanced)
            if word_info['length'] > 6:
                score += 1
            
            word_info['learning_score'] = score
        
        # Sort by score descending
        return sorted(words, key=lambda x: x['learning_score'], reverse=True)
    
    def _create_vocabulary_item(self, word_info: Dict[str, Any], 
                               transcription: Dict[str, Any]) -> Dict[str, Any]:
        """Create comprehensive vocabulary item with definition and examples."""
        
        word = word_info['word']
        
        # Find sentence from transcription containing this word
        original_sentence = self._find_sentence_with_word(word, transcription.get('text', ''))
        
        vocabulary_item = {
            'word': word,
            'pos': word_info.get('pos', 'unknown'),
            'cefr_level': word_info.get('cefr_level', 'B1'),
            'definition': self._get_simple_definition(word, word_info.get('pos')),
            'pronunciation': self._get_pronunciation_guide(word),
            'timestamp': word_info.get('timestamp', 0),
            'context_sentence': original_sentence,
            'example_sentence': self._generate_example_sentence(word, word_info.get('pos')),
            'collocations': self._get_collocations(word),
            'difficulty_notes': self._get_difficulty_notes(word, word_info.get('cefr_level')),
            'translation_notes': self._get_translation_notes(word)
        }
        
        return vocabulary_item
    
    def _load_word_frequencies(self) -> Dict[str, int]:
        """Load word frequency data (simplified version)."""
        # In a real implementation, this would load from a comprehensive frequency list
        return {
            'the': 1, 'of': 2, 'and': 3, 'to': 4, 'a': 5,
            'in': 6, 'is': 7, 'it': 8, 'you': 9, 'that': 10,
            # Add more common words...
        }
    
    def _load_cefr_mappings(self) -> Dict[str, str]:
        """Load CEFR level mappings for words."""
        # Simplified mapping - in production, use comprehensive CEFR word lists
        return {
            'hello': 'A1', 'goodbye': 'A1', 'please': 'A1',
            'restaurant': 'A2', 'appointment': 'A2', 
            'opportunity': 'B1', 'experience': 'B1',
            'administration': 'B2', 'characteristic': 'B2',
            'comprehensive': 'C1', 'sophisticated': 'C1',
            'ubiquitous': 'C2', 'connotation': 'C2'
        }
    
    def _estimate_pos(self, word: str) -> str:
        """Estimate part of speech (simplified heuristics)."""
        # Very basic POS estimation - in production, use proper NLP
        if word.endswith('ing'):
            return 'VERB'
        elif word.endswith('tion') or word.endswith('ness'):
            return 'NOUN'
        elif word.endswith('ly'):
            return 'ADV'
        elif word.endswith('ed'):
            return 'VERB'
        else:
            return 'NOUN'  # Default assumption
    
    def _extract_context(self, word: str, text: str) -> str:
        """Extract context sentence containing the word."""
        sentences = re.split(r'[.!?]+', text)
        for sentence in sentences:
            if word.lower() in sentence.lower():
                return sentence.strip()
        return ""
    
    def _get_basic_words(self) -> set:
        """Get set of basic words to exclude."""
        return {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
            'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
            'can', 'may', 'might', 'must', 'shall', 'this', 'that', 'these', 'those'
        }
    
    def _is_appropriate_word(self, word: str) -> bool:
        """Check if word is appropriate for language learning."""
        # Exclude offensive or inappropriate words
        blocked_words = {'damn', 'hell', 'stupid'}  # Simplified list
        return word.lower() not in blocked_words
    
    def _get_word_cefr_level(self, word: str) -> str:
        """Get CEFR level for a word."""
        return self.cefr_mappings.get(word.lower(), 'B1')  # Default to B1
    
    def _is_level_appropriate(self, word_level: str, target_level: str) -> bool:
        """Check if word level is appropriate for target level."""
        try:
            word_idx = self.cefr_levels.index(word_level)
            target_idx = self.cefr_levels.index(target_level)
            # Allow words from same level or one level above
            return word_idx <= target_idx + 1
        except ValueError:
            return True
    
    def _find_sentence_with_word(self, word: str, text: str) -> str:
        """Find sentence containing the word."""
        sentences = re.split(r'[.!?]+', text)
        for sentence in sentences:
            if word.lower() in sentence.lower():
                return sentence.strip()
        return f"The word '{word}' appears in the conversation."
    
    def _get_simple_definition(self, word: str, pos: str) -> str:
        """Get simple definition for the word."""
        # Simplified definitions - in production, use dictionary API
        definitions = {
            'reservation': 'booking a table or room in advance',
            'appointment': 'a planned meeting with someone',
            'exercise': 'physical activity to stay healthy',
            'swimming': 'moving through water using arms and legs'
        }
        return definitions.get(word.lower(), f"A {pos.lower()} commonly used in English")
    
    def _get_pronunciation_guide(self, word: str) -> str:
        """Get pronunciation guide for the word."""
        # Simplified - in production, use phonetic dictionary
        return f"/{word}/"
    
    def _generate_example_sentence(self, word: str, pos: str) -> str:
        """Generate example sentence using the word."""
        templates = {
            'NOUN': f"The {word} is very important in this situation.",
            'VERB': f"I like to {word} every day.",
            'ADJ': f"This is a very {word} example.",
            'ADV': f"She spoke {word} during the meeting."
        }
        return templates.get(pos, f"Here's an example with {word}.")
    
    def _get_collocations(self, word: str) -> List[str]:
        """Get common collocations for the word."""
        # Simplified collocations
        collocations = {
            'make': ['make a decision', 'make progress', 'make an appointment'],
            'take': ['take time', 'take a break', 'take notes'],
            'get': ['get ready', 'get information', 'get started']
        }
        return collocations.get(word.lower(), [])
    
    def _get_difficulty_notes(self, word: str, level: str) -> str:
        """Get notes about word difficulty."""
        if level in ['C1', 'C2']:
            return "Advanced vocabulary - often used in formal contexts"
        elif level in ['B2']:
            return "Upper-intermediate vocabulary - useful for detailed discussions"
        elif level in ['B1']:
            return "Intermediate vocabulary - commonly used in everyday situations"
        else:
            return "Basic vocabulary - essential for beginners"
    
    def _get_translation_notes(self, word: str) -> Dict[str, str]:
        """Get translation notes for different L1s."""
        # Simplified translations
        translations = {
            'fa': 'رزرو',  # reservation in Farsi
            'ar': 'حجز'    # reservation in Arabic
        }
        return translations


class VocabularyAudioGenerator:
    """Generates audio files for vocabulary items."""
    
    def __init__(self, voice_cloner):
        self.voice_cloner = voice_cloner
        self.temp_dir = Path("temp_vocab")
        self.temp_dir.mkdir(exist_ok=True)
    
    def generate_vocabulary_audio(self, vocabulary_items: List[Dict[str, Any]], 
                                 accent_code: str, l1_language: str,
                                 target_level: str, output_path: str) -> bool:
        """Generate complete vocabulary audio file."""
        
        print(f"Generating vocabulary audio with {accent_code} accent for {len(vocabulary_items)} items")
        
        audio_segments = []
        
        for i, vocab_item in enumerate(vocabulary_items):
            print(f"Processing vocabulary item {i+1}: {vocab_item['word']}")
            
            # Generate audio sequence for this vocabulary item
            item_segments = self._generate_vocab_item_sequence(
                vocab_item, accent_code, l1_language, target_level, i
            )
            
            audio_segments.extend(item_segments)
        
        # Mix all segments together
        return self._mix_vocabulary_segments(audio_segments, output_path)
    
    def _generate_vocab_item_sequence(self, vocab_item: Dict[str, Any], 
                                    accent_code: str, l1_language: str,
                                    target_level: str, index: int) -> List[str]:
        """Generate audio sequence for single vocabulary item."""
        
        word = vocab_item['word']
        pos = vocab_item['pos']
        segments = []
        
        # 1. Word (clear pronunciation)
        word_file = self.temp_dir / f"vocab_{index:03d}_01_word.wav"
        success = self.voice_cloner.synthesize_with_accent(
            text=word,
            accent_code=accent_code,
            output_path=str(word_file),
            emotion="clear",
            speed=0.8  # Slower for vocabulary
        )
        if success:
            segments.append(str(word_file))
        
        # 2. Short pause
        pause_file = self.temp_dir / f"vocab_{index:03d}_02_pause.wav"
        self._create_silence_file(pause_file, 0.5)
        segments.append(str(pause_file))
        
        # 3. Part of speech
        pos_text = self._get_pos_explanation(pos)
        pos_file = self.temp_dir / f"vocab_{index:03d}_03_pos.wav"
        success = self.voice_cloner.synthesize_with_accent(
            text=pos_text,
            accent_code=accent_code,
            output_path=str(pos_file)
        )
        if success:
            segments.append(str(pos_file))
        
        # 4. Countable/Uncountable for nouns
        if pos.upper() == 'NOUN':
            count_text = self._get_countability_info(word)
            count_file = self.temp_dir / f"vocab_{index:03d}_04_count.wav"
            success = self.voice_cloner.synthesize_with_accent(
                text=count_text,
                accent_code=accent_code,
                output_path=str(count_file)
            )
            if success:
                segments.append(str(count_file))
        
        # 5. Translation (if A1-B1 and not English native)
        if target_level in ['A1', 'A2', 'B1'] and l1_language in ['fa', 'ar']:
            translation = self._get_translation(word, l1_language)
            if translation:
                trans_file = self.temp_dir / f"vocab_{index:03d}_05_translation.wav"
                success = self.voice_cloner.synthesize_with_accent(
                    text=translation,
                    accent_code=accent_code,
                    output_path=str(trans_file)
                )
                if success:
                    segments.append(str(trans_file))
        
        # 6. Context sentence
        context_file = self.temp_dir / f"vocab_{index:03d}_06_context.wav"
        success = self.voice_cloner.synthesize_with_accent(
            text=vocab_item['context_sentence'],
            accent_code=accent_code,
            output_path=str(context_file),
            speed=0.9
        )
        if success:
            segments.append(str(context_file))
        
        # 7. Example sentence  
        example_file = self.temp_dir / f"vocab_{index:03d}_07_example.wav"
        success = self.voice_cloner.synthesize_with_accent(
            text=vocab_item['example_sentence'],
            accent_code=accent_code,
            output_path=str(example_file),
            speed=0.9
        )
        if success:
            segments.append(str(example_file))
        
        # 8. Final pause before next word
        final_pause = self.temp_dir / f"vocab_{index:03d}_08_final_pause.wav"
        self._create_silence_file(final_pause, 1.0)
        segments.append(str(final_pause))
        
        return segments
    
    def _create_silence_file(self, output_path: Path, duration: float):
        """Create silence audio file."""
        silence = self.voice_cloner.create_silence(duration)
        try:
            import soundfile as sf
            sf.write(str(output_path), silence, 22050)
        except:
            # Fallback using numpy
            np.save(str(output_path).replace('.wav', '.npy'), silence)
    
    def _get_pos_explanation(self, pos: str) -> str:
        """Get part of speech explanation."""
        explanations = {
            'NOUN': 'noun',
            'VERB': 'verb', 
            'ADJ': 'adjective',
            'ADV': 'adverb',
            'PREP': 'preposition',
            'CONJ': 'conjunction'
        }
        return explanations.get(pos.upper(), 'word')
    
    def _get_countability_info(self, word: str) -> str:
        """Get countable/uncountable information for nouns."""
        # Simplified - in production, use comprehensive database
        uncountable_words = {'water', 'money', 'information', 'advice', 'furniture', 'music'}
        if word.lower() in uncountable_words:
            return 'uncountable noun'
        else:
            return 'countable noun'
    
    def _get_translation(self, word: str, l1_language: str) -> str:
        """Get translation in learner's L1."""
        # Simplified translations
        translations = {
            'fa': {
                'reservation': 'رزرو',
                'appointment': 'قرار ملاقات', 
                'swimming': 'شنا',
                'exercise': 'ورزش'
            },
            'ar': {
                'reservation': 'حجز',
                'appointment': 'موعد',
                'swimming': 'سباحة', 
                'exercise': 'تمرين'
            }
        }
        
        lang_dict = translations.get(l1_language, {})
        translation = lang_dict.get(word.lower(), '')
        
        if translation:
            return f"In your language: {translation}"
        return ""
    
    def _mix_vocabulary_segments(self, segments: List[str], output_path: str) -> bool:
        """Mix vocabulary segments into final audio file."""
        try:
            from pydub import AudioSegment
            
            final_audio = AudioSegment.empty()
            
            for segment_path in segments:
                try:
                    if segment_path.endswith('.wav'):
                        segment = AudioSegment.from_wav(segment_path)
                    else:
                        continue  # Skip non-audio files
                    
                    final_audio += segment
                    
                except Exception as e:
                    print(f"Warning: Could not add segment {segment_path}: {e}")
            
            # Export final vocabulary audio
            final_audio.export(output_path, format="mp3", bitrate="128k")
            
            # Clean up temporary files
            for segment_path in segments:
                try:
                    os.remove(segment_path)
                except:
                    pass
            
            print(f"✓ Vocabulary audio created: {output_path}")
            return True
            
        except Exception as e:
            print(f"✗ Failed to create vocabulary audio: {e}")
            return False