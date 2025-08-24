import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Languages, CheckCircle, BookOpen, Volume2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiRequest } from '@/lib/queryClient';

interface AIHelperProps {
  isOpen: boolean;
  onClose: () => void;
  targetLanguage?: string;
  studentLevel?: string;
}

interface WordSuggestion {
  word: string;
  definition: string;
  example: string;
}

interface TranslationResult {
  translation: string;
  sourceLanguage: string;
  confidence: number;
}

interface GrammarResult {
  corrected: string;
  explanation: string;
}

interface PronunciationResult {
  pronunciation: string;
  syllables: string[];
  tips: string[];
}

export function AIHelper({ isOpen, onClose, targetLanguage = 'fa', studentLevel = 'B1' }: AIHelperProps) {
  const { t } = useTranslation(['callern']);
  const [activeTab, setActiveTab] = useState<'translate' | 'words' | 'grammar' | 'pronunciation'>('translate');
  const [loading, setLoading] = useState(false);
  
  // Translation state
  const [translateText, setTranslateText] = useState('');
  const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);
  
  // Word helper state
  const [wordContext, setWordContext] = useState('');
  const [wordSuggestions, setWordSuggestions] = useState<WordSuggestion[]>([]);
  
  // Grammar state
  const [grammarText, setGrammarText] = useState('');
  const [grammarResult, setGrammarResult] = useState<GrammarResult | null>(null);
  
  // Pronunciation state
  const [pronunciationWord, setPronunciationWord] = useState('');
  const [pronunciationResult, setPronunciationResult] = useState<PronunciationResult | null>(null);

  const handleTranslate = async () => {
    if (!translateText.trim()) return;
    
    setLoading(true);
    try {
      const response = await apiRequest('/api/callern/ai/translate', {
        method: 'POST',
        body: JSON.stringify({
          text: translateText,
          targetLanguage
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setTranslationResult(data);
      }
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWordHelper = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/api/callern/ai/word-helper', {
        method: 'POST',
        body: JSON.stringify({
          context: wordContext || 'general conversation',
          level: studentLevel
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setWordSuggestions(data.words || []);
      }
    } catch (error) {
      console.error('Word helper error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGrammarCheck = async () => {
    if (!grammarText.trim()) return;
    
    setLoading(true);
    try {
      const response = await apiRequest('/api/callern/ai/grammar-check', {
        method: 'POST',
        body: JSON.stringify({
          text: grammarText
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setGrammarResult(data);
      }
    } catch (error) {
      console.error('Grammar check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePronunciation = async () => {
    if (!pronunciationWord.trim()) return;
    
    setLoading(true);
    try {
      const response = await apiRequest('/api/callern/ai/pronunciation', {
        method: 'POST',
        body: JSON.stringify({
          word: pronunciationWord
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setPronunciationResult(data);
      }
    } catch (error) {
      console.error('Pronunciation error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Card className="absolute top-4 left-4 w-96 max-h-[600px] bg-white shadow-2xl z-50">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-lg">{t('callern:aiAssistant')}</h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1">
        <TabsList className="grid w-full grid-cols-4 p-1">
          <TabsTrigger value="translate">
            <Languages className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="words">
            <BookOpen className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="grammar">
            <CheckCircle className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="pronunciation">
            <Volume2 className="h-4 w-4" />
          </TabsTrigger>
        </TabsList>

        {/* Translation Tab */}
        <TabsContent value="translate" className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t('callern:enterTextToTranslate')}
            </label>
            <Input
              placeholder={t('callern:typeHere')}
              value={translateText}
              onChange={(e) => setTranslateText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleTranslate()}
            />
          </div>
          
          <Button 
            onClick={handleTranslate} 
            disabled={loading || !translateText.trim()}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Languages className="h-4 w-4 mr-2" />
            )}
            {t('callern:translate')}
          </Button>
          
          {translationResult && (
            <div className="bg-blue-50 rounded-lg p-3 space-y-2">
              <p className="font-medium">{translationResult.translation}</p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {translationResult.sourceLanguage}
                </Badge>
                <span className="text-xs text-gray-500">
                  {Math.round(translationResult.confidence * 100)}% confidence
                </span>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Word Helper Tab */}
        <TabsContent value="words" className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t('callern:describeContext')}
            </label>
            <Input
              placeholder={t('callern:contextPlaceholder')}
              value={wordContext}
              onChange={(e) => setWordContext(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleWordHelper()}
            />
          </div>
          
          <Button 
            onClick={handleWordHelper} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <BookOpen className="h-4 w-4 mr-2" />
            )}
            {t('callern:getSuggestions')}
          </Button>
          
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {wordSuggestions.map((suggestion, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-3">
                  <p className="font-medium">{suggestion.word}</p>
                  <p className="text-sm text-gray-600 mt-1">{suggestion.definition}</p>
                  <p className="text-sm text-blue-600 italic mt-2">"{suggestion.example}"</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Grammar Check Tab */}
        <TabsContent value="grammar" className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t('callern:enterTextForGrammar')}
            </label>
            <Input
              placeholder={t('callern:grammarPlaceholder')}
              value={grammarText}
              onChange={(e) => setGrammarText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleGrammarCheck()}
            />
          </div>
          
          <Button 
            onClick={handleGrammarCheck} 
            disabled={loading || !grammarText.trim()}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            {t('callern:checkGrammar')}
          </Button>
          
          {grammarResult && (
            <div className="space-y-3">
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-sm font-medium text-green-800">{t('callern:corrected')}:</p>
                <p className="mt-1">{grammarResult.corrected}</p>
              </div>
              {grammarResult.explanation && (
                <div className="bg-yellow-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-yellow-800">{t('callern:explanation')}:</p>
                  <p className="text-sm mt-1">{grammarResult.explanation}</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Pronunciation Tab */}
        <TabsContent value="pronunciation" className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t('callern:enterWordForPronunciation')}
            </label>
            <Input
              placeholder={t('callern:wordPlaceholder')}
              value={pronunciationWord}
              onChange={(e) => setPronunciationWord(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handlePronunciation()}
            />
          </div>
          
          <Button 
            onClick={handlePronunciation} 
            disabled={loading || !pronunciationWord.trim()}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Volume2 className="h-4 w-4 mr-2" />
            )}
            {t('callern:getPronunciation')}
          </Button>
          
          {pronunciationResult && (
            <div className="space-y-3">
              <div className="bg-purple-50 rounded-lg p-3">
                <p className="text-sm font-medium text-purple-800">{t('callern:phonetic')}:</p>
                <p className="text-lg font-mono mt-1">{pronunciationResult.pronunciation}</p>
              </div>
              {pronunciationResult.syllables && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-blue-800">{t('callern:syllables')}:</p>
                  <p className="mt-1">{pronunciationResult.syllables.join(' • ')}</p>
                </div>
              )}
              {pronunciationResult.tips && pronunciationResult.tips.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-800">{t('callern:tips')}:</p>
                  <ul className="list-disc list-inside text-sm mt-1">
                    {pronunciationResult.tips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}