import { useState, useEffect } from 'react';
import { useParams, useLocation, Redirect } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { ArrowLeft, Download, AlertCircle, Lock, BookOpen } from 'lucide-react';
import { PDFReader } from '@/components/PDFReader/PDFReader';
import { apiRequest } from '@/lib/queryClient';

interface BookData {
  id: number;
  title: string;
  author: string;
  description?: string;
  price: number;
  price_minor: number;
  currency_code: string;
  is_free: boolean;
  pdf_file_path?: string;
  hardcopy_available: boolean;
}

interface OrderData {
  id: number;
  userId: number;
  status: string;
  books: {
    bookId: number;
    book: BookData;
  }[];
}

export default function BookReader() {
  const { bookId, orderId } = useParams<{ bookId: string; orderId?: string }>();
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [readingProgress, setReadingProgress] = useState<{ page: number; total: number }>({ page: 1, total: 0 });

  // Redirect to auth if not authenticated
  if (!authLoading && !user) {
    return <Redirect to="/auth" />;
  }

  // Fetch book details
  const { data: book, isLoading: bookLoading, error: bookError } = useQuery<BookData>({
    queryKey: ['/api/books', bookId],
    enabled: !!bookId,
  });

  // Fetch order details if orderId is provided
  const { data: order, isLoading: orderLoading } = useQuery<OrderData>({
    queryKey: ['/api/orders', orderId],
    enabled: !!orderId && !!user,
  });

  // Check if user has access to the book
  const hasAccess = () => {
    if (!book) return false;
    
    // Free books are accessible to everyone
    if (book.is_free) return true;
    
    // If orderId is provided, check if user owns this order
    if (orderId && order) {
      return order.userId === user?.id && 
             order.books.some((item: any) => item.bookId === parseInt(bookId || '0', 10));
    }
    
    // For direct book access, we could implement additional checks here
    // For now, assume access if the user is authenticated
    return !!user;
  };

  // Download PDF mutation
  const downloadMutation = useMutation({
    mutationFn: async () => {
      if (!bookId) throw new Error('Book ID is required');
      
      let downloadUrl: string;
      
      if (orderId) {
        // Download from order
        downloadUrl = `/api/orders/${orderId}/download/${bookId}`;
      } else {
        // Direct book download
        downloadUrl = `/api/books/${bookId}/download`;
      }

      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('You need to be logged in to access this book');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to access this book');
        } else if (response.status === 404) {
          throw new Error('Book not found or PDF not available');
        } else {
          throw new Error('Failed to download book');
        }
      }

      // Create blob URL for PDF
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      return url;
    },
    onSuccess: (url) => {
      setPdfUrl(url);
      setError(null);
      toast({
        title: "Success",
        description: "Book loaded successfully",
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || 'Failed to load book';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  // Load PDF when component mounts and user has access
  useEffect(() => {
    if (book && hasAccess() && !pdfUrl && !downloadMutation.isPending) {
      downloadMutation.mutate();
    }
  }, [book, user, orderId, order]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const handleBackNavigation = () => {
    if (orderId) {
      setLocation(`/student/orders/${orderId}`);
    } else {
      setLocation('/books');
    }
  };

  const handleReadingProgress = (page: number, total: number) => {
    setReadingProgress({ page, total });
    
    // Save reading progress to API (optional)
    if (user && bookId) {
      apiRequest('/api/reading-progress', {
        method: 'POST',
        body: JSON.stringify({
          bookId: parseInt(bookId, 10),
          currentPage: page,
          totalPages: total,
          progress: total > 0 ? (page / total) * 100 : 0
        })
      }).catch(error => {
        console.error('Failed to save reading progress:', error);
      });
    }
  };

  const handlePDFError = (errorMessage: string) => {
    setError(errorMessage);
    toast({
      title: "PDF Error",
      description: errorMessage,
      variant: "destructive",
    });
  };

  // Loading states
  if (authLoading || bookLoading || orderLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-4" />
          <Card>
            <CardContent className="p-8">
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error states
  if (bookError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={handleBackNavigation}
            className="mb-4"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load book details. Please try again later.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={handleBackNavigation}
            className="mb-4"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Book not found.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Access check
  if (!hasAccess()) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={handleBackNavigation}
            className="mb-4"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <Card>
            <CardContent className="p-8 text-center">
              <Lock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-semibold mb-2">Access Required</h2>
              <p className="text-muted-foreground mb-6">
                You need to purchase this book to read it.
              </p>
              <div className="space-y-4">
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="font-semibold text-lg">{book.title}</h3>
                  <p className="text-sm text-muted-foreground">by {book.author}</p>
                  <p className="text-2xl font-bold mt-2">
                    {book.currency_code} {book.price}
                  </p>
                </div>
                <Button 
                  onClick={() => setLocation(`/books/${bookId}`)}
                  className="w-full"
                  data-testid="button-purchase"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  View Book Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show error if PDF failed to load
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={handleBackNavigation}
            className="mb-4"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
          
          <div className="mt-4">
            <Button
              onClick={() => downloadMutation.mutate()}
              disabled={downloadMutation.isPending}
              data-testid="button-retry"
            >
              {downloadMutation.isPending ? (
                <>
                  <Download className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Retry
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while PDF is being downloaded
  if (downloadMutation.isPending || !pdfUrl) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={handleBackNavigation}
            className="mb-4"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <Card>
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <Download className="w-8 h-8 text-primary animate-bounce" />
                </div>
                <h3 className="text-xl font-semibold">Loading {book.title}</h3>
                <p className="text-muted-foreground">
                  Preparing your book for reading...
                </p>
                {downloadProgress > 0 && (
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main PDF Reader view
  return (
    <div className="min-h-screen bg-background" data-testid="book-reader">
      {/* Header - only show on non-fullscreen */}
      <div className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackNavigation}
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="min-w-0">
                <h1 className="font-semibold truncate" data-testid="text-book-title">
                  {book.title}
                </h1>
                <p className="text-sm text-muted-foreground truncate">
                  by {book.author}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span data-testid="text-reading-progress">
                Page {readingProgress.page} of {readingProgress.total}
              </span>
              {readingProgress.total > 0 && (
                <span>
                  ({Math.round((readingProgress.page / readingProgress.total) * 100)}%)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PDF Reader */}
      <div className="h-[calc(100vh-4rem)]">
        <PDFReader
          pdfUrl={pdfUrl}
          bookId={parseInt(bookId || '0', 10)}
          bookTitle={book.title}
          onError={handlePDFError}
          onProgress={handleReadingProgress}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}