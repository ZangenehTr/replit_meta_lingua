import { useState, useRef, useCallback, useEffect, Suspense, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text, Html, Sky, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, X, ArrowRight } from "lucide-react";
import { useTTS } from "@/hooks/useTTS";
import { cn } from "@/lib/utils";
import { getObjectComponent } from "./SceneObjects3D";
import { getEnvironmentComponent } from "./SceneEnvironments3D";

interface InteractionPointData {
  id: number;
  objectId: string;
  label: string;
  labelFa?: string;
  labelAr?: string;
  interactionType: string;
  position: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  color?: string;
  shape?: string;
  questionData?: {
    question: string;
    questionFa?: string;
    questionAr?: string;
    options?: string[];
    correctAnswer: string;
    type?: string;
  };
  feedbackCorrect?: string;
  feedbackCorrectFa?: string;
  feedbackIncorrect?: string;
  feedbackIncorrectFa?: string;
  audioUrl?: string;
  points: number;
  isRequired: boolean;
}

interface SceneData {
  id: number;
  title: string;
  titleFa?: string;
  titleAr?: string;
  description?: string;
  sceneType: string;
  cefrLevel: string;
  environment?: {
    groundColor?: string;
    skyColor?: string;
    ambientLight?: number;
    fog?: boolean;
    fogColor?: string;
    fogDensity?: number;
  };
  cameraConfig?: {
    position?: [number, number, number];
    lookAt?: [number, number, number];
    fov?: number;
  };
  lightingConfig?: {
    directionalPosition?: [number, number, number];
    directionalIntensity?: number;
    ambientIntensity?: number;
  };
  interactions: InteractionPointData[];
  estimatedDurationMinutes: number;
  xpReward: number;
}

interface InteractiveScene3DProps {
  scene: SceneData;
  onComplete: (score: number, timeSpent: number) => void;
  onProgress: (progress: number) => void;
  isMobile?: boolean;
}

const SCENE_CAMERAS: Record<string, { position: [number, number, number]; target: [number, number, number] }> = {
  cafe: { position: [6, 4, 8], target: [0, 0.5, -1] },
  market: { position: [0, 5, 10], target: [0, 0.5, -2] },
  airport: { position: [0, 4, 10], target: [0, 1, -2] },
  hospital: { position: [5, 4, 8], target: [0, 0.8, 0] },
  office: { position: [6, 4, 8], target: [0, 0.5, -1] },
};

function getCameraConfig(sceneTitle: string) {
  const key = sceneTitle.toLowerCase();
  if (key.includes("cafe") || key.includes("coffee")) return SCENE_CAMERAS.cafe;
  if (key.includes("market") || key.includes("bazaar")) return SCENE_CAMERAS.market;
  if (key.includes("airport") || key.includes("flight")) return SCENE_CAMERAS.airport;
  if (key.includes("hospital") || key.includes("clinic")) return SCENE_CAMERAS.hospital;
  if (key.includes("office") || key.includes("work")) return SCENE_CAMERAS.office;
  return SCENE_CAMERAS.cafe;
}

function CameraController({ target, introComplete }: { target: [number, number, number]; introComplete: boolean }) {
  const { camera } = useThree();
  const basePos = useRef(new THREE.Vector3());
  const startTime = useRef(Date.now());
  const initialized = useRef(false);

  useFrame(() => {
    if (introComplete) return;
    if (!initialized.current) {
      basePos.current.copy(camera.position);
      initialized.current = true;
    }
    const elapsed = (Date.now() - startTime.current) / 1000;
    if (elapsed < 3) {
      const progress = elapsed / 3;
      const ease = 1 - Math.pow(1 - progress, 3);
      const sweep = Math.sin(ease * Math.PI * 0.5) * 1.5;
      camera.position.x = basePos.current.x + sweep;
      camera.lookAt(target[0], target[1], target[2]);
    }
  });

  return null;
}

function InteractiveObject({
  point,
  isCompleted,
  isActive,
  onClick,
  lang,
}: {
  point: InteractionPointData;
  isCompleted: boolean;
  isActive: boolean;
  onClick: () => void;
  lang: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!groupRef.current) return;

    if (!isCompleted && (hovered || isActive)) {
      const bobSpeed = isActive ? 4 : 2.5;
      groupRef.current.position.y = point.position.y + Math.sin(state.clock.elapsedTime * bobSpeed) * 0.06;
    } else {
      groupRef.current.position.y = point.position.y;
    }

    if (glowRef.current) {
      const pulse = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.3;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = isCompleted ? 0 : hovered ? 0.4 : pulse * 0.2;
      const s = isCompleted ? 0 : hovered ? 1.4 : 1.1 + pulse * 0.15;
      glowRef.current.scale.setScalar(s);
    }
  });

  const pos = point.position;
  const scale = point.scale || { x: 1, y: 1, z: 1 };
  const label = lang === "fa" && point.labelFa ? point.labelFa : lang === "ar" && point.labelAr ? point.labelAr : point.label;
  const ObjectModel = getObjectComponent(point.objectId);

  return (
    <group ref={groupRef} position={[pos.x, pos.y, pos.z]}>
      {!isCompleted && (
        <mesh ref={glowRef} position={[0, 0.3, 0]}>
          <sphereGeometry args={[0.6, 16, 16]} />
          <meshBasicMaterial
            color={isActive ? "#FF9800" : hovered ? "#2196F3" : "#6366F1"}
            transparent
            opacity={0.15}
            depthWrite={false}
          />
        </mesh>
      )}

      <group
        scale={[scale.x, scale.y, scale.z]}
        onClick={(e) => {
          e.stopPropagation();
          if (!isCompleted) onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = isCompleted ? "default" : "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "default";
        }}
      >
        {ObjectModel ? (
          <ObjectModel />
        ) : (
          <mesh>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial color={point.color || "#6366F1"} />
          </mesh>
        )}
      </group>

      {(hovered || isActive) && !isCompleted && (
        <Html center position={[0, 1.3, 0]} distanceFactor={8} zIndexRange={[100, 0]}>
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg border-2 border-indigo-300 dark:border-indigo-600 whitespace-nowrap animate-in fade-in duration-200">
            <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300">{label}</p>
            <p className="text-[10px] text-indigo-400 text-center mt-0.5">
              {isActive ? "⬆" : "👆"}
            </p>
          </div>
        </Html>
      )}

      {isCompleted && (
        <Html center position={[0, 1.1, 0]} distanceFactor={8} zIndexRange={[100, 0]}>
          <div className="bg-green-500 w-7 h-7 rounded-full flex items-center justify-center shadow-lg ring-2 ring-green-300 ring-offset-1">
            <Check className="w-4 h-4 text-white" />
          </div>
        </Html>
      )}

      {!isCompleted && !hovered && (
        <Html center position={[0, -0.5, 0]} distanceFactor={10} zIndexRange={[50, 0]}>
          <div className="bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md">
            <p className="text-[11px] text-white font-medium whitespace-nowrap">{label}</p>
          </div>
        </Html>
      )}
    </group>
  );
}

function SceneLighting({ sceneType }: { sceneType: string }) {
  const key = sceneType.toLowerCase();
  const isIndoor = key.includes("cafe") || key.includes("hospital") || key.includes("office");
  const isMarket = key.includes("market") || key.includes("bazaar");

  return (
    <>
      <ambientLight intensity={isIndoor ? 0.35 : 0.5} color={isIndoor ? "#FFF8E1" : "#FFFFFF"} />
      <directionalLight
        position={isMarket ? [8, 15, 5] : [5, 10, 5]}
        intensity={isIndoor ? 0.6 : 1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        color={isMarket ? "#FFE0B2" : "#FFFFFF"}
      />
      {!isIndoor && (
        <hemisphereLight
          args={["#87CEEB", "#8B7355", 0.3]}
        />
      )}
    </>
  );
}

function SceneBackground({ sceneType }: { sceneType: string }) {
  const key = sceneType.toLowerCase();
  const isOutdoor = key.includes("market") || key.includes("bazaar");

  if (isOutdoor) {
    return <Sky sunPosition={[15, 25, 10]} turbidity={3} rayleigh={0.5} />;
  }

  return null;
}

function QuestionPanel({
  point,
  onAnswer,
  lang,
}: {
  point: InteractionPointData;
  onAnswer: (correct: boolean) => void;
  lang: string;
}) {
  const { t } = useTranslation("linguaquest");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const qData = point.questionData;
  if (!qData) return null;

  const question =
    lang === "fa" && qData.questionFa ? qData.questionFa : lang === "ar" && qData.questionAr ? qData.questionAr : qData.question;

  const isCorrect = selectedAnswer === qData.correctAnswer;

  const handleAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    setShowResult(true);
    setTimeout(() => {
      onAnswer(answer === qData.correctAnswer);
    }, 1500);
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-xl border-2 border-indigo-200 dark:border-indigo-700">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {point.points} pts
          </Badge>
          <Badge className="text-xs bg-indigo-500">{point.interactionType}</Badge>
        </div>

        <p className="text-base font-medium text-gray-800 dark:text-gray-200">{question}</p>

        {qData.options && (
          <div className="space-y-2">
            {qData.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => !showResult && handleAnswer(option)}
                disabled={showResult}
                className={cn(
                  "w-full text-left p-3 rounded-lg border-2 transition-all text-sm",
                  showResult && option === qData.correctAnswer
                    ? "border-green-500 bg-green-50 dark:bg-green-900/30"
                    : showResult && option === selectedAnswer && !isCorrect
                    ? "border-red-500 bg-red-50 dark:bg-red-900/30"
                    : "border-gray-200 dark:border-gray-600 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                )}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {!qData.options && qData.type === "trueFalse" && (
          <div className="flex gap-3">
            <Button
              onClick={() => !showResult && handleAnswer("true")}
              disabled={showResult}
              variant={showResult && selectedAnswer === "true" ? (isCorrect ? "default" : "destructive") : "outline"}
              className="flex-1"
            >
              True ✓
            </Button>
            <Button
              onClick={() => !showResult && handleAnswer("false")}
              disabled={showResult}
              variant={showResult && selectedAnswer === "false" ? (isCorrect ? "default" : "destructive") : "outline"}
              className="flex-1"
            >
              False ✗
            </Button>
          </div>
        )}

        {showResult && (
          <div className={cn("p-2 rounded-lg text-sm", isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
            {isCorrect ? (
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                {t("scene3d.correctAnswer", "Correct!")}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <X className="w-4 h-4" />
                {t("scene3d.wrongAnswer", "Try again next time!")}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function InteractiveScene3D({ scene, onComplete, onProgress, isMobile }: InteractiveScene3DProps) {
  const { t, i18n } = useTranslation("linguaquest");
  const lang = i18n.language;
  const { playWord } = useTTS();

  const [completedPoints, setCompletedPoints] = useState<Set<string>>(new Set());
  const [activePoint, setActivePoint] = useState<InteractionPointData | null>(null);
  const [score, setScore] = useState(0);
  const [startTime] = useState(Date.now());
  const [showCompletion, setShowCompletion] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIntroComplete(true), 3500);
    return () => clearTimeout(timer);
  }, []);

  const totalRequired = useMemo(
    () => scene.interactions.filter((p) => p.isRequired).length,
    [scene.interactions]
  );
  const maxScore = useMemo(
    () => scene.interactions.reduce((sum, p) => sum + p.points, 0),
    [scene.interactions]
  );

  const progressPercent = totalRequired > 0 ? (completedPoints.size / totalRequired) * 100 : 0;

  useEffect(() => {
    onProgress(progressPercent);
  }, [progressPercent, onProgress]);

  const handleObjectClick = useCallback(
    (point: InteractionPointData) => {
      if (completedPoints.has(point.objectId)) return;
      setActivePoint(point);
      if (point.audioUrl) {
        playWord(point.label);
      }
    },
    [completedPoints, playWord]
  );

  const handleAnswer = useCallback(
    (correct: boolean) => {
      if (!activePoint) return;
      const earned = correct ? activePoint.points : 0;
      setScore((prev) => prev + earned);

      setCompletedPoints((prev) => {
        const next = new Set(prev);
        next.add(activePoint.objectId);
        return next;
      });

      setTimeout(() => {
        setActivePoint(null);
        const newCompleted = completedPoints.size + 1;
        if (newCompleted >= totalRequired) {
          setShowCompletion(true);
          const timeSpent = Math.floor((Date.now() - startTime) / 1000);
          setTimeout(() => {
            onComplete(score + earned, timeSpent);
          }, 2000);
        }
      }, 500);
    },
    [activePoint, completedPoints.size, totalRequired, score, startTime, onComplete]
  );

  const camConfig = getCameraConfig(scene.title);
  const EnvironmentComponent = getEnvironmentComponent(scene.title);
  const fov = scene.cameraConfig?.fov || 55;

  const sceneTitle =
    lang === "fa" && scene.titleFa ? scene.titleFa : lang === "ar" && scene.titleAr ? scene.titleAr : scene.title;

  return (
    <div className="relative w-full h-full min-h-[500px]">
      <div className="absolute top-0 left-0 right-0 z-10 p-3 flex items-center justify-between bg-gradient-to-b from-black/60 via-black/30 to-transparent pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <h3 className="text-white font-bold text-sm drop-shadow-lg">{sceneTitle}</h3>
          <Badge className="bg-indigo-500 text-white text-xs shadow-md">{scene.cefrLevel}</Badge>
        </div>
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="text-white text-sm font-medium drop-shadow-lg">
            {t("scene3d.scoreLabel", "Score")}: {score}/{maxScore}
          </div>
          <Badge variant="secondary" className="text-xs shadow-md">
            {completedPoints.size}/{totalRequired}
          </Badge>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-10 p-3 bg-gradient-to-t from-black/60 via-black/30 to-transparent pointer-events-none">
        <Progress value={progressPercent} className="h-2.5 shadow-md" />
        <p className="text-white/90 text-xs mt-1.5 text-center font-medium drop-shadow">
          {isMobile ? t("scene3d.tapToInteract", "Tap objects to learn") : t("scene3d.clickToInteract", "Click objects to learn")}
        </p>
      </div>

      {activePoint && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <QuestionPanel point={activePoint} onAnswer={handleAnswer} lang={lang} />
        </div>
      )}

      {showCompletion && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <Card className="max-w-sm mx-auto bg-white/95 dark:bg-gray-800/95 shadow-2xl">
            <CardContent className="p-6 text-center space-y-4">
              <div className="text-5xl">🎉</div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">{t("scene3d.sceneComplete", "Scene Complete!")}</h3>
              <p className="text-gray-600 dark:text-gray-300">{t("scene3d.sceneCompleteDesc", "Great job exploring this scene!")}</p>
              <div className="flex justify-center gap-4">
                <Badge className="text-lg px-4 py-2 bg-yellow-500">
                  +{scene.xpReward} XP
                </Badge>
                <Badge className="text-lg px-4 py-2 bg-indigo-500">
                  {score}/{maxScore}
                </Badge>
              </div>
              <Button onClick={() => onComplete(score, Math.floor((Date.now() - startTime) / 1000))} className="w-full">
                {t("scene3d.continueToNext", "Continue")} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <Canvas
        shadows
        camera={{
          position: camConfig.position,
          fov,
          near: 0.1,
          far: 200,
        }}
        style={{ width: "100%", height: "100%" }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <color attach="background" args={["#1a1a2e"]} />

          <SceneLighting sceneType={scene.title} />
          <SceneBackground sceneType={scene.title} />

          {EnvironmentComponent && <EnvironmentComponent />}

          <ContactShadows
            position={[0, -0.005, 0]}
            opacity={0.35}
            scale={20}
            blur={2}
            far={6}
          />

          <CameraController target={camConfig.target} introComplete={introComplete} />

          {scene.interactions.map((point) => (
            <InteractiveObject
              key={point.objectId}
              point={point}
              isCompleted={completedPoints.has(point.objectId)}
              isActive={activePoint?.objectId === point.objectId}
              onClick={() => handleObjectClick(point)}
              lang={lang}
            />
          ))}

          <OrbitControls
            enablePan={true}
            enableZoom={true}
            minPolarAngle={Math.PI / 8}
            maxPolarAngle={Math.PI / 2.1}
            minDistance={2}
            maxDistance={18}
            target={camConfig.target}
            enableDamping
            dampingFactor={0.08}
            rotateSpeed={0.5}
            panSpeed={0.4}
            zoomSpeed={0.8}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
