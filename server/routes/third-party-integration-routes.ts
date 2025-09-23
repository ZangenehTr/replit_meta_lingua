import { Router } from 'express';
import { db } from '../db';
import { thirdPartyApis, iranianCalendarSettings, calendarEventsIranian, holidayCalendarPersian, insertThirdPartyApiSchema, insertIranianCalendarSettingsSchema } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { keybitCalendarService } from '../services/keybit-calendar.service';
import crypto from 'crypto';
import { z } from 'zod';

const router = Router();

// Middleware to ensure admin access
const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.user || req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Helper function to encrypt API keys
const encryptApiKey = (apiKey: string): string => {
  const algorithm = 'aes-256-cbc';
  const key = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-me';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, key);
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

// Helper function to decrypt API keys
const decryptApiKey = (encryptedKey: string): string => {
  try {
    const algorithm = 'aes-256-cbc';
    const key = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-me';
    const textParts = encryptedKey.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = textParts.join(':');
    const decipher = crypto.createDecipher(algorithm, key);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Failed to decrypt API key:', error);
    return '';
  }
};

// ============================================================================
// THIRD-PARTY API MANAGEMENT ROUTES
// ============================================================================

/**
 * GET /api/admin/third-party-apis
 * Get all third-party API configurations
 */
router.get('/admin/third-party-apis', requireAdmin, async (req, res) => {
  try {
    const apis = await db
      .select({
        id: thirdPartyApis.id,
        apiName: thirdPartyApis.apiName,
        displayName: thirdPartyApis.displayName,
        description: thirdPartyApis.description,
        baseUrl: thirdPartyApis.baseUrl,
        isEnabled: thirdPartyApis.isEnabled,
        isHealthy: thirdPartyApis.isHealthy,
        lastHealthCheck: thirdPartyApis.lastHealthCheck,
        rateLimit: thirdPartyApis.rateLimit,
        usageCount: thirdPartyApis.usageCount,
        usageCountMonth: thirdPartyApis.usageCountMonth,
        lastUsedAt: thirdPartyApis.lastUsedAt,
        errorCount: thirdPartyApis.errorCount,
        lastErrorAt: thirdPartyApis.lastErrorAt,
        lastErrorMessage: thirdPartyApis.lastErrorMessage,
        costPerRequest: thirdPartyApis.costPerRequest,
        monthlyBudget: thirdPartyApis.monthlyBudget,
        currentMonthlyCost: thirdPartyApis.currentMonthlyCost,
        createdAt: thirdPartyApis.createdAt,
        updatedAt: thirdPartyApis.updatedAt
      })
      .from(thirdPartyApis)
      .orderBy(desc(thirdPartyApis.createdAt));

    res.json(apis);
  } catch (error) {
    console.error('Failed to fetch third-party APIs:', error);
    res.status(500).json({ message: 'Failed to fetch third-party APIs' });
  }
});

/**
 * GET /api/admin/third-party-apis/:id
 * Get specific third-party API configuration
 */
router.get('/admin/third-party-apis/:id', requireAdmin, async (req, res) => {
  try {
    const [api] = await db
      .select()
      .from(thirdPartyApis)
      .where(eq(thirdPartyApis.id, parseInt(req.params.id)))
      .limit(1);

    if (!api) {
      return res.status(404).json({ message: 'API configuration not found' });
    }

    // Don't return encrypted keys in the response
    const { apiKey, apiSecret, ...safeApi } = api;

    res.json({
      ...safeApi,
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret
    });
  } catch (error) {
    console.error('Failed to fetch API configuration:', error);
    res.status(500).json({ message: 'Failed to fetch API configuration' });
  }
});

/**
 * POST /api/admin/third-party-apis
 * Create new third-party API configuration
 */
router.post('/admin/third-party-apis', requireAdmin, async (req, res) => {
  try {
    const validatedData = insertThirdPartyApiSchema.parse(req.body);

    // Encrypt API keys if provided
    const encryptedData = {
      ...validatedData,
      apiKey: validatedData.apiKey ? encryptApiKey(validatedData.apiKey) : null,
      apiSecret: validatedData.apiSecret ? encryptApiKey(validatedData.apiSecret) : null
    };

    const [newApi] = await db
      .insert(thirdPartyApis)
      .values(encryptedData)
      .returning({
        id: thirdPartyApis.id,
        apiName: thirdPartyApis.apiName,
        displayName: thirdPartyApis.displayName,
        isEnabled: thirdPartyApis.isEnabled
      });

    res.status(201).json(newApi);
  } catch (error) {
    console.error('Failed to create API configuration:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid API configuration data', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to create API configuration' });
  }
});

/**
 * PUT /api/admin/third-party-apis/:id
 * Update third-party API configuration
 */
router.put('/admin/third-party-apis/:id', requireAdmin, async (req, res) => {
  try {
    const validatedData = insertThirdPartyApiSchema.partial().parse(req.body);

    // Encrypt API keys if provided
    const updateData: any = { ...validatedData };
    if (validatedData.apiKey) {
      updateData.apiKey = encryptApiKey(validatedData.apiKey);
    }
    if (validatedData.apiSecret) {
      updateData.apiSecret = encryptApiKey(validatedData.apiSecret);
    }

    const [updatedApi] = await db
      .update(thirdPartyApis)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(thirdPartyApis.id, parseInt(req.params.id)))
      .returning({
        id: thirdPartyApis.id,
        apiName: thirdPartyApis.apiName,
        displayName: thirdPartyApis.displayName,
        isEnabled: thirdPartyApis.isEnabled
      });

    if (!updatedApi) {
      return res.status(404).json({ message: 'API configuration not found' });
    }

    res.json(updatedApi);
  } catch (error) {
    console.error('Failed to update API configuration:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid API configuration data', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to update API configuration' });
  }
});

/**
 * DELETE /api/admin/third-party-apis/:id
 * Delete third-party API configuration
 */
router.delete('/admin/third-party-apis/:id', requireAdmin, async (req, res) => {
  try {
    const [deletedApi] = await db
      .delete(thirdPartyApis)
      .where(eq(thirdPartyApis.id, parseInt(req.params.id)))
      .returning({ id: thirdPartyApis.id });

    if (!deletedApi) {
      return res.status(404).json({ message: 'API configuration not found' });
    }

    res.json({ message: 'API configuration deleted successfully' });
  } catch (error) {
    console.error('Failed to delete API configuration:', error);
    res.status(500).json({ message: 'Failed to delete API configuration' });
  }
});

/**
 * POST /api/admin/third-party-apis/:id/test
 * Test third-party API connectivity
 */
router.post('/admin/third-party-apis/:id/test', requireAdmin, async (req, res) => {
  try {
    const [api] = await db
      .select()
      .from(thirdPartyApis)
      .where(eq(thirdPartyApis.id, parseInt(req.params.id)))
      .limit(1);

    if (!api) {
      return res.status(404).json({ message: 'API configuration not found' });
    }

    let testResult;

    // Test specific APIs
    if (api.apiName === 'keybit') {
      testResult = await keybitCalendarService.testConnection();
    } else {
      // Generic connectivity test
      testResult = {
        success: false,
        error: 'Test not implemented for this API type'
      };
    }

    res.json(testResult);
  } catch (error) {
    console.error('Failed to test API:', error);
    res.status(500).json({ message: 'Failed to test API connectivity' });
  }
});

/**
 * POST /api/admin/third-party-apis/:id/health-check
 * Perform health check on specific API
 */
router.post('/admin/third-party-apis/:id/health-check', requireAdmin, async (req, res) => {
  try {
    const [api] = await db
      .select()
      .from(thirdPartyApis)
      .where(eq(thirdPartyApis.id, parseInt(req.params.id)))
      .limit(1);

    if (!api) {
      return res.status(404).json({ message: 'API configuration not found' });
    }

    let healthResult;

    // Perform health check for specific APIs
    if (api.apiName === 'keybit') {
      const isHealthy = await keybitCalendarService.checkHealth();
      const status = await keybitCalendarService.getApiStatus();
      healthResult = {
        isHealthy,
        ...status
      };
    } else {
      healthResult = {
        isHealthy: false,
        error: 'Health check not implemented for this API type'
      };
    }

    res.json(healthResult);
  } catch (error) {
    console.error('Failed to perform health check:', error);
    res.status(500).json({ message: 'Failed to perform health check' });
  }
});

// ============================================================================
// CALENDAR CONVERSION ROUTES
// ============================================================================

/**
 * POST /api/calendar/convert/gregorian-to-jalali
 * Convert Gregorian date to Jalali
 */
router.post('/calendar/convert/gregorian-to-jalali', async (req, res) => {
  try {
    const { date } = req.body;
    
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const gregorianDate = new Date(date);
    const result = await keybitCalendarService.gregorianToJalali(gregorianDate);

    res.json(result);
  } catch (error) {
    console.error('Failed to convert date:', error);
    res.status(500).json({ message: 'Failed to convert date' });
  }
});

/**
 * POST /api/calendar/convert/jalali-to-gregorian
 * Convert Jalali date to Gregorian
 */
router.post('/calendar/convert/jalali-to-gregorian', async (req, res) => {
  try {
    const { year, month, day } = req.body;
    
    if (!year || !month || !day) {
      return res.status(400).json({ message: 'Year, month, and day are required' });
    }

    const result = await keybitCalendarService.jalaliToGregorian(year, month, day);

    res.json(result);
  } catch (error) {
    console.error('Failed to convert date:', error);
    res.status(500).json({ message: 'Failed to convert date' });
  }
});

/**
 * GET /api/calendar/month-names
 * Get Persian month and weekday names
 */
router.get('/calendar/month-names', async (req, res) => {
  try {
    const result = await keybitCalendarService.getMonthNames();
    res.json(result);
  } catch (error) {
    console.error('Failed to get month names:', error);
    res.status(500).json({ message: 'Failed to get month names' });
  }
});

/**
 * GET /api/calendar/holidays/:year
 * Get Iranian holidays for a specific year
 */
router.get('/calendar/holidays/:year', async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    
    if (isNaN(year)) {
      return res.status(400).json({ message: 'Invalid year provided' });
    }

    const result = await keybitCalendarService.getHolidays(year);
    res.json(result);
  } catch (error) {
    console.error('Failed to get holidays:', error);
    res.status(500).json({ message: 'Failed to get holidays' });
  }
});

// ============================================================================
// CALENDAR SETTINGS ROUTES
// ============================================================================

/**
 * GET /api/calendar/settings
 * Get user or global calendar settings
 */
router.get('/calendar/settings', async (req, res) => {
  try {
    const userId = req.user?.id;
    
    // Get user-specific settings if authenticated
    let settings = [];
    if (userId) {
      settings = await db
        .select()
        .from(iranianCalendarSettings)
        .where(eq(iranianCalendarSettings.userId, userId));
    }

    // Get global settings as fallback
    const globalSettings = await db
      .select()
      .from(iranianCalendarSettings)
      .where(eq(iranianCalendarSettings.isGlobal, true));

    res.json({
      userSettings: settings,
      globalSettings
    });
  } catch (error) {
    console.error('Failed to get calendar settings:', error);
    res.status(500).json({ message: 'Failed to get calendar settings' });
  }
});

/**
 * POST /api/calendar/settings
 * Update user calendar settings
 */
router.post('/calendar/settings', async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const validatedData = insertIranianCalendarSettingsSchema.parse({
      ...req.body,
      userId,
      isGlobal: false
    });

    // Check if user already has this setting
    const existingSetting = await db
      .select()
      .from(iranianCalendarSettings)
      .where(
        and(
          eq(iranianCalendarSettings.userId, userId),
          eq(iranianCalendarSettings.settingKey, validatedData.settingKey)
        )
      )
      .limit(1);

    let result;
    if (existingSetting.length > 0) {
      // Update existing setting
      [result] = await db
        .update(iranianCalendarSettings)
        .set({ ...validatedData, updatedAt: new Date() })
        .where(eq(iranianCalendarSettings.id, existingSetting[0].id))
        .returning();
    } else {
      // Create new setting
      [result] = await db
        .insert(iranianCalendarSettings)
        .values(validatedData)
        .returning();
    }

    res.json(result);
  } catch (error) {
    console.error('Failed to update calendar settings:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid settings data', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to update calendar settings' });
  }
});

/**
 * GET /api/admin/calendar/events
 * Get all Iranian calendar events (admin only)
 */
router.get('/admin/calendar/events', requireAdmin, async (req, res) => {
  try {
    const events = await db
      .select()
      .from(calendarEventsIranian)
      .orderBy(calendarEventsIranian.persianDate);

    res.json(events);
  } catch (error) {
    console.error('Failed to get calendar events:', error);
    res.status(500).json({ message: 'Failed to get calendar events' });
  }
});

/**
 * GET /api/admin/calendar/holidays
 * Get all Persian holidays (admin only)
 */
router.get('/admin/calendar/holidays', requireAdmin, async (req, res) => {
  try {
    const holidays = await db
      .select()
      .from(holidayCalendarPersian)
      .orderBy(holidayCalendarPersian.persianDate);

    res.json(holidays);
  } catch (error) {
    console.error('Failed to get holidays:', error);
    res.status(500).json({ message: 'Failed to get holidays' });
  }
});

export default router;