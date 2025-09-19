import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ShoppingCart,
  Book,
  Laptop,
  Shirt,
  Apple,
  Watch,
  Coffee,
  MessageCircle,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Map,
  Star,
  Trophy,
  Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import * as THREE from 'three';

interface Shop {
  id: string;
  name: string;
  type: 'fashion' | 'electronics' | 'bookstore' | 'grocery' | 'accessories' | 'cafe';
  icon: any;
  position: { x: number; y: number; z: number };
  color: string;
  shopgirl: {
    name: string;
    greeting: string;
    personality: string;
  };
}

interface LexiMessage {
  id: string;
  type: 'lexi' | 'shopgirl' | 'user' | 'translation';
  speaker: string;
  content: string;
  timestamp: Date;
  originalLanguage?: string;
  translatedContent?: string;
}

interface InteractionData {
  newVocabulary: string[];
  phrases: string[];
  expressions: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

const SHOPS: Shop[] = [
  {
    id: 'fashion',
    name: 'Bella Fashion',
    type: 'fashion',
    icon: Shirt,
    position: { x: -20, y: 0, z: -10 },
    color: '#FF6B9D',
    shopgirl: {
      name: 'Sofia',
      greeting: "Welcome to Bella Fashion! I'm Sofia. Looking for something special today?",
      personality: 'friendly, fashion-forward, helpful'
    }
  },
  {
    id: 'electronics',
    name: 'TechWorld',
    type: 'electronics',
    icon: Laptop,
    position: { x: 20, y: 0, z: -10 },
    color: '#4A90E2',
    shopgirl: {
      name: 'Maya',
      greeting: "Hi there! I'm Maya from TechWorld. Need help finding the perfect gadget?",
      personality: 'knowledgeable, patient, tech-savvy'
    }
  },
  {
    id: 'bookstore',
    name: 'Page Turner',
    type: 'bookstore',
    icon: Book,
    position: { x: -20, y: 0, z: 10 },
    color: '#8B4513',
    shopgirl: {
      name: 'Emma',
      greeting: "Welcome to Page Turner! I'm Emma. What kind of books are you interested in?",
      personality: 'intellectual, warm, literary'
    }
  },
  {
    id: 'grocery',
    name: 'Fresh Market',
    type: 'grocery',
    icon: Apple,
    position: { x: 20, y: 0, z: 10 },
    color: '#4CAF50',
    shopgirl: {
      name: 'Lisa',
      greeting: "Hello! I'm Lisa from Fresh Market. Looking for fresh ingredients today?",
      personality: 'cheerful, health-conscious, helpful'
    }
  },
  {
    id: 'accessories',
    name: 'Sparkle Accessories',
    type: 'accessories',
    icon: Watch,
    position: { x: 0, y: 0, z: -20 },
    color: '#E91E63',
    shopgirl: {
      name: 'Aria',
      greeting: "Hi! Welcome to Sparkle Accessories. I'm Aria. Want to add some sparkle to your style?",
      personality: 'bubbly, stylish, enthusiastic'
    }
  },
  {
    id: 'cafe',
    name: 'Cozy Corner Cafe',
    type: 'cafe',
    icon: Coffee,
    position: { x: 0, y: 0, z: 20 },
    color: '#795548',
    shopgirl: {
      name: 'Zoe',
      greeting: "Welcome to Cozy Corner! I'm Zoe, your barista. What can I get you today?",
      personality: 'relaxed, friendly, coffee-expert'
    }
  }
];

export default function VirtualMall() {
  // Three.js refs
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const frameRef = useRef<number>();

  // State management
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);
  const [messages, setMessages] = useState<LexiMessage[]>([]);
  const [isLexiSpeaking, setIsLexiSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [visitedShops, setVisitedShops] = useState<Set<string>>(new Set());
  const [collectedVocabulary, setCollectedVocabulary] = useState<string[]>([]);
  const [sessionProgress, setSessionProgress] = useState(0);

  const { toast } = useToast();
  const { t } = useLanguage();

  // Initialize Lexi greeting
  useEffect(() => {
    const lexiGreeting: LexiMessage = {
      id: 'welcome',
      type: 'lexi',
      speaker: 'Lexi',
      content: "Hello! I'm Lexi, your AI study partner! Welcome to our virtual shopping mall. I'll be with you throughout this adventure to help you practice English. Let's explore together!",
      timestamp: new Date()
    };
    setMessages([lexiGreeting]);
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75, 
      mountRef.current.clientWidth / mountRef.current.clientHeight, 
      0.1, 
      1000
    );
    camera.position.set(0, 5, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Create mall floor
    const floorGeometry = new THREE.PlaneGeometry(100, 100);
    const floorMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xffffff,
      transparent: true,
      opacity: 0.9
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Create shops
    SHOPS.forEach((shop) => {
      const shopGroup = new THREE.Group();
      
      // Shop building
      const buildingGeometry = new THREE.BoxGeometry(8, 6, 8);
      const buildingMaterial = new THREE.MeshLambertMaterial({ 
        color: shop.color,
        transparent: true,
        opacity: 0.8
      });
      const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
      building.position.set(0, 3, 0);
      building.castShadow = true;
      shopGroup.add(building);

      // Shop sign
      const signGeometry = new THREE.PlaneGeometry(6, 1.5);
      const signMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xffffff
      });
      const sign = new THREE.Mesh(signGeometry, signMaterial);
      sign.position.set(0, 7, 4.1);
      shopGroup.add(sign);

      // Position shop
      shopGroup.position.set(shop.position.x, shop.position.y, shop.position.z);
      shopGroup.userData = { shopId: shop.id };
      scene.add(shopGroup);
    });

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      
      // Rotate camera around center for demo
      const time = Date.now() * 0.0005;
      camera.position.x = Math.cos(time) * 30;
      camera.position.z = Math.sin(time) * 30;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();
    setIsLoaded(true);

    // Cleanup
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;

      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;

      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mutation for AI conversations
  const conversationMutation = useMutation({
    mutationFn: async (data: { message: string; context: any }) => {
      return apiRequest('/api/ai/virtual-mall-conversation', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (response) => {
      const newMessage: LexiMessage = {
        id: Date.now().toString(),
        type: response.speaker === 'Lexi' ? 'lexi' : 'shopgirl',
        speaker: response.speaker,
        content: response.message,
        timestamp: new Date(),
        originalLanguage: response.originalLanguage,
        translatedContent: response.translation
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      if (response.newVocabulary) {
        setCollectedVocabulary(prev => [...prev, ...response.newVocabulary]);
      }
    },
    onError: () => {
      toast({
        title: "Connection Error",
        description: "Unable to connect with Lexi. Please try again.",
        variant: "destructive"
      });
    }
  });

  const enterShop = (shop: Shop) => {
    setCurrentShop(shop);
    setVisitedShops(prev => new Set([...prev, shop.id]));
    
    const shopgirlGreeting: LexiMessage = {
      id: Date.now().toString(),
      type: 'shopgirl',
      speaker: shop.shopgirl.name,
      content: shop.shopgirl.greeting,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, shopgirlGreeting]);
    setSessionProgress(prev => Math.min(prev + 16.67, 100)); // 6 locations = ~16.67% each
  };

  const sendMessage = () => {
    if (!userInput.trim()) return;

    const userMessage: LexiMessage = {
      id: Date.now().toString(),
      type: 'user',
      speaker: 'You',
      content: userInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    conversationMutation.mutate({
      message: userInput,
      context: {
        currentShop: currentShop?.id,
        shopgirlName: currentShop?.shopgirl.name,
        visitedShops: Array.from(visitedShops)
      }
    });

    setUserInput('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Virtual Shopping Mall
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Practice English with Lexi and friendly shopkeepers
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="gap-2">
              <Trophy className="w-4 h-4" />
              {collectedVocabulary.length} new words
            </Badge>
            <Badge variant="outline" className="gap-2">
              <Star className="w-4 h-4" />
              {visitedShops.size}/6 shops visited
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3D Mall View */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="w-5 h-5" />
                3D Mall Explorer
              </CardTitle>
              <Progress value={sessionProgress} className="w-full" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Explore progress: {Math.round(sessionProgress)}%
              </p>
            </CardHeader>
            <CardContent>
              <div 
                ref={mountRef}
                className="w-full h-[500px] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden relative"
              >
                {!isLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Loading virtual mall...</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Shop buttons overlay */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                {SHOPS.map((shop) => {
                  const IconComponent = shop.icon;
                  return (
                    <Button
                      key={shop.id}
                      variant={visitedShops.has(shop.id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => enterShop(shop)}
                      className="flex items-center gap-2"
                      style={{ backgroundColor: visitedShops.has(shop.id) ? shop.color : undefined }}
                    >
                      <IconComponent className="w-4 h-4" />
                      {shop.name}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Interface */}
        <div>
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                {currentShop ? `Chat with ${currentShop.shopgirl.name}` : 'Chat with Lexi'}
              </CardTitle>
              {currentShop && (
                <Badge style={{ backgroundColor: currentShop.color, color: 'white' }}>
                  {currentShop.name}
                </Badge>
              )}
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.type === 'user'
                          ? 'bg-purple-600 text-white'
                          : message.type === 'lexi'
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                          : 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100'
                      }`}
                    >
                      <p className="text-xs font-medium mb-1">{message.speaker}</p>
                      <p className="text-sm">{message.content}</p>
                      {message.translatedContent && (
                        <p className="text-xs mt-1 opacity-75 italic">
                          Translation: {message.translatedContent}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!userInput.trim() || conversationMutation.isPending}
                  size="sm"
                >
                  Send
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsListening(!isListening)}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Vocabulary Collection */}
          {collectedVocabulary.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  New Vocabulary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {collectedVocabulary.map((word, index) => (
                    <Badge key={index} variant="secondary">
                      {word}
                    </Badge>
                  ))}
                </div>
                <Button className="w-full mt-3" variant="outline" size="sm">
                  Add to Flashcards
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}