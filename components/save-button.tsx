"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Bookmark,
  Star,
  Flag,
  Briefcase,
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
  const [isLoading, setIsLoading] = useState(false);

  const [savedLists, setSavedLists] = useState({
    favorites: false,
    wantToGo: false,
    starred: false,
    travelPlans: false,
    savedPlaces: false,
  });

  const isAnySaved = Object.values(savedLists).some(Boolean);

  // Fetch saved status when component mounts or session changes
  useEffect(() => {
    if (session?.user) {
      fetchSavedStatus();
    }
  }, [session, restaurantId]);

  const fetchSavedStatus = async () => {
    try {
      const response = await fetch(`/api/saved/${restaurantId}`);
      if (response.ok) {
        const data = await response.json();
        setSavedLists(
          data.savedLists || {
            favorites: false,
            wantToGo: false,
            starred: false,
            travelPlans: false,
            savedPlaces: false,
          },
        );
      }
    } catch (error) {
      console.error("Error fetching saved status:", error);
    }
  };

  const handleToggleList = async (list: keyof typeof savedLists) => {
    if (!session) {
      setShowLoginDialog(true);
      return;
    }

    setIsLoading(true);
    const newValue = !savedLists[list];

    // Optimistic update
    setSavedLists((prev) => ({ ...prev, [list]: newValue }));

    try {
      const response = await fetch("/api/saved", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          restaurantId,
          restaurantName,
          listType: list,
          action: newValue ? "add" : "remove",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      const data = await response.json();

      const listNames: Record<string, string> = {
        favorites: "Favorites",
        wantToGo: "Want to go",
        starred: "Starred places",
        travelPlans: "Travel plans",
        savedPlaces: "Saved places",
      };

      const action = newValue ? "Saved to" : "Removed from";
      toast.success(`${action} ${listNames[list] || list}`);
    } catch (error) {
      // Revert optimistic update on error
      setSavedLists((prev) => ({ ...prev, [list]: !newValue }));
      toast.error("Failed to save. Please try again.");
      console.error("Error saving:", error);
    } finally {
      setIsLoading(false);
    }
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
            disabled={isLoading}
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
          <DropdownMenuContent
            align="end"
            className="w-64 p-2 rounded-2xl shadow-xl border-gray-100"
          >
            <DropdownMenuLabel className="px-3 py-2 text-sm font-semibold text-gray-900">
              Save in your lists
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1" />

            <DropdownMenuCheckboxItem
              checked={savedLists.favorites}
              onCheckedChange={() => handleToggleList("favorites")}
              disabled={isLoading}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${savedLists.favorites ? "bg-red-50" : "bg-gray-50 text-gray-400"}`}
              >
                <Heart
                  className={`h-4.5 w-4.5 ${savedLists.favorites ? "fill-red-500 text-red-500" : ""}`}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900 leading-tight">
                  Favorites
                </span>
                <span className="text-[10px] text-gray-400 font-normal">
                  Private
                </span>
              </div>
            </DropdownMenuCheckboxItem>

            <DropdownMenuCheckboxItem
              checked={savedLists.wantToGo}
              onCheckedChange={() => handleToggleList("wantToGo")}
              disabled={isLoading}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${savedLists.wantToGo ? "bg-green-50" : "bg-gray-50 text-gray-400"}`}
              >
                <Flag
                  className={`h-4.5 w-4.5 ${savedLists.wantToGo ? "fill-green-600 text-green-600" : ""}`}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900 leading-tight">
                  Want to go
                </span>
                <span className="text-[10px] text-gray-400 font-normal">
                  Private
                </span>
              </div>
            </DropdownMenuCheckboxItem>

            <DropdownMenuCheckboxItem
              checked={savedLists.starred}
              onCheckedChange={() => handleToggleList("starred")}
              disabled={isLoading}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${savedLists.starred ? "bg-yellow-50" : "bg-gray-50 text-gray-400"}`}
              >
                <Star
                  className={`h-4.5 w-4.5 ${savedLists.starred ? "fill-yellow-500 text-yellow-500" : ""}`}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900 leading-tight">
                  Starred places
                </span>
                <span className="text-[10px] text-gray-400 font-normal">
                  Private
                </span>
              </div>
            </DropdownMenuCheckboxItem>

            <DropdownMenuCheckboxItem
              checked={savedLists.travelPlans}
              onCheckedChange={() => handleToggleList("travelPlans")}
              disabled={isLoading}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${savedLists.travelPlans ? "bg-cyan-50" : "bg-gray-50 text-gray-400"}`}
              >
                <Briefcase
                  className={`h-4.5 w-4.5 ${savedLists.travelPlans ? "fill-cyan-600 text-cyan-600" : ""}`}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900 leading-tight">
                  Travel plans
                </span>
                <span className="text-[10px] text-gray-400 font-normal">
                  Private
                </span>
              </div>
            </DropdownMenuCheckboxItem>

            <DropdownMenuCheckboxItem
              checked={savedLists.savedPlaces}
              onCheckedChange={() => handleToggleList("savedPlaces")}
              disabled={isLoading}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${savedLists.savedPlaces ? "bg-blue-50" : "bg-gray-50 text-gray-400"}`}
              >
                <Bookmark
                  className={`h-4.5 w-4.5 ${savedLists.savedPlaces ? "fill-blue-600 text-blue-600" : ""}`}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900 leading-tight">
                  Saved places
                </span>
                <span className="text-[10px] text-gray-400 font-normal">
                  Private
                </span>
              </div>
            </DropdownMenuCheckboxItem>

            <DropdownMenuSeparator className="my-1" />

            <div className="p-1">
              <Button
                variant="ghost"
                className="w-full justify-center gap-2 h-10 rounded-xl text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-sm font-bold border border-transparent hover:border-blue-100 transition-all"
              >
                <Plus className="h-4 w-4" />
                New list
              </Button>
            </div>
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
