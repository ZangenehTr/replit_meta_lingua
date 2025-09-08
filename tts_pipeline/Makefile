#!/usr/bin/make -f

# Makefile for TTS Pipeline

.PHONY: help install test run clean demo

help:	## Show this help message
	@echo "🎤 Accent-Aware TTS/ASR Pipeline"
	@echo "================================"
	@echo "Available commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'

install:	## Install Python dependencies
	pip install -r requirements.txt
	@echo "✅ Dependencies installed"

demo:	## Run demonstration with IELTS conversation
	python main.py \
		--goal ielts --level B2 --l1 fa \
		--topic "swimming lesson booking" --duration_sec 120 \
		--vocab_count 10 --seed 42 \
		--voices voices.yaml

demo-toefl:	## Run TOEFL campus conversation demo  
	python main.py \
		--goal toefl --level B1 --l1 other \
		--topic "campus library assistance" --duration_sec 90 \
		--vocab_count 8 --seed 123 \
		--voices voices.yaml

demo-business:	## Run business meeting demo
	python main.py \
		--goal business --level C1 --l1 ar \
		--topic "quarterly performance review" --duration_sec 150 \
		--vocab_count 12 --seed 456 \
		--voices voices.yaml

test:	## Run basic system tests
	@echo "🧪 Running pipeline tests..."
	python -c "import TTS; print('✅ TTS available')"
	python -c "import whisper; print('✅ Whisper available')" 
	python -c "import pydub; print('✅ PyDub available')"
	python -c "import librosa; print('✅ Librosa available')"
	python -c "from policy import AccentPolicy; print('✅ Policy module working')"
	python -c "from utils import load_voices_config; print('✅ Utils module working')"
	@echo "✅ All tests passed"

clean:	## Clean temporary files and outputs
	rm -rf out/* temp_* __pycache__ *.pyc
	find . -name "*.pyc" -delete
	find . -name "__pycache__" -type d -exec rm -rf {} +
	@echo "✅ Cleaned up temporary files"

setup-voices:	## Create sample voice directory structure
	mkdir -p voices
	@echo "📁 Created voices directory"
	@echo "ℹ️  Add your reference voice samples to voices/ directory"
	@echo "   - Each file should be 10-30 seconds of clear speech"
	@echo "   - Update voices.yaml with correct file paths"

run:	demo	## Alias for demo command