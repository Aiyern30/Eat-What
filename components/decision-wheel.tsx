"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Utensils, Sparkles } from "lucide-react";
import WheelComponent from "@/components/WheelComponents";
import { Restaurant } from "@/types/restaurant";

interface DecisionWheelProps {
  restaurants: Restaurant[];
  onSelect: (restaurant: Restaurant) => void;
}

export function DecisionWheel({ restaurants, onSelect }: DecisionWheelProps) {
  const [open, setOpen] = useState(false);

  if (restaurants.length === 0) return null;

  // Limit to 50 as requested, or current total
  const data = restaurants.slice(0, 50);
  const segments = data.map((r) => r.name);

  // Generate a variety of vibrant colors
  const segColors = [
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
    "#009688",
    "#673AB7",
    "#FF5722",
    "#607D8B",
    "#9C27B0",
  ];

  // Repeat colors to match the number of segments
  const wheelColors = Array.from(
    { length: segments.length },
    (_, i) => segColors[i % segColors.length],
  );

  const handleFinished = (winner: string) => {
    const selected = data.find((r) => r.name === winner);
    if (selected) {
      // Delay closing to let user see the winning segment
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
          className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg font-bold group h-10"
        >
          <Sparkles className="mr-2 h-4 w-4 group-hover:animate-spin" />
          Spin to Decide
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px] flex flex-col items-center">
        <DialogHeader className="w-full">
          <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
            <Utensils className="h-6 w-6 text-purple-600" />
            Can't Decide? Let the Wheel Choose!
          </DialogTitle>
        </DialogHeader>
        <div className="flex justify-center items-center w-full py-4 overflow-hidden bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <div className="scale-75 sm:scale-100 transition-transform">
            <WheelComponent
              segments={segments}
              segColors={wheelColors}
              onFinished={handleFinished}
              primaryColor="#7c3aed"
              contrastColor="white"
              buttonText="Spin"
              isOnlyOnce={false}
              size={250}
              upDuration={100}
              downDuration={600}
              fontFamily="Inter"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2 italic">
          Spinning from the top {data.length} current results
        </p>
      </DialogContent>
    </Dialog>
  );
}
