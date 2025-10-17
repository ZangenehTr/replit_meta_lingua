import { z } from 'zod';

const envSchema = z.object({
  // CRITICAL: Required in all environments
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters for security'),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL URL'),
  
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  
  // AI Services (Optional but recommended)
  OLLAMA_HOST: z.string().url().optional(),
  
  // Iranian External Services (Optional)
  KAVENEGAR_API_KEY: z.string().optional(),
  SHETAB_MERCHANT_ID: z.string().optional(),
  SHETAB_TERMINAL_ID: z.string().optional(),
  SHETAB_SECRET_KEY: z.string().min(32).optional(),
  ISABEL_VOIP_API_KEY: z.string().optional(),
  
  // Server Instance (for multi-server deployments)
  SERVER_INSTANCE_ID: z.string().optional(),
});

export type ValidatedEnv = z.infer<typeof envSchema>;

export function validateEnvironment() {
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error('❌ CRITICAL: Environment validation failed');
    console.error('Missing or invalid environment variables:');
    
    const errors = result.error.format();
    Object.keys(errors).forEach((key) => {
      if (key !== '_errors') {
        const fieldErrors = (errors as any)[key]._errors;
        if (fieldErrors && fieldErrors.length > 0) {
          console.error(`  - ${key}: ${fieldErrors.join(', ')}`);
        }
      }
    });
    
    // In production, exit immediately - no fallbacks allowed
    if (process.env.NODE_ENV === 'production') {
      console.error('');
      console.error('❌ FATAL: Cannot start in production without valid environment configuration');
      console.error('Please set all required environment variables in your .env file');
      console.error('See .env.production.template for reference');
      process.exit(1);
    }
    
    // In development, warn but continue (for rapid development)
    console.warn('');
    console.warn('⚠️  WARNING: Continuing in development mode with validation errors');
    console.warn('⚠️  This would cause immediate exit in production');
    console.warn('');
  } else {
    console.log('✅ Environment validation passed');
    
    // Log configured services (without exposing secrets)
    const config = result.data;
    console.log('📋 Configuration summary:');
    console.log(`   - Environment: ${config.NODE_ENV}`);
    console.log(`   - Database: ${config.DATABASE_URL.split('@')[1]?.split('?')[0] || 'configured'}`);
    console.log(`   - JWT Secret: ${config.JWT_SECRET.length} characters`);
    console.log(`   - Ollama: ${config.OLLAMA_HOST || 'not configured'}`);
    console.log(`   - Kavenegar SMS: ${config.KAVENEGAR_API_KEY ? 'configured' : 'not configured'}`);
    console.log(`   - Shetab Payment: ${config.SHETAB_MERCHANT_ID ? 'configured' : 'not configured'}`);
    console.log(`   - Isabel VoIP: ${config.ISABEL_VOIP_API_KEY ? 'configured' : 'not configured'}`);
  }
  
  return result;
}

export function getValidatedEnv(): ValidatedEnv {
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    throw new Error('Environment validation failed. Call validateEnvironment() first.');
  }
  
  return result.data;
}
