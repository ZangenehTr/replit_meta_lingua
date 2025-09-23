import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { debounce } from '@/lib/debounce';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  X, 
  TrendingUp, 
  Clock, 
  Filter,
  Book,
  GraduationCap,
  Users,
  FileText,
  MessageSquare,
  Calendar,
  Languages,
  BookOpen,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

interface SearchSuggestion {
  query: string;
  type?: 'recent' | 'trending' | 'suggestion';
}

interface TrendingItem {
  query: string;
  volume?: number;
}

interface TrendingData {
  trending: TrendingItem[];
}

interface RecentSearchItem {
  query: string;
  resultsCount: number;
}

interface RecentSearchData {
  history: RecentSearchItem[];
}

interface SuggestionItem {
  suggestion: string;
}

type SuggestionResponse = (string | SuggestionItem)[];

interface SearchFilters {
  categories?: string[];
  languages?: string[];
  levels?: string[];
  contentTypes?: string[];
  priceRange?: { min: number; max: number };
  dateRange?: { start: string; end: string };
}

interface UniversalSearchBarProps {
  placeholder?: string;
  showFilters?: boolean;
  autoFocus?: boolean;
  onSearch?: (query: string, filters?: SearchFilters) => void;
  className?: string;
  variant?: 'default' | 'compact' | 'expanded';
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

export function UniversalSearchBar({
  placeholder,
  showFilters = false,
  autoFocus = false,
  onSearch,
  className,
  variant = 'default'
}: UniversalSearchBarProps) {
  const { t, i18n } = useTranslation(['common', 'courses']);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Get search suggestions
  const { data: suggestions = [] } = useQuery<SuggestionResponse>({
    queryKey: ['/api/search/suggestions', query],
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get recent searches for logged-in users
  const { data: recentSearches } = useQuery<RecentSearchData>({
    queryKey: ['/api/search/history'],
    enabled: !!user && query.length === 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Get trending searches
  const { data: trendingData } = useQuery<TrendingData>({
    queryKey: ['/api/search/trending'],
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  const trending: TrendingItem[] = trendingData?.trending || [];

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchQuery: string, searchFilters: SearchFilters) => {
      if (searchQuery.trim()) {
        if (onSearch) {
          onSearch(searchQuery, searchFilters);
        } else {
          // Navigate to search results page
          const params = new URLSearchParams({
            q: searchQuery,
            ...Object.entries(searchFilters).reduce((acc, [key, value]) => {
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
          setLocation(`/search?${params.toString()}`);
        }
      }
    }, 300),
    [onSearch, setLocation]
  );

  // Handle search execution
  const handleSearch = useCallback(() => {
    if (query.trim()) {
      setShowSuggestions(false);
      debouncedSearch(query.trim(), filters);
    }
  }, [query, filters, debouncedSearch]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    debouncedSearch(suggestion, filters);
  }, [filters, debouncedSearch]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    const suggestionsList = [
      ...trending.map(t => t.query),
      ...suggestions.map(s => typeof s === 'string' ? s : s.suggestion || ''),
      ...(recentSearches?.history || []).map(h => h.query)
    ];

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestion(prev => 
          prev < suggestionsList.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestion(prev => 
          prev > 0 ? prev - 1 : suggestionsList.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestion >= 0 && suggestionsList[selectedSuggestion]) {
          handleSuggestionSelect(suggestionsList[selectedSuggestion]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestion(-1);
        inputRef.current?.blur();
        break;
    }
  }, [showSuggestions, trending, suggestions, recentSearches, selectedSuggestion, handleSuggestionSelect, handleSearch]);

  // Auto focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle filter changes
  const handleFilterChange = useCallback((key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Get active filter count
  const activeFilterCount = Object.values(filters).filter(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
    return value !== undefined;
  }).length;

  const isRTL = i18n.language === 'fa' || i18n.language === 'ar';

  if (variant === 'compact') {
    return (
      <div className={cn("relative flex items-center space-x-2", isRTL && "space-x-reverse", className)}>
        <div className="relative flex-1">
          <Search className={cn("absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder || t('search.placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            className={cn("w-full", isRTL ? "pr-10" : "pl-10")}
            data-testid="search-input-compact"
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              className={cn("absolute top-1/2 transform -translate-y-1/2 h-6 w-6 p-0", isRTL ? "left-2" : "right-2")}
              onClick={() => setQuery('')}
              data-testid="search-clear-button"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Button onClick={handleSearch} size="sm" data-testid="search-submit-button">
          <Search className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)} ref={suggestionsRef}>
      {/* Main Search Input */}
      <div className="relative">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className={cn("absolute top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground", isRTL ? "right-4" : "left-4")} />
            <Input
              ref={inputRef}
              type="text"
              placeholder={placeholder || t('search.placeholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              className={cn("w-full text-base h-12", isRTL ? "pr-12 pl-4" : "pl-12 pr-4", variant === 'expanded' && "h-14 text-lg")}
              data-testid="search-input"
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                className={cn("absolute top-1/2 transform -translate-y-1/2 h-8 w-8 p-0", isRTL ? "left-2" : "right-2")}
                onClick={() => setQuery('')}
                data-testid="search-clear-button"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {showFilters && (
            <Popover open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size={variant === 'expanded' ? 'lg' : 'default'}
                  className="relative"
                  data-testid="search-filters-button"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {t('search.filters')}
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 px-1 text-xs">
                      {activeFilterCount}
                    </Badge>
                  )}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-0" align={isRTL ? "end" : "start"}>
                <SearchFiltersPanel
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onClearFilters={clearFilters}
                />
              </PopoverContent>
            </Popover>
          )}
          
          <Button 
            onClick={handleSearch} 
            size={variant === 'expanded' ? 'lg' : 'default'}
            disabled={!query.trim()}
            data-testid="search-submit-button"
          >
            <Search className="h-4 w-4 mr-2" />
            {t('search.search')}
          </Button>
        </div>

        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <div className="flex items-center space-x-2 mt-2 flex-wrap gap-2">
            {filters.contentTypes?.map((type) => (
              <Badge key={type} variant="secondary" className="text-xs">
                {CONTENT_TYPE_LABELS[type as keyof typeof CONTENT_TYPE_LABELS] || type}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                  onClick={() => {
                    const newTypes = filters.contentTypes?.filter(t => t !== type) || [];
                    handleFilterChange('contentTypes', newTypes.length > 0 ? newTypes : undefined);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
            {filters.languages?.map((lang) => (
              <Badge key={lang} variant="secondary" className="text-xs">
                <Languages className="h-3 w-3 mr-1" />
                {lang}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                  onClick={() => {
                    const newLangs = filters.languages?.filter(l => l !== lang) || [];
                    handleFilterChange('languages', newLangs.length > 0 ? newLangs : undefined);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                {t('search.clearAllFilters')}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (query.length >= 2 || trending.length > 0 || recentSearches?.history?.length > 0) && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-background border border-border rounded-lg shadow-lg max-h-96 overflow-auto">
          <Command>
            <CommandList>
              {/* Trending Searches */}
              {query.length === 0 && trending.length > 0 && (
                <CommandGroup heading={
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    {t('search.trending')}
                  </div>
                }>
                  {trending.slice(0, 5).map((item, index) => (
                    <CommandItem
                      key={`trending-${index}`}
                      value={item.query}
                      onSelect={handleSuggestionSelect}
                      className={cn(selectedSuggestion === index && "bg-muted")}
                      data-testid={`trending-suggestion-${index}`}
                    >
                      <TrendingUp className="h-4 w-4 mr-2 text-muted-foreground" />
                      {item.query}
                      {item.volume && (
                        <Badge variant="outline" className="ml-auto text-xs">
                          {item.volume}
                        </Badge>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Recent Searches */}
              {query.length === 0 && recentSearches?.history?.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading={
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      {t('search.recent')}
                    </div>
                  }>
                    {recentSearches.history.slice(0, 5).map((item, index) => (
                      <CommandItem
                        key={`recent-${index}`}
                        value={item.query}
                        onSelect={handleSuggestionSelect}
                        className={cn(selectedSuggestion === (trending.length + index) && "bg-muted")}
                        data-testid={`recent-suggestion-${index}`}
                      >
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        {item.query}
                        <span className="ml-auto text-xs text-muted-foreground">
                          {item.resultsCount} {t('search.results')}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              {/* Search Suggestions */}
              {query.length >= 2 && suggestions.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading={t('search.suggestions')}>
                    {suggestions.slice(0, 8).map((suggestion, index) => {
                      const suggestionText = typeof suggestion === 'string' ? suggestion : suggestion.suggestion || '';
                      const adjustedIndex = trending.length + (recentSearches?.history?.length || 0) + index;
                      
                      return (
                        <CommandItem
                          key={`suggestion-${index}`}
                          value={suggestionText}
                          onSelect={handleSuggestionSelect}
                          className={cn(selectedSuggestion === adjustedIndex && "bg-muted")}
                          data-testid={`search-suggestion-${index}`}
                        >
                          <Search className="h-4 w-4 mr-2 text-muted-foreground" />
                          {suggestionText}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </>
              )}

              {/* No suggestions */}
              {query.length >= 2 && suggestions.length === 0 && (
                <CommandEmpty>{t('search.noSuggestions')}</CommandEmpty>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}

// Search Filters Panel Component
interface SearchFiltersPanelProps {
  filters: SearchFilters;
  onFilterChange: (key: keyof SearchFilters, value: any) => void;
  onClearFilters: () => void;
}

function SearchFiltersPanel({ filters, onFilterChange, onClearFilters }: SearchFiltersPanelProps) {
  const { t } = useTranslation(['common', 'courses']);

  const contentTypes = Object.keys(CONTENT_TYPE_LABELS) as (keyof typeof CONTENT_TYPE_LABELS)[];
  const languages = ['en', 'fa', 'ar', 'de', 'es', 'fr'];
  const levels = ['beginner', 'elementary', 'intermediate', 'upper_intermediate', 'advanced', 'proficient'];
  const categories = ['general', 'academic', 'business', 'test_prep', 'conversation'];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{t('search.filters')}</h3>
        <Button variant="ghost" size="sm" onClick={onClearFilters}>
          {t('search.clearAll')}
        </Button>
      </div>

      {/* Content Types */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('search.contentTypes')}</label>
        <div className="grid grid-cols-2 gap-2">
          {contentTypes.map((type) => {
            const Icon = CONTENT_TYPE_ICONS[type];
            const isSelected = filters.contentTypes?.includes(type);
            
            return (
              <Button
                key={type}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const current = filters.contentTypes || [];
                  const newTypes = isSelected 
                    ? current.filter(t => t !== type)
                    : [...current, type];
                  onFilterChange('contentTypes', newTypes.length > 0 ? newTypes : undefined);
                }}
                className="justify-start"
                data-testid={`filter-content-type-${type}`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {CONTENT_TYPE_LABELS[type]}
              </Button>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Languages */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('search.languages')}</label>
        <Select 
          value={filters.languages?.join(',') || ''} 
          onValueChange={(value) => onFilterChange('languages', value ? value.split(',') : undefined)}
        >
          <SelectTrigger data-testid="filter-languages">
            <SelectValue placeholder={t('search.selectLanguages')} />
          </SelectTrigger>
          <SelectContent>
            {languages.map((lang) => (
              <SelectItem key={lang} value={lang}>
                {t(`languages.${lang}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Levels */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('search.levels')}</label>
        <Select 
          value={filters.levels?.join(',') || ''} 
          onValueChange={(value) => onFilterChange('levels', value ? value.split(',') : undefined)}
        >
          <SelectTrigger data-testid="filter-levels">
            <SelectValue placeholder={t('search.selectLevels')} />
          </SelectTrigger>
          <SelectContent>
            {levels.map((level) => (
              <SelectItem key={level} value={level}>
                {t(`levels.${level}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}