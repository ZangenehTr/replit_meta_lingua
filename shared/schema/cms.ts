import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, varchar, date, time, bigint, unique } from "drizzle-orm/pg-core";
import { buildInsertSchema } from "./schema-helpers";
import { z } from "zod";
import { users } from "./users";

export const cmsPages = pgTable("cms_pages", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  titleEn: varchar("title_en", { length: 255 }),
  titleFa: varchar("title_fa", { length: 255 }),
  titleAr: varchar("title_ar", { length: 255 }),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  template: varchar("template", { length: 100 }), // Template type (landing, course_showcase, etc.)
  status: varchar("status", { length: 20 }).default("draft").notNull(), // draft, published, archived
  locale: varchar("locale", { length: 10 }).default("en"), // en, fa, ar, both
  direction: varchar("direction", { length: 10 }).default("ltr"), // ltr, rtl, auto
  isHomepage: boolean("is_homepage").default(false),
  metaTitle: varchar("meta_title", { length: 255 }),
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords"),
  ogImage: text("og_image"),
  publishedAt: timestamp("published_at"),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// CMS Page Sections - Individual sections within pages
export const cmsPageSections = pgTable("cms_page_sections", {
  id: serial("id").primaryKey(),
  pageId: integer("page_id").references(() => cmsPages.id).notNull(),
  sectionType: varchar("section_type", { length: 100 }).notNull(), // hero, features, blog_grid, video_gallery, testimonials, cta, etc.
  title: varchar("title", { length: 255 }),
  titleEn: varchar("title_en", { length: 255 }),
  titleFa: varchar("title_fa", { length: 255 }),
  titleAr: varchar("title_ar", { length: 255 }),
  content: jsonb("content").notNull(), // Flexible content structure per section type
  styles: jsonb("styles"), // Section styling (direction, alignment, colors, etc.)
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// CMS Blog Categories
export const cmsBlogCategories = pgTable("cms_blog_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nameEn: varchar("name_en", { length: 255 }),
  nameFa: varchar("name_fa", { length: 255 }),
  nameAr: varchar("name_ar", { length: 255 }),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  descriptionEn: text("description_en"),
  descriptionFa: text("description_fa"),
  descriptionAr: text("description_ar"),
  parentId: integer("parent_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// CMS Blog Tags
export const cmsBlogTags = pgTable("cms_blog_tags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  nameEn: varchar("name_en", { length: 100 }),
  nameFa: varchar("name_fa", { length: 100 }),
  nameAr: varchar("name_ar", { length: 100 }),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// CMS Blog Posts
export const cmsBlogPosts = pgTable("cms_blog_posts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  titleEn: varchar("title_en", { length: 255 }),
  titleFa: varchar("title_fa", { length: 255 }),
  titleAr: varchar("title_ar", { length: 255 }),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  excerpt: text("excerpt"),
  excerptEn: text("excerpt_en"),
  excerptFa: text("excerpt_fa"),
  excerptAr: text("excerpt_ar"),
  content: text("content").notNull(),
  contentEn: text("content_en"),
  contentFa: text("content_fa"),
  contentAr: text("content_ar"),
  featuredImage: text("featured_image"),
  authorId: integer("author_id").references(() => users.id).notNull(),
  categoryId: integer("category_id").references(() => cmsBlogCategories.id),
  status: varchar("status", { length: 20 }).default("draft").notNull(), // draft, published, archived, rejected
  locale: varchar("locale", { length: 10 }).default("en"), // en, fa, ar
  metaTitle: varchar("meta_title", { length: 255 }),
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords"),
  ogImage: text("og_image"),
  viewCount: integer("view_count").default(0),
  publishedAt: timestamp("published_at"),
  // AI generation fields
  aiGenerated: boolean("ai_generated").default(false),
  aiPrompt: text("ai_prompt"),
  aiModel: varchar("ai_model", { length: 100 }),
  aiSourceRef: text("ai_source_ref"),
  scheduledPublishAt: timestamp("scheduled_publish_at"),
  jsonLdBlock: text("json_ld_block"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// CMS Blog Post Tags Junction Table
export const cmsBlogPostTags = pgTable("cms_blog_post_tags", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => cmsBlogPosts.id).notNull(),
  tagId: integer("tag_id").references(() => cmsBlogTags.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// CMS Blog Comments
export const cmsBlogComments = pgTable("cms_blog_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => cmsBlogPosts.id).notNull(),
  authorName: varchar("author_name", { length: 255 }).notNull(),
  authorEmail: varchar("author_email", { length: 255 }).notNull(),
  content: text("content").notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, approved, rejected, spam
  parentId: integer("parent_id"), // For nested comments
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// CMS Videos - Video gallery
export const cmsVideos = pgTable("cms_videos", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  titleEn: varchar("title_en", { length: 255 }),
  titleFa: varchar("title_fa", { length: 255 }),
  titleAr: varchar("title_ar", { length: 255 }),
  description: text("description"),
  descriptionEn: text("description_en"),
  descriptionFa: text("description_fa"),
  descriptionAr: text("description_ar"),
  videoUrl: text("video_url").notNull(), // Local path or embed URL
  videoType: varchar("video_type", { length: 20 }).notNull(), // local, youtube, vimeo
  thumbnail: text("thumbnail"),
  duration: integer("duration"), // Duration in seconds
  category: varchar("category", { length: 100 }),
  locale: varchar("locale", { length: 10 }).default("en"),
  viewCount: integer("view_count").default(0),
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// CMS Media Assets - Unified media library
export const cmsMediaAssets = pgTable("cms_media_assets", {
  id: serial("id").primaryKey(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  filePath: text("file_path").notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(), // image, video, document, audio
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  fileSize: bigint("file_size", { mode: "number" }).notNull(), // Size in bytes
  width: integer("width"),
  height: integer("height"),
  alt: text("alt"),
  altEn: text("alt_en"),
  altFa: text("alt_fa"),
  altAr: text("alt_ar"),
  caption: text("caption"),
  captionEn: text("caption_en"),
  captionFa: text("caption_fa"),
  captionAr: text("caption_ar"),
  uploadedBy: integer("uploaded_by").references(() => users.id).notNull(),
  usageCount: integer("usage_count").default(0), // Track where media is used
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// CMS Page Analytics - Track page views and conversions
export const cmsPageAnalytics = pgTable("cms_page_analytics", {
  id: serial("id").primaryKey(),
  pageId: integer("page_id").references(() => cmsPages.id),
  blogPostId: integer("blog_post_id").references(() => cmsBlogPosts.id),
  videoId: integer("video_id").references(() => cmsVideos.id),
  eventType: varchar("event_type", { length: 50 }).notNull(), // view, cta_click, conversion
  userId: integer("user_id").references(() => users.id),
  sessionId: varchar("session_id", { length: 255 }),
  referrer: text("referrer"),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Custom Fonts - White-label font management for global branding
export const customFonts = pgTable("custom_fonts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  fontFamily: varchar("font_family", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileFormat: varchar("file_format", { length: 50 }).notNull(), // woff2, woff, ttf, otf
  language: varchar("language", { length: 10 }), // fa, en, ar, null for all languages
  isActive: boolean("is_active").default(false),
  displayOrder: integer("display_order").default(0),
  uploadedBy: integer("uploaded_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Insert schemas for CMS
export const insertCmsPageSchema = buildInsertSchema(cmsPages, {
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCmsPageSectionSchema = buildInsertSchema(cmsPageSections, {
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCmsBlogCategorySchema = buildInsertSchema(cmsBlogCategories, {
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCmsBlogTagSchema = buildInsertSchema(cmsBlogTags, {
  id: true,
  createdAt: true
});

export const insertCmsBlogPostSchema = buildInsertSchema(cmsBlogPosts, {
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCmsBlogPostTagSchema = buildInsertSchema(cmsBlogPostTags, {
  id: true,
  createdAt: true
});

export const insertCmsBlogCommentSchema = buildInsertSchema(cmsBlogComments, {
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCmsVideoSchema = buildInsertSchema(cmsVideos, {
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCmsMediaAssetSchema = buildInsertSchema(cmsMediaAssets, {
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCmsPageAnalyticsSchema = buildInsertSchema(cmsPageAnalytics, {
  id: true,
  createdAt: true
});

export const insertCustomFontSchema = buildInsertSchema(customFonts, {
  id: true,
  createdAt: true,
  updatedAt: true
});

// Types for CMS
export type CmsPage = typeof cmsPages.$inferSelect;
export type InsertCmsPage = z.infer<typeof insertCmsPageSchema>;
export type CmsPageSection = typeof cmsPageSections.$inferSelect;
export type InsertCmsPageSection = z.infer<typeof insertCmsPageSectionSchema>;
export type CmsBlogCategory = typeof cmsBlogCategories.$inferSelect;
export type InsertCmsBlogCategory = z.infer<typeof insertCmsBlogCategorySchema>;
export type CmsBlogTag = typeof cmsBlogTags.$inferSelect;
export type InsertCmsBlogTag = z.infer<typeof insertCmsBlogTagSchema>;
export type CmsBlogPost = typeof cmsBlogPosts.$inferSelect;
export type InsertCmsBlogPost = z.infer<typeof insertCmsBlogPostSchema>;
export type CmsBlogPostTag = typeof cmsBlogPostTags.$inferSelect;
export type InsertCmsBlogPostTag = z.infer<typeof insertCmsBlogPostTagSchema>;
export type CmsBlogComment = typeof cmsBlogComments.$inferSelect;
export type InsertCmsBlogComment = z.infer<typeof insertCmsBlogCommentSchema>;
export type CmsVideo = typeof cmsVideos.$inferSelect;
export type InsertCmsVideo = z.infer<typeof insertCmsVideoSchema>;
export type CmsMediaAsset = typeof cmsMediaAssets.$inferSelect;
export type InsertCmsMediaAsset = z.infer<typeof insertCmsMediaAssetSchema>;
export type CmsPageAnalytics = typeof cmsPageAnalytics.$inferSelect;
export type InsertCmsPageAnalytics = z.infer<typeof insertCmsPageAnalyticsSchema>;
export type CustomFont = typeof customFonts.$inferSelect;
export type InsertCustomFont = z.infer<typeof insertCustomFontSchema>;

// ============================================================================
// AI CONTENT PIPELINE TABLES

// Content version history
export const cmsContentVersions = pgTable("cms_content_versions", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => cmsBlogPosts.id).notNull(),
  versionNumber: integer("version_number").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  metaTitle: varchar("meta_title", { length: 255 }),
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords"),
  status: varchar("status", { length: 20 }).notNull(),
  changedBy: integer("changed_by").references(() => users.id).notNull(),
  changeNote: text("change_note"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Prompt templates for AI content generation
export const cmsContentPromptTemplates = pgTable("cms_content_prompt_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  contentType: varchar("content_type", { length: 50 }).notNull(), // blog, landing, qa
  tone: varchar("tone", { length: 50 }).notNull().default("professional"), // professional, casual, educational, etc.
  length: varchar("length", { length: 20 }).notNull().default("medium"), // short, medium, long
  format: varchar("format", { length: 50 }).notNull().default("article"), // article, list, qa, etc.
  promptBody: text("prompt_body").notNull(),
  systemPrompt: text("system_prompt"),
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Generation job logs for observability
export const cmsContentGenerationLogs = pgTable("cms_content_generation_logs", {
  id: serial("id").primaryKey(),
  jobId: varchar("job_id", { length: 255 }),
  postId: integer("post_id").references(() => cmsBlogPosts.id),
  templateId: integer("template_id").references(() => cmsContentPromptTemplates.id),
  sourceType: varchar("source_type", { length: 50 }), // market_trend, competitor_price, faq_keyword, manual
  sourceId: integer("source_id"),
  status: varchar("status", { length: 20 }).notNull().default("queued"), // queued, processing, completed, failed
  model: varchar("model", { length: 100 }),
  generationTimeMs: integer("generation_time_ms"),
  promptUsed: text("prompt_used"),
  errorMessage: text("error_message"),
  triggeredBy: integer("triggered_by").references(() => users.id),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertCmsContentVersionSchema = buildInsertSchema(cmsContentVersions, {
  id: true,
  createdAt: true
});

export const insertCmsContentPromptTemplateSchema = buildInsertSchema(cmsContentPromptTemplates, {
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCmsContentGenerationLogSchema = buildInsertSchema(cmsContentGenerationLogs, {
  id: true,
  createdAt: true
});

export type CmsContentVersion = typeof cmsContentVersions.$inferSelect;
export type InsertCmsContentVersion = z.infer<typeof insertCmsContentVersionSchema>;
export type CmsContentPromptTemplate = typeof cmsContentPromptTemplates.$inferSelect;
export type InsertCmsContentPromptTemplate = z.infer<typeof insertCmsContentPromptTemplateSchema>;
export type CmsContentGenerationLog = typeof cmsContentGenerationLogs.$inferSelect;
export type InsertCmsContentGenerationLog = z.infer<typeof insertCmsContentGenerationLogSchema>;

// ============================================================================
// SITE LANDING PAGES — per-program CMS-editable content (IELTS/TOEFL/GRE/PTE/Conversation)

export const siteLandingPages = pgTable("site_landing_pages", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  programName: varchar("program_name", { length: 255 }).notNull(),
  heroTitle: text("hero_title").notNull(),
  heroSubtitle: text("hero_subtitle"),
  heroCtaPrimary: varchar("hero_cta_primary", { length: 255 }),
  heroCtaSecondary: varchar("hero_cta_secondary", { length: 255 }),
  targetAudienceBullets: jsonb("target_audience_bullets").$type<string[]>().default([]),
  examTipsHtml: text("exam_tips_html"),
  testimonials: jsonb("testimonials").$type<Array<{quote: string; studentName: string; score: string; examType: string}>>().default([]),
  faqItems: jsonb("faq_items").$type<Array<{q: string; a: string}>>().default([]),
  seoTitle: varchar("seo_title", { length: 255 }),
  seoDescription: text("seo_description"),
  seoKeywords: text("seo_keywords").array().default([]),
  featureBullets: jsonb("feature_bullets").$type<string[]>().default([]),
  isPublished: boolean("is_published").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertSiteLandingPageSchema = buildInsertSchema(siteLandingPages, {
  id: true,
  createdAt: true,
  updatedAt: true
});

export type SiteLandingPage = typeof siteLandingPages.$inferSelect;
export type InsertSiteLandingPage = z.infer<typeof insertSiteLandingPageSchema>;

