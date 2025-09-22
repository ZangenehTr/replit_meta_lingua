import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  X, 
  Volume2, 
  Copy, 
  BookOpen,
  Globe,
  Loader2,
  Star,
  History
} from 'lucide-react';

interface DictionaryOverlayProps {
  word: string;
  position: { x: number; y: number };
  onClose: () => void;
  bookId: number;
  pageNumber: number;
}

interface DefinitionData {
  word: string;
  phonetic?: string;
  pronunciation?: string;
  definitions: {
    partOfSpeech: string;
    definition: string;
    example?: string;
    synonyms?: string[];
  }[];
  etymology?: string;
  translations?: {
    [lang: string]: {
      word: string;
      definition: string;
    };
  };
}

interface DictionaryHistory {
  word: string;
  timestamp: number;
  bookId: number;
  pageNumber: number;
}

export default function DictionaryOverlay({ 
  word, 
  position, 
  onClose, 
  bookId, 
  pageNumber 
}: DictionaryOverlayProps) {
  const { toast } = useToast();
  const overlayRef = useRef<HTMLDivElement>(null);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [definition, setDefinition] = useState<DefinitionData | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [history, setHistory] = useState<DictionaryHistory[]>([]);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Position the overlay
  const [overlayPosition, setOverlayPosition] = useState({ x: position.x, y: position.y });

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('dictionary-history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Failed to load dictionary history:', error);
      }
    }
  }, []);

  // Save to history
  const addToHistory = (word: string) => {
    const historyItem: DictionaryHistory = {
      word,
      timestamp: Date.now(),
      bookId,
      pageNumber
    };
    
    const newHistory = [historyItem, ...history.filter(item => item.word !== word)].slice(0, 50);
    setHistory(newHistory);
    localStorage.setItem('dictionary-history', JSON.stringify(newHistory));
  };

  // Fetch word definition
  useEffect(() => {
    const fetchDefinition = async () => {
      if (!word.trim()) return;

      setIsLoading(true);
      setError(null);

      try {
        // Log the dictionary lookup for analytics
        await apiRequest('/api/dictionary/log', {
          method: 'POST',
          body: JSON.stringify({
            word: word.trim(),
            bookId,
            pageNumber,
            language: selectedLanguage,
            timestamp: new Date().toISOString()
          })
        });

        // Fetch definition from the API
        const response = await apiRequest(`/api/dictionary/lookup?word=${encodeURIComponent(word.trim())}&lang=${selectedLanguage}&context=book`);
        
        if (response.success) {
          setDefinition(response.data);
          addToHistory(word.trim());
          
          // Check if word is in favorites
          const favorites = JSON.parse(localStorage.getItem('dictionary-favorites') || '[]');
          setIsFavorite(favorites.some((fav: any) => fav.word === word.trim()));
        } else {
          setError(response.message || 'Definition not found');
        }
      } catch (error: any) {
        console.error('Dictionary lookup error:', error);
        setError('Failed to fetch definition. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDefinition();
  }, [word, selectedLanguage, bookId, pageNumber]);

  // Position overlay to avoid going off screen
  useEffect(() => {
    if (!overlayRef.current) return;

    const overlay = overlayRef.current;
    const rect = overlay.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = position.x;
    let y = position.y;

    // Adjust horizontal position
    if (x + rect.width > viewportWidth) {
      x = viewportWidth - rect.width - 20;
    }
    if (x < 20) {
      x = 20;
    }

    // Adjust vertical position
    if (y + rect.height > viewportHeight) {
      y = position.y - rect.height - 10;
    }
    if (y < 20) {
      y = 20;
    }

    setOverlayPosition({ x, y });
  }, [position, definition]);

  // Handle clicks outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "Text copied to clipboard",
      });
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  // Play pronunciation
  const playPronunciation = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(error => {
        console.error('Failed to play audio:', error);
        toast({
          title: "Error",
          description: "Failed to play pronunciation",
          variant: "destructive",
        });
      });
    } else if (definition?.phonetic) {
      // Use browser's speech synthesis as fallback
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = selectedLanguage === 'fa' ? 'fa-IR' : selectedLanguage === 'ar' ? 'ar-SA' : 'en-US';
      speechSynthesis.speak(utterance);
    }
  };

  // Toggle favorite
  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('dictionary-favorites') || '[]');
    const favoriteItem = {
      word: word.trim(),
      definition: definition?.definitions[0]?.definition || '',
      timestamp: Date.now(),
      bookId,
      pageNumber
    };

    if (isFavorite) {
      const newFavorites = favorites.filter((fav: any) => fav.word !== word.trim());
      localStorage.setItem('dictionary-favorites', JSON.stringify(newFavorites));
      setIsFavorite(false);
      toast({
        title: "Removed",
        description: "Word removed from favorites",
      });
    } else {
      const newFavorites = [favoriteItem, ...favorites].slice(0, 100);
      localStorage.setItem('dictionary-favorites', JSON.stringify(newFavorites));
      setIsFavorite(true);
      toast({
        title: "Added",
        description: "Word added to favorites",
      });
    }
  };

  const supportedLanguages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'fa', name: 'Persian', nativeName: 'فارسی' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' }
  ];

  return (
    <div
      ref={overlayRef}
      className="fixed z-50 w-96 max-w-[90vw] max-h-[80vh] bg-background border border-border rounded-lg shadow-lg"
      style={{ 
        left: overlayPosition.x, 
        top: overlayPosition.y,
        direction: selectedLanguage === 'fa' || selectedLanguage === 'ar' ? 'rtl' : 'ltr'
      }}
      data-testid="dictionary-overlay"
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            {word}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFavorite}
              data-testid="button-favorite"
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              data-testid="button-close"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="w-40" data-testid="select-language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {supportedLanguages.map(lang => (
                <SelectItem key={lang.code} value={lang.code}>
                  <div className="flex items-center gap-2">
                    <Globe className="w-3 h-3" />
                    {lang.nativeName}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {definition && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(word)}
                data-testid="button-copy"
              >
                <Copy className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={playPronunciation}
                disabled={!definition.phonetic}
                data-testid="button-pronunciation"
              >
                <Volume2 className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <ScrollArea className="h-80">
          {isLoading && (
            <div className="flex items-center justify-center h-32" data-testid="dictionary-loading">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Looking up definition...</span>
            </div>
          )}

          {error && (
            <div className="text-center p-4" data-testid="dictionary-error">
              <p className="text-destructive text-sm mb-2">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedLanguage(selectedLanguage === 'en' ? 'fa' : 'en')}
                data-testid="button-try-language"
              >
                Try {selectedLanguage === 'en' ? 'Persian' : 'English'}
              </Button>
            </div>
          )}

          {definition && (
            <Tabs defaultValue="definition" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="definition">Definition</TabsTrigger>
                <TabsTrigger value="translations">Translations</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="definition" className="space-y-4">
                {definition.phonetic && (
                  <div className="text-sm text-muted-foreground">
                    /{definition.phonetic}/
                  </div>
                )}
                
                {definition.definitions.map((def, index) => (
                  <div key={index} className="space-y-2">
                    <Badge variant="secondary">{def.partOfSpeech}</Badge>
                    <p className="text-sm leading-relaxed">{def.definition}</p>
                    {def.example && (
                      <p className="text-xs text-muted-foreground italic">
                        Example: {def.example}
                      </p>
                    )}
                    {def.synonyms && def.synonyms.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs text-muted-foreground">Synonyms:</span>
                        {def.synonyms.map((synonym, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {synonym}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                
                {definition.etymology && (
                  <div className="pt-2 border-t">
                    <h4 className="text-xs font-medium text-muted-foreground mb-1">Etymology</h4>
                    <p className="text-xs text-muted-foreground">{definition.etymology}</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="translations" className="space-y-3">
                {definition.translations ? (
                  Object.entries(definition.translations).map(([lang, translation]) => (
                    <div key={lang} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{lang.toUpperCase()}</Badge>
                        <span className="font-medium">{translation.word}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{translation.definition}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No translations available
                  </p>
                )}
              </TabsContent>
              
              <TabsContent value="history" className="space-y-2">
                {history.length > 0 ? (
                  history.slice(0, 10).map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{item.word}</span>
                      <span className="text-muted-foreground text-xs">
                        Page {item.pageNumber}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent lookups
                  </p>
                )}
              </TabsContent>
            </Tabs>
          )}
        </ScrollArea>
      </CardContent>
    </div>
  );
}