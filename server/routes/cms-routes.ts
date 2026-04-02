/**
 * CMS Routes - Content Management System API Endpoints
 * Handles website pages, blog posts, videos, and media assets
 */

import { Express, Request, Response } from 'express';
import { z } from 'zod';
import { insertCmsPageSchema, insertCmsPageSectionSchema, insertCmsBlogCategorySchema, 
         insertCmsBlogTagSchema, insertCmsBlogPostSchema, insertCmsBlogCommentSchema,
         insertCmsVideoSchema, insertCmsMediaAssetSchema, insertCmsPageAnalyticsSchema,
         insertCurriculumCategorySchema, insertGuestLeadSchema, insertCustomFontSchema,
         cmsBlogPosts, cmsContentVersions, cmsContentPromptTemplates, cmsContentGenerationLogs } from '@shared/schema';
import { DatabaseStorage } from '../database-storage.js';
import { db } from '../db.js';
import { eq, and, lte, desc, sql, or } from 'drizzle-orm';
import multer from 'multer';
import { nanoid } from 'nanoid';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';

export function registerCmsRoutes(app: Express, authenticateToken?: any, requireRole?: any) {
  // Create storage instance
  const storage = new DatabaseStorage();
  
  // Admin middleware helper - applies both auth and admin role check
  const requireAdmin = authenticateToken && requireRole ? 
    [authenticateToken, requireRole(['Admin'])] : 
    [];

  // Supervisor or Admin middleware — allows approval/rejection by either role
  // Supervisors can approve content but scheduling is locked to Admin sign-off
  const requireSupervisorOrAdmin = authenticateToken && requireRole ?
    [authenticateToken, requireRole(['Admin', 'Supervisor'])] :
    [];
  
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
  
  // Create blog post — requires authenticated editor/admin; status is forced to 'draft'
  // Publishing must go through the approval endpoint to enforce workflow + duplicate checks
  app.post('/api/cms/blog/posts', ...requireSupervisorOrAdmin, async (req: Request, res: Response) => {
    try {
      const body = { ...req.body };
      // Prevent direct publish bypass — all new posts start as draft
      if (body.status === 'published') {
        body.status = 'draft';
      }
      const postData = insertCmsBlogPostSchema.parse(body);
      const post = await storage.createBlogPost(postData);
      res.status(201).json(post);
    } catch (error: unknown) {
      console.error('Error creating blog post:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid post data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create post' });
    }
  });
  
  // Update blog post — requires authenticated editor/admin
  // Direct publish bypass is blocked; use the approve endpoint to publish
  app.put('/api/cms/blog/posts/:id', ...requireSupervisorOrAdmin, async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.id);
      const user = (req as any).user;
      const isAdmin = user?.role === 'Admin';
      const body = { ...req.body };

      // Enforce: non-admin users cannot directly set status to published
      // Only Admin can publish directly through PUT (e.g. unpublish/re-publish toggle)
      if (!isAdmin && body.status === 'published') {
        return res.status(403).json({ message: 'Publishing requires Admin role or use the approve endpoint.' });
      }

      // Save version before updating
      try {
        const [existingPost] = await db.select().from(cmsBlogPosts).where(eq(cmsBlogPosts.id, postId));
        if (existingPost) {
          const [lastVer] = await db.select({ versionNumber: cmsContentVersions.versionNumber })
            .from(cmsContentVersions)
            .where(eq(cmsContentVersions.postId, postId))
            .orderBy(desc(cmsContentVersions.versionNumber))
            .limit(1);
          const nextVersion = (lastVer?.versionNumber ?? 0) + 1;
          await db.insert(cmsContentVersions).values({
            postId,
            versionNumber: nextVersion,
            title: existingPost.title,
            slug: existingPost.slug,
            excerpt: existingPost.excerpt ?? '',
            content: existingPost.content,
            metaTitle: existingPost.metaTitle ?? '',
            metaDescription: existingPost.metaDescription ?? '',
            metaKeywords: existingPost.metaKeywords ?? '',
            status: existingPost.status,
            changedBy: user?.id ?? existingPost.authorId,
            changeNote: 'Pre-update snapshot',
          });
        }
      } catch (vErr: unknown) {
        console.warn('[CMS] Version save error (non-fatal):', vErr instanceof Error ? vErr.message : String(vErr));
      }

      const post = await storage.updateBlogPost(postId, body);
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      res.json(post);
    } catch (error: unknown) {
      console.error('Error updating blog post:', error);
      res.status(500).json({ message: 'Failed to update post' });
    }
  });
  
  app.delete('/api/cms/blog/posts/:id', ...requireAdmin, async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.id);
      await storage.deleteBlogPost(postId);
      res.json({ message: 'Post deleted successfully' });
    } catch (error: unknown) {
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

  app.put('/api/cms/media/:id', async (req: Request, res: Response) => {
    try {
      const assetId = parseInt(req.params.id);
      const { alt, caption, altEn, altFa, altAr, captionEn, captionFa, captionAr } = req.body;
      
      const updated = await storage.updateMediaAsset(assetId, {
        alt,
        caption,
        altEn,
        altFa,
        altAr,
        captionEn,
        captionFa,
        captionAr
      });
      
      if (!updated) {
        return res.status(404).json({ message: 'Media asset not found' });
      }
      
      res.json(updated);
    } catch (error) {
      console.error('Error updating media asset:', error);
      res.status(500).json({ message: 'Failed to update media asset' });
    }
  });
  
  // Media file upload
  const cmsUploadDir = 'uploads/cms-media';
  
  if (!fsSync.existsSync(cmsUploadDir)) {
    fsSync.mkdirSync(cmsUploadDir, { recursive: true });
  }
  const cmsMediaStorage = multer.diskStorage({
    destination: (req: any, file: any, cb: any) => cb(null, cmsUploadDir),
    filename: (req: any, file: any, cb: any) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
  const cmsUpload = multer({ storage: cmsMediaStorage });

  app.post('/api/cms/media/upload', cmsUpload.single('file'), async (req: any, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      const { altText, description, uploadedBy } = req.body;
      const fileTypeMap: Record<string, string> = {
        'image/jpeg': 'image', 'image/jpg': 'image', 'image/png': 'image',
        'image/gif': 'image', 'image/webp': 'image',
        'video/mp4': 'video', 'video/webm': 'video', 'video/quicktime': 'video',
        'application/pdf': 'document', 'application/msword': 'document',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document'
      };
      const asset = await storage.createMediaAsset({
        fileName: req.file.originalname,
        fileType: fileTypeMap[req.file.mimetype] || 'other',
        fileSize: req.file.size,
        filePath: req.file.path,
        mimeType: req.file.mimetype,
        altText: altText || null,
        description: description || null,
        uploadedBy: uploadedBy ? parseInt(uploadedBy) : null
      });
      res.status(201).json({ message: 'File uploaded successfully', asset });
    } catch (error) {
      console.error('Error uploading media:', error);
      res.status(500).json({ message: 'Failed to upload media' });
    }
  });
  
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
  
  // ============================================================================
  // CONTACT FORM ENDPOINT
  // ============================================================================
  
  app.post('/api/contact', async (req: Request, res: Response) => {
    try {
      const contactSchema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
        subject: z.string().min(1),
        message: z.string().min(10),
      });
      
      const data = contactSchema.parse(req.body);
      
      // In production, this would:
      // 1. Send email notification to admin
      // 2. Store in database for tracking
      // 3. Send confirmation email to user
      // For now, we'll log and return success
      console.log('📧 Contact form submission:', data);
      
      res.status(200).json({ 
        success: true, 
        message: 'Thank you for contacting us. We will get back to you soon!' 
      });
    } catch (error) {
      console.error('Error processing contact form:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid form data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to send message' });
    }
  });
  
  // ============================================================================
  // CURRICULUM CATEGORIES ENDPOINTS
  // ============================================================================
  
  // Get all curriculum categories with optional active filter (admin only)
  app.get('/api/cms/curriculum-categories', ...requireAdmin, async (req: Request, res: Response) => {
    try {
      const { isActive } = req.query;
      
      const filters: any = {};
      if (isActive !== undefined) {
        filters.isActive = isActive === 'true';
      }
      
      const categories = await storage.getCurriculumCategories(filters);
      res.json(categories);
    } catch (error) {
      console.error('Error fetching curriculum categories:', error);
      res.status(500).json({ message: 'Failed to fetch curriculum categories' });
    }
  });
  
  // Get active curriculum categories (public endpoint)
  app.get('/api/cms/curriculum-categories/active', async (req: Request, res: Response) => {
    try {
      const categories = await storage.getCurriculumCategories({ isActive: true });
      res.json(categories);
    } catch (error) {
      console.error('Error fetching active curriculum categories:', error);
      res.status(500).json({ message: 'Failed to fetch active curriculum categories' });
    }
  });
  
  // Get curriculum category by slug (public endpoint)
  app.get('/api/cms/curriculum-categories/slug/:slug', async (req: Request, res: Response) => {
    try {
      const category = await storage.getCurriculumCategoryBySlug(req.params.slug);
      
      if (!category) {
        return res.status(404).json({ message: 'Curriculum category not found' });
      }
      
      res.json(category);
    } catch (error) {
      console.error('Error fetching curriculum category by slug:', error);
      res.status(500).json({ message: 'Failed to fetch curriculum category' });
    }
  });
  
  // Get single curriculum category by ID (admin only)
  app.get('/api/cms/curriculum-categories/:id', ...requireAdmin, async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.id);
      const category = await storage.getCurriculumCategory(categoryId);
      
      if (!category) {
        return res.status(404).json({ message: 'Curriculum category not found' });
      }
      
      res.json(category);
    } catch (error) {
      console.error('Error fetching curriculum category:', error);
      res.status(500).json({ message: 'Failed to fetch curriculum category' });
    }
  });
  
  // Create curriculum category (admin only)
  app.post('/api/cms/curriculum-categories', ...requireAdmin, async (req: Request, res: Response) => {
    try {
      const categoryData = insertCurriculumCategorySchema.parse(req.body);
      const category = await storage.createCurriculumCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      console.error('Error creating curriculum category:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid curriculum category data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create curriculum category' });
    }
  });
  
  // Update curriculum category (admin only)
  app.put('/api/cms/curriculum-categories/:id', ...requireAdmin, async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.id);
      
      // Validate update data with partial schema
      const updateSchema = insertCurriculumCategorySchema.partial();
      const categoryData = updateSchema.parse(req.body);
      
      const category = await storage.updateCurriculumCategory(categoryId, categoryData);
      
      if (!category) {
        return res.status(404).json({ message: 'Curriculum category not found' });
      }
      
      res.json(category);
    } catch (error) {
      console.error('Error updating curriculum category:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid curriculum category data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update curriculum category' });
    }
  });
  
  // Delete curriculum category (admin only)
  app.delete('/api/cms/curriculum-categories/:id', ...requireAdmin, async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.id);
      await storage.deleteCurriculumCategory(categoryId);
      res.json({ message: 'Curriculum category deleted successfully' });
    } catch (error) {
      console.error('Error deleting curriculum category:', error);
      res.status(500).json({ message: 'Failed to delete curriculum category' });
    }
  });
  
  // Get courses for a curriculum category (public)
  app.get('/api/cms/curriculum-categories/:id/courses', async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.id);
      const { isActive } = req.query;
      const courses = await storage.getCoursesByCategory(categoryId, {
        isActive: isActive === 'false' ? false : isActive === 'true' ? true : undefined
      });
      res.json(courses);
    } catch (error) {
      console.error('Error fetching courses by category:', error);
      res.status(500).json({ message: 'Failed to fetch courses by category' });
    }
  });

  // Reorder curriculum categories (admin only)
  app.put('/api/cms/curriculum-categories/reorder', ...requireAdmin, async (req: Request, res: Response) => {
    try {
      const { categoryOrders } = req.body;
      if (!Array.isArray(categoryOrders)) {
        return res.status(400).json({ message: 'categoryOrders must be an array' });
      }
      await storage.reorderCurriculumCategories(categoryOrders);
      res.json({ success: true });
    } catch (error) {
      console.error('Error reordering curriculum categories:', error);
      res.status(500).json({ message: 'Failed to reorder curriculum categories' });
    }
  });

  // Get page sections by page ID
  app.get('/api/cms/pages/:id/sections', async (req: Request, res: Response) => {
    try {
      const pageId = parseInt(req.params.id);
      const sections = await storage.getCmsPageSections(pageId);
      res.json(sections);
    } catch (error) {
      console.error('Error fetching page sections:', error);
      res.status(500).json({ message: 'Failed to fetch page sections' });
    }
  });

  // Create page section under a page
  app.post('/api/cms/pages/:id/sections', async (req: Request, res: Response) => {
    try {
      const pageId = parseInt(req.params.id);
      const sectionData = insertCmsPageSectionSchema.parse({
        ...req.body,
        pageId
      });
      const section = await storage.createCmsPageSection(sectionData);
      res.status(201).json(section);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid section data', errors: error.errors });
      }
      console.error('Error creating page section:', error);
      res.status(500).json({ message: 'Failed to create page section' });
    }
  });

  // ============================================================================
  // GUEST LEADS ENDPOINTS
  // ============================================================================
  
  // Create guest lead (public endpoint)
  app.post('/api/cms/guest-leads', async (req: Request, res: Response) => {
    try {
      const leadData = insertGuestLeadSchema.parse(req.body);
      const lead = await storage.createGuestLead(leadData);
      res.status(201).json(lead);
    } catch (error) {
      console.error('Error creating guest lead:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid guest lead data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create guest lead' });
    }
  });
  
  // Get all guest leads (admin only)
  app.get('/api/cms/guest-leads', ...requireAdmin, async (req: Request, res: Response) => {
    try {
      const { status, source } = req.query;
      const leads = await storage.getGuestLeads({
        status: status as string | undefined,
        source: source as string | undefined
      });
      res.json(leads);
    } catch (error) {
      console.error('Error fetching guest leads:', error);
      res.status(500).json({ message: 'Failed to fetch guest leads' });
    }
  });

  // Get single guest lead (admin only)
  app.get('/api/cms/guest-leads/:id', ...requireAdmin, async (req: Request, res: Response) => {
    try {
      const leadId = parseInt(req.params.id);
      const lead = await storage.getGuestLead(leadId);
      if (!lead) {
        return res.status(404).json({ message: 'Lead not found' });
      }
      res.json(lead);
    } catch (error) {
      console.error('Error fetching guest lead:', error);
      res.status(500).json({ message: 'Failed to fetch guest lead' });
    }
  });

  // Update guest lead (admin only)
  app.put('/api/cms/guest-leads/:id', ...requireAdmin, async (req: Request, res: Response) => {
    try {
      const leadId = parseInt(req.params.id);
      const lead = await storage.updateGuestLead(leadId, req.body);
      if (!lead) {
        return res.status(404).json({ message: 'Lead not found' });
      }
      res.json(lead);
    } catch (error) {
      console.error('Error updating guest lead:', error);
      res.status(500).json({ message: 'Failed to update guest lead' });
    }
  });
  
  // ============================================================================
  // CUSTOM FONTS MANAGEMENT - White-Label Branding
  // ============================================================================
  
  // Configure multer for font file uploads
  const fontStorage = multer.diskStorage({
    destination: async (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'public', 'fonts', 'custom');
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const fileName = `${nanoid(10)}${ext}`;
      cb(null, fileName);
    }
  });
  
  const fontUpload = multer({
    storage: fontStorage,
    fileFilter: (req, file, cb) => {
      const allowedFormats = ['.woff', '.woff2', '.ttf', '.otf'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowedFormats.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Only font files (.woff, .woff2, .ttf, .otf) are allowed'));
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    }
  });
  
  // Upload custom font (admin only)
  app.post('/api/cms/fonts/upload', ...requireAdmin, fontUpload.single('fontFile'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No font file uploaded' });
      }
      
      const { name, fontFamily, language } = req.body;
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      
      const fileUrl = `/fonts/custom/${req.file.filename}`;
      const fileFormat = path.extname(req.file.filename).substring(1);
      
      const fontData = {
        name,
        fontFamily,
        fileUrl,
        fileFormat,
        language: language || null,
        uploadedBy: userId
      };
      
      const font = await storage.createCustomFont(fontData);
      res.status(201).json(font);
    } catch (error) {
      console.error('Error uploading custom font:', error);
      res.status(500).json({ message: 'Failed to upload font' });
    }
  });
  
  // Get all custom fonts (admin only)
  app.get('/api/cms/fonts', ...requireAdmin, async (req: Request, res: Response) => {
    try {
      const fonts = await storage.getCustomFonts();
      res.json(fonts);
    } catch (error) {
      console.error('Error fetching custom fonts:', error);
      res.status(500).json({ message: 'Failed to fetch fonts' });
    }
  });
  
  // Get active fonts (public endpoint for applying fonts globally)
  app.get('/api/cms/fonts/active', async (req: Request, res: Response) => {
    try {
      const fonts = await storage.getActiveFonts();
      res.json(fonts);
    } catch (error) {
      console.error('Error fetching active fonts:', error);
      res.status(500).json({ message: 'Failed to fetch active fonts' });
    }
  });
  
  // Activate/deactivate a font (admin only)
  app.patch('/api/cms/fonts/:id/activate', ...requireAdmin, async (req: Request, res: Response) => {
    try {
      const fontId = parseInt(req.params.id);
      const { isActive, language } = req.body;
      
      // If activating, deactivate all other fonts for the same language
      if (isActive && language) {
        await storage.deactivateFontsForLanguage(language);
      }
      
      const font = await storage.updateCustomFont(fontId, { isActive });
      
      if (!font) {
        return res.status(404).json({ message: 'Font not found' });
      }
      
      res.json(font);
    } catch (error) {
      console.error('Error activating font:', error);
      res.status(500).json({ message: 'Failed to activate font' });
    }
  });
  
  // Update custom font metadata (admin only)
  app.put('/api/cms/fonts/:id', ...requireAdmin, async (req: Request, res: Response) => {
    try {
      const fontId = parseInt(req.params.id);
      const { name, fontFamily, language, displayOrder } = req.body;
      
      const font = await storage.updateCustomFont(fontId, {
        name,
        fontFamily,
        language,
        displayOrder
      });
      
      if (!font) {
        return res.status(404).json({ message: 'Font not found' });
      }
      
      res.json(font);
    } catch (error) {
      console.error('Error updating font:', error);
      res.status(500).json({ message: 'Failed to update font' });
    }
  });
  
  // Delete custom font (admin only)
  app.delete('/api/cms/fonts/:id', ...requireAdmin, async (req: Request, res: Response) => {
    try {
      const fontId = parseInt(req.params.id);
      
      // Get font details to delete the file
      const font = await storage.getCustomFont(fontId);
      if (font) {
        const filePath = path.join(process.cwd(), 'public', font.fileUrl);
        try {
          await fs.unlink(filePath);
        } catch (err) {
          console.error('Error deleting font file:', err);
        }
      }
      
      await storage.deleteCustomFont(fontId);
      res.json({ message: 'Font deleted successfully' });
    } catch (error) {
      console.error('Error deleting font:', error);
      res.status(500).json({ message: 'Failed to delete font' });
    }
  });

  // ============================================================================
  // APPROVAL WORKFLOW & VERSIONING ENDPOINTS
  // ============================================================================

  async function saveVersion(postId: number, userId: number, note?: string): Promise<void> {
    const [post] = await db.select().from(cmsBlogPosts).where(eq(cmsBlogPosts.id, postId));
    if (!post) return;
    const [lastVersion] = await db.select({ versionNumber: cmsContentVersions.versionNumber })
      .from(cmsContentVersions)
      .where(eq(cmsContentVersions.postId, postId))
      .orderBy(desc(cmsContentVersions.versionNumber))
      .limit(1);
    const nextVersion = (lastVersion?.versionNumber || 0) + 1;
    await db.insert(cmsContentVersions).values({
      postId,
      versionNumber: nextVersion,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content,
      metaTitle: post.metaTitle || '',
      metaDescription: post.metaDescription || '',
      metaKeywords: post.metaKeywords || '',
      status: post.status,
      changedBy: userId,
      changeNote: note,
    });
  }

  // GET supervisor sign-off policy setting (Admin only)
  app.get('/api/admin/cms/policy/supervisor-signoff', ...requireAdmin, async (req: Request, res: Response) => {
    try {
      const settings = await db.execute(sql`SELECT cms_supervisor_requires_admin_signoff FROM admin_settings LIMIT 1`);
      const row = settings.rows[0] as { cms_supervisor_requires_admin_signoff: boolean | null } | undefined;
      const requiresSignoff = row?.cms_supervisor_requires_admin_signoff !== false; // default true
      res.json({ supervisorRequiresAdminSignoff: requiresSignoff });
    } catch (error: unknown) {
      console.error('Error fetching supervisor policy:', error);
      res.json({ supervisorRequiresAdminSignoff: true }); // fail safe: require signoff
    }
  });

  // PUT supervisor sign-off policy setting (Admin only)
  app.put('/api/admin/cms/policy/supervisor-signoff', ...requireAdmin, async (req: Request, res: Response) => {
    try {
      const { supervisorRequiresAdminSignoff } = req.body;
      if (typeof supervisorRequiresAdminSignoff !== 'boolean') {
        return res.status(400).json({ message: 'supervisorRequiresAdminSignoff must be boolean' });
      }
      await db.execute(sql`
        UPDATE admin_settings SET cms_supervisor_requires_admin_signoff = ${supervisorRequiresAdminSignoff}
        WHERE id = (SELECT id FROM admin_settings LIMIT 1)
      `);
      res.json({ supervisorRequiresAdminSignoff });
    } catch (error: unknown) {
      console.error('Error updating supervisor policy:', error);
      res.status(500).json({ message: 'Failed to update policy' });
    }
  });

  // Approve post (Admin or Supervisor)
  // Admin: can publish immediately, schedule, or override duplicate detection
  // Supervisor: marks as pending_admin_review (configurable) or publishes if policy allows direct publish
  app.post('/api/cms/blog/posts/:id/approve', ...requireSupervisorOrAdmin, async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.id);
      const user = (req as any).user;
      const isAdmin = user?.role === 'Admin';

      const { publishImmediately = true, scheduledAt, forceDuplicate = false, duplicateThreshold } = req.body;

      // Read supervisor sign-off policy (default: require admin sign-off)
      let supervisorRequiresAdminSignoff = true;
      try {
        const policyRows = await db.execute(sql`SELECT cms_supervisor_requires_admin_signoff FROM admin_settings LIMIT 1`);
        const policyRow = policyRows.rows[0] as { cms_supervisor_requires_admin_signoff: boolean | null } | undefined;
        supervisorRequiresAdminSignoff = policyRow?.cms_supervisor_requires_admin_signoff !== false;
      } catch {
        // Column may not exist yet (pre-migration), default to requiring sign-off
      }

      // Supervisors cannot schedule for future publish (Admin sign-off required regardless of policy)
      if (!isAdmin && scheduledAt) {
        return res.status(403).json({ message: 'Scheduling future publish requires Admin role.' });
      }

      // Supervisors cannot force-override duplicate detection
      if (!isAdmin && forceDuplicate) {
        return res.status(403).json({ message: 'Overriding duplicate detection requires Admin role.' });
      }

      const [post] = await db.select().from(cmsBlogPosts).where(eq(cmsBlogPosts.id, postId));
      if (!post) return res.status(404).json({ message: 'Post not found' });

      // Allow approving from: draft (initial), rejected (re-submitted), pending_admin_review (Supervisor pre-approved)
      const approvableStatuses = ['draft', 'rejected', 'pending_admin_review'];
      if (!approvableStatuses.includes(post.status)) {
        return res.status(400).json({ message: `Cannot approve post with status: ${post.status}` });
      }
      // Only Admin can do final sign-off on Supervisor-pre-approved posts
      if (post.status === 'pending_admin_review' && !isAdmin) {
        return res.status(403).json({ message: 'Final sign-off on Supervisor-approved posts requires Admin role.' });
      }

      // Duplicate detection using tsvector with configurable threshold
      // Default threshold 0.1; Admin can supply custom threshold; Supervisors always get full check
      const similarityThreshold = isAdmin && typeof duplicateThreshold === 'number'
        ? Math.max(0.01, Math.min(duplicateThreshold, 1.0))
        : 0.1;

      if (!forceDuplicate) {
        const titleForSearch = post.title.replace(/'/g, "''");
        const excerptForSearch = (post.excerpt || '').replace(/'/g, "''");
        const searchText = `${titleForSearch} ${excerptForSearch}`;
        
        if (searchText.trim().length > 5) {
          const duplicates = await db.execute(sql`
            SELECT id, title, slug,
              ts_rank(
                to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(excerpt, '')),
                plainto_tsquery('english', ${searchText})
              ) as rank
            FROM cms_blog_posts
            WHERE status = 'published'
              AND id != ${postId}
              AND to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(excerpt, ''))
                  @@ plainto_tsquery('english', ${searchText})
            ORDER BY rank DESC
            LIMIT 5
          `);

          interface DuplicateRow { id: number; title: string; slug: string; rank: string | number; }
          const rows = duplicates.rows as DuplicateRow[];
          const highSimilarity = rows.filter((r) => parseFloat(String(r.rank)) >= similarityThreshold);
          if (highSimilarity.length > 0) {
            return res.status(409).json({
              message: 'Potential duplicate content detected',
              threshold: similarityThreshold,
              duplicates: highSimilarity.map((r) => ({ id: r.id, title: r.title, slug: r.slug, similarity: parseFloat(String(r.rank)) })),
              hint: isAdmin ? 'Pass forceDuplicate: true to override, or set duplicateThreshold to a lower value.' : 'Contact an Admin to override duplicate detection.'
            });
          }
        }
      }

      const approverRole = user?.role ?? 'admin';
      const approverName = user?.username ?? 'unknown';
      await saveVersion(postId, user?.id ?? 1, `Approved by ${approverRole}: ${approverName}`);

      // RBAC publish semantics:
      // - Supervisor: marks post as 'pending_admin_review' (needs Admin final sign-off before publish)
      // - Admin: can publish immediately, schedule, or hold in draft
      let newStatus: string;
      let publishedAt: Date | null | undefined;
      let scheduledPublishAt: Date | null;

      if (!isAdmin) {
        // Supervisor approval — behaviour depends on configurable policy
        if (supervisorRequiresAdminSignoff) {
          // Policy: Supervisor sets post to pending_admin_review; Admin must do final sign-off
          newStatus = 'pending_admin_review';
          publishedAt = post.publishedAt;
          scheduledPublishAt = null;
        } else {
          // Policy disabled: Supervisor can publish directly (immediate only, no scheduling)
          newStatus = publishImmediately ? 'published' : 'draft';
          publishedAt = publishImmediately ? new Date() : post.publishedAt;
          scheduledPublishAt = null;
        }
      } else if (scheduledAt) {
        // Admin with future scheduled publish
        newStatus = 'draft';
        publishedAt = post.publishedAt;
        scheduledPublishAt = new Date(scheduledAt);
      } else if (publishImmediately) {
        // Admin immediate publish
        newStatus = 'published';
        publishedAt = new Date();
        scheduledPublishAt = null;
      } else {
        // Admin approve but keep as draft (e.g. admin reviewed and approved but wants to publish manually)
        newStatus = 'draft';
        publishedAt = post.publishedAt;
        scheduledPublishAt = null;
      }

      const [updated] = await db.update(cmsBlogPosts)
        .set({
          status: newStatus,
          publishedAt: publishedAt ?? null,
          scheduledPublishAt,
          updatedAt: new Date(),
        })
        .where(eq(cmsBlogPosts.id, postId))
        .returning();

      res.json(updated);
    } catch (error: unknown) {
      console.error('Error approving post:', error);
      res.status(500).json({ message: 'Failed to approve post' });
    }
  });

  // Reject post (Admin or Supervisor)
  app.post('/api/cms/blog/posts/:id/reject', ...requireSupervisorOrAdmin, async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.id);
      const user = (req as any).user;
      const { reason } = req.body;

      const [post] = await db.select().from(cmsBlogPosts).where(eq(cmsBlogPosts.id, postId));
      if (!post) return res.status(404).json({ message: 'Post not found' });

      await saveVersion(postId, user?.id ?? 1, `Rejected: ${reason ?? 'No reason provided'}`);

      const [updated] = await db.update(cmsBlogPosts)
        .set({ status: 'rejected', updatedAt: new Date() })
        .where(eq(cmsBlogPosts.id, postId))
        .returning();

      res.json(updated);
    } catch (error: unknown) {
      console.error('Error rejecting post:', error);
      res.status(500).json({ message: 'Failed to reject post' });
    }
  });

  // Get version history for a post
  app.get('/api/cms/blog/posts/:id/versions', ...requireSupervisorOrAdmin, async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.id);
      const versions = await db.select()
        .from(cmsContentVersions)
        .where(eq(cmsContentVersions.postId, postId))
        .orderBy(desc(cmsContentVersions.versionNumber));
      res.json(versions);
    } catch (error: unknown) {
      console.error('Error fetching versions:', error);
      res.status(500).json({ message: 'Failed to fetch versions' });
    }
  });

  // Get diff between two versions of a post
  // Returns field-level changes between versionA and versionB (or versionA and current post)
  app.get('/api/cms/blog/posts/:id/versions/diff', ...requireSupervisorOrAdmin, async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.id);
      const versionA = parseInt(String(req.query.a || '0'));
      const versionB = req.query.b ? parseInt(String(req.query.b)) : null;

      const getVersion = async (vNum: number) => {
        const [v] = await db.select().from(cmsContentVersions)
          .where(and(eq(cmsContentVersions.postId, postId), eq(cmsContentVersions.versionNumber, vNum)));
        return v;
      };

      const verA = await getVersion(versionA);
      if (!verA) return res.status(404).json({ message: `Version ${versionA} not found` });

      let verBData: Record<string, unknown>;
      if (versionB !== null) {
        const verBObj = await getVersion(versionB);
        if (!verBObj) return res.status(404).json({ message: `Version ${versionB} not found` });
        verBData = verBObj as unknown as Record<string, unknown>;
      } else {
        const [currentPost] = await db.select().from(cmsBlogPosts).where(eq(cmsBlogPosts.id, postId));
        if (!currentPost) return res.status(404).json({ message: 'Post not found' });
        verBData = currentPost as unknown as Record<string, unknown>;
      }

      const DIFFABLE_FIELDS = ['title', 'slug', 'excerpt', 'content', 'metaTitle', 'metaDescription', 'metaKeywords', 'status'] as const;
      const changes: Array<{ field: string; from: unknown; to: unknown }> = [];

      for (const field of DIFFABLE_FIELDS) {
        const fromVal = (verA as unknown as Record<string, unknown>)[field];
        const toVal = verBData[field];
        if (fromVal !== toVal) {
          changes.push({ field, from: fromVal, to: toVal });
        }
      }

      res.json({
        postId,
        versionA,
        versionB: versionB ?? 'current',
        changesCount: changes.length,
        changes,
        versionAMeta: { versionNumber: verA.versionNumber, changeNote: verA.changeNote, createdAt: verA.createdAt },
      });
    } catch (error: unknown) {
      console.error('Error generating version diff:', error);
      res.status(500).json({ message: 'Failed to generate version diff' });
    }
  });

  // ============================================================================
  // PROMPT TEMPLATE CRUD ENDPOINTS
  // ============================================================================

  app.get('/api/admin/content/templates', ...requireAdmin, async (req: Request, res: Response) => {
    try {
      const templates = await db.select().from(cmsContentPromptTemplates).orderBy(desc(cmsContentPromptTemplates.createdAt));
      res.json(templates);
    } catch (error: unknown) {
      console.error('Error fetching templates:', error);
      res.status(500).json({ message: 'Failed to fetch templates' });
    }
  });

  app.get('/api/admin/content/templates/:id', ...requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const [tmpl] = await db.select().from(cmsContentPromptTemplates).where(eq(cmsContentPromptTemplates.id, id));
      if (!tmpl) return res.status(404).json({ message: 'Template not found' });
      res.json(tmpl);
    } catch (error: unknown) {
      console.error('Error fetching template:', error);
      res.status(500).json({ message: 'Failed to fetch template' });
    }
  });

  app.post('/api/admin/content/templates', ...requireAdmin, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { name, contentType, tone, length: len, format, promptBody, systemPrompt } = req.body;
      if (!name || !contentType || !promptBody) {
        return res.status(400).json({ message: 'name, contentType, and promptBody are required' });
      }
      const [tmpl] = await db.insert(cmsContentPromptTemplates).values({
        name,
        contentType,
        tone: tone || 'professional',
        length: len || 'medium',
        format: format || 'article',
        promptBody,
        systemPrompt,
        createdBy: user?.id || 1,
      }).returning();
      res.status(201).json(tmpl);
    } catch (error: unknown) {
      console.error('Error creating template:', error);
      res.status(500).json({ message: 'Failed to create template' });
    }
  });

  app.put('/api/admin/content/templates/:id', ...requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { name, contentType, tone, length: len, format, promptBody, systemPrompt, isActive } = req.body;
      const [updated] = await db.update(cmsContentPromptTemplates)
        .set({ name, contentType, tone, length: len, format, promptBody, systemPrompt, isActive, updatedAt: new Date() })
        .where(eq(cmsContentPromptTemplates.id, id))
        .returning();
      if (!updated) return res.status(404).json({ message: 'Template not found' });
      res.json(updated);
    } catch (error: unknown) {
      console.error('Error updating template:', error);
      res.status(500).json({ message: 'Failed to update template' });
    }
  });

  app.delete('/api/admin/content/templates/:id', ...requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(cmsContentPromptTemplates).where(eq(cmsContentPromptTemplates.id, id));
      res.json({ message: 'Template deleted' });
    } catch (error: unknown) {
      console.error('Error deleting template:', error);
      res.status(500).json({ message: 'Failed to delete template' });
    }
  });

  // ============================================================================
  // AI CONTENT PIPELINE TRIGGER & OBSERVABILITY ENDPOINTS
  // ============================================================================

  app.post('/api/admin/content/generate', ...requireAdmin, async (req: Request, res: Response) => {
    try {
      const { aiCmsContentService } = await import('../services/ai-cms-content-service.js');
      const user = (req as any).user;
      const { sourceType, sourceId, templateId, overrides } = req.body;

      if (!sourceType) {
        return res.status(400).json({ message: 'sourceType is required' });
      }

      const result = await aiCmsContentService.enqueueGeneration({
        sourceType,
        sourceId,
        templateId,
        overrides,
        triggeredBy: user?.id || 1,
        authorId: user?.id || 1,
      });

      res.status(202).json({
        message: 'Content generation queued',
        jobId: result.jobId,
        logId: result.logId,
      });
    } catch (error: unknown) {
      console.error('Error queueing content generation:', error);
      res.status(500).json({ message: 'Failed to queue generation', error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get('/api/admin/content/generation-jobs', ...requireAdmin, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await db.select()
        .from(cmsContentGenerationLogs)
        .orderBy(desc(cmsContentGenerationLogs.createdAt))
        .limit(limit);

      const total = logs.length;
      const queued = logs.filter(l => l.status === 'queued').length;
      const processing = logs.filter(l => l.status === 'processing').length;
      const completed = logs.filter(l => l.status === 'completed').length;
      const failed = logs.filter(l => l.status === 'failed').length;
      const completedLogs = logs.filter(l => l.generationTimeMs != null && l.status === 'completed');
      const avgTime = completedLogs.length > 0
        ? Math.round(completedLogs.reduce((sum, l) => sum + (l.generationTimeMs || 0), 0) / completedLogs.length)
        : 0;

      res.json({
        summary: { total, queued, processing, completed, failed, avgGenerationTimeMs: avgTime },
        jobs: logs,
      });
    } catch (error: unknown) {
      console.error('Error fetching generation jobs:', error);
      res.status(500).json({ message: 'Failed to fetch generation jobs' });
    }
  });

  app.get('/api/admin/content/sources', ...requireAdmin, async (req: Request, res: Response) => {
    try {
      const { aiCmsContentService } = await import('../services/ai-cms-content-service.js');
      const sources = await aiCmsContentService.getRecentSources();
      res.json(sources);
    } catch (error: unknown) {
      console.error('Error fetching sources:', error);
      res.status(500).json({ message: 'Failed to fetch sources' });
    }
  });
}
