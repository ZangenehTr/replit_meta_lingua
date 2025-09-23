import { useRef, useEffect, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text, Box, Sphere, Plane } from "@react-three/drei";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Mic, Volume2, RotateCcw, Check, X } from "lucide-react";

interface LessonData {
  id: number;
  title: string;
  description: string;
  language: string;
  difficulty: string;
  lessonType: 'vocabulary' | 'grammar' | 'conversation' | 'listening' | 'pronunciation';
  sceneType: string;
  vocabularyWords?: string[];
  grammarTopics?: string[];
  exampleSentences?: string[];
  estimatedDurationMinutes: number;
  xpReward: number;
}

interface InteractionPoint {
  id: string;
  position: [number, number, number];
  word: string;
  translation: string;
  audioUrl?: string;
  isCompleted: boolean;
}

interface Three3DLessonProps {
  lesson: LessonData;
  onComplete: (timeSpent: number) => void;
  onProgress: (progress: number) => void;
  onInteraction: (pointId: string) => void;
  isMobile?: boolean;
}

/**
 * 3D Interactive Vocabulary Scene Component
 */
function VocabularyScene({ lesson, interactionPoints, onPointClick }: {
  lesson: LessonData;
  interactionPoints: InteractionPoint[];
  onPointClick: (pointId: string) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.01; // Gentle rotation
    }
  });

  return (
    <group ref={groupRef}>
      {/* Environment setup */}
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      {/* Interactive vocabulary objects */}
      {interactionPoints.map((point, index) => (
        <VocabularyObject
          key={point.id}
          position={point.position}
          word={point.word}
          translation={point.translation}
          isCompleted={point.isCompleted}
          onClick={() => onPointClick(point.id)}
          delay={index * 0.2}
        />
      ))}

      {/* Floor plane */}
      <Plane 
        args={[20, 20]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -3, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#f0f8ff" opacity={0.7} transparent />
      </Plane>
    </group>
  );
}

/**
 * Individual vocabulary object in 3D space
 */
function VocabularyObject({ 
  position, 
  word, 
  translation, 
  isCompleted, 
  onClick, 
  delay = 0 
}: {
  position: [number, number, number];
  word: string;
  translation: string;
  isCompleted: boolean;
  onClick: () => void;
  delay?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  useFrame((state) => {
    if (meshRef.current && visible) {
      const scale = hovered ? 1.2 : 1;
      meshRef.current.scale.lerp({ x: scale, y: scale, z: scale } as any, 0.1);
      
      if (!isCompleted) {
        meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
      }
    }
  });

  if (!visible) return null;

  return (
    <group position={position}>
      <Box
        ref={meshRef}
        args={[1.5, 1.5, 1.5]}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial 
          color={isCompleted ? "#4ade80" : hovered ? "#60a5fa" : "#3b82f6"}
          emissive={hovered ? "#1e40af" : "#000000"}
          emissiveIntensity={hovered ? 0.2 : 0}
        />
      </Box>
      
      {/* Word text */}
      <Text
        position={[0, 2, 0]}
        fontSize={0.5}
        color={isCompleted ? "#16a34a" : "#1f2937"}
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter-bold.woff"
      >
        {word}
      </Text>
      
      {/* Translation text */}
      <Text
        position={[0, -2, 0]}
        fontSize={0.3}
        color="#6b7280"
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter-regular.woff"
      >
        {translation}
      </Text>

      {/* Completion indicator */}
      {isCompleted && (
        <Sphere args={[0.2]} position={[1, 1, 1]}>
          <meshBasicMaterial color="#22c55e" />
        </Sphere>
      )}
    </group>
  );
}

/**
 * Camera controller for mobile optimization
 */
function MobileOptimizedCamera({ isMobile }: { isMobile: boolean }) {
  const { camera } = useThree();

  useEffect(() => {
    if (isMobile) {
      camera.position.set(0, 5, 8);
      camera.fov = 75;
    } else {
      camera.position.set(0, 8, 12);
      camera.fov = 60;
    }
    camera.updateProjectionMatrix();
  }, [camera, isMobile]);

  return null;
}

/**
 * Main 3D Lesson Component
 */
export function Three3DLesson({ 
  lesson, 
  onComplete, 
  onProgress, 
  onInteraction,
  isMobile = false 
}: Three3DLessonProps) {
  const [interactionPoints, setInteractionPoints] = useState<InteractionPoint[]>([]);
  const [progress, setProgress] = useState(0);
  const [startTime] = useState(Date.now());
  const [selectedPoint, setSelectedPoint] = useState<InteractionPoint | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  // Initialize interaction points from lesson data
  useEffect(() => {
    if (lesson.vocabularyWords) {
      const points: InteractionPoint[] = lesson.vocabularyWords.map((word, index) => ({
        id: `vocab_${index}`,
        position: [
          (index % 3 - 1) * 4, // X: -4, 0, 4
          Math.floor(index / 3) * 2, // Y: stacked
          (Math.floor(index / 3) % 2) * 2 - 1 // Z: alternating
        ] as [number, number, number],
        word: word,
        translation: `Translation of ${word}`, // Would come from lesson data
        isCompleted: false
      }));
      setInteractionPoints(points);
    }
  }, [lesson]);

  // Handle point interaction
  const handlePointClick = useCallback((pointId: string) => {
    setInteractionPoints(prev => {
      const updated = prev.map(point => 
        point.id === pointId 
          ? { ...point, isCompleted: true }
          : point
      );

      // Calculate progress
      const completedCount = updated.filter(p => p.isCompleted).length;
      const newProgress = (completedCount / updated.length) * 100;
      setProgress(newProgress);
      onProgress(newProgress);

      // Check if lesson completed
      if (completedCount === updated.length) {
        const timeSpent = Math.floor((Date.now() - startTime) / 60000); // minutes
        setTimeout(() => onComplete(timeSpent), 500);
      }

      return updated;
    });

    // Find selected point for interaction panel
    const point = interactionPoints.find(p => p.id === pointId);
    if (point) {
      setSelectedPoint(point);
      onInteraction(pointId);
    }
  }, [interactionPoints, onComplete, onProgress, onInteraction, startTime]);

  // Voice interaction handler
  const handleVoiceInteraction = useCallback(() => {
    setIsVoiceMode(!isVoiceMode);
    // Voice recording logic would go here
  }, [isVoiceMode]);

  const resetLesson = useCallback(() => {
    setInteractionPoints(prev => prev.map(point => ({ ...point, isCompleted: false })));
    setProgress(0);
    setSelectedPoint(null);
    onProgress(0);
  }, [onProgress]);

  return (
    <div className="h-full w-full relative bg-gradient-to-b from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* 3D Canvas */}
      <div className="h-2/3 w-full">
        <Canvas 
          shadows 
          camera={{ position: [0, 8, 12], fov: 60 }}
          gl={{ antialias: true, alpha: true }}
          dpr={isMobile ? 1 : 2}
        >
          <MobileOptimizedCamera isMobile={isMobile} />
          
          <VocabularyScene 
            lesson={lesson}
            interactionPoints={interactionPoints}
            onPointClick={handlePointClick}
          />
          
          <OrbitControls 
            enableZoom={!isMobile}
            enablePan={false}
            maxPolarAngle={Math.PI / 2}
            minDistance={isMobile ? 8 : 5}
            maxDistance={isMobile ? 15 : 20}
            touches={{
              ONE: isMobile ? THREE.TOUCH.ROTATE : THREE.TOUCH.ROTATE,
              TWO: isMobile ? THREE.TOUCH.DOLLY_PAN : THREE.TOUCH.DOLLY_PAN
            }}
          />
        </Canvas>
      </div>

      {/* Control Panel */}
      <div className="h-1/3 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto">
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Progress: {Math.round(progress)}%
              </span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {lesson.xpReward} XP
              </Badge>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          {/* Interaction area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Selected word info */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  {selectedPoint ? selectedPoint.word : "Click on objects to learn!"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedPoint ? (
                  <div className="space-y-2">
                    <p className="text-gray-600 dark:text-gray-300">
                      Translation: {selectedPoint.translation}
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={handleVoiceInteraction}
                        variant={isVoiceMode ? "destructive" : "default"}
                        data-testid="button-voice-practice"
                      >
                        <Mic className="w-4 h-4 mr-1" />
                        {isVoiceMode ? "Stop" : "Practice"}
                      </Button>
                      <Button size="sm" variant="outline" data-testid="button-play-audio">
                        <Volume2 className="w-4 h-4 mr-1" />
                        Listen
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    Tap or click on the 3D objects above to learn vocabulary words.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Lesson controls */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={resetLesson}
                    data-testid="button-reset-lesson"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Reset
                  </Button>
                  
                  {progress === 100 && (
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => onComplete(Math.floor((Date.now() - startTime) / 60000))}
                      data-testid="button-complete-lesson"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Complete
                    </Button>
                  )}
                </div>
                
                <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                  <p>🎯 Difficulty: <span className="capitalize">{lesson.difficulty}</span></p>
                  <p>⏱️ Est. Time: {lesson.estimatedDurationMinutes} minutes</p>
                  <p>🎮 Type: <span className="capitalize">{lesson.lessonType}</span></p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile help overlay */}
      {isMobile && (
        <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white p-2 rounded-lg text-xs">
          📱 Drag to rotate • Pinch to zoom
        </div>
      )}
    </div>
  );
}