import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/services/endpoints";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  BookOpen, 
  Search, 
  Plus, 
  Eye, 
  Edit,
  ShoppingCart,
  DollarSign,
  Package,
  Star,
  TrendingUp,
  Upload,
  Settings,
  FileText,
  HardDrive,
  Music,
  Video
} from "lucide-react";

type BookType = 'pdf' | 'hardcopy';

export function AdminBookEcommerce() {
  const { t } = useTranslation(['admin', 'common']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Add Book form state
  const [bookType, setBookType] = useState<BookType>('pdf');
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [language, setLanguage] = useState("en");
  const [level, setLevel] = useState("");
  const [pageCount, setPageCount] = useState("");
  const [publishedYear, setPublishedYear] = useState("");
  const [stock, setStock] = useState("");
  
  // File uploads
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);

  // Fetch books data
  const { data: books = [], isLoading, refetch } = useQuery({
    queryKey: [API_ENDPOINTS.admin.bookCatalog, { search: searchTerm, category: filterCategory }],
  });

  // Create book mutation
  const createBookMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return apiRequest('/api/books', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: async (data) => {
      toast({
        title: t('common:success'),
        description: t('admin:bookEcommerce.bookCreatedSuccess'),
      });
      
      // Generate AI description after book creation
      if (data.data?.id) {
        try {
          await apiRequest(`/api/books/${data.data.id}/generate-ai-description`, {
            method: 'POST',
          });
          toast({
            title: t('common:success'),
            description: t('admin:bookEcommerce.aiDescriptionGenerated'),
          });
        } catch (error) {
          console.error('Failed to generate AI description:', error);
        }
      }
      
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.admin.bookCatalog] });
      resetForm();
      setAddDialogOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: t('common:error'),
        description: error.message || t('admin:bookEcommerce.bookCreatedError'),
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('author', author);
    formData.append('isbn', isbn);
    formData.append('description', description);
    formData.append('bookType', bookType);
    formData.append('price', price);
    formData.append('currency', 'IRR');
    formData.append('language', language);
    
    if (level) formData.append('level', level);
    if (pageCount) formData.append('pageCount', pageCount);
    if (publishedYear) formData.append('publishedYear', publishedYear);
    
    if (bookType === 'pdf') {
      if (pdfFile) formData.append('pdfFile', pdfFile);
      audioFiles.forEach((file, index) => {
        formData.append(`audioFile${index}`, file);
      });
      videoFiles.forEach((file, index) => {
        formData.append(`videoFile${index}`, file);
      });
    } else {
      if (stock) formData.append('stock', stock);
      if (coverImage) formData.append('coverImage', coverImage);
    }
    
    createBookMutation.mutate(formData);
  };

  const resetForm = () => {
    setBookType('pdf');
    setTitle("");
    setAuthor("");
    setIsbn("");
    setDescription("");
    setPrice("");
    setLanguage("en");
    setLevel("");
    setPageCount("");
    setPublishedYear("");
    setStock("");
    setPdfFile(null);
    setCoverImage(null);
    setAudioFiles([]);
    setVideoFiles([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'pdf' | 'cover' | 'audio' | 'video') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (type === 'pdf') {
      setPdfFile(files[0]);
    } else if (type === 'cover') {
      setCoverImage(files[0]);
    } else if (type === 'audio') {
      setAudioFiles(Array.from(files));
    } else if (type === 'video') {
      setVideoFiles(Array.from(files));
    }
  };

  // Mock books data for development
  const mockBooks = [
    {
      id: 1,
      title: "Persian Grammar Essentials",
      author: "Dr. Reza Mohtashemi",
      category: "grammar",
      price: 890000,
      currency: "IRR",
      stock: 45,
      sold: 128,
      rating: 4.8,
      status: "published",
      bookType: "hardcopy",
      cover: "/api/placeholder/book-cover-1.jpg",
      description: "Comprehensive guide to Persian grammar for beginners"
    },
    {
      id: 2,
      title: "Business English Conversations",
      author: "Sarah Johnson",
      category: "business",
      price: 1250000,
      currency: "IRR",
      stock: 0,
      sold: 89,
      rating: 4.6,
      status: "published",
      bookType: "pdf",
      cover: "/api/placeholder/book-cover-2.jpg",
      description: "Essential business English phrases and conversations"
    },
    {
      id: 3,
      title: "IELTS Speaking Mastery",
      author: "Michael Chen",
      category: "test-prep",
      price: 1450000,
      currency: "IRR",
      stock: 18,
      sold: 156,
      rating: 4.9,
      status: "published",
      bookType: "hardcopy",
      cover: "/api/placeholder/book-cover-3.jpg",
      description: "Complete IELTS speaking preparation guide"
    }
  ];

  const displayBooks = isLoading ? mockBooks : (Array.isArray(books) && books.length > 0 ? books : mockBooks);

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('admin:navigation.bookEcommerce')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('admin:bookEcommerce.description')}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-book">
                <Plus className="h-4 w-4 mr-2" />
                {t('admin:bookEcommerce.addBook')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('admin:bookEcommerce.addNewBook')}</DialogTitle>
                <DialogDescription>
                  {t('admin:bookEcommerce.addBookDescription')}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Book Type Selection */}
                <div className="space-y-2">
                  <Label>{t('admin:bookEcommerce.bookType')}</Label>
                  <Select value={bookType} onValueChange={(value: BookType) => setBookType(value)}>
                    <SelectTrigger data-testid="select-book-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {t('admin:bookEcommerce.pdfBook')}
                        </div>
                      </SelectItem>
                      <SelectItem value="hardcopy">
                        <div className="flex items-center gap-2">
                          <HardDrive className="h-4 w-4" />
                          {t('admin:bookEcommerce.hardcopyBook')}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Basic Information */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">{t('admin:bookEcommerce.title')} *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      data-testid="input-title"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="author">{t('admin:bookEcommerce.author')}</Label>
                      <Input
                        id="author"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        data-testid="input-author"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="isbn">ISBN</Label>
                      <Input
                        id="isbn"
                        value={isbn}
                        onChange={(e) => setIsbn(e.target.value)}
                        data-testid="input-isbn"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">{t('admin:bookEcommerce.description')}</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      data-testid="input-description"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('admin:bookEcommerce.aiDescriptionNote')}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">{t('admin:bookEcommerce.price')} (IRR) *</Label>
                      <Input
                        id="price"
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                        data-testid="input-price"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="language">{t('admin:bookEcommerce.language')}</Label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger data-testid="select-language">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="fa">Farsi</SelectItem>
                          <SelectItem value="ar">Arabic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="level">{t('admin:bookEcommerce.level')}</Label>
                      <Input
                        id="level"
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                        placeholder="A1, B2, etc."
                        data-testid="input-level"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pageCount">{t('admin:bookEcommerce.pageCount')}</Label>
                      <Input
                        id="pageCount"
                        type="number"
                        value={pageCount}
                        onChange={(e) => setPageCount(e.target.value)}
                        data-testid="input-page-count"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="year">{t('admin:bookEcommerce.publishedYear')}</Label>
                      <Input
                        id="year"
                        type="number"
                        value={publishedYear}
                        onChange={(e) => setPublishedYear(e.target.value)}
                        placeholder="2024"
                        data-testid="input-published-year"
                      />
                    </div>
                  </div>
                </div>

                {/* Conditional Fields Based on Book Type */}
                {bookType === 'pdf' ? (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-semibold">{t('admin:bookEcommerce.pdfBookFiles')}</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="pdfFile">{t('admin:bookEcommerce.pdfFile')} *</Label>
                      <Input
                        id="pdfFile"
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileChange(e, 'pdf')}
                        required
                        data-testid="input-pdf-file"
                      />
                      {pdfFile && (
                        <p className="text-sm text-muted-foreground">
                          {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="audioFiles">
                        <Music className="h-4 w-4 inline mr-2" />
                        {t('admin:bookEcommerce.audioFiles')}
                      </Label>
                      <Input
                        id="audioFiles"
                        type="file"
                        accept="audio/*"
                        multiple
                        onChange={(e) => handleFileChange(e, 'audio')}
                        data-testid="input-audio-files"
                      />
                      {audioFiles.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {audioFiles.length} file(s) selected
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="videoFiles">
                        <Video className="h-4 w-4 inline mr-2" />
                        {t('admin:bookEcommerce.videoFiles')}
                      </Label>
                      <Input
                        id="videoFiles"
                        type="file"
                        accept="video/*"
                        multiple
                        onChange={(e) => handleFileChange(e, 'video')}
                        data-testid="input-video-files"
                      />
                      {videoFiles.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {videoFiles.length} file(s) selected
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-semibold">{t('admin:bookEcommerce.hardcopyBookDetails')}</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="coverImage">{t('admin:bookEcommerce.coverImage')} *</Label>
                      <Input
                        id="coverImage"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'cover')}
                        required
                        data-testid="input-cover-image"
                      />
                      {coverImage && (
                        <p className="text-sm text-muted-foreground">
                          {coverImage.name} ({(coverImage.size / 1024).toFixed(2)} KB)
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stock">{t('admin:bookEcommerce.stock')} *</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        required
                        min="0"
                        data-testid="input-stock"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAddDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    {t('common:cancel')}
                  </Button>
                  <Button
                    type="submit"
                    disabled={createBookMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createBookMutation.isPending ? t('common:saving') : t('common:save')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:bookEcommerce.totalBooks')}
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-books">
              {displayBooks.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:bookEcommerce.totalSales')}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-sales">
              {(displayBooks.reduce((sum, book) => sum + (book.sold * book.price), 0) / 1000000).toFixed(1)}M IRR
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:bookEcommerce.inStock')}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-in-stock">
              {displayBooks.reduce((sum, book) => sum + book.stock, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:bookEcommerce.avgRating')}
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-rating">
              {(displayBooks.reduce((sum, book) => sum + book.rating, 0) / displayBooks.length).toFixed(1)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Book Management */}
      <Tabs defaultValue="catalog" className="w-full">
        <TabsList>
          <TabsTrigger value="catalog">{t('admin:bookEcommerce.catalog')}</TabsTrigger>
          <TabsTrigger value="orders">{t('admin:bookEcommerce.orders')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('admin:bookEcommerce.analytics')}</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('admin:bookEcommerce.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-books"
              />
            </div>
          </div>

          {/* Books Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {displayBooks.map((book) => (
              <Card key={book.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex gap-4">
                    <div className="w-16 h-20 bg-gray-200 rounded flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg" data-testid={`text-book-title-${book.id}`}>
                        {book.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{book.author}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="secondary">
                          {book.category}
                        </Badge>
                        <Badge variant={book.bookType === 'pdf' ? 'default' : 'outline'}>
                          {book.bookType === 'pdf' ? 'PDF' : 'Hardcopy'}
                        </Badge>
                      </div>
                    </div>
                    <Badge 
                      variant={book.status === 'published' ? 'default' : 'secondary'}
                      data-testid={`badge-status-${book.id}`}
                    >
                      {book.status}
                    </Badge>
                  </div>
                  <CardDescription>{book.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>{t('admin:bookEcommerce.price')}</span>
                      <span className="font-medium" data-testid={`text-price-${book.id}`}>
                        {book.price.toLocaleString()} {book.currency}
                      </span>
                    </div>
                    {book.bookType === 'hardcopy' && (
                      <div className="flex justify-between">
                        <span>{t('admin:bookEcommerce.stock')}</span>
                        <span data-testid={`text-stock-${book.id}`}>{book.stock}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>{t('admin:bookEcommerce.sold')}</span>
                      <span data-testid={`text-sold-${book.id}`}>{book.sold}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('admin:bookEcommerce.rating')}</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span data-testid={`text-rating-${book.id}`}>{book.rating}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" data-testid={`button-view-${book.id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      {t('common:view')}
                    </Button>
                    <Button size="sm" variant="outline" data-testid={`button-edit-${book.id}`}>
                      <Edit className="h-4 w-4 mr-1" />
                      {t('common:edit')}
                    </Button>
                    <Button size="sm" variant="outline" data-testid={`button-settings-${book.id}`}>
                      <Settings className="h-4 w-4 mr-1" />
                      {t('common:settings')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin:bookEcommerce.recentOrders')}</CardTitle>
              <CardDescription>
                {t('admin:bookEcommerce.ordersDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4" />
                <p>{t('admin:bookEcommerce.noOrdersPlaceholder')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin:bookEcommerce.salesAnalytics')}</CardTitle>
              <CardDescription>
                {t('admin:bookEcommerce.analyticsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                <p>{t('admin:bookEcommerce.analyticsPlaceholder')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
