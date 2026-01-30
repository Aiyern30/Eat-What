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
  size = 290,
  upDuration = 100,
  downDuration = 1000,
  fontFamily = "proxima-nova",
}: WheelComponentProps) => {
  const [isFinished, setFinished] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

  const timerDelay = segments.length;
  const upTime = segments.length * upDuration;
  const downTime = segments.length * downDuration;
  const centerX = 300;
  const centerY = 300;

  useEffect(() => {
    stateRef.current.maxSpeed = Math.PI / segments.length;
  }, [segments.length]);

  useEffect(() => {
    wheelInit();
    return () => {
      if (stateRef.current.timerHandle) {
        clearInterval(stateRef.current.timerHandle);
      }
    };
  }, []);

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
    ctx.arc(centerX, centerY, 50, 0, PI2, false);
    ctx.closePath();
    ctx.fillStyle = primaryColor;
    ctx.lineWidth = 10;
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
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = primaryColor;
    ctx.font = "bold 1.5em " + fontFamily;
    stateRef.current.currentSegment = segments[i];
    if (stateRef.current.isStarted) {
      ctx.fillText(
        stateRef.current.currentSegment,
        centerX + 10,
        centerY + size + 50,
      );
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 1000, 800);
  };

  const wheelDraw = () => {
    clear();
    drawWheel();
    drawNeedle();
  };

  const spin = () => {
    if (isFinished && isOnlyOnce) return;

    stateRef.current.isStarted = true;
    if (!stateRef.current.timerHandle) {
      stateRef.current.spinStart = new Date().getTime();
      stateRef.current.frames = 0;
      stateRef.current.timerHandle = setInterval(onTimerTick, timerDelay);
    }
  };

  const onTimerTick = () => {
    stateRef.current.frames++;
    wheelDraw();
    const duration = new Date().getTime() - stateRef.current.spinStart;
    let progress = 0;
    let finished = false;
    if (duration < upTime) {
      progress = duration / upTime;
      stateRef.current.angleDelta =
        stateRef.current.maxSpeed * Math.sin((progress * Math.PI) / 2);
    } else {
      if (winningSegment) {
        if (
          stateRef.current.currentSegment === winningSegment &&
          stateRef.current.frames > segments.length
        ) {
          progress = duration / upTime;
          stateRef.current.angleDelta =
            stateRef.current.maxSpeed *
            Math.sin((progress * Math.PI) / 2 + Math.PI / 2);
          progress = 1;
        } else {
          progress = duration / downTime;
          stateRef.current.angleDelta =
            stateRef.current.maxSpeed *
            Math.sin((progress * Math.PI) / 2 + Math.PI / 2);
        }
      } else {
        progress = duration / downTime;
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
    <div id="wheel" style={{ width: "100%" }}>
      <canvas
        ref={canvasRef}
        id="canvas"
        width="600"
        height="600"
        style={{
          pointerEvents: isFinished && isOnlyOnce ? "none" : "auto",
        }}
        onClick={spin}
      />
    </div>
  );
};

export default WheelComponent;
