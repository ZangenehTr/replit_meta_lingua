import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Expand,
  Minimize,
  Move,
  Volume2,
  VolumeX
} from 'lucide-react';

interface VideoCallLayoutProps {
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  isVideoOff: boolean;
  isConnected: boolean;
  role: 'student' | 'teacher';
  userName?: string;
  remoteName?: string;
}

type PipPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export function VideoCallLayout({
  localVideoRef,
  remoteVideoRef,
  isVideoOff,
  isConnected,
  role,
  userName,
  remoteName
}: VideoCallLayoutProps) {
  const [pipPosition, setPipPosition] = useState<PipPosition>('top-right');
  const [isDragging, setIsDragging] = useState(false);
  const [isMainLocal, setIsMainLocal] = useState(false); // Remote is main by default
  const [localMuted, setLocalMuted] = useState(true);
  const [remoteMuted, setRemoteMuted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Position mappings for PiP window
  const positionStyles: Record<PipPosition, string> = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  // Handle PiP drag and position change
  const handlePipClick = (e: React.MouseEvent) => {
    // Simple position cycling on click
    const positions: PipPosition[] = ['top-right', 'bottom-right', 'bottom-left', 'top-left'];
    const currentIndex = positions.indexOf(pipPosition);
    const nextIndex = (currentIndex + 1) % positions.length;
    setPipPosition(positions[nextIndex]);
  };

  // Swap main and PiP videos
  const handleSwapVideos = () => {
    setIsMainLocal(!isMainLocal);
  };

  // Handle local video muting (for echo prevention)
  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.muted = true; // Always mute local video to prevent echo
    }
  }, [localVideoRef]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-gray-900 overflow-hidden">
      {/* Main Video (Usually Remote) */}
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <video
          ref={isMainLocal ? localVideoRef : remoteVideoRef}
          className={cn(
            "w-full h-full object-cover",
            isMainLocal && isVideoOff && "hidden"
          )}
          autoPlay
          playsInline
          muted={isMainLocal ? true : remoteMuted}
        />
        
        {/* Placeholder when no video */}
        {((!isMainLocal && !isConnected) || (isMainLocal && isVideoOff)) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
            <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center mb-4">
              <span className="text-4xl text-gray-400">
                {(isMainLocal ? userName : remoteName)?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
            <p className="text-white text-lg font-medium">
              {isMainLocal ? userName : remoteName || (isConnected ? 'Remote User' : 'Connecting...')}
            </p>
            {!isConnected && (
              <p className="text-gray-400 text-sm mt-2">Waiting for connection...</p>
            )}
          </div>
        )}

        {/* Volume control for main video */}
        {!isMainLocal && isConnected && (
          <button
            onClick={() => setRemoteMuted(!remoteMuted)}
            className="absolute bottom-4 left-4 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            title={remoteMuted ? "Unmute remote" : "Mute remote"}
          >
            {remoteMuted ? (
              <VolumeX className="w-5 h-5 text-white" />
            ) : (
              <Volume2 className="w-5 h-5 text-white" />
            )}
          </button>
        )}
      </div>

      {/* Picture-in-Picture (PiP) Video (Usually Local) */}
      <AnimatePresence>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={cn(
            "absolute z-10 shadow-2xl rounded-lg overflow-hidden",
            "w-48 h-36 md:w-64 md:h-48 lg:w-72 lg:h-54",
            "border-2 border-white/20",
            positionStyles[pipPosition],
            isDragging && "cursor-grabbing",
            !isDragging && "cursor-grab hover:shadow-3xl transition-shadow"
          )}
          onClick={handlePipClick}
          onDoubleClick={handleSwapVideos}
        >
          {/* PiP Video */}
          <video
            ref={isMainLocal ? remoteVideoRef : localVideoRef}
            className={cn(
              "w-full h-full object-cover bg-gray-800",
              !isMainLocal && isVideoOff && "hidden"
            )}
            autoPlay
            playsInline
            muted={!isMainLocal} // Local video always muted
          />

          {/* Placeholder for PiP when video is off */}
          {((!isMainLocal && isVideoOff) || (isMainLocal && !isConnected)) && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
              <div className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center">
                <span className="text-xl text-gray-300">
                  {(!isMainLocal ? userName : remoteName)?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
            </div>
          )}

          {/* PiP Controls Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity">
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
              <span className="text-xs text-white font-medium px-2 py-1 bg-black/50 rounded">
                {!isMainLocal ? 'You' : 'Remote'}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSwapVideos();
                  }}
                  className="p-1 rounded bg-black/50 hover:bg-black/70 transition-colors"
                  title="Swap videos"
                >
                  <Expand className="w-3 h-3 text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Could add minimize functionality here
                  }}
                  className="p-1 rounded bg-black/50 hover:bg-black/70 transition-colors"
                  title="Move"
                >
                  <Move className="w-3 h-3 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Position indicator dots */}
          <div className="absolute top-2 right-2 flex gap-1">
            {(['top-right', 'bottom-right', 'bottom-left', 'top-left'] as PipPosition[]).map((pos) => (
              <div
                key={pos}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-colors",
                  pos === pipPosition ? "bg-white" : "bg-white/30"
                )}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Helper text */}
      {!isConnected && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-center">
          <p className="text-white/70 text-sm bg-black/30 px-4 py-2 rounded-lg backdrop-blur-sm">
            Click the small video to move it • Double-click to swap
          </p>
        </div>
      )}
    </div>
  );
}