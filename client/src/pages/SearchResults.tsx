import { useState, useEffect, useMemo } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
// Removed Helmet import - not available
import { UniversalSearchBar } from '@/components/search/UniversalSearchBar';
import { SearchResults as SearchResultsComponent } from '@/components/search/SearchResults';
import { SearchFilters } from '@/components/search/SearchFilters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { 
  Search,
  Filter,
  TrendingUp,
  Clock,
  X,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SearchFilters as SearchFiltersType } from '@shared/schema';

// Helper function to parse URL search params into filters
function parseSearchParams(searchParams: URLSearchParams): {
  query: string;
  filters: SearchFiltersType;
} {
  const query = searchParams.get('q') || '';
  
  const filters: SearchFiltersType = {};
  
  // Parse array parameters
  const categories = searchParams.get('categories');
  if (categories) filters.categories = categories.split(',');
  
  const languages = searchParams.get('languages');
  if (languages) filters.languages = languages.split(',');
  
  const levels = searchParams.get('levels');
  if (levels) filters.levels = levels.split(',');
  
  const contentTypes = searchParams.get('contentTypes');
  if (contentTypes) filters.contentTypes = contentTypes.split(',');
  
  const instructors = searchParams.get('instructors');
  if (instructors) filters.instructors = instructors.split(',');
  
  const ratings = searchParams.get('ratings');
  if (ratings) filters.ratings = ratings.split(',').map(Number).filter(n => !isNaN(n));
  
  // Parse price range
  const priceMin = searchParams.get('priceMin');
  const priceMax = searchParams.get('priceMax');
  if (priceMin || priceMax) {
    filters.priceRange = {
      min: priceMin ? Number(priceMin) : 0,
      max: priceMax ? Number(priceMax) : Number.MAX_SAFE_INTEGER
    };
  }
  
  // Parse date range
  const dateStart = searchParams.get('dateStart');
  const dateEnd = searchParams.get('dateEnd');
  if (dateStart || dateEnd) {
    filters.dateRange = {
      start: dateStart || '1900-01-01',
      end: dateEnd || new Date().toISOString().split('T')[0]
    };
  }
  
  return { query, filters };
}

// Helper function to convert filters back to URL params
function filtersToURLParams(query: string, filters: SearchFiltersType): string {
  const params = new URLSearchParams({ q: query });
  
  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value) && value.length > 0) {
      params.set(key, value.join(','));
    } else if (typeof value === 'object' && value !== null) {
      Object.entries(value).forEach(([subKey, subValue]) => {
        params.set(`${key}${subKey.charAt(0).toUpperCase() + subKey.slice(1)}`, String(subValue));
      });
    } else if (value !== undefined) {
      params.set(key, String(value));
    }
  });
  
  return params.toString();
}

export default function SearchResultsPage() {
  const { t, i18n } = useTranslation();
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  
  // Parse current search state from URL
  const { query: currentQuery, filters: currentFilters } = useMemo(() => {
    return parseSearchParams(searchParams);
  }, [searchParams]);
  
  const isRTL = i18n.language === 'fa' || i18n.language === 'ar';

  // Get search facets for filters
  const { data: facetsData } = useQuery({
    queryKey: ['/api/search/facets', currentQuery],
    enabled: !!currentQuery,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get trending searches for empty state
  const { data: trendingData } = useQuery({
    queryKey: ['/api/search/trending'],
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Handle search from search bar
  const handleSearch = (newQuery: string, newFilters: SearchFiltersType = {}) => {
    const params = filtersToURLParams(newQuery, newFilters);
    setLocation(`/search?${params}`);
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters: SearchFiltersType) => {
    const params = filtersToURLParams(currentQuery, newFilters);
    setLocation(`/search?${params}`);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setLocation(`/search?q=${encodeURIComponent(currentQuery)}`);
  };

  // Get active filter count
  const activeFilterCount = Object.values(currentFilters).filter(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
    return value !== undefined;
  }).length;

  const pageTitle = currentQuery 
    ? t('search.resultsPageTitle', { query: currentQuery })
    : t('search.searchPage');

  return (
    <>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 space-y-6">
          {/* Search Header */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Search className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">{t('search.universalSearch')}</h1>
              </div>
              {currentQuery && (
                <Badge variant="outline" className="text-sm">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI-Enhanced
                </Badge>
              )}
            </div>

            {/* Enhanced Search Bar */}
            <UniversalSearchBar
              placeholder={t('search.placeholder')}
              showFilters={true}
              variant="expanded"
              className="max-w-none"
              data-testid="search-page-search-bar"
            />
          </div>

          {!currentQuery ? (
            /* Empty State - No Search Query */
            <div className="space-y-8">
              {/* Trending Searches */}
              {trendingData?.trending && trendingData.trending.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <h2 className="text-lg font-semibold">{t('search.trendingSearches')}</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {trendingData.trending.slice(0, 10).map((trend, index) => (
                        <Badge 
                          key={index}
                          variant="secondary" 
                          className="cursor-pointer hover:bg-secondary/80 transition-colors"
                          onClick={() => handleSearch(trend.query)}
                          data-testid={`trending-search-${index}`}
                        >
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {trend.query}
                          {trend.volume && (
                            <span className="ml-2 text-xs opacity-75">
                              {trend.volume}
                            </span>
                          )}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Search Tips */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4">{t('search.searchTips')}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div className="space-y-2">
                      <p className="font-medium text-foreground">{t('search.searchTipsTitle1')}</p>
                      <p>{t('search.searchTipsDesc1')}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="font-medium text-foreground">{t('search.searchTipsTitle2')}</p>
                      <p>{t('search.searchTipsDesc2')}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="font-medium text-foreground">{t('search.searchTipsTitle3')}</p>
                      <p>{t('search.searchTipsDesc3')}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="font-medium text-foreground">{t('search.searchTipsTitle4')}</p>
                      <p>{t('search.searchTipsDesc4')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Search Results Layout */
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Desktop Filters Sidebar */}
              <div className="hidden lg:block">
                <div className="sticky top-6">
                  <SearchFilters
                    filters={currentFilters}
                    facets={facetsData?.facets}
                    onFiltersChange={handleFiltersChange}
                    data-testid="desktop-search-filters"
                  />
                </div>
              </div>

              {/* Main Results Area */}
              <div className="lg:col-span-3 space-y-4">
                {/* Mobile Filters Button & Active Filters */}
                <div className="flex items-center justify-between lg:hidden">
                  <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="relative" data-testid="mobile-filters-button">
                        <Filter className="h-4 w-4 mr-2" />
                        {t('search.filters')}
                        {activeFilterCount > 0 && (
                          <Badge variant="secondary" className="ml-2 h-5 px-1 text-xs">
                            {activeFilterCount}
                          </Badge>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side={isRTL ? "right" : "left"} className="w-80 overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle>{t('search.filters')}</SheetTitle>
                        <SheetDescription>
                          {t('search.filtersDescription')}
                        </SheetDescription>
                      </SheetHeader>
                      <div className="mt-6">
                        <SearchFilters
                          filters={currentFilters}
                          facets={facetsData?.facets}
                          onFiltersChange={(newFilters) => {
                            handleFiltersChange(newFilters);
                            setMobileFiltersOpen(false);
                          }}
                          data-testid="mobile-search-filters"
                        />
                      </div>
                    </SheetContent>
                  </Sheet>

                  {activeFilterCount > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearAllFilters}
                      className="text-muted-foreground hover:text-foreground"
                      data-testid="mobile-clear-filters"
                    >
                      <X className="h-4 w-4 mr-1" />
                      {t('search.clearAll')}
                    </Button>
                  )}
                </div>

                {/* Active Filters Display */}
                {activeFilterCount > 0 && (
                  <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">{t('search.activeFilters')}:</span>
                    
                    {/* Content Types */}
                    {currentFilters.contentTypes?.map((type) => (
                      <Badge key={type} variant="secondary" className="text-xs">
                        {type}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                          onClick={() => {
                            const newTypes = currentFilters.contentTypes?.filter(t => t !== type) || [];
                            handleFiltersChange({
                              ...currentFilters,
                              contentTypes: newTypes.length > 0 ? newTypes : undefined
                            });
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}

                    {/* Languages */}
                    {currentFilters.languages?.map((lang) => (
                      <Badge key={lang} variant="secondary" className="text-xs">
                        {lang}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                          onClick={() => {
                            const newLangs = currentFilters.languages?.filter(l => l !== lang) || [];
                            handleFiltersChange({
                              ...currentFilters,
                              languages: newLangs.length > 0 ? newLangs : undefined
                            });
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}

                    {/* Clear All Button */}
                    <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-xs">
                      {t('search.clearAll')}
                    </Button>
                  </div>
                )}

                {/* Search Results Component */}
                <SearchResultsComponent
                  query={currentQuery}
                  filters={currentFilters}
                  onFiltersChange={handleFiltersChange}
                  data-testid="search-results-list"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}