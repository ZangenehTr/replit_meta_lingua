import { useState, useRef, useCallback, useEffect, Suspense, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text, Html, Environment, Sky, Plane } from "@react-three/drei";
import * as THREE from "three";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, X, Volume2, HelpCircle, ArrowRight } from "lucide-react";
import { useTTS } from "@/hooks/useTTS";
import { cn } from "@/lib/utils";

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

const SCENE_COLORS: Record<string, { ground: string; sky: string; ambient: string }> = {
  cafe: { ground: "#8B7355", sky: "#87CEEB", ambient: "#FFF8DC" },
  airport: { ground: "#C0C0C0", sky: "#B0C4DE", ambient: "#F0F8FF" },
  classroom: { ground: "#DEB887", sky: "#87CEEB", ambient: "#FFFFF0" },
  market: { ground: "#CD853F", sky: "#FFD700", ambient: "#FFF8DC" },
  hospital: { ground: "#F5F5F5", sky: "#E0E0E0", ambient: "#FFFFFF" },
  restaurant: { ground: "#8B4513", sky: "#2F4F4F", ambient: "#FFE4B5" },
  hotel: { ground: "#D2B48C", sky: "#87CEEB", ambient: "#FAFAD2" },
  library: { ground: "#A0522D", sky: "#4682B4", ambient: "#F5F5DC" },
  office: { ground: "#808080", sky: "#87CEEB", ambient: "#F0F0F0" },
  park: { ground: "#228B22", sky: "#87CEEB", ambient: "#F0FFF0" },
};

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
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!meshRef.current) return;
    if (isCompleted) return;

    if (hovered || isActive) {
      meshRef.current.scale.setScalar(1.15 + Math.sin(state.clock.elapsedTime * 3) * 0.05);
    } else {
      meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }

    if (!isCompleted) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  const color = isCompleted
    ? "#4CAF50"
    : isActive
    ? "#FF9800"
    : hovered
    ? "#2196F3"
    : point.color || "#6366F1";

  const pos = point.position;
  const scale = point.scale || { x: 0.5, y: 0.5, z: 0.5 };

  const label =
    lang === "fa" && point.labelFa ? point.labelFa : lang === "ar" && point.labelAr ? point.labelAr : point.label;

  const geometry = useMemo(() => {
    switch (point.shape) {
      case "sphere":
        return <sphereGeometry args={[0.5, 32, 32]} />;
      case "cylinder":
        return <cylinderGeometry args={[0.3, 0.3, 0.8, 32]} />;
      case "cone":
        return <coneGeometry args={[0.4, 0.8, 32]} />;
      case "torus":
        return <torusGeometry args={[0.4, 0.15, 16, 32]} />;
      default:
        return <boxGeometry args={[0.8, 0.8, 0.8]} />;
    }
  }, [point.shape]);

  return (
    <group position={[pos.x, pos.y, pos.z]}>
      <mesh
        ref={meshRef}
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
        {geometry}
        <meshStandardMaterial
          color={color}
          emissive={hovered || isActive ? color : "#000000"}
          emissiveIntensity={hovered || isActive ? 0.3 : 0}
          metalness={0.3}
          roughness={0.6}
        />
      </mesh>

      {(hovered || isActive) && !isCompleted && (
        <Html center position={[0, 1.2, 0]} distanceFactor={8}>
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg border border-indigo-200 dark:border-indigo-700 whitespace-nowrap">
            <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">{label}</p>
          </div>
        </Html>
      )}

      {isCompleted && (
        <Html center position={[0, 1, 0]} distanceFactor={8}>
          <div className="bg-green-500/90 w-6 h-6 rounded-full flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
        </Html>
      )}

      {!isCompleted && !hovered && (
        <Text
          position={[0, -0.8, 0]}
          fontSize={0.2}
          color="#FFFFFF"
          outlineColor="#000000"
          outlineWidth={0.02}
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      )}
    </group>
  );
}

function Ground({ color, sceneType }: { color: string; sceneType: string }) {
  return (
    <Plane
      args={[40, 40]}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.5, 0]}
      receiveShadow
    >
      <meshStandardMaterial color={color} roughness={0.8} />
    </Plane>
  );
}

function SceneEnvironment({
  sceneType,
  envConfig,
}: {
  sceneType: string;
  envConfig?: SceneData["environment"];
}) {
  const colors = SCENE_COLORS[sceneType] || SCENE_COLORS.classroom;
  const groundColor = envConfig?.groundColor || colors.ground;

  return (
    <>
      <ambientLight intensity={envConfig?.ambientLight || 0.6} />
      <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
      <Sky sunPosition={[10, 20, 10]} />
      <Ground color={groundColor} sceneType={sceneType} />
      {envConfig?.fog && (
        <fog
          attach="fog"
          color={envConfig.fogColor || "#E0E0E0"}
          near={5}
          far={30}
        />
      )}
    </>
  );
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
              {t("scene3d.interactions.trueFalse")} ✓
            </Button>
            <Button
              onClick={() => !showResult && handleAnswer("false")}
              disabled={showResult}
              variant={showResult && selectedAnswer === "false" ? (isCorrect ? "default" : "destructive") : "outline"}
              className="flex-1"
            >
              {t("scene3d.interactions.trueFalse")} ✗
            </Button>
          </div>
        )}

        {showResult && (
          <div className={cn("p-2 rounded-lg text-sm", isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
            {isCorrect ? (
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                {t("scene3d.correctAnswer")}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <X className="w-4 h-4" />
                {t("scene3d.wrongAnswer")}
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

  const cameraPos = scene.cameraConfig?.position || [0, 5, 10];
  const fov = scene.cameraConfig?.fov || 60;

  const sceneTitle =
    lang === "fa" && scene.titleFa ? scene.titleFa : lang === "ar" && scene.titleAr ? scene.titleAr : scene.title;

  return (
    <div className="relative w-full h-full min-h-[500px]">
      <div className="absolute top-0 left-0 right-0 z-10 p-3 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center gap-2">
          <h3 className="text-white font-bold text-sm">{sceneTitle}</h3>
          <Badge className="bg-indigo-500 text-white text-xs">{scene.cefrLevel}</Badge>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-white text-sm">
            {t("scene3d.scoreLabel")}: {score}/{maxScore}
          </div>
          <Badge variant="secondary" className="text-xs">
            {completedPoints.size}/{totalRequired}
          </Badge>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-10 p-3 bg-gradient-to-t from-black/50 to-transparent">
        <Progress value={progressPercent} className="h-2" />
        <p className="text-white/80 text-xs mt-1 text-center">
          {isMobile ? t("scene3d.tapToInteract") : t("scene3d.clickToInteract")}
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
              <div className="text-4xl">🎉</div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">{t("scene3d.sceneComplete")}</h3>
              <p className="text-gray-600 dark:text-gray-300">{t("scene3d.sceneCompleteDesc")}</p>
              <div className="flex justify-center gap-4">
                <Badge className="text-lg px-4 py-2 bg-yellow-500">
                  {t("scene3d.earnedXP", { xp: scene.xpReward })}
                </Badge>
                <Badge className="text-lg px-4 py-2 bg-indigo-500">
                  {score}/{maxScore}
                </Badge>
              </div>
              <Button onClick={() => onComplete(score, Math.floor((Date.now() - startTime) / 1000))} className="w-full">
                {t("scene3d.continueToNext")} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <Canvas
        shadows
        camera={{
          position: cameraPos as [number, number, number],
          fov,
          near: 0.1,
          far: 100,
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <Suspense fallback={null}>
          <SceneEnvironment sceneType={scene.sceneType} envConfig={scene.environment} />

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
            enablePan={false}
            enableZoom={true}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.2}
            minDistance={3}
            maxDistance={20}
            target={[0, 0, 0]}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
