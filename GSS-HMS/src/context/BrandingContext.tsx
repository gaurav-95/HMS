import { createContext, useContext, useState, useEffect, useCallback } from "react";

// ─── Palette Definitions ────────────────────────────────────
export interface Palette {
  key: string;
  label: string;
  light: string;   // --color-primary in light mode
  dark: string;    // --color-primary in dark mode
  fg: string;      // --color-primary-foreground
  ring: string;    // --color-ring
}

export const PALETTES: Palette[] = [
  { key: "teal",   label: "Teal",   light: "#0f766e", dark: "#14b8a6", fg: "#f0fdfa", ring: "#0f766e" },
  { key: "blue",   label: "Blue",   light: "#1d4ed8", dark: "#3b82f6", fg: "#eff6ff", ring: "#1d4ed8" },
  { key: "purple", label: "Purple", light: "#7c3aed", dark: "#a78bfa", fg: "#f5f3ff", ring: "#7c3aed" },
  { key: "rose",   label: "Rose",   light: "#e11d48", dark: "#fb7185", fg: "#fff1f2", ring: "#e11d48" },
  { key: "amber",  label: "Amber",  light: "#b45309", dark: "#fbbf24", fg: "#fffbeb", ring: "#b45309" },
  { key: "slate",  label: "Slate",  light: "#475569", dark: "#94a3b8", fg: "#f8fafc", ring: "#475569" },
];

const DEFAULT_PALETTE = "teal";

// ─── Context Types ───────────────────────────────────────────
interface BrandingState {
  logoDataUrl: string | null;
  paletteKey: string;
  setLogo: (dataUrl: string | null) => void;
  setPalette: (key: string) => void;
}

const BrandingContext = createContext<BrandingState>({
  logoDataUrl: null,
  paletteKey: DEFAULT_PALETTE,
  setLogo: () => {},
  setPalette: () => {},
});

// ─── Apply palette CSS vars to :root ─────────────────────────
function applyPalette(key: string) {
  const palette = PALETTES.find((p) => p.key === key) ?? PALETTES[0];
  const root = document.documentElement;
  const isDark = root.classList.contains("dark");

  const primary = isDark ? palette.dark : palette.light;
  root.style.setProperty("--color-primary", primary);
  root.style.setProperty("--color-primary-foreground", palette.fg);
  root.style.setProperty("--color-ring", isDark ? palette.dark : palette.ring);
}

// ─── Provider ────────────────────────────────────────────────
export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(() =>
    localStorage.getItem("branding-logo") || null
  );
  const [paletteKey, setPaletteKey] = useState<string>(() =>
    localStorage.getItem("branding-palette") || DEFAULT_PALETTE
  );

  // Apply palette on mount and whenever theme class changes
  useEffect(() => {
    applyPalette(paletteKey);

    // Re-apply when dark/light class toggles (theme change)
    const observer = new MutationObserver(() => applyPalette(paletteKey));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [paletteKey]);

  const setLogo = useCallback((dataUrl: string | null) => {
    setLogoDataUrl(dataUrl);
    if (dataUrl) {
      localStorage.setItem("branding-logo", dataUrl);
    } else {
      localStorage.removeItem("branding-logo");
    }
  }, []);

  const setPalette = useCallback((key: string) => {
    setPaletteKey(key);
    localStorage.setItem("branding-palette", key);
    applyPalette(key);
  }, []);

  return (
    <BrandingContext.Provider value={{ logoDataUrl, paletteKey, setLogo, setPalette }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}
