"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Utensils,
  Sparkles,
  Settings2,
  Volume2,
  VolumeX,
  Timer,
  Palette,
  Check,
} from "lucide-react";
import WheelComponent from "@/components/WheelComponents";
import { Restaurant } from "@/types/restaurant";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DecisionWheelProps {
  restaurants: Restaurant[];
  onSelect: (restaurant: Restaurant) => void;
}

const THEMES = {
  vibrant: [
    "#EE4040",
    "#F0CF50",
    "#815CD1",
    "#3DA5E0",
    "#34A24F",
    "#F9AA33",
    "#4A6572",
    "#607D8B",
    "#FB8C00",
    "#00ACC1",
    "#3949AB",
    "#D81B60",
    "#43A047",
    "#546E7A",
    "#795548",
  ],
  pastel: [
    "#FFB7B2",
    "#FFDAC1",
    "#E2F0CB",
    "#B5EAD7",
    "#C7CEEA",
    "#FF9AA2",
    "#FFCCB6",
    "#D4F0F0",
    "#8FCACA",
    "#CCE2CB",
    "#B6CFB6",
    "#97C1A9",
    "#FCB9AA",
    "#FFDBCC",
    "#ECEAE4",
  ],
  night: [
    "#2D3436",
    "#636E72",
    "#B2BEC3",
    "#DFE6E9",
    "#00B894",
    "#00CEC9",
    "#0984E3",
    "#6C5CE7",
    "#D63031",
    "#E84393",
    "#FD79A8",
    "#FDCB6E",
    "#E17055",
    "#55E6C1",
    "#58B19F",
  ],
  ocean: [
    "#0077B6",
    "#0096C7",
    "#00B4D8",
    "#48CAE4",
    "#90E0EF",
    "#ADE8F4",
    "#CAF0F8",
    "#023E8A",
    "#03045E",
    "#184E77",
    "#1E6091",
    "#1A759F",
    "#168AAD",
    "#34A0A4",
    "#52B69A",
  ],
};

export function DecisionWheel({ restaurants, onSelect }: DecisionWheelProps) {
  const [open, setOpen] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [spinDuration, setSpinDuration] = useState("normal"); // fast, normal, slow
  const [theme, setTheme] = useState<keyof typeof THEMES>("vibrant");

  // Load settings from localStorage
  useEffect(() => {
    const savedVolume = localStorage.getItem("wheel-volume");
    const savedDuration = localStorage.getItem("wheel-duration");
    const savedTheme = localStorage.getItem("wheel-theme");

    if (savedVolume) setVolume(parseFloat(savedVolume));
    if (savedDuration) setSpinDuration(savedDuration);
    if (savedTheme && savedTheme in THEMES)
      setTheme(savedTheme as keyof typeof THEMES);
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem("wheel-volume", volume.toString());
    localStorage.setItem("wheel-duration", spinDuration);
    localStorage.setItem("wheel-theme", theme);
  }, [volume, spinDuration, theme]);

  if (restaurants.length === 0) return null;

  const data = restaurants.slice(0, 50);
  const segments = data.map((r) => r.name);
  const wheelColors = Array.from(
    { length: segments.length },
    (_, i) => THEMES[theme][i % THEMES[theme].length],
  );

  const getDurations = () => {
    switch (spinDuration) {
      case "fast":
        return { up: 50, down: 400 };
      case "slow":
        return { up: 200, down: 1200 };
      default:
        return { up: 100, down: 600 };
    }
  };

  const { up: upDuration, down: downDuration } = getDurations();

  const handleFinished = (winner: string) => {
    const selected = data.find((r) => r.name === winner);
    if (selected) {
      setTimeout(() => {
        onSelect(selected);
        setOpen(false);
      }, 1500);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg font-bold group h-10 px-6 transition-all hover:scale-105 active:scale-95"
        >
          <Sparkles className="mr-2 h-4 w-4 group-hover:animate-spin" />
          Spin to Decide
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] flex flex-col items-center bg-white/95 backdrop-blur-md">
        <DialogHeader className="w-full relative">
          <div className="absolute right-0 top-0">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-purple-100 text-purple-600"
                >
                  <Settings2 className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-80 p-6 space-y-6 shadow-2xl rounded-2xl border-purple-100"
                side="left"
                align="start"
              >
                <div className="space-y-2">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-purple-600" />
                    Wheel Settings
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Adjust your spinning experience
                  </p>
                </div>

                {/* Volume Control */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      {volume === 0 ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                      Volume
                    </Label>
                    <span className="text-xs font-medium text-purple-600">
                      {Math.round(volume * 100)}%
                    </span>
                  </div>
                  <Slider
                    value={[volume]}
                    onValueChange={(vals) => setVolume(vals[0])}
                    max={1}
                    step={0.01}
                    className="cursor-pointer"
                  />
                </div>

                {/* Spin Speed */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Timer className="h-4 w-4" />
                    Spin Speed
                  </Label>
                  <RadioGroup
                    value={spinDuration}
                    onValueChange={setSpinDuration}
                    className="grid grid-cols-3 gap-2"
                  >
                    {["fast", "normal", "slow"].map((d) => (
                      <div key={d}>
                        <RadioGroupItem
                          value={d}
                          id={`speed-${d}`}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={`speed-${d}`}
                          className="flex items-center justify-center rounded-lg border-2 border-muted bg-white p-2 hover:bg-purple-50 peer-data-[state=checked]:border-purple-600 peer-data-[state=checked]:text-purple-600 transition-all cursor-pointer text-xs capitalize font-medium"
                        >
                          {d}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Theme Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Color Theme
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(THEMES) as Array<keyof typeof THEMES>).map(
                      (t) => (
                        <Button
                          key={t}
                          variant="outline"
                          size="sm"
                          onClick={() => setTheme(t)}
                          className={`justify-start gap-2 h-9 px-3 rounded-lg border-2 transition-all ${
                            theme === t
                              ? "border-purple-600 bg-purple-50 text-purple-600 shadow-sm"
                              : "hover:border-purple-200"
                          }`}
                        >
                          <div className="flex -space-x-1.5">
                            {THEMES[t].slice(0, 3).map((c, i) => (
                              <div
                                key={i}
                                className="h-3 w-3 rounded-full ring-1 ring-white"
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                          <span className="text-xs capitalize font-medium">
                            {t}
                          </span>
                          {theme === t && (
                            <Check className="h-3 w-3 ml-auto shrink-0" />
                          )}
                        </Button>
                      ),
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <DialogTitle className="text-2xl font-black text-center flex items-center justify-center gap-3 text-gray-900 pt-4">
            <div className="bg-purple-100 p-2 rounded-xl">
              <Utensils className="h-6 w-6 text-purple-600" />
            </div>
            Can't Decide?
          </DialogTitle>
          <p className="text-sm text-gray-500 text-center mt-1">
            Let the Spin of Fate choose your meal!
          </p>
        </DialogHeader>

        <div className="flex justify-center items-center w-full py-8 mt-4 overflow-hidden bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
          <div className="scale-[0.85] sm:scale-100 transition-all duration-500 ease-in-out hover:rotate-1">
            <WheelComponent
              segments={segments}
              segColors={wheelColors}
              onFinished={handleFinished}
              primaryColor="#7c3aed"
              contrastColor="white"
              buttonText="Spin"
              isOnlyOnce={false}
              size={250}
              upDuration={upDuration}
              downDuration={downDuration}
              fontFamily="Outfit, sans-serif"
              volume={volume}
            />
          </div>
        </div>

        <div className="w-full flex justify-between items-center px-2 mt-4">
          <p className="text-[10px] text-muted-foreground italic flex items-center gap-1.5">
            <Check className="h-3 w-3 text-green-500" />
            Picking from {data.length} local favorites
          </p>
          <div className="flex items-center gap-4 text-[10px] font-bold text-purple-400 uppercase tracking-widest">
            <span>{theme} theme</span>
            <span className="h-1 w-1 rounded-full bg-purple-200" />
            <span>{spinDuration} spin</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
