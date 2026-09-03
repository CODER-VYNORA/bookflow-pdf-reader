import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Play } from 'lucide-react';

interface IntroVideoProps {
  onComplete: () => void;
}

export default function IntroVideo({
  onComplete,
}: IntroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const completedRef = useRef(false);

  const [isMuted, setIsMuted] = useState(true);
  const [showPlayButton, setShowPlayButton] = useState(false);

  const finishIntro = () => {
    if (completedRef.current) return;

    completedRef.current = true;

    onComplete();
  };

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    video.muted = true;
    video.playsInline = true;

    const playVideo = async () => {
      try {
        await video.play();

        setShowPlayButton(false);
      } catch (error) {
        console.log('Autoplay blocked:', error);

        // Show play button if browser blocks autoplay
        setShowPlayButton(true);
      }
    };

    playVideo();

    // Maximum intro duration = 10 seconds
    const maxTimer = window.setTimeout(() => {
      finishIntro();
    }, 10000);

    return () => {
      window.clearTimeout(maxTimer);
    };
  }, []);

  const handlePlay = async () => {
    const video = videoRef.current;

    if (!video) return;

    try {
      video.muted = true;

      await video.play();

      setShowPlayButton(false);
    } catch (error) {
      console.log('Unable to play video:', error);
    }
  };

  const toggleMute = async () => {
    const video = videoRef.current;

    if (!video) return;

    const newMutedState = !video.muted;

    video.muted = newMutedState;

    setIsMuted(newMutedState);

    if (video.paused) {
      try {
        await video.play();
        setShowPlayButton(false);
      } catch (error) {
        console.log('Unable to resume video:', error);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-black flex items-center justify-center overflow-hidden">

      {/* Intro Video */}
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

      {/* Play Button - only appears when autoplay is blocked */}
      {showPlayButton && (
        <button
          type="button"
          onClick={handlePlay}
          className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-white/90 text-black flex items-center justify-center hover:bg-white active:scale-95 transition-all"
          aria-label="Play intro video"
        >
          <Play className="w-8 h-8 ml-1" fill="currentColor" />
        </button>
      )}

      {/* Mute / Unmute */}
      <button
        type="button"
        onClick={toggleMute}
        aria-label={
          isMuted
            ? 'Unmute intro video'
            : 'Mute intro video'
        }
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