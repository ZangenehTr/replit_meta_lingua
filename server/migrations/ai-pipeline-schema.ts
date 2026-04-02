import { db } from '../db';
import { sql } from 'drizzle-orm';

export async function runAIPipelineMigration() {
  console.log('[Migration] Running AI pipeline schema migration...');

  await db.execute(sql`
    ALTER TABLE cms_blog_posts
      ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS ai_prompt TEXT,
      ADD COLUMN IF NOT EXISTS ai_model VARCHAR(100),
      ADD COLUMN IF NOT EXISTS ai_source_ref TEXT,
      ADD COLUMN IF NOT EXISTS scheduled_publish_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS json_ld_block TEXT
  `);

  // Add configurable supervisor sign-off policy to admin_settings
  await db.execute(sql`
    ALTER TABLE admin_settings
      ADD COLUMN IF NOT EXISTS cms_supervisor_requires_admin_signoff BOOLEAN DEFAULT TRUE
  `);
  console.log('[Migration] cms_blog_posts columns added');

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS cms_content_versions (
      id SERIAL PRIMARY KEY,
      post_id INTEGER NOT NULL REFERENCES cms_blog_posts(id),
      version_number INTEGER NOT NULL,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL,
      excerpt TEXT,
      content TEXT NOT NULL,
      meta_title VARCHAR(255),
      meta_description TEXT,
      meta_keywords TEXT,
      status VARCHAR(20) NOT NULL,
      changed_by INTEGER REFERENCES users(id),
      change_note TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);
  console.log('[Migration] cms_content_versions table created');

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS cms_content_prompt_templates (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      content_type VARCHAR(50) NOT NULL,
      tone VARCHAR(50) NOT NULL DEFAULT 'professional',
      length VARCHAR(20) NOT NULL DEFAULT 'medium',
      format VARCHAR(50) NOT NULL DEFAULT 'article',
      prompt_body TEXT NOT NULL,
      system_prompt TEXT,
      is_active BOOLEAN DEFAULT TRUE NOT NULL,
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);
  console.log('[Migration] cms_content_prompt_templates table created');

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS cms_content_generation_logs (
      id SERIAL PRIMARY KEY,
      job_id VARCHAR(255),
      post_id INTEGER REFERENCES cms_blog_posts(id),
      template_id INTEGER REFERENCES cms_content_prompt_templates(id),
      source_type VARCHAR(50),
      source_id INTEGER,
      status VARCHAR(20) NOT NULL DEFAULT 'queued',
      model VARCHAR(100),
      generation_time_ms INTEGER,
      prompt_used TEXT,
      error_message TEXT,
      triggered_by INTEGER REFERENCES users(id),
      started_at TIMESTAMP,
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);
  console.log('[Migration] cms_content_generation_logs table created');

  console.log('[Migration] AI pipeline schema migration completed');
}
