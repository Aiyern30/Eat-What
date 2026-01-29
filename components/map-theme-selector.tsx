// MapThemeSelector.tsx
import { Check, Layers } from "lucide-react";
import { getMapThemeConfigs } from "./mapTheme";
import { MapTheme } from "@/types/map";

interface MapThemeSelectorProps {
  mapTheme: MapTheme;
  setMapTheme: (theme: MapTheme) => void;
  showThemeMenu: boolean;
  setShowThemeMenu: (show: boolean) => void;
}

export const MapThemeSelector: React.FC<MapThemeSelectorProps> = ({
  mapTheme,
  setMapTheme,
  showThemeMenu,
  setShowThemeMenu,
}) => {
  const themeConfigs = getMapThemeConfigs();

  return (
    <div className="relative">
      {/* Dropdown Menu */}
      {showThemeMenu && (
        <div className="absolute top-0 right-14 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 w-[360px] animate-in fade-in slide-in-from-right-5 zoom-in-95 origin-top-right z-20">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-gray-900">Map Style</h4>
            <button
              onClick={() => setShowThemeMenu(false)}
              className="text-gray-400 hover:text-gray-600 text-xs font-medium px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {themeConfigs.map((theme) => (
              <button
                key={theme.id}
                onClick={() => {
                  setMapTheme(theme.id);
                }}
                className="flex flex-col items-center gap-2 group transition-all"
              >
                <div
                  className={`relative w-full aspect-4/3 rounded-xl overflow-hidden shadow-sm border-2 transition-all duration-200 ${
                    mapTheme === theme.id
                      ? "border-blue-600 ring-2 ring-blue-100 scale-105"
                      : "border-gray-200 group-hover:border-gray-300 group-hover:shadow-md"
                  }`}
                >
                  {theme.preview}
                  {mapTheme === theme.id && (
                    <div className="absolute inset-0 bg-blue-600/10 flex items-center justify-center">
                      <div className="bg-blue-600 rounded-full p-0.5 shadow-md">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  )}
                </div>
                <span
                  className={`text-xs font-medium transition-colors ${
                    mapTheme === theme.id
                      ? "text-blue-600"
                      : "text-gray-600 group-hover:text-gray-900"
                  }`}
                >
                  {theme.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        className={`p-3 rounded-full shadow-lg border transition-all duration-300 ${
          showThemeMenu
            ? "bg-gray-900 border-gray-900 text-white rotate-90"
            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
        }`}
        onClick={() => setShowThemeMenu(!showThemeMenu)}
        title="Change Map Style"
      >
        <Layers className="w-5 h-5" />
      </button>
    </div>
  );
};
