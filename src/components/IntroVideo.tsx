import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface IntroVideoProps {
  onComplete: () => void;
}

export default function IntroVideo({ onComplete }: IntroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const completedRef = useRef(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  const finishIntro = () => {
    if (completedRef.current) return;

    completedRef.current = true;
    setIsClosing(true);

    // Smooth fade-out
    window.setTimeout(() => {
      onComplete();
    }, 400);
  };

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    video.muted = true;

    const startVideo = async () => {
      try {
        await video.play();
      } catch {
        // Autoplay can be blocked by some browsers.
        // The video remains ready for manual playback if needed.
      }
    };

    startVideo();

    // Hard maximum: 10 seconds
    const maxTimer = window.setTimeout(() => {
      finishIntro();
    }, 10000);

    return () => {
      window.clearTimeout(maxTimer);
    };
  }, []);

  const toggleMute = async () => {
    const video = videoRef.current;

    if (!video) return;

    const newMutedState = !video.muted;

    video.muted = newMutedState;
    setIsMuted(newMutedState);

    // Some browsers may pause autoplay when audio is enabled.
    if (video.paused) {
      try {
        await video.play();
      } catch {
        // Ignore browser playback restrictions.
      }
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[99999] bg-black flex items-center justify-center overflow-hidden transition-opacity duration-400 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <video
        ref={videoRef}
        src="/Intro.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={finishIntro}
        className="w-full h-full object-contain"
      />

      {/* Mute / Unmute */}
      <button
        type="button"
        onClick={toggleMute}
        aria-label={isMuted ? 'Unmute intro video' : 'Mute intro video'}
        className="absolute bottom-6 right-6 z-10 w-12 h-12 rounded-full bg-black/65 text-white flex items-center justify-center hover:bg-black/80 active:scale-95 transition-all backdrop-blur-sm"
      >
        {isMuted ? (
          <VolumeX className="w-5 h-5" />
        ) : (
          <Volume2 className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}