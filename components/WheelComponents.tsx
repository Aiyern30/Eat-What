import React, { useEffect, useState, useRef } from "react";

interface WheelComponentProps {
  segments: string[];
  segColors: string[];
  winningSegment?: string;
  onFinished: (winner: string) => void;
  primaryColor?: string;
  contrastColor?: string;
  buttonText?: string;
  isOnlyOnce?: boolean;
  size?: number;
  upDuration?: number;
  downDuration?: number;
  fontFamily?: string;
  volume?: number; // 0 to 1
  onSpinStart?: () => void;
}

const WheelComponent = ({
  segments,
  segColors,
  winningSegment,
  onFinished,
  primaryColor = "black",
  contrastColor = "white",
  buttonText = "Spin",
  isOnlyOnce = true,
  size = 240,
  upDuration = 100,
  downDuration = 1000,
  fontFamily = "proxima-nova",
  volume = 0.5,
  onSpinStart,
}: WheelComponentProps) => {
  const [isFinished, setFinished] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  // For sound effects
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastBleepIdx = useRef<number>(-1);

  // Ref-based state to avoid re-renders during animation and stale closures
  const stateRef = useRef({
    currentSegment: "",
    isStarted: false,
    timerHandle: null as NodeJS.Timeout | null,
    angleCurrent: 0,
    angleDelta: 0,
    spinStart: 0,
    frames: 0,
    maxSpeed: Math.PI / segments.length,
  });

  const centerX = 350;
  const centerY = 280;

  const internalStateRef = useRef({
    upTime: segments.length * upDuration,
    downTime: segments.length * downDuration,
  });

  useEffect(() => {
    internalStateRef.current.upTime = segments.length * upDuration;
    internalStateRef.current.downTime = segments.length * downDuration;
  }, [segments.length, upDuration, downDuration]);

  useEffect(() => {
    stateRef.current.maxSpeed = Math.PI / segments.length;
  }, [segments.length]);

  // Handle responsive scaling
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const canvasWidth = 700;
        const newScale = Math.min(1, containerWidth / canvasWidth);
        setScale(newScale);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    wheelInit();
    return () => {
      if (stateRef.current.timerHandle) {
        clearInterval(stateRef.current.timerHandle);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playClickSound = () => {
    if (volume <= 0) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (
          window.AudioContext || (window as any).webkitAudioContext
        )();
      }

      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(volume * 0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.warn("Audio context failed to start:", e);
    }
  };

  const wheelInit = () => {
    wheelDraw();
  };

  const drawSegment = (
    ctx: CanvasRenderingContext2D,
    key: number,
    lastAngle: number,
    angle: number,
  ) => {
    const value = segments[key];
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, size, lastAngle, angle, false);
    ctx.lineTo(centerX, centerY);
    ctx.closePath();
    ctx.fillStyle = segColors[key];
    ctx.fill();
    ctx.stroke();
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((lastAngle + angle) / 2);
    ctx.fillStyle = contrastColor;
    ctx.font = "bold 1em " + fontFamily;
    ctx.fillText(value.substr(0, 21), size / 2 + 20, 0);
    ctx.restore();
  };

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastAngle = stateRef.current.angleCurrent;
    const len = segments.length;
    const PI2 = Math.PI * 2;
    ctx.lineWidth = 1;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.font = "1em " + fontFamily;
    for (let i = 1; i <= len; i++) {
      const angle = PI2 * (i / len) + stateRef.current.angleCurrent;
      drawSegment(ctx, i - 1, lastAngle, angle);
      lastAngle = angle;
    }

    // Draw a center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 40, 0, PI2, false);
    ctx.closePath();
    ctx.fillStyle = primaryColor;
    ctx.lineWidth = 8;
    ctx.strokeStyle = contrastColor;
    ctx.fill();
    ctx.font = "bold 1em " + fontFamily;
    ctx.fillStyle = contrastColor;
    ctx.textAlign = "center";
    ctx.fillText(buttonText, centerX, centerY + 3);
    ctx.stroke();

    // Draw outer circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, size, 0, PI2, false);
    ctx.closePath();

    ctx.lineWidth = 10;
    ctx.strokeStyle = "transparent";
    ctx.stroke();
  };

  const drawNeedle = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineWidth = 1;
    ctx.strokeStyle = contrastColor;
    ctx.fillStyle = contrastColor;
    ctx.beginPath();
    ctx.moveTo(centerX + 20, centerY - 50);
    ctx.lineTo(centerX - 20, centerY - 50);
    ctx.lineTo(centerX, centerY - 70);
    ctx.closePath();
    ctx.fill();

    const change = stateRef.current.angleCurrent + Math.PI / 2;
    let i =
      segments.length -
      Math.floor((change / (Math.PI * 2)) * segments.length) -
      1;
    if (i < 0) i = i + segments.length;

    // Play sound if index changed
    if (
      i !== lastBleepIdx.current &&
      stateRef.current.isStarted &&
      !isFinished
    ) {
      playClickSound();
      lastBleepIdx.current = i;
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = primaryColor;
    ctx.font = "bold 1.5em " + fontFamily;
    stateRef.current.currentSegment = segments[i];
    if (stateRef.current.isStarted) {
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = primaryColor;
      ctx.font = "bold 1.8em " + fontFamily;

      // Draw result with a subtle glow/shadow
      ctx.shadowBlur = 10;
      ctx.shadowColor = "rgba(0,0,0,0.2)";
      ctx.font = "bold 2rem " + fontFamily;
      ctx.fillText(
        stateRef.current.currentSegment,
        centerX,
        centerY + size + 70,
      );

      // Draw "Selected:" prefix
      ctx.font = "italic 1rem " + fontFamily;
      ctx.fillStyle = "#666";
      ctx.shadowBlur = 0;
      ctx.fillText("You should eat at:", centerX, centerY + size + 35);
      ctx.restore();
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 700, 720);
  };

  const wheelDraw = () => {
    clear();
    drawWheel();
    drawNeedle();
  };

  const spin = () => {
    if (isFinished && isOnlyOnce) return;

    stateRef.current.isStarted = true;
    onSpinStart?.();
    if (!stateRef.current.timerHandle) {
      stateRef.current.spinStart = new Date().getTime();
      stateRef.current.frames = 0;
      stateRef.current.timerHandle = setInterval(onTimerTick, segments.length);
    }
  };

  const onTimerTick = () => {
    stateRef.current.frames++;
    wheelDraw();
    const { upTime, downTime } = internalStateRef.current;
    const duration = new Date().getTime() - stateRef.current.spinStart;
    let progress = 0;
    let finished = false;
    if (duration < upTime) {
      progress = duration / upTime;
      stateRef.current.angleDelta =
        stateRef.current.maxSpeed * Math.sin((progress * Math.PI) / 2);
    } else {
      const decelerationDuration = duration - upTime;
      if (winningSegment) {
        if (
          stateRef.current.currentSegment === winningSegment &&
          stateRef.current.frames > segments.length
        ) {
          progress = decelerationDuration / downTime;
          stateRef.current.angleDelta =
            stateRef.current.maxSpeed *
            Math.sin((progress * Math.PI) / 2 + Math.PI / 2);
          progress = 1;
        } else {
          progress = decelerationDuration / downTime;
          stateRef.current.angleDelta =
            stateRef.current.maxSpeed *
            Math.sin((progress * Math.PI) / 2 + Math.PI / 2);
        }
      } else {
        progress = decelerationDuration / downTime;
        stateRef.current.angleDelta =
          stateRef.current.maxSpeed *
          Math.sin((progress * Math.PI) / 2 + Math.PI / 2);
      }
      if (progress >= 1) finished = true;
    }

    stateRef.current.angleCurrent += stateRef.current.angleDelta;
    while (stateRef.current.angleCurrent >= Math.PI * 2)
      stateRef.current.angleCurrent -= Math.PI * 2;
    if (finished) {
      setFinished(true);
      onFinished(stateRef.current.currentSegment);
      if (stateRef.current.timerHandle) {
        clearInterval(stateRef.current.timerHandle);
        stateRef.current.timerHandle = null;
      }
      stateRef.current.angleDelta = 0;
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full flex justify-center items-center overflow-hidden"
      style={{ padding: "1rem" }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          transition: "transform 0.3s ease",
        }}
      >
        <canvas
          ref={canvasRef}
          id="canvas"
          width="700"
          height="720"
          style={{
            pointerEvents: isFinished && isOnlyOnce ? "none" : "auto",
            display: "block",
            cursor: "pointer",
          }}
          onClick={spin}
        />
      </div>
    </div>
  );
};

export default WheelComponent;
