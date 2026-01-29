export type MapTheme =
  | "standard"
  | "dark"
  | "retro"
  | "satellite"
  | "hybrid"
  | "silver"
  | "night"
  | "aubergine";

export interface MapThemeConfig {
  id: MapTheme;
  label: string;
  preview: React.ReactNode;
}
