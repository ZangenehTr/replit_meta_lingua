import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/services/endpoints";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertBookSchema } from "@shared/schema";
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
  FileText,
  HardDrive
} from "lucide-react";

type BookType = 'pdf' | 'hardcopy';

interface Book {
  id: number;
  title: string;
  author?: string;
  isbn?: string;
  price: string;
  currency?: string;
  bookType?: string;
  language?: string;
  level?: string;
}

// Form schema for Add Book dialog (simplified for initial creation)
const addBookFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  author: z.string().max(255).optional(),
  isbn: z.string().max(20).optional(),
  description: z.string().optional(),
  price: z.string().min(1, "Price is required"),
  bookType: z.enum(['pdf', 'hardcopy']).default('pdf'),
  language: z.string().max(50).default("en"),
  level: z.string().max(20).optional(),
  pageCount: z.number().optional(),
  publicationYear: z.number().optional(),
  category: z.string().max(255).optional(),
  stockQuantity: z.number().default(0),
});

type AddBookFormData = z.infer<typeof addBookFormSchema>;

export function AdminBookEcommerce() {
  const { t } = useTranslation(['admin', 'common']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const form = useForm<AddBookFormData>({
    resolver: zodResolver(addBookFormSchema),
    defaultValues: {
      title: "",
      author: "",
      isbn: "",
      description: "",
      price: "",
      bookType: 'pdf',
      language: "en",
      level: "",
      category: "",
      stockQuantity: 0,
    },
  });

  const editForm = useForm<AddBookFormData>({
    resolver: zodResolver(addBookFormSchema),
    defaultValues: {
      title: "",
      author: "",
      isbn: "",
      description: "",
      price: "",
      bookType: 'pdf',
      language: "en",
      level: "",
      category: "",
      stockQuantity: 0,
    },
  });

  // Fetch books data
  const { data: books = [], isLoading, refetch } = useQuery<Book[]>({
    queryKey: [API_ENDPOINTS.admin.bookCatalog, { search: searchTerm, category: filterCategory }],
  });

  // Fetch book orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery<any[]>({
    queryKey: [API_ENDPOINTS.admin.bookOrders],
  });

  // Shipping address dialog state
  const [shippingDialogOpen, setShippingDialogOpen] = useState(false);
  const [selectedBookForPurchase, setSelectedBookForPurchase] = useState<Book | null>(null);
  const [shippingAddress, setShippingAddress] = useState('');

  // Purchase book mutation
  const purchaseBookMutation = useMutation({
    mutationFn: async ({ bookId, shippingAddress }: { bookId: number; shippingAddress?: string }) => {
      return await apiRequest(`/api/book-ecommerce/books/${bookId}/purchase`, {
        method: 'POST',
        body: JSON.stringify({
          paymentMethod: 'wallet',
          shippingAddress
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.admin.bookOrders] });
      toast({
        title: t('common:success'),
        description: 'Book purchased successfully'
      });
      setShippingDialogOpen(false);
      setSelectedBookForPurchase(null);
      setShippingAddress('');
    },
    onError: (error: any) => {
      toast({
        title: t('common:error'),
        description: error.message || 'Failed to purchase book',
        variant: 'destructive'
      });
    }
  });

  const handlePurchaseClick = (book: Book) => {
    if (book.bookType === 'hardcopy') {
      setSelectedBookForPurchase(book);
      setShippingDialogOpen(true);
    } else {
      purchaseBookMutation.mutate({ bookId: book.id });
    }
  };

  const handleConfirmPurchase = () => {
    if (selectedBookForPurchase) {
      purchaseBookMutation.mutate({ 
        bookId: selectedBookForPurchase.id,
        shippingAddress: selectedBookForPurchase.bookType === 'hardcopy' ? shippingAddress : undefined
      });
    }
  };

  // Create book mutation
  const createBookMutation = useMutation({
    mutationFn: async (data: AddBookFormData) => {
      return apiRequest('/api/books', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: async (response) => {
      toast({
        title: t('common:success'),
        description: t('admin:bookEcommerce.bookCreatedSuccess'),
      });
      
      // Generate AI description after book creation
      if (response.data?.id) {
        try {
          await apiRequest(`/api/books/${response.data.id}/generate-description`, {
            method: 'POST',
          });
          toast({
            title: t('common:success'),
            description: t('admin:bookEcommerce.aiDescriptionGenerated'),
          });
        } catch (error: any) {
          console.error('Failed to generate AI description:', error);
          toast({
            title: t('common:warning'),
            description: error.message || 'AI description generation failed. You can retry later.',
            variant: 'default',
          });
        }
      }
      
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.admin.bookCatalog] });
      form.reset();
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

  const onSubmit = (data: AddBookFormData) => {
    createBookMutation.mutate(data);
  };

  // Handlers for View and Edit
  const handleViewBook = (book: Book) => {
    setSelectedBook(book);
    setViewDialogOpen(true);
  };

  const handleEditBook = async (book: Book) => {
    setSelectedBook(book);
    
    // Fetch full book details from API to avoid partial data
    try {
      const fullBook = await apiRequest(`/api/books/${book.id}`, { method: 'GET' });
      
      editForm.reset({
        title: fullBook.data.title || "",
        author: fullBook.data.author || "",
        isbn: fullBook.data.isbn || "",
        description: fullBook.data.description || "",
        price: fullBook.data.price || "",
        bookType: (fullBook.data.bookType || fullBook.data.book_type || 'pdf') as 'pdf' | 'hardcopy',
        language: fullBook.data.language || "en",
        level: fullBook.data.level || "",
        category: fullBook.data.category || "",
        stockQuantity: fullBook.data.stockQuantity || fullBook.data.stock_quantity || 0,
        pageCount: fullBook.data.pageCount || fullBook.data.page_count,
        publicationYear: fullBook.data.publicationYear || fullBook.data.publication_year,
      });
      
      setEditDialogOpen(true);
    } catch (error) {
      console.error('Failed to fetch book details:', error);
      toast({
        title: t('common:error'),
        description: 'Failed to load book details',
        variant: 'destructive',
      });
    }
  };

  // Update book mutation
  const updateBookMutation = useMutation({
    mutationFn: async (data: AddBookFormData) => {
      if (!selectedBook) throw new Error('No book selected');
      return apiRequest(`/api/books/${selectedBook.id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: t('common:success'),
        description: 'Book updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.admin.bookCatalog] });
      setEditDialogOpen(false);
      setSelectedBook(null);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: t('common:error'),
        description: error.message || 'Failed to update book',
        variant: 'destructive',
      });
    },
  });

  const onEditSubmit = (data: AddBookFormData) => {
    updateBookMutation.mutate(data);
  };

  const bookType = form.watch("bookType");
  const editBookType = editForm.watch("bookType");

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            {t('admin:bookEcommerce.title')}
          </h1>
          <p className="text-muted-foreground mt-1" data-testid="text-page-description">
            {t('admin:bookEcommerce.description')}
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-book">
              <Plus className="mr-2 h-4 w-4" />
              {t('admin:bookEcommerce.addBook')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-add-book">
            <DialogHeader>
              <DialogTitle data-testid="text-dialog-title">{t('admin:bookEcommerce.addNewBook')}</DialogTitle>
              <DialogDescription data-testid="text-dialog-description">
                {t('admin:bookEcommerce.addBookDescription')}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Book Type Selection */}
                <FormField
                  control={form.control}
                  name="bookType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel data-testid="label-book-type">{t('admin:bookEcommerce.bookType')}</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            type="button"
                            onClick={() => field.onChange('pdf')}
                            data-testid="button-type-pdf"
                            className={`p-4 border-2 rounded-lg flex items-center gap-3 transition-colors ${
                              field.value === 'pdf'
                                ? 'border-primary bg-primary/10'
                                : 'border-muted hover:border-primary/50'
                            }`}
                          >
                            <FileText className="h-6 w-6" />
                            <div className="text-left">
                              <div className="font-semibold">{t('admin:bookEcommerce.pdfBook')}</div>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => field.onChange('hardcopy')}
                            data-testid="button-type-hardcopy"
                            className={`p-4 border-2 rounded-lg flex items-center gap-3 transition-colors ${
                              field.value === 'hardcopy'
                                ? 'border-primary bg-primary/10'
                                : 'border-muted hover:border-primary/50'
                            }`}
                          >
                            <HardDrive className="h-6 w-6" />
                            <div className="text-left">
                              <div className="font-semibold">{t('admin:bookEcommerce.hardcopyBook')}</div>
                            </div>
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel data-testid="label-title">{t('admin:bookEcommerce.bookTitle')}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-title" placeholder={t('admin:bookEcommerce.bookTitle')} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="author"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-author">{t('admin:bookEcommerce.author')}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-author" placeholder={t('admin:bookEcommerce.author')} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isbn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-isbn">ISBN</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-isbn" placeholder="ISBN" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel data-testid="label-description">{t('admin:bookEcommerce.description')}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-description" placeholder={t('admin:bookEcommerce.description')} />
                      </FormControl>
                      <FormDescription data-testid="text-ai-note">
                        {t('admin:bookEcommerce.aiDescriptionNote')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-price">{t('admin:bookEcommerce.price')} (IRR)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" data-testid="input-price" placeholder="500000" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-language">{t('admin:bookEcommerce.language')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-language">
                              <SelectValue placeholder={t('admin:bookEcommerce.language')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="en" data-testid="option-language-en">English</SelectItem>
                            <SelectItem value="fa" data-testid="option-language-fa">فارسی</SelectItem>
                            <SelectItem value="ar" data-testid="option-language-ar">العربية</SelectItem>
                            <SelectItem value="fr" data-testid="option-language-fr">Français</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-level">{t('admin:bookEcommerce.level')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-level">
                              <SelectValue placeholder={t('admin:bookEcommerce.level')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="A1" data-testid="option-level-a1">A1</SelectItem>
                            <SelectItem value="A2" data-testid="option-level-a2">A2</SelectItem>
                            <SelectItem value="B1" data-testid="option-level-b1">B1</SelectItem>
                            <SelectItem value="B2" data-testid="option-level-b2">B2</SelectItem>
                            <SelectItem value="C1" data-testid="option-level-c1">C1</SelectItem>
                            <SelectItem value="C2" data-testid="option-level-c2">C2</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pageCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-page-count">{t('admin:bookEcommerce.pageCount')}</FormLabel>
                        <FormControl>
                          <Input 
                            value={field.value || ""}
                            type="number"
                            data-testid="input-page-count"
                            placeholder="300"
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="publicationYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-publication-year">{t('admin:bookEcommerce.publishedYear')}</FormLabel>
                        <FormControl>
                          <Input 
                            value={field.value || ""}
                            type="number"
                            data-testid="input-publication-year"
                            placeholder="2024"
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Hardcopy specific: Stock */}
                {bookType === 'hardcopy' && (
                  <FormField
                    control={form.control}
                    name="stockQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-stock">{t('admin:bookEcommerce.stock')}</FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            type="number"
                            data-testid="input-stock"
                            placeholder="100"
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="flex justify-end gap-2 pt-4">
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
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card data-testid="card-total-books">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin:bookEcommerce.totalBooks')}</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-books">{books.length || 0}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-total-sales">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin:bookEcommerce.totalSales')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-sales">0</div>
          </CardContent>
        </Card>

        <Card data-testid="card-in-stock">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin:bookEcommerce.inStock')}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-in-stock">0</div>
          </CardContent>
        </Card>

        <Card data-testid="card-avg-rating">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin:bookEcommerce.avgRating')}</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-rating">0.0</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="catalog" className="space-y-4">
        <TabsList data-testid="tabs-navigation">
          <TabsTrigger value="catalog" data-testid="tab-catalog">
            <BookOpen className="mr-2 h-4 w-4" />
            {t('admin:bookEcommerce.catalog')}
          </TabsTrigger>
          <TabsTrigger value="orders" data-testid="tab-orders">
            <ShoppingCart className="mr-2 h-4 w-4" />
            {t('admin:bookEcommerce.orders')}
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            <TrendingUp className="mr-2 h-4 w-4" />
            {t('admin:bookEcommerce.analytics')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-4">
          <Card data-testid="card-catalog">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('admin:bookEcommerce.catalog')}</CardTitle>
                  <CardDescription>{t('admin:bookEcommerce.description')}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t('admin:bookEcommerce.searchPlaceholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      data-testid="input-search"
                      className="pl-8 w-[300px]"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8" data-testid="text-loading">{t('common:loading')}</div>
              ) : books.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground" data-testid="text-no-books">
                  {t('admin:bookEcommerce.noOrdersPlaceholder')}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {books.map((book) => (
                    <Card key={book.id} data-testid={`card-book-${book.id}`}>
                      <CardHeader>
                        <CardTitle className="line-clamp-1" data-testid={`text-book-title-${book.id}`}>{book.title}</CardTitle>
                        <CardDescription data-testid={`text-book-author-${book.id}`}>{book.author}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" data-testid={`badge-book-type-${book.id}`}>
                            {book.bookType === 'pdf' ? t('admin:bookEcommerce.pdfBook') : t('admin:bookEcommerce.hardcopyBook')}
                          </Badge>
                          <span className="font-semibold" data-testid={`text-book-price-${book.id}`}>
                            {book.price} {book.currency || 'IRR'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1" 
                            data-testid={`button-view-${book.id}`}
                            onClick={() => handleViewBook(book)}
                          >
                            <Eye className="mr-1 h-3 w-3" />
                            {t('common:view')}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1" 
                            data-testid={`button-edit-${book.id}`}
                            onClick={() => handleEditBook(book)}
                          >
                            <Edit className="mr-1 h-3 w-3" />
                            {t('common:edit')}
                          </Button>
                        </div>
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="w-full" 
                          data-testid={`button-purchase-${book.id}`}
                          onClick={() => handlePurchaseClick(book)}
                          disabled={purchaseBookMutation.isPending}
                        >
                          <ShoppingCart className="mr-1 h-3 w-3" />
                          Purchase ({book.price} {book.currency || 'IRR'})
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card data-testid="card-orders">
            <CardHeader>
              <CardTitle>{t('admin:bookEcommerce.recentOrders')}</CardTitle>
              <CardDescription>{t('admin:bookEcommerce.ordersDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="text-center py-8">{t('common:loading')}</div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground" data-testid="text-no-orders">
                  {t('admin:bookEcommerce.noOrdersPlaceholder')}
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order: any) => (
                    <Card key={order.id} data-testid={`card-order-${order.id}`}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base">Order #{order.id}</CardTitle>
                            <CardDescription>User ID: {order.userId}</CardDescription>
                          </div>
                          <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                            {order.paymentStatus}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Amount</p>
                            <p className="font-medium">{order.totalAmount} {order.currency}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Status</p>
                            <p className="font-medium">{order.orderStatus}</p>
                          </div>
                        </div>
                        
                        {order.downloadLimit !== undefined ? (
                          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                            <p className="text-sm font-medium mb-1">PDF Downloads</p>
                            <p className="text-sm text-muted-foreground">
                              {order.downloadCount || 0} / {order.downloadLimit} downloads used
                            </p>
                            {order.lastDownloadAt && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Last: {new Date(order.lastDownloadAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                        ) : order.shippingStatus !== undefined || order.trackingNumber ? (
                          <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                            <p className="text-sm font-medium mb-1">Hardcopy Shipping</p>
                            <p className="text-sm text-muted-foreground">
                              Status: {order.shippingStatus || 'Pending'}
                            </p>
                            {order.trackingNumber && (
                              <p className="text-sm text-muted-foreground">
                                Tracking: {order.trackingNumber}
                              </p>
                            )}
                            {order.deliveredAt && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Delivered: {new Date(order.deliveredAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card data-testid="card-analytics">
            <CardHeader>
              <CardTitle>{t('admin:bookEcommerce.salesAnalytics')}</CardTitle>
              <CardDescription>{t('admin:bookEcommerce.analyticsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground" data-testid="text-no-analytics">
                {t('admin:bookEcommerce.analyticsPlaceholder')}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Book Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-view-book">
          <DialogHeader>
            <DialogTitle data-testid="text-view-title">{selectedBook?.title}</DialogTitle>
            <DialogDescription data-testid="text-view-author">{selectedBook?.author}</DialogDescription>
          </DialogHeader>
          {selectedBook && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ISBN</p>
                  <p data-testid="text-view-isbn">{selectedBook.isbn || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Price</p>
                  <p data-testid="text-view-price">{selectedBook.price} {selectedBook.currency || 'IRR'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <p data-testid="text-view-type">{selectedBook.bookType || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Language</p>
                  <p data-testid="text-view-language">{selectedBook.language || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Level</p>
                  <p data-testid="text-view-level">{selectedBook.level || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Book Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-edit-book">
          <DialogHeader>
            <DialogTitle data-testid="text-edit-title">Edit Book</DialogTitle>
            <DialogDescription data-testid="text-edit-description">
              Update book details
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-edit-title">{t('admin:bookEcommerce.bookTitle')}</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="author"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-edit-author">{t('admin:bookEcommerce.author')}</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-author" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-edit-price">{t('admin:bookEcommerce.price')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" data-testid="input-edit-price" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                  data-testid="button-edit-cancel"
                >
                  {t('common:cancel')}
                </Button>
                <Button type="submit" disabled={updateBookMutation.isPending} data-testid="button-edit-save">
                  {updateBookMutation.isPending ? t('common:saving') : t('common:save')}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={shippingDialogOpen} onOpenChange={setShippingDialogOpen}>
        <DialogContent data-testid="dialog-shipping-address">
          <DialogHeader>
            <DialogTitle>Enter Shipping Address</DialogTitle>
            <DialogDescription>
              Please provide your shipping address for the hardcopy book delivery
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="shipping-address">Shipping Address</Label>
              <textarea
                id="shipping-address"
                className="w-full min-h-[100px] p-2 border rounded-md"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Enter your complete shipping address..."
                data-testid="textarea-shipping-address"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShippingDialogOpen(false)}
                data-testid="button-shipping-cancel"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmPurchase}
                disabled={!shippingAddress || purchaseBookMutation.isPending}
                data-testid="button-shipping-confirm"
              >
                {purchaseBookMutation.isPending ? 'Processing...' : 'Confirm Purchase'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminBookEcommerce;
