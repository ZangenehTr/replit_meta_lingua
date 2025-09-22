import { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Maximize, 
  Minimize,
  ChevronLeft,
  ChevronRight,
  Search,
  Bookmark,
  Settings
} from 'lucide-react';
import DictionaryOverlay from './DictionaryOverlay';
import PDFControls from './PDFControls';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFReaderProps {
  pdfUrl: string;
  bookId: number;
  bookTitle: string;
  onError?: (error: string) => void;
  onProgress?: (page: number, total: number) => void;
  className?: string;
}

interface TextSelection {
  text: string;
  x: number;
  y: number;
  pageNumber: number;
}

interface BookmarkData {
  page: number;
  title: string;
  timestamp: number;
}

interface ReadingSettings {
  zoom: number;
  rotation: number;
  theme: 'light' | 'dark' | 'sepia';
  fitMode: 'width' | 'height' | 'auto';
}

export function PDFReader({ 
  pdfUrl, 
  bookId, 
  bookTitle, 
  onError, 
  onProgress,
  className = "" 
}: PDFReaderProps) {
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // PDF state
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Selection and dictionary state
  const [textSelection, setTextSelection] = useState<TextSelection | null>(null);
  const [showDictionary, setShowDictionary] = useState<boolean>(false);
  
  // Bookmarks and settings
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);
  const [settings, setSettings] = useState<ReadingSettings>({
    zoom: 1.0,
    rotation: 0,
    theme: 'light',
    fitMode: 'width'
  });

  // Load saved settings and bookmarks from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem(`pdf-settings-${bookId}`);
    const savedBookmarks = localStorage.getItem(`pdf-bookmarks-${bookId}`);
    const savedPage = localStorage.getItem(`pdf-page-${bookId}`);

    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Failed to load saved settings:', error);
      }
    }

    if (savedBookmarks) {
      try {
        setBookmarks(JSON.parse(savedBookmarks));
      } catch (error) {
        console.error('Failed to load saved bookmarks:', error);
      }
    }

    if (savedPage) {
      const page = parseInt(savedPage, 10);
      if (!isNaN(page)) {
        setCurrentPage(page);
      }
    }
  }, [bookId]);

  // Save settings and current page
  useEffect(() => {
    localStorage.setItem(`pdf-settings-${bookId}`, JSON.stringify(settings));
  }, [settings, bookId]);

  useEffect(() => {
    localStorage.setItem(`pdf-page-${bookId}`, currentPage.toString());
  }, [currentPage, bookId]);

  useEffect(() => {
    localStorage.setItem(`pdf-bookmarks-${bookId}`, JSON.stringify(bookmarks));
  }, [bookmarks, bookId]);

  // Progress tracking
  useEffect(() => {
    if (onProgress && numPages > 0) {
      onProgress(currentPage, numPages);
    }
  }, [currentPage, numPages, onProgress]);

  // PDF document event handlers
  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
    toast({
      title: "PDF Loaded",
      description: `Successfully loaded ${numPages} pages`,
    });
  };

  const handleDocumentLoadError = (error: Error) => {
    console.error('PDF loading error:', error);
    const errorMessage = error.message || 'Failed to load PDF document';
    setError(errorMessage);
    setIsLoading(false);
    onError?.(errorMessage);
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
  };

  // Navigation functions
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= numPages) {
      setCurrentPage(page);
      // Scroll to page if needed
      const pageElement = pageRefs.current[page - 1];
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [numPages]);

  const nextPage = useCallback(() => {
    if (currentPage < numPages) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, numPages, goToPage]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  // Zoom and view controls
  const zoomIn = useCallback(() => {
    setSettings(prev => ({ ...prev, zoom: Math.min(prev.zoom * 1.2, 3.0) }));
  }, []);

  const zoomOut = useCallback(() => {
    setSettings(prev => ({ ...prev, zoom: Math.max(prev.zoom / 1.2, 0.5) }));
  }, []);

  const toggleRotation = useCallback(() => {
    setSettings(prev => ({ ...prev, rotation: (prev.rotation + 90) % 360 }));
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  // Bookmark functions
  const addBookmark = useCallback(() => {
    const bookmark: BookmarkData = {
      page: currentPage,
      title: `Page ${currentPage}`,
      timestamp: Date.now()
    };
    setBookmarks(prev => [...prev, bookmark]);
    toast({
      title: "Bookmark Added",
      description: `Page ${currentPage} bookmarked`,
    });
  }, [currentPage, toast]);

  const removeBookmark = useCallback((index: number) => {
    setBookmarks(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Text selection handling
  const handleTextSelection = useCallback((event: MouseEvent) => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const text = selection.toString().trim();
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setTextSelection({
        text,
        x: rect.left + rect.width / 2,
        y: rect.top,
        pageNumber: currentPage
      });
    }
  }, [currentPage]);

  // Double-click to show dictionary
  const handleDoubleClick = useCallback((event: MouseEvent) => {
    handleTextSelection(event);
    if (textSelection) {
      setShowDictionary(true);
    }
  }, [textSelection, handleTextSelection]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          prevPage();
          break;
        case 'ArrowRight':
          event.preventDefault();
          nextPage();
          break;
        case 'f':
        case 'F':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            setShowSearch(prev => !prev);
          }
          break;
        case 'Escape':
          if (isFullscreen) {
            toggleFullscreen();
          }
          setShowDictionary(false);
          setShowSearch(false);
          break;
        case '+':
        case '=':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            zoomIn();
          }
          break;
        case '-':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            zoomOut();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [prevPage, nextPage, isFullscreen, toggleFullscreen, zoomIn, zoomOut]);

  // Mouse events for text selection
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mouseup', handleTextSelection);
    container.addEventListener('dblclick', handleDoubleClick);

    return () => {
      container.removeEventListener('mouseup', handleTextSelection);
      container.removeEventListener('dblclick', handleDoubleClick);
    };
  }, [handleTextSelection, handleDoubleClick]);

  // Hide controls after inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const resetTimeout = () => {
      clearTimeout(timeout);
      setShowControls(true);
      timeout = setTimeout(() => {
        if (isFullscreen) {
          setShowControls(false);
        }
      }, 3000);
    };

    if (isFullscreen) {
      document.addEventListener('mousemove', resetTimeout);
      document.addEventListener('click', resetTimeout);
      resetTimeout();
    }

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mousemove', resetTimeout);
      document.removeEventListener('click', resetTimeout);
    };
  }, [isFullscreen]);

  const progress = numPages > 0 ? (currentPage / numPages) * 100 : 0;

  if (error) {
    return (
      <Card className="p-8 text-center" data-testid="pdf-error">
        <div className="text-red-500 mb-4">Error loading PDF</div>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
          data-testid="button-retry"
        >
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full bg-background ${className}`}
      data-testid="pdf-reader"
    >
      {/* Controls */}
      <PDFControls
        currentPage={currentPage}
        numPages={numPages}
        settings={settings}
        bookmarks={bookmarks}
        isLoading={isLoading}
        showControls={showControls}
        isFullscreen={isFullscreen}
        onPageChange={goToPage}
        onSettingsChange={setSettings}
        onAddBookmark={addBookmark}
        onRemoveBookmark={removeBookmark}
        onToggleFullscreen={toggleFullscreen}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onRotate={toggleRotation}
        onPrevPage={prevPage}
        onNextPage={nextPage}
        className={showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      />

      {/* Progress bar */}
      {numPages > 0 && (
        <div className="absolute top-0 left-0 right-0 z-40">
          <Progress value={progress} className="h-1 rounded-none" data-testid="progress-bar" />
        </div>
      )}

      {/* PDF Document */}
      <div className="w-full h-full overflow-auto pt-16 pb-4">
        {isLoading && (
          <div className="flex items-center justify-center h-full" data-testid="pdf-loading">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading PDF...</p>
            </div>
          </div>
        )}

        <Document
          file={pdfUrl}
          onLoadSuccess={handleDocumentLoadSuccess}
          onLoadError={handleDocumentLoadError}
          loading={null}
          error={null}
          className="flex flex-col items-center"
        >
          <Page
            pageNumber={currentPage}
            scale={settings.zoom}
            rotate={settings.rotation}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            className={`shadow-lg mb-4 ${settings.theme === 'dark' ? 'invert' : settings.theme === 'sepia' ? 'sepia' : ''}`}
            data-testid={`pdf-page-${currentPage}`}
          />
        </Document>
      </div>

      {/* Dictionary Overlay */}
      {showDictionary && textSelection && (
        <DictionaryOverlay
          word={textSelection.text}
          position={{ x: textSelection.x, y: textSelection.y }}
          onClose={() => {
            setShowDictionary(false);
            setTextSelection(null);
          }}
          bookId={bookId}
          pageNumber={textSelection.pageNumber}
        />
      )}
    </div>
  );
}