import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize,
  Minimize,
  Settings,
  Bookmark,
  BookOpen,
  Search,
  Sun,
  Moon,
  FileText,
  Home
} from 'lucide-react';

interface ReadingSettings {
  zoom: number;
  rotation: number;
  theme: 'light' | 'dark' | 'sepia';
  fitMode: 'width' | 'height' | 'auto';
}

interface BookmarkData {
  page: number;
  title: string;
  timestamp: number;
}

interface PDFControlsProps {
  currentPage: number;
  numPages: number;
  settings: ReadingSettings;
  bookmarks: BookmarkData[];
  isLoading: boolean;
  showControls: boolean;
  isFullscreen: boolean;
  onPageChange: (page: number) => void;
  onSettingsChange: (settings: ReadingSettings) => void;
  onAddBookmark: () => void;
  onRemoveBookmark: (index: number) => void;
  onToggleFullscreen: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRotate: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  className?: string;
}

export default function PDFControls({
  currentPage,
  numPages,
  settings,
  bookmarks,
  isLoading,
  showControls,
  isFullscreen,
  onPageChange,
  onSettingsChange,
  onAddBookmark,
  onRemoveBookmark,
  onToggleFullscreen,
  onZoomIn,
  onZoomOut,
  onRotate,
  onPrevPage,
  onNextPage,
  className = ""
}: PDFControlsProps) {
  const [pageInput, setPageInput] = useState<string>(currentPage.toString());
  const [showBookmarks, setShowBookmarks] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Handle page input change
  const handlePageInputChange = (value: string) => {
    setPageInput(value);
    const pageNum = parseInt(value, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= numPages) {
      onPageChange(pageNum);
    }
  };

  const handlePageInputKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      const pageNum = parseInt(pageInput, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= numPages) {
        onPageChange(pageNum);
      } else {
        setPageInput(currentPage.toString());
      }
    }
  };

  // Update page input when currentPage changes
  if (pageInput !== currentPage.toString()) {
    setPageInput(currentPage.toString());
  }

  const handleZoomChange = (value: number[]) => {
    onSettingsChange({ ...settings, zoom: value[0] });
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'sepia') => {
    onSettingsChange({ ...settings, theme });
  };

  const handleFitModeChange = (fitMode: 'width' | 'height' | 'auto') => {
    onSettingsChange({ ...settings, fitMode });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const zoomPercentage = Math.round(settings.zoom * 100);

  return (
    <div className={`fixed top-0 left-0 right-0 z-30 transition-opacity duration-300 ${className}`}>
      <Card className="mx-4 mt-4 border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-3">
          {/* Left Controls - Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrevPage}
              disabled={currentPage <= 1 || isLoading}
              data-testid="button-prev-page"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-2 min-w-0">
              <Input
                type="number"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onBlur={() => handlePageInputChange(pageInput)}
                onKeyPress={handlePageInputKeyPress}
                className="w-16 h-8 text-center text-sm"
                min={1}
                max={numPages}
                disabled={isLoading}
                data-testid="input-page-number"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                of {numPages}
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onNextPage}
              disabled={currentPage >= numPages || isLoading}
              data-testid="button-next-page"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Center Controls - Zoom and View */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onZoomOut}
              disabled={settings.zoom <= 0.5}
              data-testid="button-zoom-out"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>

            <Badge variant="secondary" className="min-w-[60px] text-center">
              {zoomPercentage}%
            </Badge>

            <Button
              variant="ghost"
              size="sm"
              onClick={onZoomIn}
              disabled={settings.zoom >= 3.0}
              data-testid="button-zoom-in"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <Button
              variant="ghost"
              size="sm"
              onClick={onRotate}
              data-testid="button-rotate"
            >
              <RotateCw className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleFullscreen}
              data-testid="button-fullscreen"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>
          </div>

          {/* Right Controls - Features */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddBookmark}
              data-testid="button-add-bookmark"
            >
              <Bookmark className="w-4 h-4" />
            </Button>

            <Popover open={showBookmarks} onOpenChange={setShowBookmarks}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid="button-bookmarks"
                >
                  <BookOpen className="w-4 h-4" />
                  {bookmarks.length > 0 && (
                    <Badge variant="destructive" className="ml-1 h-4 w-4 text-[10px] p-0">
                      {bookmarks.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" data-testid="popover-bookmarks">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Bookmarks</h4>
                  <ScrollArea className="h-48">
                    {bookmarks.length > 0 ? (
                      <div className="space-y-2">
                        {bookmarks.map((bookmark, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer"
                            onClick={() => onPageChange(bookmark.page)}
                            data-testid={`bookmark-${index}`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{bookmark.title}</p>
                              <p className="text-xs text-muted-foreground">
                                Page {bookmark.page} • {formatDate(bookmark.timestamp)}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveBookmark(index);
                              }}
                              data-testid={`button-remove-bookmark-${index}`}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No bookmarks yet
                      </p>
                    )}
                  </ScrollArea>
                </div>
              </PopoverContent>
            </Popover>

            <Popover open={showSettings} onOpenChange={setShowSettings}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid="button-settings"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" data-testid="popover-settings">
                <div className="space-y-4">
                  <h4 className="font-medium leading-none">Reading Settings</h4>
                  
                  {/* Zoom Control */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Zoom Level</label>
                    <div className="px-3">
                      <Slider
                        value={[settings.zoom]}
                        onValueChange={handleZoomChange}
                        max={3.0}
                        min={0.5}
                        step={0.1}
                        className="w-full"
                        data-testid="slider-zoom"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>50%</span>
                      <span>{zoomPercentage}%</span>
                      <span>300%</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Theme Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Theme</label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={settings.theme === 'light' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleThemeChange('light')}
                        className="flex items-center gap-2"
                        data-testid="button-theme-light"
                      >
                        <Sun className="w-3 h-3" />
                        Light
                      </Button>
                      <Button
                        variant={settings.theme === 'dark' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleThemeChange('dark')}
                        className="flex items-center gap-2"
                        data-testid="button-theme-dark"
                      >
                        <Moon className="w-3 h-3" />
                        Dark
                      </Button>
                      <Button
                        variant={settings.theme === 'sepia' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleThemeChange('sepia')}
                        className="flex items-center gap-2"
                        data-testid="button-theme-sepia"
                      >
                        <FileText className="w-3 h-3" />
                        Sepia
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Fit Mode */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fit Mode</label>
                    <Select value={settings.fitMode} onValueChange={handleFitModeChange}>
                      <SelectTrigger data-testid="select-fit-mode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="width">Fit to Width</SelectItem>
                        <SelectItem value="height">Fit to Height</SelectItem>
                        <SelectItem value="auto">Auto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Current Settings Info */}
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Rotation: {settings.rotation}°</div>
                    <div>Page: {currentPage} of {numPages}</div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </Card>
    </div>
  );
}