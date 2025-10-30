import type { Express, Request, Response } from "express";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import type { IStorage } from "./storage";
import { 
  insertCmsPageSchema, 
  insertCmsPageSectionSchema,
  insertCmsBlogCategorySchema,
  insertCmsBlogTagSchema,
  insertCmsBlogPostSchema,
  insertCmsVideoSchema,
  insertCmsMediaAssetSchema,
  insertCmsPageAnalyticsSchema
} from "@shared/schema";

const CMS_UPLOAD_DIR = 'uploads/cms-media';

if (!fs.existsSync(CMS_UPLOAD_DIR)) {
  fs.mkdirSync(CMS_UPLOAD_DIR, { recursive: true });
}

const cmsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, CMS_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const cmsUpload = multer({
  storage: cmsStorage,
  limits: {
    fileSize: 50 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|webm|mov|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, videos, and documents are allowed.'));
    }
  }
});

export function registerCmsRoutes(app: Express, storage: IStorage) {
  
  // ========================================================================
  // CMS PAGES ROUTES
  // ========================================================================
  
  app.get('/api/cms/pages', async (req, res) => {
    try {
      const { status, locale, isHomepage } = req.query;
      const pages = await storage.getCmsPages({
        status: status as string | undefined,
        locale: locale as string | undefined,
        isHomepage: isHomepage === 'true' ? true : isHomepage === 'false' ? false : undefined
      });
      res.json(pages);
    } catch (error) {
      console.error('Error fetching CMS pages:', error);
      res.status(500).json({ error: 'Failed to fetch CMS pages' });
    }
  });

  app.get('/api/cms/pages/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const page = await storage.getCmsPage(parseInt(id));
      if (!page) {
        return res.status(404).json({ error: 'Page not found' });
      }
      res.json(page);
    } catch (error) {
      console.error('Error fetching CMS page:', error);
      res.status(500).json({ error: 'Failed to fetch CMS page' });
    }
  });

  app.get('/api/cms/pages/slug/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const page = await storage.getCmsPageBySlug(slug);
      if (!page) {
        return res.status(404).json({ error: 'Page not found' });
      }
      res.json(page);
    } catch (error) {
      console.error('Error fetching CMS page by slug:', error);
      res.status(500).json({ error: 'Failed to fetch CMS page' });
    }
  });

  app.post('/api/cms/pages', async (req, res) => {
    try {
      const validatedData = insertCmsPageSchema.parse(req.body);
      const page = await storage.createCmsPage(validatedData);
      res.status(201).json(page);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      console.error('Error creating CMS page:', error);
      res.status(500).json({ error: 'Failed to create CMS page' });
    }
  });

  app.put('/api/cms/pages/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const page = await storage.updateCmsPage(parseInt(id), updates);
      if (!page) {
        return res.status(404).json({ error: 'Page not found' });
      }
      res.json(page);
    } catch (error) {
      console.error('Error updating CMS page:', error);
      res.status(500).json({ error: 'Failed to update CMS page' });
    }
  });

  app.delete('/api/cms/pages/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCmsPage(parseInt(id));
      res.json({ message: 'Page deleted successfully' });
    } catch (error) {
      console.error('Error deleting CMS page:', error);
      res.status(500).json({ error: 'Failed to delete CMS page' });
    }
  });

  app.post('/api/cms/pages/:id/publish', async (req, res) => {
    try {
      const { id } = req.params;
      const page = await storage.publishCmsPage(parseInt(id));
      if (!page) {
        return res.status(404).json({ error: 'Page not found' });
      }
      res.json(page);
    } catch (error) {
      console.error('Error publishing CMS page:', error);
      res.status(500).json({ error: 'Failed to publish CMS page' });
    }
  });

  // ========================================================================
  // CMS PAGE SECTIONS ROUTES
  // ========================================================================

  app.get('/api/cms/pages/:id/sections', async (req, res) => {
    try {
      const { id } = req.params;
      const sections = await storage.getCmsPageSections(parseInt(id));
      res.json(sections);
    } catch (error) {
      console.error('Error fetching page sections:', error);
      res.status(500).json({ error: 'Failed to fetch page sections' });
    }
  });

  app.post('/api/cms/pages/:id/sections', async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertCmsPageSectionSchema.parse({
        ...req.body,
        pageId: parseInt(id)
      });
      const section = await storage.createCmsPageSection(validatedData);
      res.status(201).json(section);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      console.error('Error creating page section:', error);
      res.status(500).json({ error: 'Failed to create page section' });
    }
  });

  app.put('/api/cms/sections/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const section = await storage.updateCmsPageSection(parseInt(id), updates);
      if (!section) {
        return res.status(404).json({ error: 'Section not found' });
      }
      res.json(section);
    } catch (error) {
      console.error('Error updating page section:', error);
      res.status(500).json({ error: 'Failed to update page section' });
    }
  });

  app.delete('/api/cms/sections/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCmsPageSection(parseInt(id));
      res.json({ message: 'Section deleted successfully' });
    } catch (error) {
      console.error('Error deleting page section:', error);
      res.status(500).json({ error: 'Failed to delete page section' });
    }
  });

  // ========================================================================
  // CMS BLOG CATEGORIES ROUTES
  // ========================================================================

  app.get('/api/cms/blog/categories', async (req, res) => {
    try {
      const categories = await storage.getBlogCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching blog categories:', error);
      res.status(500).json({ error: 'Failed to fetch blog categories' });
    }
  });

  app.post('/api/cms/blog/categories', async (req, res) => {
    try {
      const validatedData = insertCmsBlogCategorySchema.parse(req.body);
      const category = await storage.createBlogCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      console.error('Error creating blog category:', error);
      res.status(500).json({ error: 'Failed to create blog category' });
    }
  });

  app.put('/api/cms/blog/categories/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const category = await storage.updateBlogCategory(parseInt(id), updates);
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
      res.json(category);
    } catch (error) {
      console.error('Error updating blog category:', error);
      res.status(500).json({ error: 'Failed to update blog category' });
    }
  });

  app.delete('/api/cms/blog/categories/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteBlogCategory(parseInt(id));
      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Error deleting blog category:', error);
      res.status(500).json({ error: 'Failed to delete blog category' });
    }
  });

  // ========================================================================
  // CMS BLOG TAGS ROUTES
  // ========================================================================

  app.get('/api/cms/blog/tags', async (req, res) => {
    try {
      const tags = await storage.getBlogTags();
      res.json(tags);
    } catch (error) {
      console.error('Error fetching blog tags:', error);
      res.status(500).json({ error: 'Failed to fetch blog tags' });
    }
  });

  app.post('/api/cms/blog/tags', async (req, res) => {
    try {
      const validatedData = insertCmsBlogTagSchema.parse(req.body);
      const tag = await storage.createBlogTag(validatedData);
      res.status(201).json(tag);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      console.error('Error creating blog tag:', error);
      res.status(500).json({ error: 'Failed to create blog tag' });
    }
  });

  // ========================================================================
  // CMS BLOG POSTS ROUTES
  // ========================================================================

  app.get('/api/cms/blog/posts', async (req, res) => {
    try {
      const { status, locale, categoryId, authorId } = req.query;
      const posts = await storage.getBlogPosts({
        status: status as string | undefined,
        locale: locale as string | undefined,
        categoryId: categoryId ? parseInt(categoryId as string) : undefined,
        authorId: authorId ? parseInt(authorId as string) : undefined
      });
      res.json(posts);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      res.status(500).json({ error: 'Failed to fetch blog posts' });
    }
  });

  app.get('/api/cms/blog/posts/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const post = await storage.getBlogPost(parseInt(id));
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      res.json(post);
    } catch (error) {
      console.error('Error fetching blog post:', error);
      res.status(500).json({ error: 'Failed to fetch blog post' });
    }
  });

  app.get('/api/cms/blog/posts/slug/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const post = await storage.getBlogPostBySlug(slug);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      res.json(post);
    } catch (error) {
      console.error('Error fetching blog post by slug:', error);
      res.status(500).json({ error: 'Failed to fetch blog post' });
    }
  });

  app.post('/api/cms/blog/posts', async (req, res) => {
    try {
      const validatedData = insertCmsBlogPostSchema.parse(req.body);
      const post = await storage.createBlogPost(validatedData);
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      console.error('Error creating blog post:', error);
      res.status(500).json({ error: 'Failed to create blog post' });
    }
  });

  app.put('/api/cms/blog/posts/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const post = await storage.updateBlogPost(parseInt(id), updates);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      res.json(post);
    } catch (error) {
      console.error('Error updating blog post:', error);
      res.status(500).json({ error: 'Failed to update blog post' });
    }
  });

  app.delete('/api/cms/blog/posts/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteBlogPost(parseInt(id));
      res.json({ message: 'Post deleted successfully' });
    } catch (error) {
      console.error('Error deleting blog post:', error);
      res.status(500).json({ error: 'Failed to delete blog post' });
    }
  });

  // ========================================================================
  // CMS VIDEOS ROUTES
  // ========================================================================

  app.get('/api/cms/videos', async (req, res) => {
    try {
      const { isActive, locale, category } = req.query;
      const videos = await storage.getVideos({
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        locale: locale as string | undefined,
        category: category as string | undefined
      });
      res.json(videos);
    } catch (error) {
      console.error('Error fetching videos:', error);
      res.status(500).json({ error: 'Failed to fetch videos' });
    }
  });

  app.get('/api/cms/videos/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const video = await storage.getVideo(parseInt(id));
      if (!video) {
        return res.status(404).json({ error: 'Video not found' });
      }
      res.json(video);
    } catch (error) {
      console.error('Error fetching video:', error);
      res.status(500).json({ error: 'Failed to fetch video' });
    }
  });

  app.post('/api/cms/videos', async (req, res) => {
    try {
      const validatedData = insertCmsVideoSchema.parse(req.body);
      const video = await storage.createVideo(validatedData);
      res.status(201).json(video);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      console.error('Error creating video:', error);
      res.status(500).json({ error: 'Failed to create video' });
    }
  });

  app.put('/api/cms/videos/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const video = await storage.updateVideo(parseInt(id), updates);
      if (!video) {
        return res.status(404).json({ error: 'Video not found' });
      }
      res.json(video);
    } catch (error) {
      console.error('Error updating video:', error);
      res.status(500).json({ error: 'Failed to update video' });
    }
  });

  app.delete('/api/cms/videos/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteVideo(parseInt(id));
      res.json({ message: 'Video deleted successfully' });
    } catch (error) {
      console.error('Error deleting video:', error);
      res.status(500).json({ error: 'Failed to delete video' });
    }
  });

  // ========================================================================
  // CMS MEDIA ASSETS ROUTES
  // ========================================================================

  app.get('/api/cms/media', async (req, res) => {
    try {
      const { fileType, uploadedBy } = req.query;
      const assets = await storage.getMediaAssets({
        fileType: fileType as string | undefined,
        uploadedBy: uploadedBy ? parseInt(uploadedBy as string) : undefined
      });
      res.json(assets);
    } catch (error) {
      console.error('Error fetching media assets:', error);
      res.status(500).json({ error: 'Failed to fetch media assets' });
    }
  });

  app.get('/api/cms/media/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const asset = await storage.getMediaAsset(parseInt(id));
      if (!asset) {
        return res.status(404).json({ error: 'Media asset not found' });
      }
      res.json(asset);
    } catch (error) {
      console.error('Error fetching media asset:', error);
      res.status(500).json({ error: 'Failed to fetch media asset' });
    }
  });

  app.post('/api/cms/media/upload', cmsUpload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { altText, description, uploadedBy } = req.body;
      
      const fileTypeMap: Record<string, string> = {
        'image/jpeg': 'image',
        'image/jpg': 'image',
        'image/png': 'image',
        'image/gif': 'image',
        'image/webp': 'image',
        'video/mp4': 'video',
        'video/webm': 'video',
        'video/quicktime': 'video',
        'application/pdf': 'document',
        'application/msword': 'document',
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

      res.status(201).json({
        message: 'File uploaded successfully',
        asset
      });
    } catch (error) {
      console.error('Error uploading media:', error);
      res.status(500).json({ error: 'Failed to upload media' });
    }
  });

  // ========================================================================
  // CMS PAGE ANALYTICS ROUTES
  // ========================================================================

  app.post('/api/cms/analytics/track', async (req, res) => {
    try {
      const validatedData = insertCmsPageAnalyticsSchema.parse(req.body);
      const analytics = await storage.trackPageAnalytics(validatedData);
      res.status(201).json(analytics);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      console.error('Error tracking analytics:', error);
      res.status(500).json({ error: 'Failed to track analytics' });
    }
  });

  app.get('/api/cms/analytics', async (req, res) => {
    try {
      const { pageId, blogPostId, videoId, dateFrom, dateTo } = req.query;
      const analytics = await storage.getPageAnalytics({
        pageId: pageId ? parseInt(pageId as string) : undefined,
        blogPostId: blogPostId ? parseInt(blogPostId as string) : undefined,
        videoId: videoId ? parseInt(videoId as string) : undefined,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined
      });
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  // ========================================================================
  // SEO ROUTES
  // ========================================================================

  app.get('/api/seo/sitemap.xml', async (req, res) => {
    try {
      const pages = await storage.getCmsPages({ status: 'published' });
      const posts = await storage.getBlogPosts({ status: 'published' });
      
      const domain = req.get('host') || 'localhost';
      const protocol = req.protocol;
      
      let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
      sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
      
      for (const page of pages) {
        sitemap += '  <url>\n';
        sitemap += `    <loc>${protocol}://${domain}/pages/${page.slug}</loc>\n`;
        sitemap += `    <lastmod>${page.updatedAt?.toISOString() || new Date().toISOString()}</lastmod>\n`;
        sitemap += '    <changefreq>weekly</changefreq>\n';
        sitemap += '    <priority>0.8</priority>\n';
        sitemap += '  </url>\n';
      }
      
      for (const post of posts) {
        sitemap += '  <url>\n';
        sitemap += `    <loc>${protocol}://${domain}/blog/${post.slug}</loc>\n`;
        sitemap += `    <lastmod>${post.updatedAt?.toISOString() || new Date().toISOString()}</lastmod>\n`;
        sitemap += '    <changefreq>monthly</changefreq>\n';
        sitemap += '    <priority>0.6</priority>\n';
        sitemap += '  </url>\n';
      }
      
      sitemap += '</urlset>';
      
      res.header('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      res.status(500).json({ error: 'Failed to generate sitemap' });
    }
  });

  app.get('/robots.txt', (req, res) => {
    const domain = req.get('host') || 'localhost';
    const protocol = req.protocol;
    
    const robotsTxt = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/

Sitemap: ${protocol}://${domain}/api/seo/sitemap.xml
`;
    
    res.header('Content-Type', 'text/plain');
    res.send(robotsTxt);
  });
}
