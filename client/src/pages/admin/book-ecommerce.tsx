import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from 'react-i18next';
import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/services/endpoints";
import { 
  BookOpen, 
  Search, 
  Plus, 
  Eye, 
  Edit,
  ShoppingCart,
  DollarSign,
  Package,
  Users,
  Star,
  TrendingUp,
  Download,
  Upload,
  Settings
} from "lucide-react";

export function AdminBookEcommerce() {
  const { t } = useTranslation(['admin', 'common']);
  const { isRTL } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  // Fetch books data
  const { data: books = [], isLoading } = useQuery({
    queryKey: [API_ENDPOINTS.admin.bookCatalog, { search: searchTerm, category: filterCategory }],
  });

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
      stock: 32,
      sold: 89,
      rating: 4.6,
      status: "published",
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
          <Button variant="outline" data-testid="button-upload-book">
            <Upload className="h-4 w-4 mr-2" />
            {t('admin:bookEcommerce.uploadBook')}
          </Button>
          <Button data-testid="button-add-book">
            <Plus className="h-4 w-4 mr-2" />
            {t('admin:bookEcommerce.addBook')}
          </Button>
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
                      <Badge variant="secondary" className="mt-1">
                        {book.category}
                      </Badge>
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
                    <div className="flex justify-between">
                      <span>{t('admin:bookEcommerce.stock')}</span>
                      <span data-testid={`text-stock-${book.id}`}>{book.stock}</span>
                    </div>
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