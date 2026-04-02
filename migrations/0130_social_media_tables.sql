-- Manual migration for Social Media & Marketing tables
-- Created: 2025-10-06
-- Reason: drizzle-kit push timeout on large schema (80+ tables)

-- Marketing Campaigns table
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  budget BIGINT DEFAULT 0,
  spent BIGINT DEFAULT 0,
  target_audience VARCHAR(255),
  channels TEXT[] DEFAULT '{}',
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  cost_per_lead BIGINT DEFAULT 0,
  roi DECIMAL(10,2) DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  iranian_compliance BOOLEAN DEFAULT TRUE,
  created_by INTEGER REFERENCES users(id),
  last_modified_by INTEGER REFERENCES users(id),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Platform Credentials table
CREATE TABLE IF NOT EXISTS platform_credentials (
  id SERIAL PRIMARY KEY,
  platform VARCHAR(50) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  account_handle VARCHAR(255),
  credential_type VARCHAR(50) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  api_key TEXT,
  api_secret TEXT,
  token_expiry TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  last_verified TIMESTAMP,
  permissions TEXT[] DEFAULT '{}',
  metadata JSONB,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Scheduled Posts table
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES marketing_campaigns(id),
  platforms TEXT[] NOT NULL,
  post_type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  media TEXT[] DEFAULT '{}',
  hashtags TEXT[] DEFAULT '{}',
  mentions TEXT[] DEFAULT '{}',
  scheduled_for TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled',
  published_at TIMESTAMP,
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_prompt TEXT,
  language VARCHAR(10) DEFAULT 'fa',
  target_audience VARCHAR(255),
  priority VARCHAR(20) DEFAULT 'normal',
  created_by INTEGER REFERENCES users(id),
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Social Media Posts table
CREATE TABLE IF NOT EXISTS social_media_posts (
  id SERIAL PRIMARY KEY,
  scheduled_post_id INTEGER REFERENCES scheduled_posts(id),
  campaign_id INTEGER REFERENCES marketing_campaigns(id),
  platform VARCHAR(50) NOT NULL,
  platform_post_id VARCHAR(255),
  post_type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  media TEXT[] DEFAULT '{}',
  hashtags TEXT[] DEFAULT '{}',
  mentions TEXT[] DEFAULT '{}',
  published_at TIMESTAMP DEFAULT NOW() NOT NULL,
  status VARCHAR(20) DEFAULT 'published',
  impressions BIGINT DEFAULT 0,
  reach BIGINT DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  language VARCHAR(10) DEFAULT 'fa',
  created_by INTEGER REFERENCES users(id),
  metadata JSONB,
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Social Media Analytics table
CREATE TABLE IF NOT EXISTS social_media_analytics (
  id SERIAL PRIMARY KEY,
  platform VARCHAR(50) NOT NULL,
  date TIMESTAMP NOT NULL,
  campaign_id INTEGER REFERENCES marketing_campaigns(id),
  followers INTEGER DEFAULT 0,
  followers_growth INTEGER DEFAULT 0,
  impressions BIGINT DEFAULT 0,
  reach BIGINT DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  profile_views INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  top_performing_post VARCHAR(255),
  iranian_audience DECIMAL(5,2),
  demographics JSONB,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Email Campaigns table
CREATE TABLE IF NOT EXISTS email_campaigns (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES marketing_campaigns(id),
  subject VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  html_content TEXT,
  sender_name VARCHAR(255) DEFAULT 'Meta Lingua',
  sender_email VARCHAR(255) NOT NULL,
  reply_to VARCHAR(255),
  recipient_type VARCHAR(50) NOT NULL,
  recipient_list TEXT[] DEFAULT '{}',
  scheduled_for TIMESTAMP,
  sent_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'draft',
  total_recipients INTEGER DEFAULT 0,
  successful_sends INTEGER DEFAULT 0,
  failed_sends INTEGER DEFAULT 0,
  opened INTEGER DEFAULT 0,
  clicked INTEGER DEFAULT 0,
  bounced INTEGER DEFAULT 0,
  unsubscribed INTEGER DEFAULT 0,
  open_rate DECIMAL(5,2) DEFAULT 0,
  click_rate DECIMAL(5,2) DEFAULT 0,
  bounce_rate DECIMAL(5,2) DEFAULT 0,
  attachments TEXT[] DEFAULT '{}',
  created_by INTEGER REFERENCES users(id),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Telegram Messages table
CREATE TABLE IF NOT EXISTS telegram_messages (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES marketing_campaigns(id),
  channel_id VARCHAR(255) NOT NULL,
  message_type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  media TEXT[] DEFAULT '{}',
  buttons JSONB,
  scheduled_for TIMESTAMP,
  sent_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'draft',
  telegram_message_id VARCHAR(255),
  views INTEGER DEFAULT 0,
  forwards INTEGER DEFAULT 0,
  reactions JSONB,
  auto_reply BOOLEAN DEFAULT FALSE,
  auto_reply_rules JSONB,
  created_by INTEGER REFERENCES users(id),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_type ON marketing_campaigns(type);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_created_by ON marketing_campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_platform_credentials_platform ON platform_credentials(platform);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_campaign ON scheduled_posts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_for ON scheduled_posts(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_social_media_posts_platform ON social_media_posts(platform);
CREATE INDEX IF NOT EXISTS idx_social_media_posts_campaign ON social_media_posts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_social_media_analytics_platform_date ON social_media_analytics(platform, date);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_telegram_messages_status ON telegram_messages(status);
