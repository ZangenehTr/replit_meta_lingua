import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import { apiRequest } from "@/lib/queryClient";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Download, 
  Loader2,
  Languages,
  Mic,
  RotateCcw
} from "lucide-react";

interface PronunciationResult {
  word: string;
  success: boolean;
  audioUrl: string | null;
  duration: number;
  error?: string;
}

interface TTSResponse {
  success: boolean;
  audioUrl?: string;
  duration?: number;
  pronunciations?: PronunciationResult[];
  error?: string;
}

export function PronunciationPractice() {
  const { t } = useTranslation(['common']);
  const { toast } = useToast();
  
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("fa");
  const [speed, setSpeed] = useState("normal");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [pronunciationResults, setPronunciationResults] = useState<PronunciationResult[]>([]);
  const [mode, setMode] = useState<'single' | 'vocabulary'>('single');

  // Supported languages
  const supportedLanguages = [
    { code: 'fa', name: 'فارسی', englishName: 'Persian' },
    { code: 'en', name: 'انگلیسی', englishName: 'English' },
    { code: 'ar', name: 'عربی', englishName: 'Arabic' }
  ];

  const speedOptions = [
    { value: 'slow', label: 'آهسته', englishLabel: 'Slow' },
    { value: 'normal', label: 'معمولی', englishLabel: 'Normal' },
    { value: 'fast', label: 'سریع', englishLabel: 'Fast' }
  ];

  // Generate single pronunciation
  const generatePronunciation = async () => {
    if (!text.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً متنی برای تولید تلفظ وارد کنید",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await apiRequest('/api/tts/pronunciation', {
        method: 'POST',
        body: JSON.stringify({
          text: text.trim(),
          language,
          level: speed
        })
      });

      const result: TTSResponse = await response.json();
      
      if (result.success && result.audioUrl) {
        setGeneratedAudio(result.audioUrl);
        toast({
          title: "موفق",
          description: "تلفظ با موفقیت تولید شد",
        });
      } else {
        throw new Error(result.error || 'Failed to generate pronunciation');
      }
    } catch (error) {
      console.error('Pronunciation generation error:', error);
      toast({
        title: "خطا",
        description: "خطا در تولید تلفظ. لطفاً دوباره تلاش کنید.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate vocabulary pronunciations
  const generateVocabularyPronunciation = async () => {
    const words = text.split(/[,\n\s]+/).filter(word => word.trim().length > 0);
    
    if (words.length === 0) {
      toast({
        title: "خطا",
        description: "لطفاً کلمات را وارد کنید (جدا شده با کاما یا خط جدید)",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await apiRequest('/api/tts/vocabulary', {
        method: 'POST',
        body: JSON.stringify({
          words,
          language,
          level: speed
        })
      });

      const result: TTSResponse = await response.json();
      
      if (result.success && result.pronunciations) {
        setPronunciationResults(result.pronunciations);
        toast({
          title: "موفق",
          description: `تلفظ ${result.successful} کلمه از ${result.total} کلمه تولید شد`,
        });
      } else {
        throw new Error(result.error || 'Failed to generate vocabulary pronunciations');
      }
    } catch (error) {
      console.error('Vocabulary pronunciation error:', error);
      toast({
        title: "خطا",
        description: "خطا در تولید تلفظ کلمات. لطفاً دوباره تلاش کنید.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Play audio
  const playAudio = (audioUrl: string) => {
    if (currentAudio) {
      currentAudio.pause();
    }

    const audio = new Audio(audioUrl);
    setCurrentAudio(audio);
    setIsPlaying(true);

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentAudio(null);
    };

    audio.onerror = () => {
      setIsPlaying(false);
      setCurrentAudio(null);
      toast({
        title: "خطا",
        description: "خطا در پخش صدا",
        variant: "destructive"
      });
    };

    audio.play().catch(error => {
      console.error('Audio play error:', error);
      setIsPlaying(false);
      setCurrentAudio(null);
    });
  };

  // Stop audio
  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
      setIsPlaying(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setText("");
    setGeneratedAudio(null);
    setPronunciationResults([]);
    stopAudio();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            تمرین تلفظ - Pronunciation Practice
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mode Selection */}
          <div className="flex gap-4">
            <Button
              variant={mode === 'single' ? 'default' : 'outline'}
              onClick={() => setMode('single')}
              className="flex-1"
            >
              تلفظ متن
            </Button>
            <Button
              variant={mode === 'vocabulary' ? 'default' : 'outline'}
              onClick={() => setMode('vocabulary')}
              className="flex-1"
            >
              تلفظ کلمات
            </Button>
          </div>

          {/* Input Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {mode === 'single' ? 'متن برای تلفظ:' : 'کلمات (جدا شده با کاما):'}
              </label>
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={mode === 'single' 
                  ? "متن خود را اینجا وارد کنید..." 
                  : "کلمه1، کلمه2، کلمه3..."}
                className="text-lg"
                multiline={mode === 'vocabulary'}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Language Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">زبان:</label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedLanguages.map(lang => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name} ({lang.englishName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Speed Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">سرعت:</label>
                <Select value={speed} onValueChange={setSpeed}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {speedOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label} ({option.englishLabel})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={mode === 'single' ? generatePronunciation : generateVocabularyPronunciation}
                disabled={isGenerating || !text.trim()}
                className="flex-1"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Mic className="h-4 w-4 mr-2" />
                )}
                {isGenerating ? 'در حال تولید...' : 'تولید تلفظ'}
              </Button>
              
              <Button variant="outline" onClick={resetForm}>
                <RotateCcw className="h-4 w-4 mr-2" />
                پاک کردن
              </Button>
            </div>
          </div>

          {/* Single Pronunciation Result */}
          {mode === 'single' && generatedAudio && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">تلفظ تولید شده:</h3>
                    <p className="text-sm text-gray-600">"{text}"</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => playAudio(generatedAudio)}
                      disabled={isPlaying}
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    {isPlaying && (
                      <Button size="sm" variant="outline" onClick={stopAudio}>
                        <VolumeX className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Vocabulary Pronunciation Results */}
          {mode === 'vocabulary' && pronunciationResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>نتایج تلفظ کلمات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pronunciationResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{result.word}</span>
                        {result.success ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            موفق
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            خطا
                          </Badge>
                        )}
                      </div>
                      
                      {result.success && result.audioUrl && (
                        <Button
                          size="sm"
                          onClick={() => playAudio(result.audioUrl!)}
                          disabled={isPlaying}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {!result.success && result.error && (
                        <span className="text-sm text-red-600">{result.error}</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}