CREATE TABLE "achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"type" text NOT NULL,
	"icon" text NOT NULL,
	"xp_reward" integer DEFAULT 0,
	"badge_color" text DEFAULT '#3B82F6',
	"requirements" jsonb NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "admin_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"shetab_merchant_id" varchar(255),
	"shetab_terminal_id" varchar(255),
	"shetab_api_key" text,
	"shetab_secret_key" text,
	"shetab_environment" varchar(20) DEFAULT 'sandbox',
	"shetab_enabled" boolean DEFAULT false,
	"kavenegar_api_key" text,
	"kavenegar_sender" varchar(50),
	"kavenegar_enabled" boolean DEFAULT false,
	"voip_server_address" varchar(255),
	"voip_port" integer DEFAULT 5060,
	"voip_username" varchar(100),
	"voip_password" text,
	"voip_enabled" boolean DEFAULT false,
	"call_recording_enabled" boolean DEFAULT false,
	"recording_storage_path" varchar(500) DEFAULT '/var/recordings',
	"email_smtp_host" varchar(255),
	"email_smtp_port" integer DEFAULT 587,
	"email_username" varchar(255),
	"email_password" text,
	"email_from_address" varchar(255),
	"email_enabled" boolean DEFAULT false,
	"database_backup_enabled" boolean DEFAULT true,
	"database_backup_frequency" varchar(20) DEFAULT 'daily',
	"database_retention_days" integer DEFAULT 30,
	"jwt_secret_key" text,
	"session_timeout" integer DEFAULT 60,
	"max_login_attempts" integer DEFAULT 5,
	"password_min_length" integer DEFAULT 8,
	"require_two_factor" boolean DEFAULT false,
	"system_maintenance_mode" boolean DEFAULT false,
	"system_debug_mode" boolean DEFAULT false,
	"system_log_level" varchar(20) DEFAULT 'info',
	"system_max_upload_size" integer DEFAULT 10,
	"notification_email_enabled" boolean DEFAULT true,
	"notification_sms_enabled" boolean DEFAULT true,
	"notification_push_enabled" boolean DEFAULT true,
	"api_rate_limit" integer DEFAULT 100,
	"api_rate_limit_window" integer DEFAULT 60,
	"file_storage_provider" varchar(20) DEFAULT 'local',
	"file_storage_config" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_activity_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"activity_type" varchar(50) NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"duration" integer,
	"ai_model" varchar(50),
	"analysis_data" jsonb,
	"score" numeric(5, 2),
	"mistakes" jsonb,
	"improvements" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_grammar_tracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"pattern_type" varchar(100) NOT NULL,
	"pattern_name" varchar(255) NOT NULL,
	"correct_usage" integer DEFAULT 0,
	"incorrect_usage" integer DEFAULT 0,
	"accuracy" numeric(5, 2),
	"introduced" boolean DEFAULT true,
	"practiced" boolean DEFAULT false,
	"mastered" boolean DEFAULT false,
	"example_sentences" jsonb,
	"common_mistakes" jsonb,
	"last_practiced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_knowledge_base" (
	"id" serial PRIMARY KEY NOT NULL,
	"training_data_id" integer NOT NULL,
	"model_name" varchar(100) NOT NULL,
	"topic" varchar(255) NOT NULL,
	"key_terms" text[] DEFAULT '{}',
	"content" text NOT NULL,
	"metadata" jsonb,
	"similarity_score" numeric(5, 3),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_progress_tracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"speaking_accuracy" numeric(5, 2),
	"speaking_fluency" numeric(5, 2),
	"pronunciation" numeric(5, 2),
	"intonation" numeric(5, 2),
	"writing_accuracy" numeric(5, 2),
	"writing_complexity" numeric(5, 2),
	"writing_coherence" numeric(5, 2),
	"vocabulary_size" integer,
	"vocabulary_retention" numeric(5, 2),
	"vocabulary_usage" numeric(5, 2),
	"grammar_accuracy" numeric(5, 2),
	"grammar_complexity" numeric(5, 2),
	"overall_level" varchar(10),
	"progress_rate" numeric(5, 2),
	"last_assessed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_pronunciation_analysis" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"session_id" integer,
	"audio_url" varchar(500) NOT NULL,
	"transcription" text,
	"expected_text" text,
	"overall_score" numeric(5, 2),
	"clarity" numeric(5, 2),
	"fluency" numeric(5, 2),
	"nativelikeness" numeric(5, 2),
	"phonetic_analysis" jsonb,
	"stress_patterns" jsonb,
	"intonation_analysis" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_training_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"model_name" varchar(100) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_type" varchar(50) NOT NULL,
	"content" text NOT NULL,
	"tags" text[] DEFAULT '{}',
	"is_active" boolean DEFAULT true,
	"trained_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_vocabulary_tracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"word" varchar(100) NOT NULL,
	"language" varchar(10) NOT NULL,
	"times_encountered" integer DEFAULT 1,
	"times_used_correctly" integer DEFAULT 0,
	"times_used_incorrectly" integer DEFAULT 0,
	"first_seen_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp,
	"last_used_at" timestamp,
	"mastery_level" numeric(3, 2) DEFAULT 0,
	"contexts" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"group_id" integer,
	"session_id" integer,
	"date" date NOT NULL,
	"status" text NOT NULL,
	"check_in_time" timestamp,
	"check_out_time" timestamp,
	"notes" text,
	"marked_by" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"user_role" varchar(50) NOT NULL,
	"action" varchar(100) NOT NULL,
	"resource_type" varchar(50) NOT NULL,
	"resource_id" integer,
	"details" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "callern_call_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"teacher_id" integer NOT NULL,
	"package_id" integer NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"duration_minutes" integer,
	"status" varchar(20) NOT NULL,
	"notes" text,
	"recording_url" text,
	"transcript_url" text,
	"transcript_lang" varchar(10),
	"ai_summary_json" jsonb,
	"consent_recording_at" timestamp,
	"student_consent_recording" boolean DEFAULT false,
	"teacher_consent_recording" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "callern_packages" (
	"id" serial PRIMARY KEY NOT NULL,
	"package_name" varchar(100) NOT NULL,
	"total_hours" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "callern_syllabus_topics" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" varchar(50) NOT NULL,
	"level" varchar(20) NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"order" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text,
	"type" text DEFAULT 'direct' NOT NULL,
	"participants" text[] NOT NULL,
	"last_message" text,
	"last_message_at" timestamp,
	"unread_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"sender_id" integer NOT NULL,
	"sender_name" text,
	"message" text NOT NULL,
	"message_type" varchar(20) DEFAULT 'text',
	"attachments" text[] DEFAULT '{}',
	"is_read" boolean DEFAULT false,
	"is_edited" boolean DEFAULT false,
	"edited_at" timestamp,
	"reply_to" integer,
	"reactions" jsonb,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"read_by" jsonb
);
--> statement-breakpoint
CREATE TABLE "class_observations" (
	"id" serial PRIMARY KEY NOT NULL,
	"teacher_id" integer NOT NULL,
	"supervisor_id" integer NOT NULL,
	"course_id" integer,
	"session_id" integer,
	"observation_date" timestamp NOT NULL,
	"duration_minutes" integer,
	"lesson_topic" text,
	"preparedness" integer,
	"delivery" integer,
	"student_participation" integer,
	"material_usage" integer,
	"time_management" integer,
	"observations" text,
	"positive_points" text[] DEFAULT '{}',
	"improvement_suggestions" text[] DEFAULT '{}',
	"follow_up_required" boolean DEFAULT false,
	"follow_up_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "communication_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer,
	"student_id" integer,
	"agent_id" integer NOT NULL,
	"type" text NOT NULL,
	"direction" text,
	"duration_minutes" integer,
	"outcome" text,
	"notes" text,
	"follow_up_required" boolean DEFAULT false,
	"follow_up_date" timestamp,
	"recording_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_library" (
	"id" serial PRIMARY KEY NOT NULL,
	"creator_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"content_type" varchar(50) NOT NULL,
	"file_url" varchar(500) NOT NULL,
	"thumbnail_url" varchar(500),
	"language" varchar(10) NOT NULL,
	"level" varchar(20),
	"skill_area" varchar(50),
	"tags" text[] DEFAULT '{}',
	"download_count" integer DEFAULT 0,
	"use_count" integer DEFAULT 0,
	"rating" numeric(3, 2),
	"is_public" boolean DEFAULT false,
	"license_type" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"course_id" integer NOT NULL,
	"original_price" integer NOT NULL,
	"discount_percentage" integer DEFAULT 0,
	"final_price" integer NOT NULL,
	"credits_awarded" integer DEFAULT 0,
	"payment_method" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"merchant_transaction_id" text,
	"shetab_transaction_id" text,
	"shetab_reference_number" text,
	"card_number" text,
	"gateway_response" jsonb,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "course_referrals" (
	"id" serial PRIMARY KEY NOT NULL,
	"referrer_user_id" integer NOT NULL,
	"course_id" integer NOT NULL,
	"referral_code" varchar(20) NOT NULL,
	"total_shares" integer DEFAULT 0 NOT NULL,
	"total_clicks" integer DEFAULT 0 NOT NULL,
	"total_enrollments" integer DEFAULT 0 NOT NULL,
	"total_commission_earned" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "course_referrals_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "course_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"session_number" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"scheduled_date" date NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"duration_minutes" integer NOT NULL,
	"status" text DEFAULT 'scheduled',
	"actual_start_time" timestamp,
	"actual_end_time" timestamp,
	"attendance_count" integer DEFAULT 0,
	"recording_url" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_code" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"language" text NOT NULL,
	"level" text NOT NULL,
	"thumbnail" text,
	"instructor_id" integer,
	"price" integer DEFAULT 0,
	"total_sessions" integer NOT NULL,
	"session_duration" integer NOT NULL,
	"delivery_mode" text NOT NULL,
	"class_format" text NOT NULL,
	"max_students" integer,
	"rating" numeric(3, 2) DEFAULT '0.00',
	"first_session_date" date,
	"last_session_date" date,
	"weekdays" text[],
	"start_time" text,
	"end_time" text,
	"time_zone" text DEFAULT 'Asia/Tehran',
	"calendar_type" text DEFAULT 'gregorian',
	"target_language" text NOT NULL,
	"target_level" text[] NOT NULL,
	"auto_record" boolean DEFAULT false,
	"recording_available" boolean DEFAULT false,
	"access_period_months" integer,
	"callern_available_24h" boolean DEFAULT true,
	"category" text NOT NULL,
	"tags" text[],
	"prerequisites" text[],
	"learning_objectives" text[],
	"difficulty" text DEFAULT 'beginner',
	"certificate_template" text,
	"is_active" boolean DEFAULT true,
	"is_featured" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "courses_course_code_unique" UNIQUE("course_code")
);
--> statement-breakpoint
CREATE TABLE "custom_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"permissions" jsonb NOT NULL,
	"is_system_role" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "daily_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"goal_type" text NOT NULL,
	"target_value" integer NOT NULL,
	"current_value" integer DEFAULT 0,
	"goal_date" timestamp NOT NULL,
	"is_completed" boolean DEFAULT false,
	"completed_at" timestamp,
	"xp_reward" integer DEFAULT 10,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" serial PRIMARY KEY NOT NULL,
	"institute_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"head_teacher_id" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipient_id" integer NOT NULL,
	"recipient_email" varchar(255) NOT NULL,
	"template_type" varchar(50) NOT NULL,
	"subject" varchar(255) NOT NULL,
	"content_json" jsonb,
	"status" varchar(20) DEFAULT 'pending',
	"sent_at" timestamp,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"course_id" integer NOT NULL,
	"progress" integer DEFAULT 0,
	"enrolled_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "forum_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer,
	"name" varchar(100) NOT NULL,
	"description" text,
	"icon" varchar(50),
	"order_index" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forum_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"thread_id" integer NOT NULL,
	"author_id" integer NOT NULL,
	"content" text NOT NULL,
	"is_answer" boolean DEFAULT false,
	"upvotes" integer DEFAULT 0,
	"edited_at" timestamp,
	"edited_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forum_threads" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"author_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"is_pinned" boolean DEFAULT false,
	"is_locked" boolean DEFAULT false,
	"view_count" integer DEFAULT 0,
	"reply_count" integer DEFAULT 0,
	"last_reply_at" timestamp,
	"last_reply_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_leaderboards" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"leaderboard_type" varchar(50) NOT NULL,
	"period" varchar(20),
	"score" integer NOT NULL,
	"rank" integer,
	"games_played" integer DEFAULT 1,
	"perfect_games" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_levels" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"level_number" integer NOT NULL,
	"level_name" varchar(100),
	"language_level" varchar(10) NOT NULL,
	"content_type" varchar(50) NOT NULL,
	"content_data" jsonb NOT NULL,
	"difficulty" varchar(20) DEFAULT 'medium',
	"speed_multiplier" numeric(3, 2) DEFAULT 1,
	"item_count" integer DEFAULT 10,
	"xp_reward" integer DEFAULT 50,
	"coins_reward" integer DEFAULT 10,
	"badge_id" integer,
	"passing_score" integer DEFAULT 70,
	"stars_thresholds" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"game_id" integer NOT NULL,
	"level_id" integer,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"duration" integer,
	"score" integer DEFAULT 0,
	"correct_answers" integer DEFAULT 0,
	"wrong_answers" integer DEFAULT 0,
	"accuracy" numeric(5, 2),
	"stars_earned" integer DEFAULT 0,
	"xp_earned" integer DEFAULT 0,
	"coins_earned" integer DEFAULT 0,
	"new_badges" jsonb,
	"game_state" jsonb,
	"is_completed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_name" varchar(255) NOT NULL,
	"game_code" varchar(50) NOT NULL,
	"description" text,
	"game_type" varchar(50) NOT NULL,
	"age_group" varchar(20) NOT NULL,
	"min_level" varchar(10) NOT NULL,
	"max_level" varchar(10) NOT NULL,
	"language" varchar(10) NOT NULL,
	"game_mode" varchar(50) NOT NULL,
	"duration" integer,
	"points_per_correct" integer DEFAULT 10,
	"bonus_multiplier" numeric(3, 2) DEFAULT 1,
	"lives_system" boolean DEFAULT false,
	"timer_enabled" boolean DEFAULT false,
	"thumbnail_url" varchar(500),
	"background_image" varchar(500),
	"sound_effects" jsonb,
	"total_levels" integer DEFAULT 10,
	"unlock_requirements" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "games_game_code_unique" UNIQUE("game_code")
);
--> statement-breakpoint
CREATE TABLE "glossary_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"term" varchar(100) NOT NULL,
	"definition" text NOT NULL,
	"part_of_speech" varchar(20),
	"cefr_level" varchar(5),
	"example" text,
	"source_call_id" integer,
	"srs_strength" integer DEFAULT 0,
	"srs_due_at" timestamp,
	"srs_last_reviewed_at" timestamp,
	"srs_review_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gradebook_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"student_id" integer NOT NULL,
	"assignment_grades" jsonb,
	"test_grades" jsonb,
	"participation_grade" numeric(5, 2),
	"attendance_grade" numeric(5, 2),
	"current_grade" numeric(5, 2),
	"projected_grade" numeric(5, 2),
	"letter_grade" varchar(5),
	"comments" text,
	"last_updated_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "homework" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"teacher_id" integer NOT NULL,
	"course_id" integer,
	"title" text NOT NULL,
	"description" text,
	"due_date" timestamp,
	"status" text DEFAULT 'pending',
	"submission" text,
	"grade" integer,
	"feedback" text,
	"assigned_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "institute_branding" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"logo" text,
	"primary_color" text DEFAULT '#3B82F6',
	"secondary_color" text DEFAULT '#10B981',
	"accent_color" text DEFAULT '#8B5CF6',
	"background_color" text DEFAULT '#FFFFFF',
	"text_color" text DEFAULT '#1F2937',
	"favicon" text,
	"login_background_image" text,
	"font_family" text DEFAULT 'Inter',
	"border_radius" text DEFAULT '0.5rem',
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "institutes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"address" text,
	"phone_number" text,
	"email" text,
	"website" text,
	"logo" text,
	"primary_color" text DEFAULT '#3B82F6',
	"secondary_color" text DEFAULT '#10B981',
	"timezone" text DEFAULT 'UTC',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "institutes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_number" text NOT NULL,
	"student_id" integer NOT NULL,
	"course_id" integer,
	"amount" integer NOT NULL,
	"tax_amount" integer DEFAULT 0,
	"total_amount" integer NOT NULL,
	"currency" text DEFAULT 'IRR',
	"status" text DEFAULT 'pending',
	"due_date" timestamp NOT NULL,
	"paid_date" timestamp,
	"payment_method" text,
	"shetab_transaction_id" text,
	"description" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"phone_number" text NOT NULL,
	"source" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"priority" text DEFAULT 'medium',
	"interested_language" text,
	"interested_level" text,
	"preferred_format" text,
	"budget" integer,
	"notes" text,
	"assigned_agent_id" integer,
	"last_contact_date" timestamp,
	"next_follow_up_date" timestamp,
	"conversion_date" timestamp,
	"student_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"activity_type" varchar(50) NOT NULL,
	"course_id" integer,
	"duration_minutes" integer,
	"completion_rate" numeric(5, 2),
	"skill_points" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_adaptations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"mood_pattern" text NOT NULL,
	"adaptation_strategy" text NOT NULL,
	"preferred_content_types" jsonb,
	"optimal_duration" integer,
	"best_time_of_day" text,
	"success_rate" integer DEFAULT 0,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "level_assessment_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"language" varchar(10) NOT NULL,
	"question_text" text NOT NULL,
	"question_type" varchar(50) NOT NULL,
	"difficulty" varchar(20) NOT NULL,
	"options" jsonb,
	"correct_answer" text,
	"media_url" varchar(500),
	"points" integer DEFAULT 1,
	"is_active" boolean DEFAULT true,
	"order" integer DEFAULT 0,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "level_assessment_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"language" varchar(10) NOT NULL,
	"total_score" integer NOT NULL,
	"max_score" integer NOT NULL,
	"proficiency_level" varchar(50) NOT NULL,
	"completed_at" timestamp DEFAULT now(),
	"answers" jsonb NOT NULL,
	"time_taken" integer
);
--> statement-breakpoint
CREATE TABLE "live_class_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"teacher_id" integer NOT NULL,
	"course_id" integer NOT NULL,
	"class_title" varchar(255) NOT NULL,
	"class_type" text NOT NULL,
	"meeting_url" text,
	"room_number" varchar(50),
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"status" text DEFAULT 'scheduled',
	"recording_url" text,
	"supervisor_join_count" integer DEFAULT 0,
	"quality_score" numeric(3, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentor_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentor_id" integer NOT NULL,
	"student_id" integer NOT NULL,
	"status" text DEFAULT 'active',
	"assigned_date" timestamp DEFAULT now() NOT NULL,
	"completed_date" timestamp,
	"goals" text[] DEFAULT '{}',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentoring_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"assignment_id" integer NOT NULL,
	"scheduled_date" timestamp NOT NULL,
	"duration_minutes" integer DEFAULT 60,
	"status" text DEFAULT 'scheduled',
	"session_type" text,
	"topics" text[] DEFAULT '{}',
	"outcomes" text,
	"next_steps" text[] DEFAULT '{}',
	"student_progress" integer,
	"mentor_notes" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" integer NOT NULL,
	"receiver_id" integer NOT NULL,
	"content" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"sent_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mood_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"mood_score" integer NOT NULL,
	"mood_category" text NOT NULL,
	"energy_level" integer NOT NULL,
	"motivation_level" integer NOT NULL,
	"stress_level" integer NOT NULL,
	"focus_level" integer NOT NULL,
	"context" text,
	"notes" text,
	"detected_from" text DEFAULT 'manual',
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mood_recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"mood_entry_id" integer NOT NULL,
	"recommendation_type" text NOT NULL,
	"content_type" text,
	"difficulty" text,
	"duration" integer,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"reasoning" text NOT NULL,
	"priority" integer DEFAULT 5,
	"is_accepted" boolean,
	"completed_at" timestamp,
	"effectiveness_rating" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_delivery_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"notification_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"channel" varchar(50) NOT NULL,
	"status" varchar(20) NOT NULL,
	"error_message" text,
	"delivered_at" timestamp,
	"clicked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "parent_guardians" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"name" text NOT NULL,
	"relationship" text NOT NULL,
	"phone_number" text,
	"email" text,
	"address" text,
	"is_primary" boolean DEFAULT false,
	"emergency_contact" boolean DEFAULT false,
	"can_pickup" boolean DEFAULT true,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payment_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer,
	"student_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'IRR',
	"method" text NOT NULL,
	"status" text DEFAULT 'pending',
	"shetab_ref_number" text,
	"shetab_card_number" text,
	"bank_code" text,
	"terminal_id" text,
	"description" text,
	"failure_reason" text,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'IRR',
	"credits_awarded" integer DEFAULT 0,
	"provider" text DEFAULT 'shetab',
	"transaction_id" text,
	"merchant_transaction_id" text,
	"gateway_transaction_id" text,
	"reference_number" text,
	"card_number" text,
	"status" text DEFAULT 'pending',
	"failure_reason" text,
	"shetab_response" jsonb,
	"ip_address" text,
	"user_agent" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "progress_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"skill_scores" jsonb NOT NULL,
	"overall_level" varchar(10) NOT NULL,
	"average_score" numeric(5, 2) NOT NULL,
	"snapshot_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"type" varchar(20) DEFAULT 'info' NOT NULL,
	"target_audience" varchar(100) NOT NULL,
	"target_user_ids" integer[] DEFAULT '{}',
	"channels" text[] NOT NULL,
	"icon" varchar(255),
	"image" varchar(255),
	"action_url" varchar(500),
	"action_text" varchar(100),
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"scheduled_at" timestamp,
	"sent_at" timestamp,
	"delivery_stats" jsonb,
	"priority" varchar(20) DEFAULT 'normal',
	"ttl" integer DEFAULT 86400,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questionnaire_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"questionnaire_id" integer NOT NULL,
	"student_id" integer NOT NULL,
	"teacher_id" integer NOT NULL,
	"session_id" integer NOT NULL,
	"responses" jsonb NOT NULL,
	"average_rating" numeric(3, 2),
	"submitted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"glossary_item_id" integer NOT NULL,
	"question_type" varchar(20) NOT NULL,
	"was_correct" boolean NOT NULL,
	"response_time" integer,
	"attempted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referral_commissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_referral_id" integer NOT NULL,
	"referrer_user_id" integer NOT NULL,
	"referred_user_id" integer,
	"course_price" integer NOT NULL,
	"total_commission_rate" integer DEFAULT 20 NOT NULL,
	"total_commission_amount" integer NOT NULL,
	"referrer_amount" integer NOT NULL,
	"referred_amount" integer DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp,
	"related_payment_id" integer,
	"related_enrollment_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "referral_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"referrer_percentage" integer DEFAULT 15 NOT NULL,
	"referred_percentage" integer DEFAULT 5 NOT NULL,
	"total_referrals" integer DEFAULT 0 NOT NULL,
	"total_enrollments" integer DEFAULT 0 NOT NULL,
	"total_commission_earned" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "referral_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "rewrite_suggestions" (
	"id" serial PRIMARY KEY NOT NULL,
	"call_id" integer NOT NULL,
	"original_utterance" text NOT NULL,
	"improved_version" text NOT NULL,
	"cefr_level" varchar(5),
	"timestamp" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"role" text NOT NULL,
	"resource" text NOT NULL,
	"action" text NOT NULL,
	"allowed" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'physical' NOT NULL,
	"capacity" integer DEFAULT 20 NOT NULL,
	"building" text,
	"floor" text,
	"equipment" text[] DEFAULT '{}',
	"amenities" text[] DEFAULT '{}',
	"description" text,
	"is_active" boolean DEFAULT true,
	"maintenance_status" text DEFAULT 'operational',
	"virtual_room_url" text,
	"virtual_room_provider" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "scheduled_observations" (
	"id" serial PRIMARY KEY NOT NULL,
	"teacher_id" integer NOT NULL,
	"supervisor_id" integer NOT NULL,
	"session_id" integer,
	"class_id" integer,
	"observation_type" varchar(50) NOT NULL,
	"scheduled_date" timestamp NOT NULL,
	"status" varchar(20) DEFAULT 'scheduled',
	"priority" varchar(10) DEFAULT 'normal',
	"notes" text,
	"teacher_notified" boolean DEFAULT false,
	"notification_sent_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "session_packages" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"package_name" varchar(255) NOT NULL,
	"total_sessions" integer NOT NULL,
	"session_duration" integer NOT NULL,
	"used_sessions" integer DEFAULT 0 NOT NULL,
	"remaining_sessions" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"status" varchar(50) DEFAULT 'active',
	"purchased_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"tutor_id" integer NOT NULL,
	"course_id" integer,
	"title" text NOT NULL,
	"description" text,
	"scheduled_at" timestamp NOT NULL,
	"duration" integer DEFAULT 60,
	"status" text DEFAULT 'scheduled',
	"session_url" text,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "skill_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"skill_type" varchar(20) NOT NULL,
	"score" numeric(5, 2) NOT NULL,
	"activity_type" varchar(50) NOT NULL,
	"activity_id" integer,
	"metadata" jsonb,
	"assessed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_callern_packages" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"package_id" integer NOT NULL,
	"total_hours" integer NOT NULL,
	"used_minutes" integer DEFAULT 0 NOT NULL,
	"remaining_minutes" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"purchased_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_callern_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"topic_id" integer NOT NULL,
	"teacher_id" integer NOT NULL,
	"call_id" integer,
	"completed_at" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_group_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"student_id" integer NOT NULL,
	"enrolled_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"status" text DEFAULT 'active',
	"progress" integer DEFAULT 0,
	"last_attendance" timestamp
);
--> statement-breakpoint
CREATE TABLE "student_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"institute_id" integer NOT NULL,
	"department_id" integer,
	"name" text NOT NULL,
	"description" text,
	"language" text NOT NULL,
	"level" text NOT NULL,
	"max_students" integer DEFAULT 20,
	"current_students" integer DEFAULT 0,
	"teacher_id" integer,
	"schedule" jsonb,
	"start_date" date,
	"end_date" date,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "student_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"teacher_id" integer NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"priority" text DEFAULT 'normal',
	"is_private" boolean DEFAULT false,
	"tags" text[] DEFAULT '{}',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "student_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"show_live_suggestions" boolean DEFAULT true,
	"email_call_summaries" boolean DEFAULT true,
	"email_weekly_recap" boolean DEFAULT true,
	"preferred_language" varchar(10) DEFAULT 'en',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "student_preferences_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
CREATE TABLE "student_questionnaires" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"course_id" integer,
	"trigger_session_number" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"questions" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"generated_by" integer NOT NULL,
	"report_type" text NOT NULL,
	"period" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"data" jsonb NOT NULL,
	"comments" text,
	"is_published" boolean DEFAULT false,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "suggested_terms" (
	"id" serial PRIMARY KEY NOT NULL,
	"call_id" integer NOT NULL,
	"term" varchar(100) NOT NULL,
	"part_of_speech" varchar(20),
	"cefr_level" varchar(5),
	"definition" text,
	"example" text,
	"suggested_by" varchar(20) NOT NULL,
	"timestamp" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supervision_observations" (
	"id" serial PRIMARY KEY NOT NULL,
	"teacher_id" integer,
	"supervisor_id" integer,
	"session_id" integer,
	"observation_type" varchar,
	"overall_score" numeric(10, 2),
	"strengths" text,
	"areas_for_improvement" text,
	"follow_up_required" boolean,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"teacher_acknowledged" boolean DEFAULT false,
	"teacher_acknowledged_at" timestamp,
	"teacher_response" text,
	"teacher_improvement_plan" text,
	"improvement_plan_deadline" date,
	"follow_up_completed" boolean DEFAULT false,
	"follow_up_completed_at" timestamp,
	"scheduled_observation_id" integer,
	"observation_status" varchar(20) DEFAULT 'completed'
);
--> statement-breakpoint
CREATE TABLE "support_ticket_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" integer NOT NULL,
	"message" text NOT NULL,
	"sender_type" varchar(20) NOT NULL,
	"sender_id" integer NOT NULL,
	"sender_name" varchar(255) NOT NULL,
	"is_internal" boolean DEFAULT false,
	"attachments" text[] DEFAULT '{}',
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"category" text,
	"student_id" integer,
	"student_name" text,
	"assigned_to" text,
	"attachments" text[] DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "system_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"kavenegar_api_key" text,
	"kavenegar_sender_number" text,
	"sms_enabled" boolean DEFAULT false,
	"shetab_merchant_id" text,
	"shetab_terminal_id" text,
	"shetab_api_key" text,
	"shetab_gateway_url" text,
	"payment_enabled" boolean DEFAULT false,
	"smtp_host" text,
	"smtp_port" integer,
	"smtp_user" text,
	"smtp_password" text,
	"email_enabled" boolean DEFAULT false,
	"ollama_api_url" text DEFAULT 'http://localhost:11434',
	"ollama_model" text DEFAULT 'llama3.2',
	"ai_enabled" boolean DEFAULT true,
	"maintenance_mode" boolean DEFAULT false,
	"registration_enabled" boolean DEFAULT true,
	"max_users_per_institute" integer DEFAULT 1000,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "system_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"metric_type" text NOT NULL,
	"value" numeric(10, 3) NOT NULL,
	"unit" text,
	"metadata" jsonb,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teacher_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"teacher_id" integer NOT NULL,
	"institute_id" integer NOT NULL,
	"department_id" integer,
	"subjects" text[] DEFAULT '{}',
	"max_students" integer DEFAULT 50,
	"current_students" integer DEFAULT 0,
	"hourly_rate" numeric(10, 2),
	"contract_type" text DEFAULT 'part_time',
	"start_date" date,
	"end_date" date,
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "teacher_availability" (
	"id" serial PRIMARY KEY NOT NULL,
	"teacher_id" integer NOT NULL,
	"day_of_week" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "teacher_availability_periods" (
	"id" serial PRIMARY KEY NOT NULL,
	"teacher_id" integer NOT NULL,
	"period_start_date" timestamp NOT NULL,
	"period_end_date" timestamp NOT NULL,
	"day_of_week" text NOT NULL,
	"time_division" text NOT NULL,
	"class_format" text NOT NULL,
	"specific_hours" text,
	"is_active" boolean DEFAULT true,
	"supervisor_notified" boolean DEFAULT false,
	"admin_notified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "teacher_callern_availability" (
	"id" serial PRIMARY KEY NOT NULL,
	"teacher_id" integer NOT NULL,
	"is_online" boolean DEFAULT false NOT NULL,
	"last_active_at" timestamp,
	"hourly_rate" numeric(10, 2),
	"available_hours" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teacher_evaluations" (
	"id" serial PRIMARY KEY NOT NULL,
	"teacher_id" integer NOT NULL,
	"supervisor_id" integer NOT NULL,
	"evaluation_period" text NOT NULL,
	"teaching_effectiveness" integer,
	"classroom_management" integer,
	"student_engagement" integer,
	"content_knowledge" integer,
	"communication" integer,
	"professionalism" integer,
	"overall_rating" numeric(3, 1),
	"strengths" text[] DEFAULT '{}',
	"improvement_areas" text[] DEFAULT '{}',
	"recommendations" text,
	"goals" text[] DEFAULT '{}',
	"observation_notes" text,
	"student_feedback_summary" text,
	"status" text DEFAULT 'draft',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teacher_observation_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"observation_id" integer NOT NULL,
	"teacher_id" integer NOT NULL,
	"response_type" text NOT NULL,
	"content" text NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"supervisor_reviewed" boolean DEFAULT false,
	"supervisor_reviewed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "teacher_retention_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"teacher_id" integer NOT NULL,
	"term_name" varchar(100) NOT NULL,
	"term_start_date" timestamp NOT NULL,
	"term_end_date" timestamp NOT NULL,
	"students_at_start" integer DEFAULT 0,
	"students_at_end" integer DEFAULT 0,
	"students_dropped" integer DEFAULT 0,
	"new_students_joined" integer DEFAULT 0,
	"retention_rate" numeric(5, 2),
	"attrition_rate" numeric(5, 2),
	"overall_retention_rate" numeric(5, 2),
	"overall_attrition_rate" numeric(5, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"attempt_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"selected_option_id" integer,
	"boolean_answer" boolean,
	"text_answer" text,
	"matching_answer" jsonb,
	"ordering_answer" jsonb,
	"recording_url" varchar(500),
	"is_correct" boolean,
	"points_earned" numeric(5, 2),
	"feedback" text,
	"graded_by" integer,
	"graded_at" timestamp,
	"answered_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"test_id" integer NOT NULL,
	"student_id" integer NOT NULL,
	"attempt_number" integer DEFAULT 1,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"time_spent" integer,
	"score" numeric(5, 2),
	"percentage" numeric(5, 2),
	"status" varchar(20) DEFAULT 'in_progress',
	"feedback" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"test_id" integer NOT NULL,
	"question_type" varchar(50) NOT NULL,
	"question_text" text NOT NULL,
	"question_audio" varchar(500),
	"question_image" varchar(500),
	"points" integer DEFAULT 1,
	"order" integer NOT NULL,
	"options" jsonb,
	"blanks_data" jsonb,
	"matching_pairs" jsonb,
	"ordering_items" jsonb,
	"model_answer" text,
	"grading_criteria" jsonb,
	"recording_prompt" text,
	"max_recording_duration" integer,
	"explanation" text,
	"skill_category" varchar(50),
	"difficulty" varchar(20) DEFAULT 'medium',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tests" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"course_id" integer,
	"teacher_id" integer,
	"test_type" varchar(50) NOT NULL,
	"language" varchar(10) NOT NULL,
	"level" varchar(20) NOT NULL,
	"passing_score" integer DEFAULT 60,
	"time_limit" integer,
	"max_attempts" integer DEFAULT 1,
	"randomize_questions" boolean DEFAULT false,
	"show_results" boolean DEFAULT true,
	"show_correct_answers" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"scheduled_date" timestamp,
	"due_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"achievement_id" integer NOT NULL,
	"unlocked_at" timestamp DEFAULT now(),
	"is_notified" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "user_game_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"game_id" integer NOT NULL,
	"current_level" integer DEFAULT 1,
	"total_score" integer DEFAULT 0,
	"total_xp_earned" integer DEFAULT 0,
	"total_coins_earned" integer DEFAULT 0,
	"total_play_time" integer DEFAULT 0,
	"sessions_played" integer DEFAULT 0,
	"accuracy" numeric(5, 2),
	"average_speed" numeric(5, 2),
	"longest_streak" integer DEFAULT 0,
	"perfect_levels" integer DEFAULT 0,
	"last_played_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"cultural_background" text,
	"native_language" text DEFAULT 'en' NOT NULL,
	"target_languages" text[] DEFAULT '{}',
	"proficiency_level" text DEFAULT 'beginner',
	"learning_goals" text[] DEFAULT '{}',
	"learning_style" text,
	"timezone" text DEFAULT 'UTC',
	"preferred_study_time" text,
	"weekly_study_hours" integer DEFAULT 5,
	"personality_type" text,
	"motivation_factors" text[] DEFAULT '{}',
	"learning_challenges" text[] DEFAULT '{}',
	"strengths" text[] DEFAULT '{}',
	"interests" text[] DEFAULT '{}',
	"bio" text,
	"target_language" text,
	"current_proficiency" text,
	"national_id" text,
	"birthday" date,
	"guardian_name" text,
	"guardian_phone" text,
	"notes" text,
	"current_level" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" text NOT NULL,
	"refresh_token" text,
	"expires_at" timestamp NOT NULL,
	"last_active_at" timestamp DEFAULT now(),
	"ip_address" text,
	"user_agent" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "user_sessions_token_unique" UNIQUE("token"),
	CONSTRAINT "user_sessions_refresh_token_unique" UNIQUE("refresh_token")
);
--> statement-breakpoint
CREATE TABLE "user_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"total_xp" integer DEFAULT 0,
	"current_level" integer DEFAULT 1,
	"streak_days" integer DEFAULT 0,
	"longest_streak" integer DEFAULT 0,
	"total_study_time" integer DEFAULT 0,
	"lessons_completed" integer DEFAULT 0,
	"quizzes_completed" integer DEFAULT 0,
	"perfect_scores" integer DEFAULT 0,
	"words_learned" integer DEFAULT 0,
	"conversations_completed" integer DEFAULT 0,
	"last_activity_date" timestamp,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_stats_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"role" text DEFAULT 'Student' NOT NULL,
	"phone_number" text,
	"national_id" text,
	"birthday" date,
	"guardian_name" text,
	"guardian_phone" text,
	"notes" text,
	"profile_image" text,
	"level" text,
	"status" text DEFAULT 'active',
	"avatar" text,
	"is_active" boolean DEFAULT true,
	"preferences" jsonb,
	"wallet_balance" integer DEFAULT 0,
	"total_credits" integer DEFAULT 0,
	"member_tier" text DEFAULT 'bronze',
	"streak_days" integer DEFAULT 0,
	"total_lessons" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "video_bookmarks" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"video_lesson_id" integer NOT NULL,
	"timestamp" integer NOT NULL,
	"title" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer,
	"teacher_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"video_url" varchar(500) NOT NULL,
	"thumbnail_url" varchar(500),
	"duration" integer NOT NULL,
	"module_id" integer,
	"order_index" integer NOT NULL,
	"language" varchar(10) NOT NULL,
	"level" varchar(20) NOT NULL,
	"skill_focus" varchar(50),
	"transcript_url" varchar(500),
	"subtitles_url" varchar(500),
	"materials_url" varchar(500),
	"is_free" boolean DEFAULT false,
	"is_published" boolean DEFAULT true,
	"view_count" integer DEFAULT 0,
	"completion_rate" numeric(5, 2) DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"video_lesson_id" integer NOT NULL,
	"timestamp" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"video_lesson_id" integer NOT NULL,
	"watch_time" integer DEFAULT 0,
	"total_duration" integer DEFAULT 0,
	"completed" boolean DEFAULT false,
	"total_watch_time" integer DEFAULT 0,
	"pause_count" integer DEFAULT 0,
	"rewind_count" integer DEFAULT 0,
	"playback_speed" numeric(3, 2) DEFAULT 1,
	"notes_count" integer DEFAULT 0,
	"bookmarks_count" integer DEFAULT 0,
	"last_watched_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"amount" integer NOT NULL,
	"description" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"merchant_transaction_id" text,
	"shetab_transaction_id" text,
	"shetab_reference_number" text,
	"card_number" text,
	"gateway_response" jsonb,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "ai_activity_sessions" ADD CONSTRAINT "ai_activity_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_grammar_tracking" ADD CONSTRAINT "ai_grammar_tracking_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_knowledge_base" ADD CONSTRAINT "ai_knowledge_base_training_data_id_ai_training_data_id_fk" FOREIGN KEY ("training_data_id") REFERENCES "public"."ai_training_data"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_progress_tracking" ADD CONSTRAINT "ai_progress_tracking_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_pronunciation_analysis" ADD CONSTRAINT "ai_pronunciation_analysis_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_pronunciation_analysis" ADD CONSTRAINT "ai_pronunciation_analysis_session_id_ai_activity_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."ai_activity_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_training_data" ADD CONSTRAINT "ai_training_data_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_vocabulary_tracking" ADD CONSTRAINT "ai_vocabulary_tracking_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_group_id_student_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."student_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_marked_by_users_id_fk" FOREIGN KEY ("marked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "callern_call_history" ADD CONSTRAINT "callern_call_history_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "callern_call_history" ADD CONSTRAINT "callern_call_history_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "callern_call_history" ADD CONSTRAINT "callern_call_history_package_id_student_callern_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."student_callern_packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_reply_to_chat_messages_id_fk" FOREIGN KEY ("reply_to") REFERENCES "public"."chat_messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_observations" ADD CONSTRAINT "class_observations_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_observations" ADD CONSTRAINT "class_observations_supervisor_id_users_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_observations" ADD CONSTRAINT "class_observations_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_observations" ADD CONSTRAINT "class_observations_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_logs" ADD CONSTRAINT "communication_logs_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_logs" ADD CONSTRAINT "communication_logs_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_logs" ADD CONSTRAINT "communication_logs_agent_id_users_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_library" ADD CONSTRAINT "content_library_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_payments" ADD CONSTRAINT "course_payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_payments" ADD CONSTRAINT "course_payments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_referrals" ADD CONSTRAINT "course_referrals_referrer_user_id_users_id_fk" FOREIGN KEY ("referrer_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_referrals" ADD CONSTRAINT "course_referrals_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_sessions" ADD CONSTRAINT "course_sessions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_instructor_id_users_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_goals" ADD CONSTRAINT "daily_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_institute_id_institutes_id_fk" FOREIGN KEY ("institute_id") REFERENCES "public"."institutes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_head_teacher_id_users_id_fk" FOREIGN KEY ("head_teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_categories" ADD CONSTRAINT "forum_categories_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_thread_id_forum_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."forum_threads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_edited_by_users_id_fk" FOREIGN KEY ("edited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_threads" ADD CONSTRAINT "forum_threads_category_id_forum_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."forum_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_threads" ADD CONSTRAINT "forum_threads_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_threads" ADD CONSTRAINT "forum_threads_last_reply_by_users_id_fk" FOREIGN KEY ("last_reply_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_leaderboards" ADD CONSTRAINT "game_leaderboards_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_leaderboards" ADD CONSTRAINT "game_leaderboards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_levels" ADD CONSTRAINT "game_levels_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_levels" ADD CONSTRAINT "game_levels_badge_id_achievements_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."achievements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_level_id_game_levels_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."game_levels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "glossary_items" ADD CONSTRAINT "glossary_items_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "glossary_items" ADD CONSTRAINT "glossary_items_source_call_id_callern_call_history_id_fk" FOREIGN KEY ("source_call_id") REFERENCES "public"."callern_call_history"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gradebook_entries" ADD CONSTRAINT "gradebook_entries_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gradebook_entries" ADD CONSTRAINT "gradebook_entries_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gradebook_entries" ADD CONSTRAINT "gradebook_entries_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homework" ADD CONSTRAINT "homework_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homework" ADD CONSTRAINT "homework_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homework" ADD CONSTRAINT "homework_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_agent_id_users_id_fk" FOREIGN KEY ("assigned_agent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_activities" ADD CONSTRAINT "learning_activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_activities" ADD CONSTRAINT "learning_activities_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "level_assessment_questions" ADD CONSTRAINT "level_assessment_questions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "level_assessment_results" ADD CONSTRAINT "level_assessment_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_class_sessions" ADD CONSTRAINT "live_class_sessions_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_class_sessions" ADD CONSTRAINT "live_class_sessions_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_class_sessions" ADD CONSTRAINT "live_class_sessions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_assignments" ADD CONSTRAINT "mentor_assignments_mentor_id_users_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_assignments" ADD CONSTRAINT "mentor_assignments_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_sessions" ADD CONSTRAINT "mentoring_sessions_assignment_id_mentor_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."mentor_assignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_delivery_logs" ADD CONSTRAINT "notification_delivery_logs_notification_id_push_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."push_notifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_delivery_logs" ADD CONSTRAINT "notification_delivery_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_guardians" ADD CONSTRAINT "parent_guardians_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_snapshots" ADD CONSTRAINT "progress_snapshots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_notifications" ADD CONSTRAINT "push_notifications_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questionnaire_responses" ADD CONSTRAINT "questionnaire_responses_questionnaire_id_student_questionnaires_id_fk" FOREIGN KEY ("questionnaire_id") REFERENCES "public"."student_questionnaires"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questionnaire_responses" ADD CONSTRAINT "questionnaire_responses_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questionnaire_responses" ADD CONSTRAINT "questionnaire_responses_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questionnaire_responses" ADD CONSTRAINT "questionnaire_responses_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_results" ADD CONSTRAINT "quiz_results_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_results" ADD CONSTRAINT "quiz_results_glossary_item_id_glossary_items_id_fk" FOREIGN KEY ("glossary_item_id") REFERENCES "public"."glossary_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_commissions" ADD CONSTRAINT "referral_commissions_course_referral_id_course_referrals_id_fk" FOREIGN KEY ("course_referral_id") REFERENCES "public"."course_referrals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_commissions" ADD CONSTRAINT "referral_commissions_referrer_user_id_users_id_fk" FOREIGN KEY ("referrer_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_commissions" ADD CONSTRAINT "referral_commissions_referred_user_id_users_id_fk" FOREIGN KEY ("referred_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_commissions" ADD CONSTRAINT "referral_commissions_related_payment_id_payments_id_fk" FOREIGN KEY ("related_payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_commissions" ADD CONSTRAINT "referral_commissions_related_enrollment_id_enrollments_id_fk" FOREIGN KEY ("related_enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_settings" ADD CONSTRAINT "referral_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rewrite_suggestions" ADD CONSTRAINT "rewrite_suggestions_call_id_callern_call_history_id_fk" FOREIGN KEY ("call_id") REFERENCES "public"."callern_call_history"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_observations" ADD CONSTRAINT "scheduled_observations_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_observations" ADD CONSTRAINT "scheduled_observations_supervisor_id_users_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_observations" ADD CONSTRAINT "scheduled_observations_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_observations" ADD CONSTRAINT "scheduled_observations_class_id_sessions_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_packages" ADD CONSTRAINT "session_packages_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_tutor_id_users_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_assessments" ADD CONSTRAINT "skill_assessments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_callern_packages" ADD CONSTRAINT "student_callern_packages_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_callern_packages" ADD CONSTRAINT "student_callern_packages_package_id_callern_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."callern_packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_callern_progress" ADD CONSTRAINT "student_callern_progress_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_callern_progress" ADD CONSTRAINT "student_callern_progress_topic_id_callern_syllabus_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."callern_syllabus_topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_callern_progress" ADD CONSTRAINT "student_callern_progress_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_callern_progress" ADD CONSTRAINT "student_callern_progress_call_id_callern_call_history_id_fk" FOREIGN KEY ("call_id") REFERENCES "public"."callern_call_history"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_group_members" ADD CONSTRAINT "student_group_members_group_id_student_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."student_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_group_members" ADD CONSTRAINT "student_group_members_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_groups" ADD CONSTRAINT "student_groups_institute_id_institutes_id_fk" FOREIGN KEY ("institute_id") REFERENCES "public"."institutes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_groups" ADD CONSTRAINT "student_groups_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_groups" ADD CONSTRAINT "student_groups_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_notes" ADD CONSTRAINT "student_notes_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_notes" ADD CONSTRAINT "student_notes_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_preferences" ADD CONSTRAINT "student_preferences_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_questionnaires" ADD CONSTRAINT "student_questionnaires_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_reports" ADD CONSTRAINT "student_reports_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_reports" ADD CONSTRAINT "student_reports_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suggested_terms" ADD CONSTRAINT "suggested_terms_call_id_callern_call_history_id_fk" FOREIGN KEY ("call_id") REFERENCES "public"."callern_call_history"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supervision_observations" ADD CONSTRAINT "supervision_observations_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supervision_observations" ADD CONSTRAINT "supervision_observations_supervisor_id_users_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supervision_observations" ADD CONSTRAINT "supervision_observations_scheduled_observation_id_scheduled_observations_id_fk" FOREIGN KEY ("scheduled_observation_id") REFERENCES "public"."scheduled_observations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_institute_id_institutes_id_fk" FOREIGN KEY ("institute_id") REFERENCES "public"."institutes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_availability" ADD CONSTRAINT "teacher_availability_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_availability_periods" ADD CONSTRAINT "teacher_availability_periods_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_callern_availability" ADD CONSTRAINT "teacher_callern_availability_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_evaluations" ADD CONSTRAINT "teacher_evaluations_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_evaluations" ADD CONSTRAINT "teacher_evaluations_supervisor_id_users_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_observation_responses" ADD CONSTRAINT "teacher_observation_responses_observation_id_supervision_observations_id_fk" FOREIGN KEY ("observation_id") REFERENCES "public"."supervision_observations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_observation_responses" ADD CONSTRAINT "teacher_observation_responses_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_retention_data" ADD CONSTRAINT "teacher_retention_data_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_answers" ADD CONSTRAINT "test_answers_attempt_id_test_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."test_attempts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_answers" ADD CONSTRAINT "test_answers_question_id_test_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."test_questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_answers" ADD CONSTRAINT "test_answers_graded_by_users_id_fk" FOREIGN KEY ("graded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_test_id_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."tests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_questions" ADD CONSTRAINT "test_questions_test_id_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."tests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tests" ADD CONSTRAINT "tests_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tests" ADD CONSTRAINT "tests_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_game_progress" ADD CONSTRAINT "user_game_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_game_progress" ADD CONSTRAINT "user_game_progress_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_bookmarks" ADD CONSTRAINT "video_bookmarks_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_bookmarks" ADD CONSTRAINT "video_bookmarks_video_lesson_id_video_lessons_id_fk" FOREIGN KEY ("video_lesson_id") REFERENCES "public"."video_lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_lessons" ADD CONSTRAINT "video_lessons_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_lessons" ADD CONSTRAINT "video_lessons_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_notes" ADD CONSTRAINT "video_notes_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_notes" ADD CONSTRAINT "video_notes_video_lesson_id_video_lessons_id_fk" FOREIGN KEY ("video_lesson_id") REFERENCES "public"."video_lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_progress" ADD CONSTRAINT "video_progress_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_progress" ADD CONSTRAINT "video_progress_video_lesson_id_video_lessons_id_fk" FOREIGN KEY ("video_lesson_id") REFERENCES "public"."video_lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;