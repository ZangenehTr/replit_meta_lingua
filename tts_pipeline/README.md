# 🎤 Accent-Aware TTS/ASR Pipeline

A comprehensive Text-to-Speech and Automatic Speech Recognition pipeline designed for language learning with accent-specific synthesis, natural conversation generation, and vocabulary extraction.

## 🌟 Features

- **Accent-Aware Synthesis**: IELTS (British), TOEFL (American), Business (Global), PTE (Multi-accent)
- **Natural Conversations**: Multi-speaker dialogues with overlaps, hesitations, and natural timing
- **Vocabulary Extraction**: CEFR-level appropriate vocabulary with translations (Farsi/Arabic)
- **Quality Assurance**: LUFS normalization, silence ratio analysis, pause validation
- **ASR Integration**: Whisper-based transcription with word-level timestamps
- **Comprehensive CLI**: Full command-line interface with YAML configuration

## 📋 System Requirements

- **Python**: 3.11+ 
- **Dependencies**: See `requirements.txt`
- **Audio Processing**: librosa, pydub, soundfile
- **TTS Engine**: Coqui XTTS-v2 (optional - fallback to OpenAI)
- **ASR Engine**: faster-whisper or OpenAI Whisper

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Core dependencies (installed)
pip install pydub librosa soundfile numpy scipy python-dotenv PyYAML

# Advanced TTS/ASR (optional)
pip install TTS==0.22.0 faster-whisper torch torchaudio
```

### 2. Basic Usage

```bash
# IELTS listening practice with British accents
python main.py --goal ielts --level B2 --topic "hotel reservation" --duration_sec 120 --vocab_count 10

# TOEFL campus conversation with American accents
python main.py --goal toefl --level B1 --topic "library assistance" --duration_sec 90 --vocab_count 8

# Business meeting with global accents
python main.py --goal business --level C1 --topic "quarterly review" --duration_sec 150 --vocab_count 12
```

### 3. Advanced Options

```bash
# With Persian L1 support and reproducible generation
python main.py --goal ielts --level B2 --l1 fa --topic "swimming lessons" --duration_sec 120 --vocab_count 10 --seed 42

# Custom voice configuration
python main.py --goal business --level C1 --topic "product launch" --duration_sec 180 --voices custom_voices.yaml
```

## 📁 Project Structure

```
tts_pipeline/
├── main.py              # CLI entry point
├── policy.py            # Accent policies and content generation
├── synthesis.py         # Coqui XTTS-v2 integration
├── mixing.py            # Audio mixing and mastering
├── qa.py               # Quality assurance and validation
├── asr_vocab.py        # ASR transcription and vocabulary
├── utils.py            # Utilities and helpers
├── voices.yaml         # Voice accent configuration
├── requirements.txt    # Python dependencies
├── Makefile           # Build and test commands
└── out/               # Generated audio outputs
```

## 🔧 Configuration

### Voice Configuration (`voices.yaml`)

```yaml
voices:
  US:
    file: "voices/us_male.wav"
    description: "American English - Male"
    gender: "male"
  
  UK:
    file: "voices/uk_female.wav" 
    description: "British English - Female"
    gender: "female"

accent_policy:
  ielts:
    listening: ["UK", "UK_FEMALE", "US", "AU"]
    vocabulary: ["UK", "UK_FEMALE"]
```

## 📊 Output Files

Each generation produces:

- **`listening_*.mp3`** - Main conversation audio (mastered)
- **`vocab_*.mp3`** - Vocabulary pronunciation guide
- **`transcript_*.srt`** - Word-level transcript with timestamps
- **`report_*.json`** - Quality analysis and metrics

## 🎯 Exam-Specific Features

### IELTS (British Focus)
- Primarily UK accents with variety (AU, US)
- Section 1 booking conversations
- Formal register and proper British expressions

### TOEFL (American Focus) 
- American English accents
- Campus conversations and academic contexts
- North American cultural references

### Business (Global Mix)
- Mixed accents (US, UK, Indian, L2 speakers)
- Professional vocabulary and scenarios
- Multicultural communication patterns

## 📈 Quality Standards

- **Duration**: 30-600 seconds
- **Silence Ratio**: ≤20% 
- **Max Pause**: ≤1.2 seconds
- **LUFS Level**: -18 ± 5 dB
- **Peak Level**: ≤-1 dBFS

## 🛠️ Make Commands

```bash
make help           # Show available commands
make install        # Install dependencies
make test          # Run system tests
make demo          # Run IELTS demonstration
make demo-toefl    # Run TOEFL demonstration  
make demo-business # Run business demonstration
make clean         # Clean temporary files
```

## 🔗 API Integration

The pipeline integrates with Meta Lingua through REST endpoints:

- `POST /api/tts-pipeline/advanced/generate` - Generate audio
- `GET /api/tts-pipeline/status` - Check system status
- `GET /api/tts-pipeline/voices` - List available accents

## 🐛 Troubleshooting

### Common Issues

1. **TTS Model Loading Fails**
   - Fallback to OpenAI TTS available
   - Check CUDA availability for GPU acceleration

2. **Voice Files Missing**
   - Update `voices.yaml` with correct paths
   - Ensure reference files are 10-30 seconds

3. **Quality Issues**
   - Check audio input levels
   - Verify sample rates match (22050 Hz)

### Development Mode

```bash
# Test core dependencies
make test

# Run with verbose output
python main.py --goal general --level A1 --topic "greetings" --duration_sec 30 --vocab_count 3

# Check system status
curl http://localhost:5000/api/tts-pipeline/status
```

## 📝 Examples

### Generate IELTS Section 1

```bash
python main.py \\
  --goal ielts \\
  --level B2 \\
  --l1 fa \\
  --topic "fitness club membership" \\
  --duration_sec 300 \\
  --vocab_count 15 \\
  --seed 12345
```

### Business Presentation

```bash  
python main.py \\
  --goal business \\
  --level C1 \\
  --topic "market analysis presentation" \\
  --duration_sec 240 \\
  --vocab_count 20
```

## 🌐 Multi-Language Support

- **English**: Primary synthesis language
- **Persian (fa)**: L1 translations and cultural context
- **Arabic (ar)**: L1 translations and cultural context  
- **Other**: General L2 approach

## 🎉 Success Metrics

- Generates authentic conversations in 2-10 minutes
- Achieves broadcast-quality audio standards
- Provides CEFR-appropriate vocabulary
- Supports 5 different exam types
- Handles 6 proficiency levels (A1-C2)

---

Built for **Meta Lingua Academy** - AI-Enhanced Language Learning Platform