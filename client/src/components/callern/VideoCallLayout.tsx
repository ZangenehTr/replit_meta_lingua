import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Expand, Move, Volume2, VolumeX } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface VideoCallLayoutProps {
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  isVideoOff: boolean; // local video off
  isConnected: boolean;
  role: "student" | "teacher";
  userName?: string;
  remoteName?: string;
}

type PipPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export function VideoCallLayout({
  localVideoRef,
  remoteVideoRef,
  isVideoOff,
  isConnected,
  role,
  userName,
  remoteName,
}: VideoCallLayoutProps) {
  const { t } = useLanguage();
  const [pipPosition, setPipPosition] = useState<PipPosition>("top-right");
  const [isDragging, setIsDragging] = useState(false);
  const [isMainLocal, setIsMainLocal] = useState(false); // remote is main by default
  const [remoteMuted, setRemoteMuted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Which view currently shows the remote?
  const remoteIsMain = !isMainLocal;

  // Muted rules:
  // - Local video must always be muted (avoid echo).
  // - Remote video is muted according to remoteMuted, regardless of where it is displayed.
  const mainMuted = remoteIsMain ? remoteMuted : true;
  const pipMuted = remoteIsMain ? true : remoteMuted;

  // Click to cycle PiP position
  const handlePipClick = () => {
    const positions: PipPosition[] = [
      "top-right",
      "bottom-right",
      "bottom-left",
      "top-left",
    ];
    const idx = positions.indexOf(pipPosition);
    setPipPosition(positions[(idx + 1) % positions.length]);
  };

  // Double-click PiP to swap
  const handleSwapVideos = () => setIsMainLocal((v) => !v);

  // Always keep local element muted as a guard
  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.muted = true;
  }, [localVideoRef]);

  // PiP corner classes
  const positionStyles: Record<PipPosition, string> = {
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-right": "bottom-4 right-4",
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-gray-900 overflow-hidden"
    >
      {/* Main Video Surface */}
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <video
          ref={isMainLocal ? localVideoRef : remoteVideoRef}
          className={cn("w-full h-full object-cover")}
          autoPlay
          playsInline
          muted={mainMuted}
        />

        {/* Placeholder states */}
        {/* If remote is main and not connected, show placeholder;
            If local is main and local video is off, show placeholder */}
        {((remoteIsMain && !isConnected) || (isMainLocal && isVideoOff)) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
            <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center mb-4">
              <span className="text-4xl text-gray-400">
                {(isMainLocal ? userName : remoteName)
                  ?.charAt(0)
                  ?.toUpperCase() || t('callern:videoCallLayout.unknownUser')}
              </span>
            </div>
            <p className="text-white text-lg font-medium">
              {isMainLocal
                ? userName || t('callern:you')
                : remoteName || (isConnected ? t('callern:videoCallLayout.remoteUser') : t('callern:connecting'))}
            </p>
            {!isConnected && remoteIsMain && (
              <p className="text-gray-400 text-sm mt-2">
                {t('callern:waitingForConnection')}
              </p>
            )}
          </div>
        )}

        {/* Remote volume control on MAIN whenever remote is main */}
        {remoteIsMain && isConnected && (
          <button
            onClick={() => setRemoteMuted((m) => !m)}
            className="absolute bottom-4 left-4 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            title={remoteMuted ? t('callern:videoCallLayout.unmuteRemote') : t('callern:videoCallLayout.muteRemote')}
          >
            {remoteMuted ? (
              <VolumeX className="w-5 h-5 text-white" />
            ) : (
              <Volume2 className="w-5 h-5 text-white" />
            )}
          </button>
        )}
      </div>

      {/* PiP (usually local) */}
      <AnimatePresence>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={cn(
            "absolute z-10 shadow-2xl rounded-lg overflow-hidden",
            "w-48 h-36 md:w-64 md:h-48 lg:w-72 lg:h-56",
            "border-2 border-white/20",
            positionStyles[pipPosition],
            isDragging
              ? "cursor-grabbing"
              : "cursor-grab hover:shadow-2xl transition-shadow",
          )}
          onClick={handlePipClick}
          onDoubleClick={handleSwapVideos}
          // Optional: enable real dragging (kept simple; you can snap to corners on drag end)
          drag
          dragMomentum={false}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
        >
          <video
            ref={isMainLocal ? remoteVideoRef : localVideoRef}
            className={cn("w-full h-full object-cover bg-gray-800")}
            autoPlay
            playsInline
            muted={pipMuted}
          />

          {/* PiP placeholder (only when the video shown here is off/unavailable) */}
          {((!isMainLocal && isVideoOff) || (isMainLocal && !isConnected)) && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
              <div className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center">
                <span className="text-xl text-gray-300">
                  {(!isMainLocal ? userName : remoteName)
                    ?.charAt(0)
                    ?.toUpperCase() || t('callern:videoCallLayout.unknownUser')}
                </span>
              </div>
            </div>
          )}

          {/* PiP overlay controls */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity">
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
              <span className="text-xs text-white font-medium px-2 py-1 bg-black/50 rounded">
                {!isMainLocal ? t('callern:you') : t('callern:videoCallLayout.remote')}
              </span>
              <div className="flex gap-1">
                {/* Remote volume control on PIP whenever remote is in PiP */}
                {!remoteIsMain && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRemoteMuted((m) => !m);
                    }}
                    className="p-1 rounded bg-black/50 hover:bg-black/70 transition-colors"
                    title={remoteMuted ? t('callern:videoCallLayout.unmuteRemote') : t('callern:videoCallLayout.muteRemote')}
                  >
                    {remoteMuted ? (
                      <VolumeX className="w-3 h-3 text-white" />
                    ) : (
                      <Volume2 className="w-3 h-3 text-white" />
                    )}
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSwapVideos();
                  }}
                  className="p-1 rounded bg-black/50 hover:bg-black/70 transition-colors"
                  title={t('callern:videoCallLayout.swapVideos')}
                >
                  <Expand className="w-3 h-3 text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); /* reserved for future: snap menu */
                  }}
                  className="p-1 rounded bg-black/50 hover:bg-black/70 transition-colors"
                  title={t('callern:videoCallLayout.move')}
                >
                  <Move className="w-3 h-3 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Position indicator dots */}
          <div className="absolute top-2 right-2 flex gap-1">
            {(
              [
                "top-right",
                "bottom-right",
                "bottom-left",
                "top-left",
              ] as PipPosition[]
            ).map((pos) => (
              <div
                key={pos}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-colors",
                  pos === pipPosition ? "bg-white" : "bg-white/30",
                )}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Helper text */}
      {!isConnected && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center">
          <p className="text-white/70 text-sm bg-black/30 px-4 py-2 rounded-lg backdrop-blur-sm">
            {t('callern:videoCallLayout.helperText')}
          </p>
        </div>
      )}
    </div>
  );
}
