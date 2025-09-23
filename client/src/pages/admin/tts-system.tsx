import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Volume2, 
  Settings, 
  Mic, 
  Play,
  Pause,
  BarChart3,
  Users,
  Clock,
  Zap,
  Download,
  Upload
} from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { useLanguage } from "@/hooks/useLanguage";

export default function TTSSystem() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isRTL = language === 'fa';

  const [selectedTab, setSelectedTab] = useState("configuration");
  const [testText, setTestText] = useState("Hello, this is a test of the text-to-speech system.");

  return (
    <div className={`container mx-auto p-6 space-y-6 ${isRTL ? 'rtl' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <BackButton />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-4" data-testid="page-title-tts-system">
            {t('admin:ttsSystem', 'Text-to-Speech System')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1" data-testid="page-description-tts-system">
            {t('admin:ttsSystemDescription', 'Configure and manage the text-to-speech system for enhanced learning experience')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" data-testid="badge-tts-status">
            <Volume2 className="h-4 w-4 mr-1" />
            {t('admin:ttsActive', 'TTS Active')}
          </Badge>
          <Button variant="outline" data-testid="button-test-tts">
            <Play className="h-4 w-4 mr-2" />
            {t('admin:testTTS', 'Test TTS')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400" data-testid="metric-daily-generations-label">
                  {t('admin:dailyGenerations', 'Daily Generations')}
                </p>
                <p className="text-2xl font-bold" data-testid="metric-daily-generations-value">1,247</p>
              </div>
              <Volume2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400" data-testid="metric-active-voices-label">
                  {t('admin:activeVoices', 'Active Voices')}
                </p>
                <p className="text-2xl font-bold" data-testid="metric-active-voices-value">12</p>
              </div>
              <Mic className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400" data-testid="metric-avg-generation-time-label">
                  {t('admin:avgGenerationTime', 'Avg Generation Time')}
                </p>
                <p className="text-2xl font-bold" data-testid="metric-avg-generation-time-value">2.3s</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400" data-testid="metric-success-rate-label">
                  {t('admin:successRate', 'Success Rate')}
                </p>
                <p className="text-2xl font-bold" data-testid="metric-success-rate-value">99.2%</p>
              </div>
              <Zap className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="configuration" data-testid="tab-tts-configuration">
            <Settings className="h-4 w-4 mr-2" />
            {t('admin:configuration', 'Configuration')}
          </TabsTrigger>
          <TabsTrigger value="voices" data-testid="tab-tts-voices">
            <Mic className="h-4 w-4 mr-2" />
            {t('admin:voices', 'Voices')}
          </TabsTrigger>
          <TabsTrigger value="testing" data-testid="tab-tts-testing">
            <Play className="h-4 w-4 mr-2" />
            {t('admin:testing', 'Testing')}
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-tts-analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            {t('admin:analytics', 'Analytics')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="card-title-tts-configuration">
                {t('admin:ttsConfiguration', 'TTS Configuration')}
              </CardTitle>
              <CardDescription>
                {t('admin:ttsConfigurationDescription', 'Configure text-to-speech engine settings and parameters')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tts-engine">{t('admin:ttsEngine', 'TTS Engine')}</Label>
                    <Select defaultValue="azure">
                      <SelectTrigger data-testid="select-tts-engine">
                        <SelectValue placeholder={t('admin:selectEngine', 'Select engine')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="azure">Azure Cognitive Services</SelectItem>
                        <SelectItem value="google">Google Cloud TTS</SelectItem>
                        <SelectItem value="aws">Amazon Polly</SelectItem>
                        <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="default-language">{t('admin:defaultLanguage', 'Default Language')}</Label>
                    <Select defaultValue="en-US">
                      <SelectTrigger data-testid="select-default-language">
                        <SelectValue placeholder={t('admin:selectLanguage', 'Select language')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en-US">English (US)</SelectItem>
                        <SelectItem value="en-GB">English (UK)</SelectItem>
                        <SelectItem value="fa-IR">Persian (Farsi)</SelectItem>
                        <SelectItem value="ar-SA">Arabic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="speech-rate">{t('admin:speechRate', 'Speech Rate')}</Label>
                    <Input 
                      id="speech-rate" 
                      type="range" 
                      min="0.5" 
                      max="2.0" 
                      step="0.1" 
                      defaultValue="1.0"
                      data-testid="slider-speech-rate"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Slow</span>
                      <span>Normal</span>
                      <span>Fast</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="tts-enabled">{t('admin:ttsEnabled', 'TTS Enabled')}</Label>
                      <p className="text-sm text-gray-500">{t('admin:ttsEnabledHint', 'Enable text-to-speech system')}</p>
                    </div>
                    <Switch id="tts-enabled" defaultChecked data-testid="switch-tts-enabled" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-play">{t('admin:autoPlay', 'Auto-play Audio')}</Label>
                      <p className="text-sm text-gray-500">{t('admin:autoPlayHint', 'Automatically play generated audio')}</p>
                    </div>
                    <Switch id="auto-play" data-testid="switch-auto-play" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="cache-audio">{t('admin:cacheAudio', 'Cache Audio Files')}</Label>
                      <p className="text-sm text-gray-500">{t('admin:cacheAudioHint', 'Store generated audio for reuse')}</p>
                    </div>
                    <Switch id="cache-audio" defaultChecked data-testid="switch-cache-audio" />
                  </div>

                  <div>
                    <Label htmlFor="max-text-length">{t('admin:maxTextLength', 'Max Text Length')}</Label>
                    <Input 
                      id="max-text-length" 
                      type="number" 
                      defaultValue="5000" 
                      data-testid="input-max-text-length"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {t('admin:maxTextLengthHint', 'Maximum characters per TTS request')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="card-title-voice-management">
                {t('admin:voiceManagement', 'Voice Management')}
              </CardTitle>
              <CardDescription>
                {t('admin:voiceManagementDescription', 'Manage available voices for different languages and styles')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: 'Aria', language: 'English (US)', gender: 'Female', style: 'Conversational', active: true },
                    { name: 'Jenny', language: 'English (US)', gender: 'Female', style: 'Professional', active: true },
                    { name: 'Ryan', language: 'English (US)', gender: 'Male', style: 'Friendly', active: true },
                    { name: 'Sara', language: 'Persian', gender: 'Female', style: 'Clear', active: false },
                    { name: 'Ahmad', language: 'Persian', gender: 'Male', style: 'Formal', active: true },
                    { name: 'Layla', language: 'Arabic', gender: 'Female', style: 'Calm', active: false }
                  ].map((voice, index) => (
                    <Card key={index} className={`cursor-pointer hover:shadow-md transition-shadow ${voice.active ? 'border-blue-200' : 'border-gray-200'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold" data-testid={`voice-name-${index}`}>
                            {voice.name}
                          </h3>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" data-testid={`button-play-voice-${index}`}>
                              <Play className="h-3 w-3" />
                            </Button>
                            <Switch 
                              checked={voice.active} 
                              size="sm" 
                              data-testid={`switch-voice-active-${index}`}
                            />
                          </div>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="text-gray-600" data-testid={`voice-language-${index}`}>
                            {voice.language}
                          </p>
                          <div className="flex justify-between">
                            <span className="text-gray-500" data-testid={`voice-gender-${index}`}>
                              {voice.gender}
                            </span>
                            <Badge variant="outline" data-testid={`voice-style-${index}`}>
                              {voice.style}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="card-title-tts-testing">
                {t('admin:ttsTestingTool', 'TTS Testing Tool')}
              </CardTitle>
              <CardDescription>
                {t('admin:ttsTestingDescription', 'Test different voices and settings with custom text')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="test-text">{t('admin:testText', 'Test Text')}</Label>
                <Textarea 
                  id="test-text" 
                  rows={4}
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  placeholder={t('admin:enterTestText', 'Enter text to convert to speech')}
                  data-testid="textarea-test-text"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="test-voice">{t('admin:selectVoice', 'Select Voice')}</Label>
                  <Select defaultValue="aria">
                    <SelectTrigger data-testid="select-test-voice">
                      <SelectValue placeholder={t('admin:chooseVoice', 'Choose voice')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aria">Aria (English)</SelectItem>
                      <SelectItem value="jenny">Jenny (English)</SelectItem>
                      <SelectItem value="ryan">Ryan (English)</SelectItem>
                      <SelectItem value="ahmad">Ahmad (Persian)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="test-speed">{t('admin:speed', 'Speed')}</Label>
                  <Select defaultValue="1.0">
                    <SelectTrigger data-testid="select-test-speed">
                      <SelectValue placeholder={t('admin:selectSpeed', 'Select speed')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.5">0.5x (Slow)</SelectItem>
                      <SelectItem value="1.0">1.0x (Normal)</SelectItem>
                      <SelectItem value="1.5">1.5x (Fast)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="test-pitch">{t('admin:pitch', 'Pitch')}</Label>
                  <Select defaultValue="0">
                    <SelectTrigger data-testid="select-test-pitch">
                      <SelectValue placeholder={t('admin:selectPitch', 'Select pitch')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="-10">Low</SelectItem>
                      <SelectItem value="0">Normal</SelectItem>
                      <SelectItem value="10">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button data-testid="button-generate-speech">
                  <Volume2 className="h-4 w-4 mr-2" />
                  {t('admin:generateSpeech', 'Generate Speech')}
                </Button>
                <Button variant="outline" data-testid="button-download-audio">
                  <Download className="h-4 w-4 mr-2" />
                  {t('admin:downloadAudio', 'Download Audio')}
                </Button>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-200" data-testid="audio-player-container">
                <div className="text-center text-gray-500">
                  <Volume2 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>{t('admin:audioPlayerPlaceholder', 'Generated audio will appear here')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="card-title-tts-analytics">
                {t('admin:ttsAnalytics', 'TTS Analytics')}
              </CardTitle>
              <CardDescription>
                {t('admin:ttsAnalyticsDescription', 'Usage statistics and performance metrics')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-8" data-testid="status-tts-analytics-loading">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>{t('admin:loadingTTSAnalytics', 'Loading TTS analytics data...')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4">
        <Button variant="outline" data-testid="button-reset-tts-settings">
          {t('admin:resetToDefault', 'Reset to Default')}
        </Button>
        <Button data-testid="button-save-tts-settings">
          {t('admin:saveSettings', 'Save Settings')}
        </Button>
      </div>
    </div>
  );
}