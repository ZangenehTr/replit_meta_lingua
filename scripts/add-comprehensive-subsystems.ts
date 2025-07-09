import { sql } from 'drizzle-orm';
import { db } from '../server/db';

async function addComprehensiveSubsystems() {
  console.log('Starting database migration for comprehensive subsystems...');

  try {
    // 1. Testing Subsystem Tables
    console.log('Creating testing subsystem tables...');
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS tests (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        course_id INTEGER REFERENCES courses(id),
        teacher_id INTEGER REFERENCES users(id),
        test_type VARCHAR(50) NOT NULL,
        language VARCHAR(10) NOT NULL,
        level VARCHAR(20) NOT NULL,
        passing_score INTEGER DEFAULT 60,
        time_limit INTEGER,
        max_attempts INTEGER DEFAULT 1,
        randomize_questions BOOLEAN DEFAULT false,
        show_results BOOLEAN DEFAULT true,
        show_correct_answers BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        scheduled_date TIMESTAMP,
        due_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS test_questions (
        id SERIAL PRIMARY KEY,
        test_id INTEGER NOT NULL REFERENCES tests(id),
        question_type VARCHAR(50) NOT NULL,
        question_text TEXT NOT NULL,
        question_audio VARCHAR(500),
        question_image VARCHAR(500),
        points INTEGER DEFAULT 1,
        "order" INTEGER NOT NULL,
        options JSONB,
        blanks_data JSONB,
        matching_pairs JSONB,
        ordering_items JSONB,
        model_answer TEXT,
        grading_criteria JSONB,
        recording_prompt TEXT,
        max_recording_duration INTEGER,
        explanation TEXT,
        skill_category VARCHAR(50),
        difficulty VARCHAR(20) DEFAULT 'medium',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS test_attempts (
        id SERIAL PRIMARY KEY,
        test_id INTEGER NOT NULL REFERENCES tests(id),
        student_id INTEGER NOT NULL REFERENCES users(id),
        attempt_number INTEGER DEFAULT 1,
        started_at TIMESTAMP DEFAULT NOW() NOT NULL,
        completed_at TIMESTAMP,
        time_spent INTEGER,
        score DECIMAL(5,2),
        percentage DECIMAL(5,2),
        status VARCHAR(20) DEFAULT 'in_progress',
        feedback TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS test_answers (
        id SERIAL PRIMARY KEY,
        attempt_id INTEGER NOT NULL REFERENCES test_attempts(id),
        question_id INTEGER NOT NULL REFERENCES test_questions(id),
        selected_option_id INTEGER,
        boolean_answer BOOLEAN,
        text_answer TEXT,
        matching_answer JSONB,
        ordering_answer JSONB,
        recording_url VARCHAR(500),
        is_correct BOOLEAN,
        points_earned DECIMAL(5,2),
        feedback TEXT,
        graded_by INTEGER REFERENCES users(id),
        graded_at TIMESTAMP,
        answered_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // 2. Gamification Tables
    console.log('Creating gamification tables...');

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        game_name VARCHAR(255) NOT NULL,
        game_code VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        game_type VARCHAR(50) NOT NULL,
        age_group VARCHAR(20) NOT NULL,
        min_level VARCHAR(10) NOT NULL,
        max_level VARCHAR(10) NOT NULL,
        language VARCHAR(10) NOT NULL,
        game_mode VARCHAR(50) NOT NULL,
        duration INTEGER,
        points_per_correct INTEGER DEFAULT 10,
        bonus_multiplier DECIMAL(3,2) DEFAULT 1.0,
        lives_system BOOLEAN DEFAULT false,
        timer_enabled BOOLEAN DEFAULT false,
        thumbnail_url VARCHAR(500),
        background_image VARCHAR(500),
        sound_effects JSONB,
        total_levels INTEGER DEFAULT 10,
        unlock_requirements JSONB,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS game_levels (
        id SERIAL PRIMARY KEY,
        game_id INTEGER NOT NULL REFERENCES games(id),
        level_number INTEGER NOT NULL,
        level_name VARCHAR(100),
        language_level VARCHAR(10) NOT NULL,
        content_type VARCHAR(50) NOT NULL,
        content_data JSONB NOT NULL,
        difficulty VARCHAR(20) DEFAULT 'medium',
        speed_multiplier DECIMAL(3,2) DEFAULT 1.0,
        item_count INTEGER DEFAULT 10,
        xp_reward INTEGER DEFAULT 50,
        coins_reward INTEGER DEFAULT 10,
        badge_id INTEGER REFERENCES achievements(id),
        passing_score INTEGER DEFAULT 70,
        stars_thresholds JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_game_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        game_id INTEGER NOT NULL REFERENCES games(id),
        current_level INTEGER DEFAULT 1,
        total_score INTEGER DEFAULT 0,
        total_xp_earned INTEGER DEFAULT 0,
        total_coins_earned INTEGER DEFAULT 0,
        total_play_time INTEGER DEFAULT 0,
        sessions_played INTEGER DEFAULT 0,
        accuracy DECIMAL(5,2),
        average_speed DECIMAL(5,2),
        longest_streak INTEGER DEFAULT 0,
        perfect_levels INTEGER DEFAULT 0,
        last_played_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS game_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        game_id INTEGER NOT NULL REFERENCES games(id),
        level_id INTEGER REFERENCES game_levels(id),
        started_at TIMESTAMP DEFAULT NOW() NOT NULL,
        ended_at TIMESTAMP,
        duration INTEGER,
        score INTEGER DEFAULT 0,
        correct_answers INTEGER DEFAULT 0,
        wrong_answers INTEGER DEFAULT 0,
        accuracy DECIMAL(5,2),
        stars_earned INTEGER DEFAULT 0,
        xp_earned INTEGER DEFAULT 0,
        coins_earned INTEGER DEFAULT 0,
        new_badges JSONB,
        game_state JSONB,
        is_completed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS game_leaderboards (
        id SERIAL PRIMARY KEY,
        game_id INTEGER NOT NULL REFERENCES games(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        leaderboard_type VARCHAR(50) NOT NULL,
        period VARCHAR(20),
        score INTEGER NOT NULL,
        rank INTEGER,
        games_played INTEGER DEFAULT 1,
        perfect_games INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // 3. Video-based Courses Tables
    console.log('Creating video learning tables...');

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS video_lessons (
        id SERIAL PRIMARY KEY,
        course_id INTEGER REFERENCES courses(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        video_url VARCHAR(500) NOT NULL,
        thumbnail_url VARCHAR(500),
        duration INTEGER NOT NULL,
        module_id INTEGER,
        order_index INTEGER NOT NULL,
        language VARCHAR(10) NOT NULL,
        level VARCHAR(20) NOT NULL,
        skill_focus VARCHAR(50),
        transcript_url VARCHAR(500),
        subtitles_url VARCHAR(500),
        materials_url VARCHAR(500),
        is_free BOOLEAN DEFAULT false,
        is_published BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS video_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        video_id INTEGER NOT NULL REFERENCES video_lessons(id),
        watched_seconds INTEGER DEFAULT 0,
        completion_percentage DECIMAL(5,2) DEFAULT 0,
        is_completed BOOLEAN DEFAULT false,
        total_watch_time INTEGER DEFAULT 0,
        pause_count INTEGER DEFAULT 0,
        rewind_count INTEGER DEFAULT 0,
        playback_speed DECIMAL(3,2) DEFAULT 1.0,
        notes_count INTEGER DEFAULT 0,
        bookmarks_count INTEGER DEFAULT 0,
        last_watched_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS video_notes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        video_id INTEGER NOT NULL REFERENCES video_lessons(id),
        timestamp INTEGER NOT NULL,
        note_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS video_bookmarks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        video_id INTEGER NOT NULL REFERENCES video_lessons(id),
        timestamp INTEGER NOT NULL,
        title VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // 4. Enhanced LMS Features
    console.log('Creating LMS enhancement tables...');

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS forum_categories (
        id SERIAL PRIMARY KEY,
        course_id INTEGER REFERENCES courses(id),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        icon VARCHAR(50),
        order_index INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS forum_threads (
        id SERIAL PRIMARY KEY,
        category_id INTEGER NOT NULL REFERENCES forum_categories(id),
        author_id INTEGER NOT NULL REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        is_pinned BOOLEAN DEFAULT false,
        is_locked BOOLEAN DEFAULT false,
        view_count INTEGER DEFAULT 0,
        reply_count INTEGER DEFAULT 0,
        last_reply_at TIMESTAMP,
        last_reply_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS forum_posts (
        id SERIAL PRIMARY KEY,
        thread_id INTEGER NOT NULL REFERENCES forum_threads(id),
        author_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        is_answer BOOLEAN DEFAULT false,
        upvotes INTEGER DEFAULT 0,
        edited_at TIMESTAMP,
        edited_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS gradebook_entries (
        id SERIAL PRIMARY KEY,
        course_id INTEGER NOT NULL REFERENCES courses(id),
        student_id INTEGER NOT NULL REFERENCES users(id),
        assignment_grades JSONB,
        test_grades JSONB,
        participation_grade DECIMAL(5,2),
        attendance_grade DECIMAL(5,2),
        current_grade DECIMAL(5,2),
        projected_grade DECIMAL(5,2),
        letter_grade VARCHAR(5),
        comments TEXT,
        last_updated_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS content_library (
        id SERIAL PRIMARY KEY,
        creator_id INTEGER NOT NULL REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        content_type VARCHAR(50) NOT NULL,
        file_url VARCHAR(500) NOT NULL,
        thumbnail_url VARCHAR(500),
        language VARCHAR(10) NOT NULL,
        level VARCHAR(20),
        skill_area VARCHAR(50),
        tags TEXT[] DEFAULT '{}',
        download_count INTEGER DEFAULT 0,
        use_count INTEGER DEFAULT 0,
        rating DECIMAL(3,2),
        is_public BOOLEAN DEFAULT false,
        license_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // 5. AI Integration Tables
    console.log('Creating AI integration tables...');

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ai_progress_tracking (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        speaking_accuracy DECIMAL(5,2),
        speaking_fluency DECIMAL(5,2),
        pronunciation DECIMAL(5,2),
        intonation DECIMAL(5,2),
        writing_accuracy DECIMAL(5,2),
        writing_complexity DECIMAL(5,2),
        writing_coherence DECIMAL(5,2),
        vocabulary_size INTEGER,
        vocabulary_retention DECIMAL(5,2),
        vocabulary_usage DECIMAL(5,2),
        grammar_accuracy DECIMAL(5,2),
        grammar_complexity DECIMAL(5,2),
        overall_level VARCHAR(10),
        progress_rate DECIMAL(5,2),
        last_assessed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ai_activity_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        activity_type VARCHAR(50) NOT NULL,
        started_at TIMESTAMP DEFAULT NOW() NOT NULL,
        ended_at TIMESTAMP,
        duration INTEGER,
        ai_model VARCHAR(50),
        analysis_data JSONB,
        score DECIMAL(5,2),
        mistakes JSONB,
        improvements JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ai_vocabulary_tracking (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        word VARCHAR(100) NOT NULL,
        language VARCHAR(10) NOT NULL,
        times_encountered INTEGER DEFAULT 1,
        times_used_correctly INTEGER DEFAULT 0,
        times_used_incorrectly INTEGER DEFAULT 0,
        first_seen_at TIMESTAMP DEFAULT NOW() NOT NULL,
        last_seen_at TIMESTAMP,
        last_used_at TIMESTAMP,
        mastery_level DECIMAL(3,2) DEFAULT 0,
        contexts JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ai_grammar_tracking (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        pattern_type VARCHAR(100) NOT NULL,
        pattern_name VARCHAR(255) NOT NULL,
        correct_usage INTEGER DEFAULT 0,
        incorrect_usage INTEGER DEFAULT 0,
        accuracy DECIMAL(5,2),
        introduced BOOLEAN DEFAULT true,
        practiced BOOLEAN DEFAULT false,
        mastered BOOLEAN DEFAULT false,
        example_sentences JSONB,
        common_mistakes JSONB,
        last_practiced_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ai_pronunciation_analysis (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        session_id INTEGER REFERENCES ai_activity_sessions(id),
        audio_url VARCHAR(500) NOT NULL,
        transcription TEXT,
        expected_text TEXT,
        overall_score DECIMAL(5,2),
        clarity DECIMAL(5,2),
        fluency DECIMAL(5,2),
        nativelikeness DECIMAL(5,2),
        phonetic_analysis JSONB,
        stress_patterns JSONB,
        intonation_analysis JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create indexes for better performance
    console.log('Creating indexes...');

    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_test_questions_test_id ON test_questions(test_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_test_attempts_student_id ON test_attempts(student_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_test_attempts_test_id ON test_attempts(test_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_user_game_progress_user_game ON user_game_progress(user_id, game_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_video_progress_user_video ON video_progress(user_id, video_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_forum_threads_category_id ON forum_threads(category_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_gradebook_entries_course_student ON gradebook_entries(course_id, student_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_ai_progress_user_id ON ai_progress_tracking(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_ai_vocabulary_user_word ON ai_vocabulary_tracking(user_id, word)`);

    console.log('Successfully created all comprehensive subsystem tables!');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

// Run the migration
addComprehensiveSubsystems()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });