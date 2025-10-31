/**
 * CMS Routes - Content Management System API Endpoints
 * Handles website pages, blog posts, videos, and media assets
 */

import { Express, Request, Response } from 'express';
import { z } from 'zod';
import { insertCmsPageSchema, insertCmsPageSectionSchema, insertCmsBlogCategorySchema, 
         insertCmsBlogTagSchema, insertCmsBlogPostSchema, insertCmsBlogCommentSchema,
         insertCmsVideoSchema, insertCmsMediaAssetSchema, insertCmsPageAnalyticsSchema } from '@shared/schema';
import { DatabaseStorage } from '../database-storage.js';

export function registerCmsRoutes(app: Express) {
  // Create storage instance
  const storage = new DatabaseStorage();
  
  // ============================================================================
  // CMS PAGES ENDPOINTS
  // ============================================================================
  
  // Get all pages with optional filters
  app.get('/api/cms/pages', async (req: Request, res: Response) => {
    try {
      const { status, locale, isHomepage } = req.query;
      
      const filters: any = {};
      if (status) filters.status = status as string;
      if (locale) filters.locale = locale as string;
      if (isHomepage !== undefined) filters.isHomepage = isHomepage === 'true';
      
      const pages = await storage.getCmsPages(filters);
      res.json(pages);
    } catch (error) {
      console.error('Error fetching CMS pages:', error);
      res.status(500).json({ message: 'Failed to fetch pages' });
    }
  });
  
  // Get single page by ID
  app.get('/api/cms/pages/:id', async (req: Request, res: Response) => {
    try {
      const pageId = parseInt(req.params.id);
      const page = await storage.getCmsPage(pageId);
      
      if (!page) {
        return res.status(404).json({ message: 'Page not found' });
      }
      
      // Get page sections
      const sections = await storage.getCmsPageSections(pageId);
      
      res.json({ ...page, sections });
    } catch (error) {
      console.error('Error fetching CMS page:', error);
      res.status(500).json({ message: 'Failed to fetch page' });
    }
  });
  
  // Get page by slug
  app.get('/api/cms/pages/slug/:slug', async (req: Request, res: Response) => {
    try {
      const page = await storage.getCmsPageBySlug(req.params.slug);
      
      if (!page) {
        return res.status(404).json({ message: 'Page not found' });
      }
      
      // Get page sections
      const sections = await storage.getCmsPageSections(page.id);
      
      res.json({ ...page, sections });
    } catch (error) {
      console.error('Error fetching CMS page by slug:', error);
      res.status(500).json({ message: 'Failed to fetch page' });
    }
  });
  
  // Create new page
  app.post('/api/cms/pages', async (req: Request, res: Response) => {
    try {
      const pageData = insertCmsPageSchema.parse(req.body);
      const page = await storage.createCmsPage(pageData);
      res.status(201).json(page);
    } catch (error) {
      console.error('Error creating CMS page:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid page data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create page' });
    }
  });
  
  // Update page
  app.put('/api/cms/pages/:id', async (req: Request, res: Response) => {
    try {
      const pageId = parseInt(req.params.id);
      const updates = req.body;
      
      const page = await storage.updateCmsPage(pageId, updates);
      
      if (!page) {
        return res.status(404).json({ message: 'Page not found' });
      }
      
      res.json(page);
    } catch (error) {
      console.error('Error updating CMS page:', error);
      res.status(500).json({ message: 'Failed to update page' });
    }
  });
  
  // Publish page
  app.post('/api/cms/pages/:id/publish', async (req: Request, res: Response) => {
    try {
      const pageId = parseInt(req.params.id);
      const page = await storage.publishCmsPage(pageId);
      
      if (!page) {
        return res.status(404).json({ message: 'Page not found' });
      }
      
      res.json(page);
    } catch (error) {
      console.error('Error publishing CMS page:', error);
      res.status(500).json({ message: 'Failed to publish page' });
    }
  });
  
  // Delete page
  app.delete('/api/cms/pages/:id', async (req: Request, res: Response) => {
    try {
      const pageId = parseInt(req.params.id);
      await storage.deleteCmsPage(pageId);
      res.json({ message: 'Page deleted successfully' });
    } catch (error) {
      console.error('Error deleting CMS page:', error);
      res.status(500).json({ message: 'Failed to delete page' });
    }
  });
  
  // ============================================================================
  // CMS PAGE SECTIONS ENDPOINTS
  // ============================================================================
  
  // Create page section
  app.post('/api/cms/page-sections', async (req: Request, res: Response) => {
    try {
      const sectionData = insertCmsPageSectionSchema.parse(req.body);
      const section = await storage.createCmsPageSection(sectionData);
      res.status(201).json(section);
    } catch (error) {
      console.error('Error creating page section:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid section data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create section' });
    }
  });
  
  // Update page section
  app.put('/api/cms/page-sections/:id', async (req: Request, res: Response) => {
    try {
      const sectionId = parseInt(req.params.id);
      const section = await storage.updateCmsPageSection(sectionId, req.body);
      
      if (!section) {
        return res.status(404).json({ message: 'Section not found' });
      }
      
      res.json(section);
    } catch (error) {
      console.error('Error updating page section:', error);
      res.status(500).json({ message: 'Failed to update section' });
    }
  });
  
  // Delete page section
  app.delete('/api/cms/page-sections/:id', async (req: Request, res: Response) => {
    try {
      const sectionId = parseInt(req.params.id);
      await storage.deleteCmsPageSection(sectionId);
      res.json({ message: 'Section deleted successfully' });
    } catch (error) {
      console.error('Error deleting page section:', error);
      res.status(500).json({ message: 'Failed to delete section' });
    }
  });
  
  // ============================================================================
  // BLOG CATEGORIES ENDPOINTS
  // ============================================================================
  
  app.get('/api/cms/blog/categories', async (req: Request, res: Response) => {
    try {
      const categories = await storage.getBlogCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching blog categories:', error);
      res.status(500).json({ message: 'Failed to fetch categories' });
    }
  });
  
  app.post('/api/cms/blog/categories', async (req: Request, res: Response) => {
    try {
      const categoryData = insertCmsBlogCategorySchema.parse(req.body);
      const category = await storage.createBlogCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      console.error('Error creating blog category:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid category data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create category' });
    }
  });
  
  app.put('/api/cms/blog/categories/:id', async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.id);
      const category = await storage.updateBlogCategory(categoryId, req.body);
      
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      res.json(category);
    } catch (error) {
      console.error('Error updating blog category:', error);
      res.status(500).json({ message: 'Failed to update category' });
    }
  });
  
  app.delete('/api/cms/blog/categories/:id', async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.id);
      await storage.deleteBlogCategory(categoryId);
      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Error deleting blog category:', error);
      res.status(500).json({ message: 'Failed to delete category' });
    }
  });
  
  // ============================================================================
  // BLOG TAGS ENDPOINTS
  // ============================================================================
  
  app.get('/api/cms/blog/tags', async (req: Request, res: Response) => {
    try {
      const tags = await storage.getBlogTags();
      res.json(tags);
    } catch (error) {
      console.error('Error fetching blog tags:', error);
      res.status(500).json({ message: 'Failed to fetch tags' });
    }
  });
  
  app.post('/api/cms/blog/tags', async (req: Request, res: Response) => {
    try {
      const tagData = insertCmsBlogTagSchema.parse(req.body);
      const tag = await storage.createBlogTag(tagData);
      res.status(201).json(tag);
    } catch (error) {
      console.error('Error creating blog tag:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid tag data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create tag' });
    }
  });
  
  // ============================================================================
  // BLOG POSTS ENDPOINTS
  // ============================================================================
  
  app.get('/api/cms/blog/posts', async (req: Request, res: Response) => {
    try {
      const { status, locale, categoryId, authorId } = req.query;
      
      const filters: any = {};
      if (status) filters.status = status as string;
      if (locale) filters.locale = locale as string;
      if (categoryId) filters.categoryId = parseInt(categoryId as string);
      if (authorId) filters.authorId = parseInt(authorId as string);
      
      const posts = await storage.getBlogPosts(filters);
      res.json(posts);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      res.status(500).json({ message: 'Failed to fetch posts' });
    }
  });
  
  app.get('/api/cms/blog/posts/:id', async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getBlogPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      res.json(post);
    } catch (error) {
      console.error('Error fetching blog post:', error);
      res.status(500).json({ message: 'Failed to fetch post' });
    }
  });
  
  app.get('/api/cms/blog/posts/slug/:slug', async (req: Request, res: Response) => {
    try {
      const post = await storage.getBlogPostBySlug(req.params.slug);
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      res.json(post);
    } catch (error) {
      console.error('Error fetching blog post by slug:', error);
      res.status(500).json({ message: 'Failed to fetch post' });
    }
  });
  
  app.post('/api/cms/blog/posts', async (req: Request, res: Response) => {
    try {
      const postData = insertCmsBlogPostSchema.parse(req.body);
      const post = await storage.createBlogPost(postData);
      res.status(201).json(post);
    } catch (error) {
      console.error('Error creating blog post:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid post data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create post' });
    }
  });
  
  app.put('/api/cms/blog/posts/:id', async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.id);
      const post = await storage.updateBlogPost(postId, req.body);
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      res.json(post);
    } catch (error) {
      console.error('Error updating blog post:', error);
      res.status(500).json({ message: 'Failed to update post' });
    }
  });
  
  app.delete('/api/cms/blog/posts/:id', async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.id);
      await storage.deleteBlogPost(postId);
      res.json({ message: 'Post deleted successfully' });
    } catch (error) {
      console.error('Error deleting blog post:', error);
      res.status(500).json({ message: 'Failed to delete post' });
    }
  });
  
  // ============================================================================
  // VIDEOS ENDPOINTS
  // ============================================================================
  
  app.get('/api/cms/videos', async (req: Request, res: Response) => {
    try {
      const { isActive, locale, category } = req.query;
      
      const filters: any = {};
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (locale) filters.locale = locale as string;
      if (category) filters.category = category as string;
      
      const videos = await storage.getVideos(filters);
      res.json(videos);
    } catch (error) {
      console.error('Error fetching videos:', error);
      res.status(500).json({ message: 'Failed to fetch videos' });
    }
  });
  
  app.get('/api/cms/videos/:id', async (req: Request, res: Response) => {
    try {
      const videoId = parseInt(req.params.id);
      const video = await storage.getVideo(videoId);
      
      if (!video) {
        return res.status(404).json({ message: 'Video not found' });
      }
      
      res.json(video);
    } catch (error) {
      console.error('Error fetching video:', error);
      res.status(500).json({ message: 'Failed to fetch video' });
    }
  });
  
  app.post('/api/cms/videos', async (req: Request, res: Response) => {
    try {
      const videoData = insertCmsVideoSchema.parse(req.body);
      const video = await storage.createVideo(videoData);
      res.status(201).json(video);
    } catch (error) {
      console.error('Error creating video:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid video data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create video' });
    }
  });
  
  app.put('/api/cms/videos/:id', async (req: Request, res: Response) => {
    try {
      const videoId = parseInt(req.params.id);
      const video = await storage.updateVideo(videoId, req.body);
      
      if (!video) {
        return res.status(404).json({ message: 'Video not found' });
      }
      
      res.json(video);
    } catch (error) {
      console.error('Error updating video:', error);
      res.status(500).json({ message: 'Failed to update video' });
    }
  });
  
  app.delete('/api/cms/videos/:id', async (req: Request, res: Response) => {
    try {
      const videoId = parseInt(req.params.id);
      await storage.deleteVideo(videoId);
      res.json({ message: 'Video deleted successfully' });
    } catch (error) {
      console.error('Error deleting video:', error);
      res.status(500).json({ message: 'Failed to delete video' });
    }
  });
  
  // ============================================================================
  // MEDIA ASSETS ENDPOINTS
  // ============================================================================
  
  app.get('/api/cms/media', async (req: Request, res: Response) => {
    try {
      const { fileType, uploadedBy } = req.query;
      
      const filters: any = {};
      if (fileType) filters.fileType = fileType as string;
      if (uploadedBy) filters.uploadedBy = parseInt(uploadedBy as string);
      
      const media = await storage.getMediaAssets(filters);
      res.json(media);
    } catch (error) {
      console.error('Error fetching media assets:', error);
      res.status(500).json({ message: 'Failed to fetch media' });
    }
  });
  
  app.get('/api/cms/media/:id', async (req: Request, res: Response) => {
    try {
      const assetId = parseInt(req.params.id);
      const asset = await storage.getMediaAsset(assetId);
      
      if (!asset) {
        return res.status(404).json({ message: 'Media asset not found' });
      }
      
      res.json(asset);
    } catch (error) {
      console.error('Error fetching media asset:', error);
      res.status(500).json({ message: 'Failed to fetch media' });
    }
  });
  
  // Note: Media upload will be handled by form-file-routes.ts
  
  // ============================================================================
  // ANALYTICS ENDPOINTS
  // ============================================================================
  
  app.post('/api/cms/analytics/track', async (req: Request, res: Response) => {
    try {
      const analyticsData = insertCmsPageAnalyticsSchema.parse(req.body);
      const tracked = await storage.trackPageAnalytics(analyticsData);
      res.status(201).json(tracked);
    } catch (error) {
      console.error('Error tracking analytics:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid analytics data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to track analytics' });
    }
  });
  
  app.get('/api/cms/analytics', async (req: Request, res: Response) => {
    try {
      const { pageId, blogPostId, videoId, dateFrom, dateTo } = req.query;
      
      const filters: any = {};
      if (pageId) filters.pageId = parseInt(pageId as string);
      if (blogPostId) filters.blogPostId = parseInt(blogPostId as string);
      if (videoId) filters.videoId = parseInt(videoId as string);
      if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
      if (dateTo) filters.dateTo = new Date(dateTo as string);
      
      const analytics = await storage.getPageAnalytics(filters);
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ message: 'Failed to fetch analytics' });
    }
  });
  
  // ============================================================================
  // SEO ENDPOINTS
  // ============================================================================
  
  // Generate sitemap.xml
  app.get('/api/seo/sitemap.xml', async (req: Request, res: Response) => {
    try {
      const pages = await storage.getCmsPages({ status: 'published' });
      const posts = await storage.getBlogPosts({ status: 'published' });
      const videos = await storage.getVideos({ isActive: true });
      
      const baseUrl = req.protocol + '://' + req.get('host');
      
      let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
      sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
      
      // Add pages
      pages.forEach((page: any) => {
        sitemap += '  <url>\n';
        sitemap += `    <loc>${baseUrl}/${page.slug}</loc>\n`;
        sitemap += `    <lastmod>${page.updatedAt.toISOString()}</lastmod>\n`;
        sitemap += '    <changefreq>weekly</changefreq>\n';
        sitemap += '    <priority>0.8</priority>\n';
        sitemap += '  </url>\n';
      });
      
      // Add blog posts
      posts.forEach((post: any) => {
        sitemap += '  <url>\n';
        sitemap += `    <loc>${baseUrl}/blog/${post.slug}</loc>\n`;
        sitemap += `    <lastmod>${post.updatedAt.toISOString()}</lastmod>\n`;
        sitemap += '    <changefreq>monthly</changefreq>\n';
        sitemap += '    <priority>0.6</priority>\n';
        sitemap += '  </url>\n';
      });
      
      sitemap += '</urlset>';
      
      res.header('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      res.status(500).json({ message: 'Failed to generate sitemap' });
    }
  });
  
  // Robots.txt
  app.get('/robots.txt', (req: Request, res: Response) => {
    const baseUrl = req.protocol + '://' + req.get('host');
    
    const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/api/seo/sitemap.xml`;
    
    res.header('Content-Type', 'text/plain');
    res.send(robotsTxt);
  });
}
