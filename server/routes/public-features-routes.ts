/**
 * Public Features Configuration Routes
 * Manages which features are visible to non-enrolled students
 */

import express from 'express';
import { storage } from '../storage';
import { requireAuth, requireRole, AuthRequest } from '../auth-middleware';
import { institutePublicFeaturesSchema } from '@shared/schema';
import { DEFAULT_PUBLIC_FEATURES } from '@shared/public-features-defaults';

const router = express.Router();

// Get public features configuration for current institute
router.get("/", async (req, res) => {
  try {
    // For now, return default configuration from the first institute (ID 1)
    // In multi-tenant setup, this would be determined by subdomain/domain
    const institute = await storage.getInstituteById(1);
    const settings = institute?.settings as any;
    
    const publicFeatures = settings?.publicFeatures || DEFAULT_PUBLIC_FEATURES;
    
    res.json(publicFeatures);
  } catch (error) {
    console.error('Error fetching public features:', error);
    // Return all-true defaults on error (admins must explicitly opt-out)
    res.json(DEFAULT_PUBLIC_FEATURES);
  }
});

// Update public features configuration (Admin/Supervisor only)
router.put("/", requireAuth, requireRole(['Admin', 'Supervisor']), async (req: AuthRequest, res) => {
  try {
    const validation = institutePublicFeaturesSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid public features configuration', details: validation.error });
    }
    
    const publicFeatures = validation.data;
    
    // Get the first institute (or use subdomain to determine which one)
    const institute = await storage.getInstituteById(1);
    if (!institute) {
      return res.status(404).json({ error: 'Institute not found' });
    }
    
    const currentSettings = (institute.settings as any) || {};
    const updatedSettings = {
      ...currentSettings,
      publicFeatures
    };
    
    await storage.updateWhiteLabelInstitute(1, { settings: updatedSettings });
    
    res.json({ success: true, publicFeatures });
  } catch (error) {
    console.error('Error updating public features:', error);
    res.status(500).json({ error: 'Failed to update public features' });
  }
});

export default router;
