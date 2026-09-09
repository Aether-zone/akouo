import { useEffect, useRef, useState } from "react";

import { Timecode } from "../Timecode";
import { TransportControls } from "../TransportControls";
import { Waveform } from "../Waveform";
import { cn } from "../lib/cn";

export interface AudioPlayerProps {
  src: string;
  /** Precomputed amplitude peaks (0..1). A placeholder pattern is used if omitted. */
  peaks?: number[];
  className?: string;
}

/*
 * Placeholder so the waveform renders without analysis data. Integer arithmetic
 * on purpose: `Math.sin` is implementation-defined to the last bit, and the
 * server and the browser are free to disagree there — which shows up as a
 * hydration mismatch on the bar heights rather than anything visible.
 */
const placeholderPeaks = Array.from({ length: 80 }, (_, i) => {
  // Knuth's multiplicative hash, kept well inside exact integer range.
  const noise = (i * 2654435761) % 1000;

  return 0.3 + 0.6 * (noise / 1000);
});

/** Self-contained audio player: waveform scrubber, transport, and timecodes. */
export function AudioPlayer({ src, peaks, className }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onPause);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onPause);
    };
  }, []);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play().catch(() => undefined);
    else audio.pause();
  }

  function skip(delta: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(
      audio.duration || 0,
      Math.max(0, audio.currentTime + delta),
    );
  }

  function seekRatio(ratio: number) {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    audio.currentTime = ratio * audio.duration;
    setCurrentTime(audio.currentTime);
  }

  function changeSpeed(next: number) {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = next;
    setSpeed(next);
  }

  const progress = duration ? currentTime / duration : 0;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border bg-card p-4",
        className,
      )}
    >
      <audio ref={audioRef} src={src} preload="metadata" />
      <Waveform
        peaks={peaks ?? placeholderPeaks}
        progress={progress}
        onSeek={seekRatio}
      />
      <div className="flex items-center justify-between gap-3">
        <TransportControls
          playing={playing}
          onPlayPause={togglePlay}
          onSkip={skip}
          speed={speed}
          onSpeedChange={changeSpeed}
        />
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Timecode seconds={currentTime} />
          <span>/</span>
          <Timecode seconds={duration} />
        </div>
      </div>
    </div>
  );
}
