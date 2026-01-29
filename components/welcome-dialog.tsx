"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  LogIn,
  ChevronRight,
  UtensilsCrossed,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { signIn, useSession } from "next-auth/react";

interface WelcomeDialogProps {
  onEnableLocation: () => void;
  locationEnabled: boolean;
  isLocationLoading: boolean;
}

export function WelcomeDialog({
  onEnableLocation,
  locationEnabled,
  isLocationLoading,
}: WelcomeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session, status: authStatus } = useSession();

  useEffect(() => {
    // Show dialog if user hasn't completed onboarding
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcome");
    if (!hasSeenWelcome) {
      setIsOpen(true);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem("hasSeenWelcome", "true");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl gap-0">
        <div className="bg-linear-to-br from-orange-500 via-red-500 to-pink-600 p-8 text-white relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <UtensilsCrossed className="w-32 h-32 rotate-12" />
          </div>
          <DialogHeader className="relative z-10 text-left">
            <DialogTitle className="text-3xl font-bold mb-2">
              Welcome to Eat What?
            </DialogTitle>
            <DialogDescription className="text-orange-100 text-base">
              Find the best food around you in seconds. Let's get you set up for
              the best experience.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6 bg-white">
          <div className="space-y-4">
            {/* Location Step */}
            <div
              className={`flex items-start gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                locationEnabled
                  ? "bg-green-50 border-green-100 shadow-sm"
                  : "bg-orange-50 border-orange-100 hover:shadow-md"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg ${
                  locationEnabled
                    ? "bg-green-500 shadow-green-200"
                    : "bg-orange-500 shadow-orange-200"
                }`}
              >
                {locationEnabled ? (
                  <CheckCircle2 className="w-5 h-5 text-white" />
                ) : (
                  <MapPin className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-gray-900 leading-none">
                    Enable Location
                  </h3>
                  {locationEnabled && (
                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                  We need your location to show you restaurants nearby.
                </p>
                <Button
                  onClick={onEnableLocation}
                  disabled={locationEnabled || isLocationLoading}
                  variant={locationEnabled ? "outline" : "default"}
                  className={`w-full justify-between h-10 rounded-xl transition-all font-semibold ${
                    locationEnabled
                      ? "bg-white text-green-600 border-green-200 hover:bg-green-50"
                      : "bg-orange-500 hover:bg-orange-600 text-white shadow-sm hover:shadow-md"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {isLocationLoading && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    {locationEnabled
                      ? "Location Enabled"
                      : isLocationLoading
                        ? "Enabling..."
                        : "Allow Location Access"}
                  </span>
                  {!locationEnabled && !isLocationLoading && (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Login Step */}
            <div
              className={`flex items-start gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                session
                  ? "bg-blue-50 border-blue-100 shadow-sm"
                  : "bg-indigo-50 border-indigo-100 hover:shadow-md"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg ${
                  session
                    ? "bg-blue-500 shadow-blue-200"
                    : "bg-indigo-500 shadow-indigo-200"
                }`}
              >
                {session ? (
                  <CheckCircle2 className="w-5 h-5 text-white" />
                ) : (
                  <LogIn className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-gray-900 leading-none">
                    Sign in with Google
                  </h3>
                  {session && (
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                      Connected
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                  Save your favorite spots and get personalized recommendations.
                </p>
                <Button
                  onClick={() => signIn("google")}
                  disabled={!!session || authStatus === "loading"}
                  variant={session ? "outline" : "default"}
                  className={`w-full justify-between h-10 rounded-xl transition-all font-semibold ${
                    session
                      ? "bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {authStatus === "loading" && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    {session
                      ? `Hi, ${session.user?.name?.split(" ")[0]}`
                      : "Login with Google"}
                  </span>
                  {!session && authStatus !== "loading" && (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="sm:justify-center">
            <Button
              onClick={handleComplete}
              variant="ghost"
              className="w-full h-11 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl font-bold transition-colors"
            >
              Continue to the Map
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
