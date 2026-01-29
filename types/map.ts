export type MapTheme =
  | "standard"
  | "dark"
  | "retro"
  | "satellite"
  | "hybrid"
  | "silver"
  | "aubergine";

export interface MapThemeConfig {
  id: MapTheme;
  label: string;
  preview: React.ReactNode;
}
