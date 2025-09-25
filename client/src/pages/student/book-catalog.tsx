import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from 'react-i18next';
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpen,
  Search,
  Filter,
  ShoppingCart,
  Plus,
  Minus,
  Star,
  Eye,
  Download,
  Heart,
  Users,
  Calendar,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Book } from '@shared/schema';

interface BookFilters {
  search?: string;
  category?: string;
  is_free?: boolean;
  limit?: number;
  offset?: number;
}

interface BookWithCartInfo extends Book {
  isInCart?: boolean;
  cartQuantity?: number;
}

export default function StudentBookCatalog() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation(['student', 'common']);
  const isRTL = i18n.language === 'fa' || i18n.language === 'ar';
  const { toast } = useToast();

  const [filters, setFilters] = useState<BookFilters>({
    limit: 12,
    offset: 0
  });

  const [selectedBook, setSelectedBook] = useState<BookWithCartInfo | null>(null);

  // Fetch books with filters
  const { data: booksResponse, isLoading, error } = useQuery<{success: boolean; data: Book[]}>({
    queryKey: ['/api/books', filters],
    enabled: !!user
  });

  // Fetch cart to check which books are already in cart
  const { data: cartResponse } = useQuery<{success: boolean; data: any}>({
    queryKey: ['/api/cart'],
    enabled: !!user
  });

  const books = booksResponse?.data || [];
  const cart = cartResponse?.data;

  // Enhance books with cart information
  const booksWithCartInfo: BookWithCartInfo[] = books.map(book => {
    const cartItem = cart?.items?.find((item: any) => item.book_id === book.id);
    return {
      ...book,
      isInCart: !!cartItem,
      cartQuantity: cartItem?.quantity || 0
    };
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async ({ bookId, quantity = 1 }: { bookId: number; quantity?: number }) => {
      return apiRequest('/api/cart/items', {
        method: 'POST',
        body: JSON.stringify({ book_id: bookId, quantity })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/books'] });
      toast({
        title: t('student:catalog.addedToCart'),
        description: t('student:catalog.itemAddedToCart'),
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: t('common:error'),
        description: error.message || t('student:catalog.addToCartError'),
        variant: "destructive"
      });
    }
  });

  // Remove from cart mutation
  const removeFromCartMutation = useMutation({
    mutationFn: async (bookId: number) => {
      const cartItem = cart?.items?.find((item: any) => item.book_id === bookId);
      if (cartItem) {
        return apiRequest(`/api/cart/items/${cartItem.id}`, {
          method: 'DELETE'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/books'] });
      toast({
        title: t('student:catalog.removedFromCart'),
        description: t('student:catalog.itemRemovedFromCart'),
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: t('common:error'),
        description: error.message || t('student:catalog.removeFromCartError'),
        variant: "destructive"
      });
    }
  });

  // Filter handlers
  const handleFilterChange = (key: keyof BookFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, offset: 0 }));
  };

  const clearFilters = () => {
    setFilters({ limit: 12, offset: 0 });
  };

  // Helper functions
  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const getBookCategories = () => {
    const categories = Array.from(new Set(books.map(book => book.category).filter(Boolean)));
    return categories;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto p-6">
          <div className="text-center py-12" data-testid="catalog-loading">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-600" />
            <p className="text-gray-600 dark:text-gray-400">{t('student:catalog.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto p-6">
          <div className="text-center py-12" data-testid="catalog-error">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {t('student:catalog.errorTitle')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('student:catalog.errorMessage')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 ${isRTL ? 'rtl' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/student/dashboard">
                <Button variant="ghost" size="sm" data-testid="button-back-to-dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('student:catalog.backToDashboard')}
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="page-title-catalog">
                    {t('student:catalog.title')}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('student:catalog.subtitle', { count: books.length })}
                  </p>
                </div>
              </div>
            </div>
            <Link href="/student/cart">
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700" data-testid="button-view-cart">
                <ShoppingCart className="w-4 h-4 mr-2" />
                {t('student:catalog.viewCart')}
                {cart?.total_items > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {cart.total_items}
                  </Badge>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Filters */}
        <Card className="shadow-lg border-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" data-testid="filters-title">
              <Filter className="w-5 h-5 text-indigo-600" />
              {t('student:catalog.filters')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">{t('student:catalog.search')}</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder={t('student:catalog.searchPlaceholder')}
                    value={filters.search || ''}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="category">{t('student:catalog.category')}</Label>
                <Select value={filters.category || 'all'} onValueChange={(value) => handleFilterChange('category', value === 'all' ? undefined : value)}>
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder={t('student:catalog.allCategories')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('student:catalog.allCategories')}</SelectItem>
                    {getBookCategories().map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="price">{t('student:catalog.price')}</Label>
                <Select value={filters.is_free === undefined ? 'all' : filters.is_free ? 'free' : 'paid'} onValueChange={(value) => handleFilterChange('is_free', value === 'all' ? undefined : value === 'free')}>
                  <SelectTrigger data-testid="select-price">
                    <SelectValue placeholder={t('student:catalog.allPrices')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('student:catalog.allPrices')}</SelectItem>
                    <SelectItem value="free">{t('student:catalog.freeOnly')}</SelectItem>
                    <SelectItem value="paid">{t('student:catalog.paidOnly')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full" data-testid="button-clear-filters">
                  {t('student:catalog.clearFilters')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Books Grid */}
        {booksWithCartInfo.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
            data-testid="catalog-empty"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-full flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              {t('student:catalog.emptyTitle')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {t('student:catalog.emptyMessage')}
            </p>
            <Button onClick={clearFilters} data-testid="button-clear-all-filters">
              {t('student:catalog.clearAllFilters')}
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {booksWithCartInfo.map((book, index) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                data-testid={`book-card-${book.id}`}
              >
                <Card className="shadow-lg border-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
                  <CardContent className="p-6">
                    {/* Book Cover */}
                    <div className="relative mb-4">
                      <div className="aspect-[3/4] bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-lg flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-300">
                        {book.cover_image ? (
                          <img 
                            src={book.cover_image} 
                            alt={book.title}
                            className="w-full h-full object-cover rounded-lg"
                            data-testid={`book-cover-${book.id}`}
                          />
                        ) : (
                          <BookOpen className="w-16 h-16 text-indigo-600 dark:text-indigo-400" />
                        )}
                      </div>
                      {book.isInCart && (
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Book Info */}
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" data-testid={`book-title-${book.id}`}>
                          {book.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1" data-testid={`book-author-${book.id}`}>
                          {t('student:catalog.byAuthor', {author: book.author})}
                        </p>
                      </div>

                      {/* Book Metadata */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {book.category}
                        </Badge>
                        {book.publication_year && (
                          <Badge variant="outline" className="text-xs">
                            {book.publication_year}
                          </Badge>
                        )}
                        {book.stock_quantity > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {t('student:catalog.inStock')}
                          </Badge>
                        )}
                      </div>

                      {/* Price */}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400" data-testid={`book-price-${book.id}`}>
                            {formatPrice(book.price as number)}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                            USD
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">4.5</span>
                        </div>
                      </div>

                      {book.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {book.description}
                        </p>
                      )}

                      {/* Action Buttons */}
                      <div className="space-y-2 pt-2">
                        {book.isInCart ? (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeFromCartMutation.mutate(book.id)}
                              disabled={removeFromCartMutation.isPending}
                              className="flex-1"
                              data-testid={`button-remove-from-cart-${book.id}`}
                            >
                              <Minus className="w-4 h-4 mr-2" />
                              {t('student:catalog.removeFromCart')}
                            </Button>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300" data-testid={`cart-quantity-${book.id}`}>
                              {book.cartQuantity}
                            </span>
                          </div>
                        ) : (
                          <Button
                            onClick={() => addToCartMutation.mutate({ bookId: book.id })}
                            disabled={addToCartMutation.isPending || book.stock_quantity === 0}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                            data-testid={`button-add-to-cart-${book.id}`}
                          >
                            {addToCartMutation.isPending ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Plus className="w-4 h-4 mr-2" />
                            )}
                            {book.stock_quantity === 0 ? t('student:catalog.outOfStock') : t('student:catalog.addToCart')}
                          </Button>
                        )}

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedBook(book)}
                            className="flex-1"
                            data-testid={`button-view-details-${book.id}`}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            {t('student:catalog.viewDetails')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            data-testid={`button-preview-${book.id}`}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            data-testid={`button-wishlist-${book.id}`}
                          >
                            <Heart className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Book Details Modal would go here */}
        {/* Implementation omitted for brevity - would show detailed book information */}
      </div>
    </div>
  );
}