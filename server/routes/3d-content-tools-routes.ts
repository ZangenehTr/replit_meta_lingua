import { Router } from "express";
import { z } from "zod";
import { 
  threeDLessonContent,
  insertThreeDLessonContentSchema,
  type ThreeDLessonContent,
  type ThreeDLessonContentInsert
} from "@shared/schema";
import { db } from "../db";
import { eq, desc, and, like, sql } from "drizzle-orm";

export const threeDContentToolsRouter = Router();

// Validation schemas for 3D content creation
const threeDElementSchema = z.object({
  id: z.string(),
  type: z.enum(['model', 'animation', 'interaction', 'text', 'audio', 'particle']),
  name: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(), 
    z: z.number()
  }),
  rotation: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number()
  }),
  scale: z.object({
    x: z.number().default(1),
    y: z.number().default(1),
    z: z.number().default(1)
  }),
  properties: z.record(z.any()).optional()
});

const threeDSceneSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  elements: z.array(threeDElementSchema),
  environment: z.object({
    background: z.string().optional(),
    lighting: z.array(z.object({
      type: z.enum(['ambient', 'directional', 'point', 'spot']),
      position: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
      color: z.string(),
      intensity: z.number()
    })),
    camera: z.object({
      position: z.object({ x: z.number(), y: z.number(), z: z.number() }),
      target: z.object({ x: z.number(), y: z.number(), z: z.number() }),
      fov: z.number().default(75)
    })
  }),
  interactions: z.array(z.object({
    triggerId: z.string(),
    actionType: z.enum(['highlight', 'animate', 'speak', 'navigate', 'quiz']),
    actionData: z.record(z.any())
  }))
});

// ====================================================================
// 3D LESSON BUILDER INTERFACE
// ====================================================================

/**
 * GET /api/3d-tools/lessons
 * Get all 3D lessons with pagination and filtering
 */
threeDContentToolsRouter.get("/lessons", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const difficulty = req.query.difficulty as string;
    const category = req.query.category as string;
    
    const offset = (page - 1) * limit;
    
    let whereClause = sql`1=1`;
    
    if (search) {
      whereClause = sql`${whereClause} AND (${threeDLessonContent.title} ILIKE ${`%${search}%`} OR ${threeDLessonContent.description} ILIKE ${`%${search}%`})`;
    }
    
    if (difficulty) {
      whereClause = sql`${whereClause} AND ${threeDLessonContent.difficultyLevel} = ${difficulty}`;
    }
    
    if (category) {
      whereClause = sql`${whereClause} AND ${threeDLessonContent.category} = ${category}`;
    }
    
    const lessons = await db
      .select()
      .from(threeDLessonContent)
      .where(whereClause)
      .orderBy(desc(threeDLessonContent.updatedAt))
      .limit(limit)
      .offset(offset);
    
    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(threeDLessonContent)
      .where(whereClause);
    
    res.json({
      success: true,
      lessons,
      pagination: {
        page,
        limit,
        total: totalCount[0].count,
        totalPages: Math.ceil(totalCount[0].count / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching 3D lessons:', error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch 3D lessons" 
    });
  }
});

/**
 * GET /api/3d-tools/lessons/:id
 * Get a specific 3D lesson for editing
 */
threeDContentToolsRouter.get("/lessons/:id", async (req, res) => {
  try {
    const lessonId = parseInt(req.params.id);
    
    const lesson = await db
      .select()
      .from(threeDLessonContent)
      .where(eq(threeDLessonContent.id, lessonId))
      .limit(1);
    
    if (lesson.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: "3D lesson not found" 
      });
    }
    
    res.json({
      success: true,
      lesson: lesson[0]
    });
    
  } catch (error) {
    console.error('Error fetching 3D lesson:', error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch 3D lesson" 
    });
  }
});

/**
 * POST /api/3d-tools/lessons
 * Create a new 3D lesson
 */
threeDContentToolsRouter.post("/lessons", async (req, res) => {
  try {
    const lessonData = insertThreeDLessonContentSchema.parse(req.body);
    
    // Validate the 3D scene data if provided
    if (lessonData.sceneElements) {
      try {
        const sceneValidation = threeDSceneSchema.partial().parse(lessonData.sceneElements);
      } catch (validationError) {
        return res.status(400).json({
          success: false,
          error: "Invalid 3D scene data",
          details: validationError
        });
      }
    }
    
    const [lesson] = await db
      .insert(threeDLessonContent)
      .values(lessonData)
      .returning();
    
    res.json({
      success: true,
      lesson,
      message: "3D lesson created successfully"
    });
    
  } catch (error) {
    console.error('Error creating 3D lesson:', error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to create 3D lesson" 
    });
  }
});

/**
 * PUT /api/3d-tools/lessons/:id
 * Update a 3D lesson
 */
threeDContentToolsRouter.put("/lessons/:id", async (req, res) => {
  try {
    const lessonId = parseInt(req.params.id);
    const updateData = req.body;
    
    // Validate the 3D scene data if being updated
    if (updateData.sceneElements) {
      try {
        const sceneValidation = threeDSceneSchema.partial().parse(updateData.sceneElements);
      } catch (validationError) {
        return res.status(400).json({
          success: false,
          error: "Invalid 3D scene data",
          details: validationError
        });
      }
    }
    
    const [updatedLesson] = await db
      .update(threeDLessonContent)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(threeDLessonContent.id, lessonId))
      .returning();
    
    res.json({
      success: true,
      lesson: updatedLesson,
      message: "3D lesson updated successfully"
    });
    
  } catch (error) {
    console.error('Error updating 3D lesson:', error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to update 3D lesson" 
    });
  }
});

/**
 * DELETE /api/3d-tools/lessons/:id
 * Delete a 3D lesson
 */
threeDContentToolsRouter.delete("/lessons/:id", async (req, res) => {
  try {
    const lessonId = parseInt(req.params.id);
    
    const [deletedLesson] = await db
      .delete(threeDLessonContent)
      .where(eq(threeDLessonContent.id, lessonId))
      .returning();
    
    res.json({
      success: true,
      lesson: deletedLesson,
      message: "3D lesson deleted successfully"
    });
    
  } catch (error) {
    console.error('Error deleting 3D lesson:', error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to delete 3D lesson" 
    });
  }
});

// ====================================================================
// 3D ELEMENT TEMPLATES AND LIBRARY
// ====================================================================

/**
 * GET /api/3d-tools/templates
 * Get 3D element templates for rapid development
 */
threeDContentToolsRouter.get("/templates", async (req, res) => {
  try {
    const templates = {
      models: [
        {
          id: "classroom_basic",
          name: "Basic Classroom",
          description: "Standard classroom setup with desks and whiteboard",
          category: "environments",
          elements: [
            {
              type: "model",
              name: "classroom_walls",
              modelUrl: "/3d-assets/classroom/walls.glb",
              position: { x: 0, y: 0, z: 0 },
              rotation: { x: 0, y: 0, z: 0 },
              scale: { x: 1, y: 1, z: 1 }
            },
            {
              type: "model", 
              name: "whiteboard",
              modelUrl: "/3d-assets/classroom/whiteboard.glb",
              position: { x: 0, y: 1.5, z: -3 },
              rotation: { x: 0, y: 0, z: 0 },
              scale: { x: 1, y: 1, z: 1 },
              properties: {
                interactive: true,
                canWrite: true
              }
            }
          ]
        },
        {
          id: "conversation_cafe",
          name: "Conversation Café", 
          description: "Casual café setting for conversation practice",
          category: "environments",
          elements: [
            {
              type: "model",
              name: "cafe_interior",
              modelUrl: "/3d-assets/cafe/interior.glb",
              position: { x: 0, y: 0, z: 0 },
              rotation: { x: 0, y: 0, z: 0 },
              scale: { x: 1, y: 1, z: 1 }
            },
            {
              type: "model",
              name: "table",
              modelUrl: "/3d-assets/cafe/table.glb", 
              position: { x: 0, y: 0, z: 0 },
              rotation: { x: 0, y: 0, z: 0 },
              scale: { x: 1, y: 1, z: 1 }
            }
          ]
        }
      ],
      interactions: [
        {
          id: "click_to_speak",
          name: "Click to Speak",
          description: "Click an object to hear pronunciation",
          actionType: "speak",
          implementation: {
            trigger: "click",
            action: "playAudio", 
            parameters: {
              audioSource: "tts",
              text: "{objectName}",
              voice: "persian_female"
            }
          }
        },
        {
          id: "hover_highlight",
          name: "Hover Highlight",
          description: "Highlight object on mouse hover",
          actionType: "highlight",
          implementation: {
            trigger: "hover",
            action: "addOutline",
            parameters: {
              color: "#00ff00",
              thickness: 2
            }
          }
        },
        {
          id: "drag_to_position",
          name: "Drag to Position",
          description: "Drag objects to correct positions",
          actionType: "animate",
          implementation: {
            trigger: "drag",
            action: "validatePosition",
            parameters: {
              tolerance: 0.5,
              snapToGrid: true,
              onCorrect: "showSuccess",
              onIncorrect: "showHint"
            }
          }
        }
      ],
      animations: [
        {
          id: "fade_in",
          name: "Fade In",
          description: "Smoothly fade object into view",
          duration: 1000,
          easing: "ease-out",
          keyframes: [
            { time: 0, opacity: 0 },
            { time: 1, opacity: 1 }
          ]
        },
        {
          id: "bounce_attention",
          name: "Bounce Attention",
          description: "Bounce animation to draw attention",
          duration: 600,
          easing: "ease-in-out",
          keyframes: [
            { time: 0, scale: { x: 1, y: 1, z: 1 } },
            { time: 0.5, scale: { x: 1.1, y: 1.1, z: 1.1 } },
            { time: 1, scale: { x: 1, y: 1, z: 1 } }
          ]
        },
        {
          id: "rotate_showcase",
          name: "Rotate Showcase",
          description: "Slowly rotate object for viewing",
          duration: 4000,
          easing: "linear",
          loop: true,
          keyframes: [
            { time: 0, rotation: { x: 0, y: 0, z: 0 } },
            { time: 1, rotation: { x: 0, y: 360, z: 0 } }
          ]
        }
      ]
    };
    
    res.json({
      success: true,
      templates
    });
    
  } catch (error) {
    console.error('Error fetching 3D templates:', error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch 3D templates" 
    });
  }
});

/**
 * POST /api/3d-tools/templates
 * Create a custom 3D template
 */
threeDContentToolsRouter.post("/templates", async (req, res) => {
  try {
    const { name, description, category, elements, interactions } = req.body;
    
    // Validate template data
    const templateValidation = z.object({
      name: z.string().min(1),
      description: z.string(),
      category: z.string(),
      elements: z.array(threeDElementSchema),
      interactions: z.array(z.any()).optional()
    }).parse({ name, description, category, elements, interactions });
    
    // For now, store as a 3D lesson content with template flag
    const templateData = {
      title: `Template: ${name}`,
      description,
      category,
      difficultyLevel: 'template',
      isTemplate: true,
      sceneElements: {
        name,
        description,
        elements,
        interactions: interactions || []
      },
      mobileOptimizations: {
        lowPoly: true,
        reducedTextures: true,
        simplifiedShaders: true
      }
    };
    
    const [template] = await db
      .insert(threeDLessonContent)
      .values(templateData)
      .returning();
    
    res.json({
      success: true,
      template,
      message: "3D template created successfully"
    });
    
  } catch (error) {
    console.error('Error creating 3D template:', error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to create 3D template" 
    });
  }
});

// ====================================================================
// MOBILE OPTIMIZATION TOOLS
// ====================================================================

/**
 * POST /api/3d-tools/optimize-mobile/:lessonId
 * Optimize a 3D lesson for mobile devices
 */
threeDContentToolsRouter.post("/optimize-mobile/:lessonId", async (req, res) => {
  try {
    const lessonId = parseInt(req.params.lessonId);
    
    // Get the lesson
    const lesson = await db
      .select()
      .from(threeDLessonContent)
      .where(eq(threeDLessonContent.id, lessonId))
      .limit(1);
    
    if (lesson.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: "3D lesson not found" 
      });
    }
    
    // Apply mobile optimizations
    const mobileOptimizations = {
      lowPoly: true,
      reducedTextures: true,
      simplifiedShaders: true,
      maxPolygons: 10000,
      textureSize: 512,
      reducedParticles: true,
      simplifiedAnimations: true,
      lodLevels: [
        { distance: 0, quality: "high" },
        { distance: 10, quality: "medium" },
        { distance: 25, quality: "low" }
      ]
    };
    
    // Update lesson with mobile optimizations
    const [optimizedLesson] = await db
      .update(threeDLessonContent)
      .set({
        mobileOptimizations,
        updatedAt: new Date()
      })
      .where(eq(threeDLessonContent.id, lessonId))
      .returning();
    
    res.json({
      success: true,
      lesson: optimizedLesson,
      optimizations: mobileOptimizations,
      message: "3D lesson optimized for mobile devices"
    });
    
  } catch (error) {
    console.error('Error optimizing for mobile:', error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to optimize for mobile" 
    });
  }
});

/**
 * GET /api/3d-tools/performance-analysis/:lessonId
 * Analyze 3D lesson performance and suggest optimizations
 */
threeDContentToolsRouter.get("/performance-analysis/:lessonId", async (req, res) => {
  try {
    const lessonId = parseInt(req.params.lessonId);
    
    // Get the lesson
    const lesson = await db
      .select()
      .from(threeDLessonContent)
      .where(eq(threeDLessonContent.id, lessonId))
      .limit(1);
    
    if (lesson.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: "3D lesson not found" 
      });
    }
    
    const sceneElements = lesson[0].sceneElements as any;
    
    // Analyze performance metrics
    const analysis = {
      totalElements: sceneElements?.elements?.length || 0,
      estimatedPolygons: (sceneElements?.elements?.length || 0) * 1000, // Rough estimate
      textureCount: sceneElements?.elements?.filter((e: any) => e.type === 'model').length || 0,
      animationCount: sceneElements?.elements?.filter((e: any) => e.properties?.animated).length || 0,
      interactionCount: sceneElements?.interactions?.length || 0,
      performance: {
        mobile: "medium", // Based on analysis
        desktop: "high",
        estimated_fps_mobile: 30,
        estimated_fps_desktop: 60
      },
      recommendations: []
    };
    
    // Generate recommendations
    if (analysis.totalElements > 20) {
      analysis.recommendations.push({
        type: "reduce_complexity",
        message: "Consider reducing the number of 3D elements for better performance",
        impact: "high"
      });
    }
    
    if (analysis.estimatedPolygons > 50000) {
      analysis.recommendations.push({
        type: "optimize_models",
        message: "Use lower polygon models for better mobile performance",
        impact: "high"
      });
    }
    
    if (analysis.animationCount > 5) {
      analysis.recommendations.push({
        type: "reduce_animations",
        message: "Too many animations may impact performance on older devices",
        impact: "medium"
      });
    }
    
    // Check if mobile optimizations are applied
    if (!lesson[0].mobileOptimizations) {
      analysis.recommendations.push({
        type: "mobile_optimization",
        message: "Apply mobile optimizations to improve performance on mobile devices",
        impact: "high"
      });
    }
    
    res.json({
      success: true,
      analysis,
      lesson: {
        id: lesson[0].id,
        title: lesson[0].title
      }
    });
    
  } catch (error) {
    console.error('Error analyzing performance:', error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to analyze performance" 
    });
  }
});

// ====================================================================
// 3D SCENE PREVIEW AND VALIDATION
// ====================================================================

/**
 * POST /api/3d-tools/validate-scene
 * Validate 3D scene configuration
 */
threeDContentToolsRouter.post("/validate-scene", async (req, res) => {
  try {
    const sceneData = req.body;
    
    // Validate scene structure
    const validatedScene = threeDSceneSchema.parse(sceneData);
    
    // Additional validation checks
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };
    
    // Check for common issues
    if (validatedScene.elements.length === 0) {
      validation.warnings.push("Scene has no 3D elements");
    }
    
    if (validatedScene.elements.length > 50) {
      validation.warnings.push("Scene has many elements - consider optimization for mobile");
    }
    
    // Check lighting setup
    if (validatedScene.environment.lighting.length === 0) {
      validation.errors.push("Scene must have at least one light source");
      validation.isValid = false;
    }
    
    // Check camera position
    const camera = validatedScene.environment.camera;
    if (camera.position.x === 0 && camera.position.y === 0 && camera.position.z === 0) {
      validation.warnings.push("Camera is at origin - consider adjusting position for better view");
    }
    
    // Check for overlapping elements
    const positions = validatedScene.elements.map(e => e.position);
    const overlapping = positions.filter((pos, index) => 
      positions.findIndex(p => 
        Math.abs(p.x - pos.x) < 0.1 && 
        Math.abs(p.y - pos.y) < 0.1 && 
        Math.abs(p.z - pos.z) < 0.1
      ) !== index
    );
    
    if (overlapping.length > 0) {
      validation.warnings.push(`${overlapping.length} elements may be overlapping`);
    }
    
    res.json({
      success: true,
      validation,
      scene: validatedScene
    });
    
  } catch (error) {
    console.error('Error validating scene:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        validation: {
          isValid: false,
          errors: error.errors.map(e => e.message),
          warnings: [],
          suggestions: []
        }
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: "Failed to validate scene" 
      });
    }
  }
});

export { threeDContentToolsRouter };