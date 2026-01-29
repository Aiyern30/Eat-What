"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Bookmark,
  Star,
  Plus,
  Check,
  MapPin,
  Clock,
  Navigation,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface SaveButtonProps {
  restaurantId: string;
  restaurantName: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  className?: string;
  showLabel?: boolean;
}

export function SaveButton({
  restaurantId,
  restaurantName,
  variant = "outline",
  className = "",
  showLabel = true,
}: SaveButtonProps) {
  const { data: session } = useSession();
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  // Mock states for saved lists
  const [savedLists, setSavedLists] = useState({
    favorites: false,
    wantToGo: false,
    starred: false,
  });

  const isAnySaved = Object.values(savedLists).some(Boolean);

  const handleToggleList = (list: keyof typeof savedLists) => {
    if (!session) {
      setShowLoginDialog(true);
      return;
    }

    setSavedLists((prev) => {
      const newState = { ...prev, [list]: !prev[list] };
      const action = newState[list] ? "Saved to" : "Removed from";
      const listName =
        list === "favorites"
          ? "Favorites"
          : list === "wantToGo"
            ? "Want to go"
            : "Starred places";

      toast.success(`${action} ${listName}`);
      return newState;
    });
  };

  const loginWithGoogle = () => {
    signIn("google");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            className={`gap-2 ${className} ${isAnySaved ? "text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100" : ""}`}
            onClick={(e) => {
              if (!session) {
                e.preventDefault();
                setShowLoginDialog(true);
              }
            }}
          >
            {isAnySaved ? (
              <Bookmark className="h-4 w-4 fill-current" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
            {showLabel && <span>{isAnySaved ? "Saved" : "Save"}</span>}
          </Button>
        </DropdownMenuTrigger>

        {session && (
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Save to list</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={savedLists.favorites}
              onCheckedChange={() => handleToggleList("favorites")}
              className="gap-2"
            >
              <Heart
                className={`h-4 w-4 ${savedLists.favorites ? "fill-red-500 text-red-500" : "text-gray-400"}`}
              />
              <span>Favorites</span>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={savedLists.wantToGo}
              onCheckedChange={() => handleToggleList("wantToGo")}
              className="gap-2"
            >
              <MapPin
                className={`h-4 w-4 ${savedLists.wantToGo ? "fill-blue-500 text-blue-500" : "text-gray-400"}`}
              />
              <span>Want to go</span>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={savedLists.starred}
              onCheckedChange={() => handleToggleList("starred")}
              className="gap-2"
            >
              <Star
                className={`h-4 w-4 ${savedLists.starred ? "fill-yellow-500 text-yellow-500" : "text-gray-400"}`}
              />
              <span>Starred places</span>
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-blue-600 focus:text-blue-700 cursor-pointer">
              <Plus className="h-4 w-4" />
              <span>New list</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        )}
      </DropdownMenu>

      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <Bookmark className="h-6 w-6 text-blue-600" />
            </div>
            <DialogTitle className="text-center text-xl">
              Save to your favorites?
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              Sign in to save{" "}
              <span className="font-bold text-gray-900">
                "{restaurantName}"
              </span>{" "}
              and keep track of your favorite places.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 text-base font-semibold transition-all shadow-md hover:shadow-lg active:scale-95"
              onClick={loginWithGoogle}
            >
              Sign in with Google
            </Button>
            <Button
              variant="ghost"
              className="w-full h-10 text-gray-500"
              onClick={() => setShowLoginDialog(false)}
            >
              Maybe later
            </Button>
          </div>
          <div className="text-[10px] text-gray-400 text-center px-6">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
