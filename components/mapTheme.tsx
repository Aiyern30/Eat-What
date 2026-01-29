import { MapTheme, MapThemeConfig } from "@/types/map";

export const getMapThemeConfigs = (): MapThemeConfig[] => [
  {
    id: "standard",
    label: "Default",
    preview: (
      <div className="w-full h-full bg-linear-to-br from-gray-50 to-blue-50 relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-16 h-12 bg-blue-200/40 rounded-tl-3xl" />
        <div className="absolute top-1/3 left-0 w-full h-1 bg-yellow-400 transform -rotate-12" />
        <div className="absolute top-1/2 left-0 w-full h-[3px] bg-orange-400 transform rotate-6" />
        <div className="absolute top-2/3 left-0 w-2/3 h-px bg-gray-300 transform -rotate-6" />
        <div className="absolute top-1/4 left-1/4 h-full w-px bg-gray-300 transform rotate-12" />
        <div className="absolute top-3 left-3 w-6 h-6 bg-green-200/60 rounded" />
        <div className="absolute bottom-2 left-4 w-2 h-2 bg-gray-300/50 rounded-sm" />
      </div>
    ),
  },
  {
    id: "satellite",
    label: "Satellite",
    preview: (
      <div className="w-full h-full bg-linear-to-br from-emerald-900 via-emerald-800 to-teal-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-1/2 bg-linear-to-b from-emerald-700/40 to-transparent" />
          <div className="absolute bottom-0 right-0 w-2/3 h-1/2 bg-linear-to-t from-teal-800/40 to-transparent" />
        </div>
        <div className="absolute top-2 right-4 w-8 h-6 bg-emerald-950/60 rounded-full blur-[2px]" />
        <div className="absolute bottom-3 left-2 w-10 h-8 bg-green-950/50 rounded-full blur-[2px]" />
        <div className="absolute top-1/2 left-1/3 w-4 h-4 bg-amber-900/30 rounded-sm blur-[1px]" />
      </div>
    ),
  },
  {
    id: "hybrid",
    label: "Hybrid",
    preview: (
      <div className="w-full h-full bg-linear-to-br from-emerald-900 via-teal-900 to-emerald-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-emerald-800/40 to-transparent" />
        <div className="absolute top-1/3 left-0 w-full h-[2px] bg-yellow-300 shadow-sm transform -rotate-12" />
        <div className="absolute top-1/2 left-0 w-full h-[3px] bg-orange-400 shadow-sm transform rotate-6" />
        <div className="absolute top-0 left-1/3 h-full w-[2px] bg-white/60 shadow-sm" />
        <div className="absolute top-2 left-2 w-8 h-1 bg-white/80 rounded-full shadow-sm" />
        <div className="absolute bottom-3 right-3 w-6 h-1 bg-white/70 rounded-full shadow-sm" />
      </div>
    ),
  },
  {
    id: "dark",
    label: "Dark",
    preview: (
      <div className="w-full h-full bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-14 h-10 bg-slate-800/60 rounded-tl-3xl" />
        <div className="absolute top-1/3 left-0 w-full h-[2px] bg-slate-600 transform -rotate-12" />
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-500 transform rotate-6" />
        <div className="absolute top-0 left-1/3 h-full w-px bg-slate-700" />
        <div className="absolute top-4 right-4 w-3 h-3 bg-blue-500/20 rounded-full" />
        <div className="absolute bottom-3 left-3 w-2 h-2 bg-slate-700 rounded-full" />
        <div className="absolute top-1/4 left-1/2 w-12 h-12 bg-blue-500/5 rounded-full blur-xl" />
      </div>
    ),
  },
  {
    id: "retro",
    label: "Retro",
    preview: (
      <div className="w-full h-full bg-linear-to-br from-[#f4ead5] to-[#e8dcc4] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-linear(circle_at_50%_50%,transparent_40%,rgba(0,0,0,0.02)_100%)]" />
        <div className="absolute top-1/3 left-0 w-full h-[2px] bg-[#c9b896] transform -rotate-12" />
        <div className="absolute top-1/2 left-0 w-full h-[3px] bg-[#b5a485] transform rotate-6" />
        <div className="absolute top-0 left-1/4 h-full w-[2px] bg-[#d4c5a9]" />
        <div className="absolute top-3 right-3 w-5 h-5 bg-[#c2ab85]/40 rounded-full" />
        <div className="absolute bottom-2 left-2 w-4 h-4 bg-[#a89674]/30 rounded-sm" />
        <div className="absolute inset-0 bg-linear-to-tr from-amber-900/5 to-transparent" />
      </div>
    ),
  },
  {
    id: "silver",
    label: "Silver",
    preview: (
      <div className="w-full h-full bg-linear-to-br from-gray-100 to-gray-200 relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-14 h-10 bg-gray-300/50 rounded-tl-3xl" />
        <div className="absolute top-1/3 left-0 w-full h-[2px] bg-gray-400 transform -rotate-12" />
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gray-500 transform rotate-6" />
        <div className="absolute top-0 left-1/3 h-full w-px bg-gray-400" />
        <div className="absolute top-3 left-3 w-6 h-6 bg-gray-300/60 rounded" />
        <div className="absolute bottom-2 right-3 w-3 h-3 bg-gray-400/40 rounded-sm" />
      </div>
    ),
  },
  {
    id: "night",
    label: "Night",
    preview: (
      <div className="w-full h-full bg-linear-to-br from-[#1a1f2e] via-[#242f3e] to-[#2c3e50] relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-16 h-12 bg-[#17263c]/80 rounded-tl-3xl" />
        <div className="absolute top-1/3 left-0 w-full h-[2px] bg-[#746855] transform -rotate-12" />
        <div className="absolute top-1/2 left-0 w-full h-[3px] bg-[#d59563] transform rotate-6" />
        <div className="absolute top-0 left-1/4 h-full w-px bg-[#38414e]" />
        <div className="absolute top-3 right-3 w-4 h-4 bg-[#263c3f]/70 rounded" />
        <div className="absolute bottom-3 left-3 w-3 h-3 bg-[#f3d19c]/20 rounded-full" />
        <div className="absolute top-1/2 left-1/2 w-10 h-10 bg-[#d59563]/10 rounded-full blur-lg" />
      </div>
    ),
  },
  {
    id: "aubergine",
    label: "Aubergine",
    preview: (
      <div className="w-full h-full bg-linear-to-br from-[#1d2c4d] via-[#283d6a] to-[#1a3646] relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-14 h-10 bg-[#0e1626]/80 rounded-tl-3xl" />
        <div className="absolute top-1/3 left-0 w-full h-[2px] bg-[#2c6675] transform -rotate-12" />
        <div className="absolute top-1/2 left-0 w-full h-[3px] bg-[#4b6878] transform rotate-6" />
        <div className="absolute top-0 left-1/3 h-full w-px bg-[#304a7d]" />
        <div className="absolute top-3 left-3 w-5 h-5 bg-[#023e58]/70 rounded" />
        <div className="absolute bottom-2 right-3 w-4 h-4 bg-[#8ec3b9]/30 rounded-sm" />
        <div className="absolute top-1/4 right-1/4 w-12 h-12 bg-[#6f9ba5]/10 rounded-full blur-xl" />
      </div>
    ),
  },
];
