import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Book,
  GraduationCap,
  Users,
  FileText,
  MessageSquare,
  Calendar,
  BookOpen,
  Star,
  Clock,
  DollarSign,
  User,
  ChevronDown,
  Filter,
  Grid3X3,
  List,
  Search,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import type { SearchResultItem, SearchResponse, SearchFilters } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface SearchResultsProps {
  query: string;
  filters: SearchFilters;
  onFiltersChange?: (filters: SearchFilters) => void;
  className?: string;
}

const CONTENT_TYPE_ICONS = {
  book: Book,
  course: GraduationCap,
  user: Users,
  test: FileText,
  homework: FileText,
  session: MessageSquare,
  roadmap: Calendar,
  dictionary: BookOpen
};

const CONTENT_TYPE_LABELS = {
  book: 'Books',
  course: 'Courses',
  user: 'People',
  test: 'Tests',
  homework: 'Homework',
  session: 'Sessions',
  roadmap: 'Roadmaps',
  dictionary: 'Dictionary'
};

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'date', label: 'Most Recent' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'alphabetical', label: 'A-Z' }
];

export function SearchResults({ 
  query, 
  filters, 
  onFiltersChange,
  className 
}: SearchResultsProps) {
  const { t, i18n } = useTranslation(['common', 'courses']);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'rating' | 'alphabetical'>('relevance');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const isRTL = i18n.language === 'fa' || i18n.language === 'ar';

  // Search query with infinite loading
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
    isError
  } = useInfiniteQuery<SearchResponse>({
    queryKey: ['/api/search', query, filters, sortBy],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        q: query,
        page: pageParam.toString(),
        limit: '20',
        sortBy,
        ...Object.entries(filters).reduce((acc, [key, value]) => {
          if (Array.isArray(value)) {
            acc[key] = value.join(',');
          } else if (typeof value === 'object' && value !== null) {
            Object.entries(value).forEach(([subKey, subValue]) => {
              acc[`${key}${subKey.charAt(0).toUpperCase() + subKey.slice(1)}`] = String(subValue);
            });
          } else {
            acc[key] = String(value);
          }
          return acc;
        }, {} as Record<string, string>)
      });

      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Search failed');
      }
      return response.json() as Promise<SearchResponse>;
    },
    getNextPageParam: (lastPage: SearchResponse) => {
      return lastPage.hasMore ? lastPage.page + 1 : undefined;
    },
    enabled: !!query,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Log search analytics
  const logSearchMutation = useMutation({
    mutationFn: async (data: { query: string; resultId?: string; resultType?: string; action?: string }) => {
      return apiRequest('/api/search/log', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }
  });

  // Flatten results from all pages
  const allResults = useMemo(() => {
    return data?.pages.flatMap(page => page.results) || [];
  }, [data]);

  // Group results by type
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResultItem[]> = {};
    allResults.forEach(result => {
      if (!groups[result.type]) {
        groups[result.type] = [];
      }
      groups[result.type].push(result);
    });
    return groups;
  }, [allResults]);

  // Handle result click
  const handleResultClick = (result: SearchResultItem) => {
    logSearchMutation.mutate({
      query,
      resultId: result.id,
      resultType: result.type,
      action: 'click'
    });
  };

  // Load more results
  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Search className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Search Error</h3>
        <p className="text-muted-foreground mb-4">
          There was an error performing your search. Please try again.
        </p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <SearchResultsSkeleton />
      </div>
    );
  }

  const totalResults = data?.pages[0]?.totalResults || 0;
  const responseTime = data?.pages[0]?.responseTime || 0;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col space-y-1">
          <div className="text-sm text-muted-foreground">
            {totalResults > 0 ? (
              <>
                About {totalResults.toLocaleString()} results for 
                <span className="font-medium text-foreground"> "{query}"</span>
                <span className="ml-2">({responseTime}ms)</span>
              </>
            ) : (
              <>No results found for <span className="font-medium text-foreground">"{query}"</span></>
            )}
          </div>
        </div>

        {totalResults > 0 && (
          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-1 border rounded-lg p-1">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                data-testid="view-mode-list"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                data-testid="view-mode-grid"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>

            {/* Sort Options */}
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
              <SelectTrigger className="w-48" data-testid="sort-select">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(`search.sort.${option.value}`) || option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* No Results */}
      {totalResults === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">{t('search.noResults')}</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            {t('search.noResultsDescription')}
          </p>
          
          {/* Search Suggestions */}
          {data?.pages[0]?.suggestions && data.pages[0].suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{t('search.tryThese')}:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {data.pages[0].suggestions.map((suggestion, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-secondary/80"
                    onClick={() => window.location.href = `/search?q=${encodeURIComponent(suggestion)}`}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {totalResults > 0 && (
        <div className="space-y-8">
          {Object.entries(groupedResults).map(([type, results]) => (
            <div key={type}>
              <div className="flex items-center space-x-2 mb-4">
                {React.createElement(CONTENT_TYPE_ICONS[type as keyof typeof CONTENT_TYPE_ICONS], {
                  className: "h-5 w-5"
                })}
                <h2 className="text-lg font-semibold">
                  {CONTENT_TYPE_LABELS[type as keyof typeof CONTENT_TYPE_LABELS]} ({results.length})
                </h2>
              </div>

              <div className={cn(
                "grid gap-4",
                viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
              )}>
                {results.map((result, index) => (
                  <SearchResultCard
                    key={`${result.type}-${result.id}`}
                    result={result}
                    query={query}
                    onClick={() => handleResultClick(result)}
                    viewMode={viewMode}
                    data-testid={`search-result-${result.type}-${index}`}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Load More Button */}
          {hasNextPage && (
            <div className="flex justify-center pt-8">
              <Button
                onClick={handleLoadMore}
                disabled={isFetchingNextPage}
                variant="outline"
                data-testid="load-more-results"
              >
                {isFetchingNextPage ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Load More Results
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Loading More Indicator */}
          {isFetching && !isLoading && (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Individual Search Result Card Component
interface SearchResultCardProps {
  result: SearchResultItem;
  query: string;
  onClick?: () => void;
  viewMode?: 'grid' | 'list';
  'data-testid'?: string;
}

function SearchResultCard({ result, query, onClick, viewMode = 'list', 'data-testid': testId }: SearchResultCardProps) {
  const { t } = useTranslation(['common', 'courses']);
  const Icon = CONTENT_TYPE_ICONS[result.type];

  const handleClick = () => {
    onClick?.();
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer hover:bg-muted/50 transition-colors",
        viewMode === 'grid' && "h-full"
      )}
      data-testid={testId}
    >
      <Link href={result.url} onClick={handleClick}>
        <CardHeader className={cn("space-y-2", viewMode === 'grid' && "pb-3")}>
          <div className="flex items-start space-x-3">
            {result.imageUrl ? (
              <img 
                src={result.imageUrl} 
                alt={result.title}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Icon className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base leading-tight">
                {result.highlights?.title ? (
                  <span dangerouslySetInnerHTML={{ __html: result.highlights.title }} />
                ) : (
                  result.title
                )}
              </CardTitle>
              
              {result.description && (
                <CardDescription className="mt-1 line-clamp-2">
                  {result.highlights?.description ? (
                    <span dangerouslySetInnerHTML={{ __html: result.highlights.description }} />
                  ) : (
                    result.description
                  )}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              {/* Content Type Badge */}
              <Badge variant="outline" className="text-xs">
                <Icon className="h-3 w-3 mr-1" />
                {CONTENT_TYPE_LABELS[result.type]}
              </Badge>

              {/* Rating */}
              {result.metadata.rating && (
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{result.metadata.rating.toFixed(1)}</span>
                </div>
              )}

              {/* Price */}
              {result.metadata.price !== undefined && (
                <div className="flex items-center space-x-1">
                  <DollarSign className="h-4 w-4" />
                  <span>{result.metadata.price.toLocaleString()} IRR</span>
                </div>
              )}

              {/* Author/Instructor */}
              {(result.metadata.author || result.metadata.instructor) && (
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>{result.metadata.author || result.metadata.instructor}</span>
                </div>
              )}

              {/* Language */}
              {result.metadata.language && (
                <Badge variant="secondary" className="text-xs">
                  {result.metadata.language.toUpperCase()}
                </Badge>
              )}

              {/* Level */}
              {result.metadata.level && (
                <Badge variant="outline" className="text-xs">
                  {result.metadata.level}
                </Badge>
              )}
            </div>

            {/* Relevance Score */}
            {result.relevanceScore && result.relevanceScore > 0 && (
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>{Math.round(result.relevanceScore)}%</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {result.metadata.tags && result.metadata.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {result.metadata.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {result.metadata.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{result.metadata.tags.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}

// Search Results Skeleton Loader
function SearchResultsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-8 w-32" />
      </div>

      {/* Results Skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-start space-x-3">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-12" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}