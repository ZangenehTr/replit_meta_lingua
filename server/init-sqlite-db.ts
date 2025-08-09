import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Create data directory if it doesn't exist
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'metalingua.db'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

console.log('Initializing SQLite database...');

// Create essential tables
const createTables = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT,
  avatar TEXT,
  bio TEXT,
  languages TEXT,
  timezone TEXT,
  country TEXT,
  city TEXT,
  address TEXT,
  postal_code TEXT,
  date_of_birth TEXT,
  gender TEXT,
  emergency_contact TEXT,
  medical_info TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME,
  is_active BOOLEAN DEFAULT 1,
  preferences TEXT,
  permissions TEXT,
  metadata TEXT
);

-- Institute branding table
CREATE TABLE IF NOT EXISTS institute_branding (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  institute_id INTEGER DEFAULT 1,
  name TEXT DEFAULT 'Meta Lingua Institute',
  logo TEXT,
  primary_color TEXT DEFAULT '#4F46E5',
  secondary_color TEXT DEFAULT '#7C3AED',
  accent_color TEXT DEFAULT '#EC4899',
  font_family TEXT DEFAULT 'Inter',
  header_text TEXT,
  footer_text TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  social_links TEXT,
  custom_css TEXT,
  custom_js TEXT,
  favicon TEXT,
  meta_description TEXT,
  meta_keywords TEXT,
  analytics_code TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  language TEXT NOT NULL,
  level TEXT NOT NULL,
  teacher_id INTEGER,
  price REAL DEFAULT 0,
  duration INTEGER,
  max_students INTEGER DEFAULT 20,
  is_active BOOLEAN DEFAULT 1,
  start_date TEXT,
  end_date TEXT,
  schedule TEXT,
  syllabus TEXT,
  requirements TEXT,
  objectives TEXT,
  materials TEXT,
  assessment_method TEXT,
  certificate_template TEXT,
  tags TEXT,
  image_url TEXT,
  video_intro_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id)
);

-- Enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  enrollment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active',
  progress REAL DEFAULT 0,
  grade TEXT,
  completion_date DATETIME,
  certificate_issued BOOLEAN DEFAULT 0,
  certificate_url TEXT,
  notes TEXT,
  attendance_rate REAL DEFAULT 0,
  last_accessed DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  location TEXT,
  meeting_url TEXT,
  teacher_id INTEGER,
  status TEXT DEFAULT 'scheduled',
  attendance_count INTEGER DEFAULT 0,
  materials TEXT,
  recording_url TEXT,
  notes TEXT,
  homework_assigned BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (teacher_id) REFERENCES users(id)
);

-- Admin settings table
CREATE TABLE IF NOT EXISTS admin_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  category TEXT,
  data_type TEXT DEFAULT 'string',
  is_sensitive BOOLEAN DEFAULT 0,
  description TEXT,
  validation_rules TEXT,
  last_modified_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  priority TEXT DEFAULT 'normal',
  is_read BOOLEAN DEFAULT 0,
  read_at DATETIME,
  action_url TEXT,
  action_label TEXT,
  metadata TEXT,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insert default branding if not exists
INSERT OR IGNORE INTO institute_branding (id, institute_id) VALUES (1, 1);

-- Insert default admin user if not exists
INSERT OR IGNORE INTO users (email, name, password, role) 
VALUES ('admin@test.com', 'Admin User', '$2b$10$YourHashedPasswordHere', 'admin');
`;

try {
  db.exec(createTables);
  console.log('✓ Database tables created successfully');
  
  // Check if tables were created
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Created tables:', tables.map((t: any) => t.name).join(', '));
  
} catch (error) {
  console.error('Error creating tables:', error);
}

db.close();
console.log('Database initialization complete');