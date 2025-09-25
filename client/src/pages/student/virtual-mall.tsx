import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
  Target,
  BookOpen,
  Plus,
  Eye,
  Search
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import * as THREE from 'three';
import lexiAvatar from '@assets/[s_970235333]-[gs_7]-[is_25]-[u_0]-[oi_0]-[m_flux1]-,_beautiful_woman,_blonde_hair,_dressed_in_latex_like_women_in_matrix_movie_with_her_name_Lexi_print_1758759656942.jpeg';

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

// Use shared types from schema
import type { Book as CourseBook } from '@shared/schema';

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
  const [showCoursebooks, setShowCoursebooks] = useState(false);
  const [selectedBook, setSelectedBook] = useState<CourseBook | null>(null);
  const [showBookDetailsModal, setShowBookDetailsModal] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);

  const { toast } = useToast();
  const { t, isRTL, direction, language } = useLanguage();

  // Microsoft Edge TTS with browser fallback for Lexi's voice
  const speakText = async (text: string, voice: 'lexi' | 'shopgirl' = 'lexi') => {
    if (!isVoiceEnabled) return;
    
    setIsLexiSpeaking(true);
    
    try {
      // Try backend Microsoft Edge TTS service first
      const response = await apiRequest('/api/tts/generate', {
        method: 'POST',
        body: JSON.stringify({
          text,
          language: language === 'fa' ? 'fa' : 'en',
          speed: voice === 'lexi' ? 0.9 : 1.0,
          voice: voice === 'lexi' ? 
            (language === 'fa' ? 'fa-IR-DilaraNeural' : 'en-US-AriaNeural') :
            (language === 'fa' ? 'fa-IR-FaridNeural' : 'en-US-JennyNeural')
        })
      });

      if (response.success && response.audioUrl) {
        // Play the professional Edge TTS audio
        const audio = new Audio(response.audioUrl);
        audio.volume = voice === 'lexi' ? 0.8 : 0.7;
        
        audio.onended = () => setIsLexiSpeaking(false);
        audio.onerror = () => {
          console.error('Audio playback failed, trying browser fallback');
          useBrowserSpeech(text, voice);
        };
        
        await audio.play();
      } else {
        console.log('Server TTS failed, using browser fallback:', response.error);
        useBrowserSpeech(text, voice);
      }
    } catch (error) {
      console.error('TTS API error, using browser fallback:', error);
      useBrowserSpeech(text, voice);
    }
  };

  // Browser speech synthesis fallback
  const useBrowserSpeech = (text: string, voice: 'lexi' | 'shopgirl' = 'lexi') => {
    if (!window.speechSynthesis) {
      console.error('Browser speech synthesis not supported');
      setIsLexiSpeaking(false);
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice based on speaker
    if (voice === 'lexi') {
      utterance.rate = 0.9; // Slightly slower for sophistication
      utterance.pitch = 1.1; // Slightly higher for Lexi's character
      utterance.volume = 0.8;
    } else {
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 0.7;
    }
    
    // Set language (browser will find best available voice)
    utterance.lang = language === 'fa' ? 'fa-IR' : 'en-US';
    
    // Try to find a good voice
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      let preferredVoice;
      
      if (language === 'fa') {
        // Look for Persian voices
        preferredVoice = voices.find(v => 
          v.lang.startsWith('fa') || 
          v.name.toLowerCase().includes('persian') ||
          v.name.toLowerCase().includes('farsi')
        );
      } else {
        // Look for quality English voices
        preferredVoice = voices.find(v => 
          v.name.toLowerCase().includes('female') || 
          v.name.toLowerCase().includes('woman') ||
          v.name.toLowerCase().includes('samantha') ||
          v.name.toLowerCase().includes('zira') ||
          v.name.toLowerCase().includes('hazel')
        );
      }
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
    }
    
    utterance.onend = () => setIsLexiSpeaking(false);
    utterance.onerror = () => {
      console.error('Browser speech synthesis failed');
      setIsLexiSpeaking(false);
    };
    
    window.speechSynthesis.speak(utterance);
  };

  // Fetch coursebooks for bookstore using shared query client
  const { data: coursebooks, isLoading: coursebooksLoading, error: coursebooksError } = useQuery<{success: boolean; data: CourseBook[]}>({
    queryKey: ['/api/books'],
    enabled: showCoursebooks
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (data: { book_id: number; quantity: number }) => {
      return apiRequest('/api/cart/items', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (response, variables) => {
      const bookTitle = coursebooks?.data?.find(book => book.id === variables.book_id)?.title || 'Book';
      
      // Invalidate cart queries to refresh cart data
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      
      // Show success toast
      toast({
        title: "Added to Cart",
        description: `"${bookTitle}" has been added to your cart!`,
        variant: "default"
      });

      // Add Emma success message
      const emmaMessage: LexiMessage = {
        id: Date.now().toString(),
        type: 'shopgirl',
        speaker: 'Emma', 
        content: `Perfect! I've successfully added "${bookTitle}" to your cart. You can continue browsing or proceed to checkout when you're ready!`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, emmaMessage]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add book to cart. Please try again.",
        variant: "destructive"
      });

      // Add Emma error message
      const emmaMessage: LexiMessage = {
        id: Date.now().toString(),
        type: 'shopgirl',
        speaker: 'Emma', 
        content: `Oh no! I'm having trouble adding that book to your cart right now. Could you please try again? I'm here to help!`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, emmaMessage]);
    }
  });

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

    // Raycaster for 3D interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Handle mouse clicks on 3D objects
    const handleMallClick = (event: MouseEvent) => {
      if (!mountRef.current || !cameraRef.current || !sceneRef.current) return;

      const rect = mountRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(sceneRef.current.children, true);

      if (intersects.length > 0) {
        // Find the shop group that was clicked
        let clickedObject = intersects[0].object;
        while (clickedObject && !clickedObject.userData.shopId) {
          clickedObject = clickedObject.parent as THREE.Object3D;
        }

        if (clickedObject && clickedObject.userData.shopId) {
          const shopId = clickedObject.userData.shopId;
          const shop = SHOPS.find(s => s.id === shopId);
          if (shop) {
            enterShop(shop);
          }
        }
      }
    };

    // Handle mouse hover for cursor changes
    const handleMallHover = (event: MouseEvent) => {
      if (!mountRef.current || !cameraRef.current || !sceneRef.current) return;

      const rect = mountRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(sceneRef.current.children, true);

      if (intersects.length > 0) {
        // Check if hovering over a shop
        let hoveredObject = intersects[0].object;
        while (hoveredObject && !hoveredObject.userData.shopId) {
          hoveredObject = hoveredObject.parent as THREE.Object3D;
        }

        if (hoveredObject && hoveredObject.userData.shopId) {
          mountRef.current.style.cursor = 'pointer';
        } else {
          mountRef.current.style.cursor = 'default';
        }
      } else {
        mountRef.current.style.cursor = 'default';
      }
    };

    // Add mouse event listeners
    mountRef.current.addEventListener('click', handleMallClick);
    mountRef.current.addEventListener('mousemove', handleMallHover);

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
        mountRef.current.removeEventListener('click', handleMallClick);
        mountRef.current.removeEventListener('mousemove', handleMallHover);
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
      
      // Make Lexi speak her responses
      if (response.speaker === 'Lexi') {
        speakText(response.message, 'lexi');
      } else {
        speakText(response.message, 'shopgirl');
      }
      
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
    
    // Reset coursebooks display when entering any shop
    setShowCoursebooks(false);
  };

  const handleBrowseCoursebooks = () => {
    const emmaMessage: LexiMessage = {
      id: Date.now().toString(),
      type: 'shopgirl',
      speaker: 'Emma',
      content: "Great choice! Here are our featured coursebooks. These are specially selected for language learners. You can view details, check prices, and add books to your learning library!",
      timestamp: new Date()
    };
    setMessages(prev => [...prev, emmaMessage]);
    
    // Now trigger coursebooks fetch and display
    setShowCoursebooks(true);
  };

  // Safe price formatter using snake_case naming - handles both string and number prices
  const format_safe_price = (book: CourseBook, locale: string = 'fa-IR'): string => {
    // Handle both string and number price formats from API
    let amount: number | undefined;
    
    if (typeof book.price === 'number') {
      amount = book.price;
    } else if (typeof book.price === 'string') {
      amount = parseFloat(book.price);
    }
    
    if (amount == null || isNaN(amount)) return 'Price unavailable';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'IRR', // Iranian Rial for Persian books
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 // No decimals for IRR
    }).format(amount);
  };

  const handleViewBookDetails = (book: CourseBook) => {
    setSelectedBook(book);
    setShowBookDetailsModal(true);
  };

  const handleAddToCart = (book: CourseBook) => {
    // Use the mutation to add to cart - success/error messages are handled in the mutation callbacks
    addToCartMutation.mutate({ book_id: book.id, quantity: 1 });
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
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800"
      dir={direction}
      lang={language}
    >
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    {currentShop ? `Chat with ${currentShop.shopgirl.name}` : 'Chat with Lexi'}
                  </CardTitle>
                  {currentShop && (
                    <Badge style={{ backgroundColor: currentShop.color, color: 'white' }}>
                      {currentShop.name}
                    </Badge>
                  )}
                </div>
                
                {/* Lexi Avatar & Voice Controls */}
                <div className="flex items-center gap-3">
                  {/* Voice Controls */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                      className="w-8 h-8 p-0"
                      data-testid="button-voice-toggle"
                    >
                      {isVoiceEnabled ? (
                        <Volume2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <VolumeX className="w-4 h-4 text-gray-400" />
                      )}
                    </Button>
                    {/* Temporary test button */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const testMessage = language === 'fa' ? 
                          'سلام! من لکسی هستم، دستیار هوشمند شما.' :
                          'Hello! I am Lexi, your AI study partner. Welcome to our virtual shopping mall!';
                        speakText(testMessage, 'lexi');
                      }}
                      className="text-xs px-2"
                      data-testid="button-test-voice"
                    >
                      Test Voice
                    </Button>
                    {isLexiSpeaking && (
                      <div className="flex items-center gap-1 text-xs text-blue-600">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                        Speaking...
                      </div>
                    )}
                  </div>
                  
                  {/* Lexi Avatar */}
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${isLexiSpeaking ? 'border-blue-500 shadow-lg' : 'border-gray-300'} transition-all duration-300`}>
                      <img 
                        src={lexiAvatar} 
                        alt="Lexi - Virtual Assistant"
                        className="w-full h-full object-cover"
                        data-testid="lexi-avatar"
                      />
                    </div>
                    {isLexiSpeaking && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {currentShop?.id === 'bookstore' && (
                <div className="flex gap-2 mt-2">
                  <Button
                    onClick={handleBrowseCoursebooks}
                    size="sm"
                    className="gap-2"
                    style={{ backgroundColor: currentShop.color }}
                    data-testid="button-browse-coursebooks"
                  >
                    <BookOpen className="w-4 h-4" />
                    Browse Coursebooks
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    data-testid="button-search-books"
                  >
                    <Search className="w-4 h-4" />
                    Search Books
                  </Button>
                </div>
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

          {/* Coursebook Catalog */}
          {currentShop?.id === 'bookstore' && showCoursebooks && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Coursebook Catalog
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Emma's curated selection of language learning books
                </p>
              </CardHeader>
              <CardContent>
                {coursebooksLoading ? (
                  <div className="text-center py-4" data-testid="coursebooks-loading">
                    <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Loading coursebooks...</p>
                  </div>
                ) : coursebooksError ? (
                  <div className="text-center py-4" data-testid="coursebooks-error">
                    <p className="text-sm text-red-600 dark:text-red-400 mb-2">Failed to load coursebooks</p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => window.location.reload()}
                      data-testid="button-retry-coursebooks"
                    >
                      Retry
                    </Button>
                  </div>
                ) : coursebooks?.data ? (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto" data-testid="coursebooks-catalog">
                    {coursebooks.data.map((book) => (
                      <div 
                        key={book.id} 
                        className="border rounded-lg p-3 bg-white dark:bg-gray-800"
                        data-testid={`book-card-${book.id}`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Book Cover Thumbnail */}
                          <div className="flex-shrink-0" data-testid={`book-cover-${book.id}`}>
                            {book.cover_image ? (
                              <img 
                                src={book.cover_image} 
                                alt={book.title}
                                className="w-16 h-20 object-cover rounded border shadow-sm"
                                onError={(e) => {
                                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA2NCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAzMkwyNCAzNkwzMiAzNkwzMiAzMkwyNCAzMloiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTI0IDQwTDI0IDQ0TDQwIDQ0TDQwIDQwTDI0IDQwWiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNMjQgNDhMMjQgNTJMMzYgNTJMMzYgNDhMMjQgNDhaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo=';
                                }}
                              />
                            ) : (
                              <div className="w-16 h-20 bg-gray-200 dark:bg-gray-700 rounded border flex items-center justify-center">
                                <Book className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          
                          {/* Book Information */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100" data-testid={`book-title-${book.id}`} dir="auto">
                              {book.title}
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1" data-testid={`book-author-${book.id}`} dir="auto">
                              by {book.author}
                            </p>
                            <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 line-clamp-2" data-testid={`book-description-${book.id}`} dir="auto">
                              {book.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <Badge variant="outline" className="text-xs" data-testid={`book-price-badge-${book.id}`}>
                                {format_safe_price(book)}
                              </Badge>
                              {book.hardcopy_available && (
                                <Badge variant="outline" className="text-xs" data-testid={`book-hardcopy-badge-${book.id}`}>Physical Copy</Badge>
                              )}
                              {book.pdf_file_path && (
                                <Badge variant="outline" className="text-xs" data-testid={`book-digital-badge-${book.id}`}>Digital</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewBookDetails(book)}
                              className="text-xs gap-1"
                              data-testid={`button-view-details-${book.id}`}
                            >
                              <Eye className="w-3 h-3" />
                              Details
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleAddToCart(book)}
                              className="text-xs gap-1"
                              style={{ backgroundColor: currentShop?.color }}
                              disabled={addToCartMutation.isPending}
                              data-testid={`button-add-to-cart-${book.id}`}
                            >
                              <Plus className="w-3 h-3" />
                              {addToCartMutation.isPending ? 'Adding...' : 'Add to Cart'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4" data-testid="coursebooks-empty">
                    <p className="text-sm text-gray-600 dark:text-gray-400">No coursebooks available at the moment.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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

      {/* Book Details Modal */}
      <Dialog open={showBookDetailsModal} onOpenChange={setShowBookDetailsModal}>
        <DialogContent className="max-w-md mx-auto" data-testid="book-details-modal">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold" data-testid="book-modal-title" dir="auto">
              {selectedBook?.title}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 dark:text-gray-400" data-testid="book-modal-author" dir="auto">
              by {selectedBook?.author}
            </DialogDescription>
          </DialogHeader>
          
          {selectedBook && (
            <div className="space-y-4 mt-4">
              {/* Cover Image - placeholder for now */}
              {selectedBook.cover_image && (
                <div className="flex justify-center" data-testid="book-modal-cover">
                  <img 
                    src={selectedBook.cover_image} 
                    alt={selectedBook.title}
                    className="w-32 h-48 object-cover rounded-lg shadow-md"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              {/* Book Description */}
              <div data-testid="book-modal-description">
                <h4 className="font-medium text-sm mb-2">Description</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed" dir="auto">
                  {selectedBook.description}
                </p>
              </div>
              
              {/* Price */}
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg" data-testid="book-modal-price">
                <span className="text-sm font-medium">Price:</span>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  {format_safe_price(selectedBook)}
                </span>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={() => {
                    handleAddToCart(selectedBook);
                    setShowBookDetailsModal(false);
                  }}
                  className="flex-1"
                  disabled={addToCartMutation.isPending}
                  data-testid="book-modal-add-to-cart"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowBookDetailsModal(false)}
                  data-testid="book-modal-close"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}