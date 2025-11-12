import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { Home } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export function useBreadcrumbs(): BreadcrumbItem[] {
  const [location] = useLocation();
  const { t } = useTranslation(['common']);

  // Fetch curriculum categories for dynamic breadcrumbs
  const { data: curriculumCategories = [] } = useQuery<any[]>({
    queryKey: ['/api/cms/curriculum-categories/active'],
  });

  // Home page - no breadcrumbs
  if (location === '/') {
    return [];
  }

  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: t('breadcrumb.home', 'Home'),
      href: '/',
      icon: Home,
    },
  ];

  const pathSegments = location.split('/').filter(Boolean);

  // Handle different route patterns
  if (pathSegments[0] === 'blog') {
    breadcrumbs.push({
      label: t('breadcrumb.blog', 'Blog'),
      href: pathSegments.length === 1 ? undefined : '/blog',
    });
    
    if (pathSegments.length > 1) {
      breadcrumbs.push({
        label: t('breadcrumb.article', 'Article'),
      });
    }
  } else if (pathSegments[0] === 'videos') {
    breadcrumbs.push({
      label: t('breadcrumb.videos', 'Videos'),
      href: pathSegments.length === 1 ? undefined : '/videos',
    });
    
    if (pathSegments.length > 1) {
      breadcrumbs.push({
        label: t('breadcrumb.video', 'Video'),
      });
    }
  } else if (pathSegments[0] === 'curriculum') {
    breadcrumbs.push({
      label: t('breadcrumb.curriculum', 'Curriculum'),
      href: pathSegments.length === 1 ? undefined : '/curriculum',
    });

    // Category page (e.g., /curriculum/test-prep)
    if (pathSegments.length > 1 && pathSegments[1]) {
      const categorySlug = pathSegments[1];
      const category = curriculumCategories.find((cat: any) => cat.slug === categorySlug);
      
      if (category) {
        const categoryName = category.nameFa || category.nameAr || category.name;
        breadcrumbs.push({
          label: categoryName,
        });
      } else {
        breadcrumbs.push({
          label: t('breadcrumb.category', 'Category'),
        });
      }
    }
  } else if (pathSegments[0] === 'services') {
    breadcrumbs.push({
      label: t('breadcrumb.services', 'Services'),
      href: pathSegments.length === 1 ? undefined : '/services',
    });

    if (pathSegments[1] === 'callern') {
      breadcrumbs.push({
        label: t('breadcrumb.callern', 'CallerN'),
      });
    }
  } else if (pathSegments[0] === 'about') {
    breadcrumbs.push({
      label: t('breadcrumb.about', 'About'),
    });
  } else if (pathSegments[0] === 'contact') {
    breadcrumbs.push({
      label: t('breadcrumb.contact', 'Contact'),
    });
  } else if (pathSegments[0] === 'take-test') {
    breadcrumbs.push({
      label: t('breadcrumb.takeTest', 'Placement Test'),
    });
  } else if (pathSegments[0] === 'auth') {
    breadcrumbs.push({
      label: t('breadcrumb.auth', 'Login / Register'),
    });
  } else if (pathSegments[0] === 'dashboard') {
    breadcrumbs.push({
      label: t('breadcrumb.dashboard', 'Dashboard'),
    });
  } else if (pathSegments[0] === 'linguaquest') {
    breadcrumbs.push({
      label: t('breadcrumb.linguaquest', 'LinguaQuest'),
    });
  }

  return breadcrumbs;
}
