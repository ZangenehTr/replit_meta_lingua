import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  Book,
  GraduationCap,
  Users,
  FileText,
  MessageSquare,
  Calendar,
  BookOpen,
  Languages,
  Star,
  DollarSign,
  Clock
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import type { SearchFilters } from '@shared/schema';

interface SearchFiltersProps {
  filters: SearchFilters;
  facets?: {
    categories: { name: string; count: number }[];
    languages: { name: string; count: number }[];
    levels: { name: string; count: number }[];
    contentTypes: { name: string; count: number }[];
  };
  onFiltersChange: (filters: SearchFilters) => void;
  className?: string;
  showClearAll?: boolean;
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

const LANGUAGE_LABELS = {
  en: 'English',
  fa: 'Persian (Farsi)',
  ar: 'Arabic',
  de: 'German',
  es: 'Spanish',
  fr: 'French',
  it: 'Italian',
  ru: 'Russian',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean'
};

const LEVEL_LABELS = {
  beginner: 'Beginner',
  elementary: 'Elementary',
  intermediate: 'Intermediate',
  upper_intermediate: 'Upper Intermediate',
  advanced: 'Advanced',
  proficient: 'Proficient'
};

const CATEGORY_LABELS = {
  general: 'General',
  academic: 'Academic',
  business: 'Business',
  test_prep: 'Test Preparation',
  conversation: 'Conversation',
  grammar: 'Grammar',
  vocabulary: 'Vocabulary',
  pronunciation: 'Pronunciation',
  writing: 'Writing',
  listening: 'Listening',
  speaking: 'Speaking',
  reading: 'Reading'
};

export function SearchFilters({
  filters,
  facets,
  onFiltersChange,
  className,
  showClearAll = true
}: SearchFiltersProps) {
  const { t, i18n } = useTranslation(['common', 'courses']);
  
  const [expandedSections, setExpandedSections] = useState({
    contentTypes: true,
    languages: false,
    categories: false,
    levels: false,
    price: false,
    rating: false
  });

  const isRTL = i18n.language === 'fa' || i18n.language === 'ar';

  // Handle filter changes
  const handleFilterChange = useCallback((key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  // Toggle array filter item
  const toggleArrayFilter = useCallback((key: keyof SearchFilters, item: string) => {
    const currentArray = (filters[key] as string[]) || [];
    const newArray = currentArray.includes(item)
      ? currentArray.filter(i => i !== item)
      : [...currentArray, item];
    
    handleFilterChange(key, newArray.length > 0 ? newArray : undefined);
  }, [filters, handleFilterChange]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    onFiltersChange({});
  }, [onFiltersChange]);

  // Get active filter count
  const activeFilterCount = Object.values(filters).filter(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
    return value !== undefined;
  }).length;

  // Toggle section expansion
  const toggleSection = useCallback((section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>{t('search.filters')}</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </CardTitle>
          {showClearAll && activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-muted-foreground hover:text-foreground"
              data-testid="clear-all-filters"
            >
              {t('search.clearAll')}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Content Types Filter */}
        <Collapsible 
          open={expandedSections.contentTypes}
          onOpenChange={() => toggleSection('contentTypes')}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-0">
            <div className="flex items-center space-x-2">
              <h4 className="font-medium">{t('search.contentTypes')}</h4>
              {filters.contentTypes && filters.contentTypes.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {filters.contentTypes.length}
                </Badge>
              )}
            </div>
            {expandedSections.contentTypes ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-2">
            {Object.entries(CONTENT_TYPE_LABELS).map(([key, label]) => {
              const Icon = CONTENT_TYPE_ICONS[key as keyof typeof CONTENT_TYPE_ICONS];
              const isSelected = filters.contentTypes?.includes(key) || false;
              const count = facets?.contentTypes.find(f => f.name === key)?.count || 0;
              
              return (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`content-type-${key}`}
                    checked={isSelected}
                    onCheckedChange={() => toggleArrayFilter('contentTypes', key)}
                    data-testid={`filter-content-type-${key}`}
                  />
                  <Label
                    htmlFor={`content-type-${key}`}
                    className="flex items-center space-x-2 cursor-pointer flex-1"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                    {count > 0 && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        ({count})
                      </span>
                    )}
                  </Label>
                </div>
              );
            })}
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Languages Filter */}
        <Collapsible 
          open={expandedSections.languages}
          onOpenChange={() => toggleSection('languages')}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-0">
            <div className="flex items-center space-x-2">
              <h4 className="font-medium">{t('search.languages')}</h4>
              {filters.languages && filters.languages.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {filters.languages.length}
                </Badge>
              )}
            </div>
            {expandedSections.languages ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-2">
            {Object.entries(LANGUAGE_LABELS).map(([key, label]) => {
              const isSelected = filters.languages?.includes(key) || false;
              const count = facets?.languages.find(f => f.name === key)?.count || 0;
              
              return (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`language-${key}`}
                    checked={isSelected}
                    onCheckedChange={() => toggleArrayFilter('languages', key)}
                    data-testid={`filter-language-${key}`}
                  />
                  <Label
                    htmlFor={`language-${key}`}
                    className="flex items-center justify-between cursor-pointer flex-1"
                  >
                    <span className="flex items-center space-x-2">
                      <Languages className="h-4 w-4" />
                      <span>{label}</span>
                    </span>
                    {count > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({count})
                      </span>
                    )}
                  </Label>
                </div>
              );
            })}
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Categories Filter */}
        <Collapsible 
          open={expandedSections.categories}
          onOpenChange={() => toggleSection('categories')}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-0">
            <div className="flex items-center space-x-2">
              <h4 className="font-medium">{t('search.categories')}</h4>
              {filters.categories && filters.categories.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {filters.categories.length}
                </Badge>
              )}
            </div>
            {expandedSections.categories ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-2">
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
              const isSelected = filters.categories?.includes(key) || false;
              const count = facets?.categories.find(f => f.name === key)?.count || 0;
              
              return (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${key}`}
                    checked={isSelected}
                    onCheckedChange={() => toggleArrayFilter('categories', key)}
                    data-testid={`filter-category-${key}`}
                  />
                  <Label
                    htmlFor={`category-${key}`}
                    className="flex items-center justify-between cursor-pointer flex-1"
                  >
                    <span>{label}</span>
                    {count > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({count})
                      </span>
                    )}
                  </Label>
                </div>
              );
            })}
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Levels Filter */}
        <Collapsible 
          open={expandedSections.levels}
          onOpenChange={() => toggleSection('levels')}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-0">
            <div className="flex items-center space-x-2">
              <h4 className="font-medium">{t('search.levels')}</h4>
              {filters.levels && filters.levels.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {filters.levels.length}
                </Badge>
              )}
            </div>
            {expandedSections.levels ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-2">
            {Object.entries(LEVEL_LABELS).map(([key, label]) => {
              const isSelected = filters.levels?.includes(key) || false;
              const count = facets?.levels.find(f => f.name === key)?.count || 0;
              
              return (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`level-${key}`}
                    checked={isSelected}
                    onCheckedChange={() => toggleArrayFilter('levels', key)}
                    data-testid={`filter-level-${key}`}
                  />
                  <Label
                    htmlFor={`level-${key}`}
                    className="flex items-center justify-between cursor-pointer flex-1"
                  >
                    <span>{label}</span>
                    {count > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({count})
                      </span>
                    )}
                  </Label>
                </div>
              );
            })}
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Price Range Filter */}
        <Collapsible 
          open={expandedSections.price}
          onOpenChange={() => toggleSection('price')}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-0">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <h4 className="font-medium">{t('search.priceRange')}</h4>
              {filters.priceRange && (
                <Badge variant="outline" className="text-xs">
                  {formatCurrency(filters.priceRange.min || 0, 'IRR')} - {formatCurrency(filters.priceRange.max || 0, 'IRR')}
                </Badge>
              )}
            </div>
            {expandedSections.price ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Free</span>
                <span>10M+ IRR</span>
              </div>
              <Slider
                value={[
                  filters.priceRange?.min || 0,
                  filters.priceRange?.max || 10000000
                ]}
                onValueChange={(value) => {
                  handleFilterChange('priceRange', {
                    min: value[0],
                    max: value[1]
                  });
                }}
                max={10000000}
                step={100000}
                className="w-full"
                data-testid="price-range-slider"
              />
              <div className="flex items-center justify-between text-xs">
                <span>
                  {formatCurrency(filters.priceRange?.min || 0, 'IRR')}
                </span>
                <span>
                  {formatCurrency(filters.priceRange?.max || 10000000, 'IRR')}
                </span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Rating Filter */}
        <Collapsible 
          open={expandedSections.rating}
          onOpenChange={() => toggleSection('rating')}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-0">
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4" />
              <h4 className="font-medium">{t('search.rating')}</h4>
              {filters.ratings && filters.ratings.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {filters.ratings.length} selected
                </Badge>
              )}
            </div>
            {expandedSections.rating ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const isSelected = filters.ratings?.includes(rating) || false;
              
              return (
                <div key={rating} className="flex items-center space-x-2">
                  <Checkbox
                    id={`rating-${rating}`}
                    checked={isSelected}
                    onCheckedChange={() => toggleArrayFilter('ratings', rating.toString())}
                    data-testid={`filter-rating-${rating}`}
                  />
                  <Label
                    htmlFor={`rating-${rating}`}
                    className="flex items-center space-x-1 cursor-pointer"
                  >
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        className={cn(
                          "h-4 w-4",
                          index < rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        )}
                      />
                    ))}
                    <span className="ml-2">& up</span>
                  </Label>
                </div>
              );
            })}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}