/**
 * Cooking Loader Service
 * Orchestrates fullscreen culinary cooking animation overlay and synchronizes
 * its 16 dynamic themes with the application theme palette.
 */

export interface CookingThemeColors {
  steamColor: string;
  steamColorMid: string;
  lidGradientStart: string;
  lidGradientEnd: string;
  lidKnobColor: string;
  potGradientStart: string;
  potGradientEnd: string;
  potBorderColor: string;
  handleLeftBg: string;
  handleLeftBorder: string;
  handleRightBg: string;
  handleRightBorder: string;
  shineColor: string;
  bubbleColor: string;
  flameGradientStart: string;
  flameGradientEnd: string;
}

export interface CookingTheme {
  id: string;
  name: string;
  icon: string;
  colors: CookingThemeColors;
}

export const COOKING_THEMES: Record<string, CookingTheme> = {
  original: {
    id: 'original',
    name: 'Original',
    icon: '🍳',
    colors: {
      steamColor: 'rgba(156, 163, 175, 0.4)',
      steamColorMid: 'rgba(156, 163, 175, 0.45)',
      lidGradientStart: 'rgb(29, 163, 200)',
      lidGradientEnd: 'rgb(116, 167, 168)',
      lidKnobColor: '#E76F51',
      potGradientStart: 'rgb(176, 154, 62)',
      potGradientEnd: 'rgba(37, 114, 102, 0.8)',
      potBorderColor: 'rgba(231, 111, 81, 0.4)',
      handleLeftBg: 'rgba(52, 165, 135, 0.9)',
      handleLeftBorder: 'rgba(17, 94, 101, 0.6)',
      handleRightBg: 'rgba(50, 166, 182, 0.9)',
      handleRightBorder: 'rgba(64, 114, 145, 0.6)',
      shineColor: 'rgba(255, 255, 255, 0.51)',
      bubbleColor: 'rgba(19, 247, 228, 0.66)',
      flameGradientStart: '#FF9F1C',
      flameGradientEnd: '#E71D36'
    }
  },
  copper: {
    id: 'copper',
    name: 'Copper',
    icon: '🥘',
    colors: {
      steamColor: 'rgba(139, 90, 43, 0.3)',
      steamColorMid: 'rgba(139, 90, 43, 0.4)',
      lidGradientStart: '#B87333',
      lidGradientEnd: '#8B4513',
      lidKnobColor: '#2C1810',
      potGradientStart: '#CD7F32',
      potGradientEnd: '#8B4513',
      potBorderColor: 'rgba(139, 69, 19, 0.6)',
      handleLeftBg: '#A0522D',
      handleLeftBorder: '#6B3E26',
      handleRightBg: '#A0522D',
      handleRightBorder: '#6B3E26',
      shineColor: 'rgba(255, 215, 180, 0.6)',
      bubbleColor: 'rgba(255, 200, 150, 0.7)',
      flameGradientStart: '#FF6B35',
      flameGradientEnd: '#F7931E'
    }
  },
  castIron: {
    id: 'castIron',
    name: 'Cast Iron',
    icon: '🍲',
    colors: {
      steamColor: 'rgba(200, 200, 200, 0.4)',
      steamColorMid: 'rgba(220, 220, 220, 0.5)',
      lidGradientStart: '#4A4A4A',
      lidGradientEnd: '#2D2D2D',
      lidKnobColor: '#1A1A1A',
      potGradientStart: '#3D3D3D',
      potGradientEnd: '#1F1F1F',
      potBorderColor: 'rgba(80, 80, 80, 0.5)',
      handleLeftBg: '#2A2A2A',
      handleLeftBorder: '#1A1A1A',
      handleRightBg: '#2A2A2A',
      handleRightBorder: '#1A1A1A',
      shineColor: 'rgba(255, 255, 255, 0.2)',
      bubbleColor: 'rgba(255, 140, 0, 0.6)',
      flameGradientStart: '#FF4500',
      flameGradientEnd: '#FF8C00'
    }
  },
  italian: {
    id: 'italian',
    name: 'Italian',
    icon: '🍅',
    colors: {
      steamColor: 'rgba(255, 200, 200, 0.4)',
      steamColorMid: 'rgba(255, 180, 180, 0.5)',
      lidGradientStart: '#C41E3A',
      lidGradientEnd: '#8B0000',
      lidKnobColor: '#228B22',
      potGradientStart: '#DC143C',
      potGradientEnd: '#8B0000',
      potBorderColor: 'rgba(139, 0, 0, 0.5)',
      handleLeftBg: '#A52A2A',
      handleLeftBorder: '#6B1C1C',
      handleRightBg: '#A52A2A',
      handleRightBorder: '#6B1C1C',
      shineColor: 'rgba(255, 200, 200, 0.5)',
      bubbleColor: 'rgba(255, 99, 71, 0.7)',
      flameGradientStart: '#FFD700',
      flameGradientEnd: '#FF6347'
    }
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean',
    icon: '🌊',
    colors: {
      steamColor: 'rgba(173, 216, 230, 0.4)',
      steamColorMid: 'rgba(135, 206, 235, 0.5)',
      lidGradientStart: '#4682B4',
      lidGradientEnd: '#1E3A5F',
      lidKnobColor: '#FF6B6B',
      potGradientStart: '#2E86AB',
      potGradientEnd: '#1A4B6E',
      potBorderColor: 'rgba(30, 58, 95, 0.5)',
      handleLeftBg: '#3A7CA5',
      handleLeftBorder: '#1E4D6B',
      handleRightBg: '#3A7CA5',
      handleRightBorder: '#1E4D6B',
      shineColor: 'rgba(173, 216, 230, 0.6)',
      bubbleColor: 'rgba(64, 224, 208, 0.7)',
      flameGradientStart: '#00CED1',
      flameGradientEnd: '#4169E1'
    }
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    icon: '🌿',
    colors: {
      steamColor: 'rgba(144, 238, 144, 0.3)',
      steamColorMid: 'rgba(144, 238, 144, 0.4)',
      lidGradientStart: '#2E8B57',
      lidGradientEnd: '#1B4D3E',
      lidKnobColor: '#8B4513',
      potGradientStart: '#3CB371',
      potGradientEnd: '#1B5E20',
      potBorderColor: 'rgba(27, 77, 62, 0.5)',
      handleLeftBg: '#228B22',
      handleLeftBorder: '#14532D',
      handleRightBg: '#228B22',
      handleRightBorder: '#14532D',
      shineColor: 'rgba(200, 255, 200, 0.5)',
      bubbleColor: 'rgba(124, 252, 0, 0.6)',
      flameGradientStart: '#ADFF2F',
      flameGradientEnd: '#32CD32'
    }
  },
  pastelPink: {
    id: 'pastelPink',
    name: 'Pastel Pink',
    icon: '🌸',
    colors: {
      steamColor: 'rgba(255, 182, 193, 0.4)',
      steamColorMid: 'rgba(255, 192, 203, 0.5)',
      lidGradientStart: '#FFB6C1',
      lidGradientEnd: '#FF69B4',
      lidKnobColor: '#FF1493',
      potGradientStart: '#FFC0CB',
      potGradientEnd: '#DB7093',
      potBorderColor: 'rgba(255, 105, 180, 0.4)',
      handleLeftBg: '#FFB6C1',
      handleLeftBorder: '#FF69B4',
      handleRightBg: '#FFB6C1',
      handleRightBorder: '#FF69B4',
      shineColor: 'rgba(255, 240, 245, 0.7)',
      bubbleColor: 'rgba(255, 182, 193, 0.7)',
      flameGradientStart: '#FFD1DC',
      flameGradientEnd: '#FF69B4'
    }
  },
  galaxy: {
    id: 'galaxy',
    name: 'Galaxy',
    icon: '🔮',
    colors: {
      steamColor: 'rgba(186, 85, 211, 0.3)',
      steamColorMid: 'rgba(147, 112, 219, 0.4)',
      lidGradientStart: '#8B5CF6',
      lidGradientEnd: '#5B21B6',
      lidKnobColor: '#F472B6',
      potGradientStart: '#7C3AED',
      potGradientEnd: '#4C1D95',
      potBorderColor: 'rgba(139, 92, 246, 0.4)',
      handleLeftBg: '#A78BFA',
      handleLeftBorder: '#6D28D9',
      handleRightBg: '#A78BFA',
      handleRightBorder: '#6D28D9',
      shineColor: 'rgba(216, 180, 254, 0.5)',
      bubbleColor: 'rgba(192, 132, 252, 0.7)',
      flameGradientStart: '#E879F9',
      flameGradientEnd: '#A855F7'
    }
  },
  sunny: {
    id: 'sunny',
    name: 'Sunny',
    icon: '☀️',
    colors: {
      steamColor: 'rgba(255, 255, 200, 0.4)',
      steamColorMid: 'rgba(255, 255, 150, 0.5)',
      lidGradientStart: '#FFD700',
      lidGradientEnd: '#DAA520',
      lidKnobColor: '#FF6347',
      potGradientStart: '#FFC107',
      potGradientEnd: '#FF8F00',
      potBorderColor: 'rgba(218, 165, 32, 0.5)',
      handleLeftBg: '#FFB300',
      handleLeftBorder: '#E65100',
      handleRightBg: '#FFB300',
      handleRightBorder: '#E65100',
      shineColor: 'rgba(255, 255, 224, 0.7)',
      bubbleColor: 'rgba(255, 223, 0, 0.7)',
      flameGradientStart: '#FFEB3B',
      flameGradientEnd: '#FF5722'
    }
  },
  darkMode: {
    id: 'darkMode',
    name: 'Dark Mode',
    icon: '🌙',
    colors: {
      steamColor: 'rgba(100, 100, 120, 0.4)',
      steamColorMid: 'rgba(120, 120, 140, 0.5)',
      lidGradientStart: '#374151',
      lidGradientEnd: '#1F2937',
      lidKnobColor: '#60A5FA',
      potGradientStart: '#4B5563',
      potGradientEnd: '#1F2937',
      potBorderColor: 'rgba(75, 85, 99, 0.5)',
      handleLeftBg: '#6B7280',
      handleLeftBorder: '#374151',
      handleRightBg: '#6B7280',
      handleRightBorder: '#374151',
      shineColor: 'rgba(156, 163, 175, 0.3)',
      bubbleColor: 'rgba(96, 165, 250, 0.6)',
      flameGradientStart: '#F59E0B',
      flameGradientEnd: '#EF4444'
    }
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    icon: '🌅',
    colors: {
      steamColor: 'rgba(255, 150, 150, 0.3)',
      steamColorMid: 'rgba(255, 180, 150, 0.4)',
      lidGradientStart: '#F97316',
      lidGradientEnd: '#DC2626',
      lidKnobColor: '#7C3AED',
      potGradientStart: '#FB923C',
      potGradientEnd: '#E11D48',
      potBorderColor: 'rgba(249, 115, 22, 0.4)',
      handleLeftBg: '#FBBF24',
      handleLeftBorder: '#F59E0B',
      handleRightBg: '#F472B6',
      handleRightBorder: '#EC4899',
      shineColor: 'rgba(254, 215, 170, 0.6)',
      bubbleColor: 'rgba(251, 146, 60, 0.7)',
      flameGradientStart: '#FCD34D',
      flameGradientEnd: '#F87171'
    }
  },
  citrus: {
    id: 'citrus',
    name: 'Citrus',
    icon: '🍊',
    colors: {
      steamColor: 'rgba(255, 200, 150, 0.4)',
      steamColorMid: 'rgba(255, 180, 120, 0.5)',
      lidGradientStart: '#FF8C00',
      lidGradientEnd: '#D2691E',
      lidKnobColor: '#228B22',
      potGradientStart: '#FF7F50',
      potGradientEnd: '#CD5C5C',
      potBorderColor: 'rgba(255, 140, 0, 0.5)',
      handleLeftBg: '#FFA07A',
      handleLeftBorder: '#E9967A',
      handleRightBg: '#FFA07A',
      handleRightBorder: '#E9967A',
      shineColor: 'rgba(255, 228, 196, 0.6)',
      bubbleColor: 'rgba(255, 165, 0, 0.7)',
      flameGradientStart: '#FFD700',
      flameGradientEnd: '#FF4500'
    }
  },
  mint: {
    id: 'mint',
    name: 'Mint Choco',
    icon: '🍦',
    colors: {
      steamColor: 'rgba(152, 255, 200, 0.3)',
      steamColorMid: 'rgba(152, 255, 200, 0.4)',
      lidGradientStart: '#3EB489',
      lidGradientEnd: '#2E8B6E',
      lidKnobColor: '#5D3A1A',
      potGradientStart: '#4ECCA3',
      potGradientEnd: '#1A3C34',
      potBorderColor: 'rgba(62, 180, 137, 0.4)',
      handleLeftBg: '#5D3A1A',
      handleLeftBorder: '#3D2512',
      handleRightBg: '#5D3A1A',
      handleRightBorder: '#3D2512',
      shineColor: 'rgba(200, 255, 230, 0.5)',
      bubbleColor: 'rgba(78, 204, 163, 0.7)',
      flameGradientStart: '#98FF98',
      flameGradientEnd: '#3EB489'
    }
  },
  icy: {
    id: 'icy',
    name: 'Icy Blue',
    icon: '🧊',
    colors: {
      steamColor: 'rgba(200, 230, 255, 0.5)',
      steamColorMid: 'rgba(180, 220, 255, 0.6)',
      lidGradientStart: '#93C5FD',
      lidGradientEnd: '#3B82F6',
      lidKnobColor: '#1E3A8A',
      potGradientStart: '#60A5FA',
      potGradientEnd: '#1D4ED8',
      potBorderColor: 'rgba(59, 130, 246, 0.4)',
      handleLeftBg: '#BFDBFE',
      handleLeftBorder: '#60A5FA',
      handleRightBg: '#BFDBFE',
      handleRightBorder: '#60A5FA',
      shineColor: 'rgba(224, 242, 254, 0.7)',
      bubbleColor: 'rgba(147, 197, 253, 0.7)',
      flameGradientStart: '#7DD3FC',
      flameGradientEnd: '#0EA5E9'
    }
  },
  avocado: {
    id: 'avocado',
    name: 'Avocado',
    icon: '🥑',
    colors: {
      steamColor: 'rgba(200, 220, 180, 0.4)',
      steamColorMid: 'rgba(180, 210, 160, 0.5)',
      lidGradientStart: '#84CC16',
      lidGradientEnd: '#4D7C0F',
      lidKnobColor: '#92400E',
      potGradientStart: '#A3E635',
      potGradientEnd: '#3F6212',
      potBorderColor: 'rgba(132, 204, 22, 0.4)',
      handleLeftBg: '#D97706',
      handleLeftBorder: '#92400E',
      handleRightBg: '#D97706',
      handleRightBorder: '#92400E',
      shineColor: 'rgba(217, 249, 157, 0.6)',
      bubbleColor: 'rgba(190, 242, 100, 0.7)',
      flameGradientStart: '#FDE047',
      flameGradientEnd: '#FACC15'
    }
  },
  royal: {
    id: 'royal',
    name: 'Royal',
    icon: '👑',
    colors: {
      steamColor: 'rgba(255, 215, 0, 0.3)',
      steamColorMid: 'rgba(255, 223, 0, 0.4)',
      lidGradientStart: '#1e3c72',
      lidGradientEnd: '#2a5298',
      lidKnobColor: '#FFD700',
      potGradientStart: '#1e3c72',
      potGradientEnd: '#16222A',
      potBorderColor: 'rgba(255, 215, 0, 0.6)',
      handleLeftBg: '#FFD700',
      handleLeftBorder: '#B8860B',
      handleRightBg: '#FFD700',
      handleRightBorder: '#B8860B',
      shineColor: 'rgba(255, 255, 255, 0.4)',
      bubbleColor: 'rgba(255, 215, 0, 0.8)',
      flameGradientStart: '#00C6FF',
      flameGradientEnd: '#0072FF'
    }
  }
};

/**
 * Mapping between application themes and Cooking Loader themes:
 * - 'dark' (Tema Negro) -> 'galaxy'
 * - 'light' (Tema Blanco) -> 'copper'
 * - 'food' (Cocina / Comida) -> 'ocean'
 * - 'retro' (Retro) -> 'sunset'
 * - 'pastel' (Pastel) -> 'pastelPink'
 */
export const APP_THEME_TO_COOKING_THEME: Record<string, string> = {
  dark: 'galaxy',
  light: 'copper',
  food: 'ocean',
  retro: 'sunset',
  pastel: 'pastelPink'
};

let activeCookingThemeId: string = 'galaxy';

/**
 * Applies CSS custom properties for the selected cooking theme.
 */
export function applyCookingTheme(themeId: string): void {
  const theme = COOKING_THEMES[themeId] || COOKING_THEMES.original;
  if (!theme) return;
  activeCookingThemeId = theme.id;

  const root = document.documentElement;
  const colors = theme.colors;

  root.style.setProperty('--steam-color', colors.steamColor);
  root.style.setProperty('--steam-color-mid', colors.steamColorMid);
  root.style.setProperty('--lid-gradient-start', colors.lidGradientStart);
  root.style.setProperty('--lid-gradient-end', colors.lidGradientEnd);
  root.style.setProperty('--lid-knob-color', colors.lidKnobColor);
  root.style.setProperty('--pot-gradient-start', colors.potGradientStart);
  root.style.setProperty('--pot-gradient-end', colors.potGradientEnd);
  root.style.setProperty('--pot-border-color', colors.potBorderColor);
  root.style.setProperty('--handle-left-bg', colors.handleLeftBg);
  root.style.setProperty('--handle-left-border', colors.handleLeftBorder);
  root.style.setProperty('--handle-right-bg', colors.handleRightBg);
  root.style.setProperty('--handle-right-border', colors.handleRightBorder);
  root.style.setProperty('--shine-color', colors.shineColor);
  root.style.setProperty('--bubble-color', colors.bubbleColor);
  root.style.setProperty('--flame-gradient-start', colors.flameGradientStart);
  root.style.setProperty('--flame-gradient-end', colors.flameGradientEnd);
}

/**
 * Automatically syncs the cooking theme whenever the web application theme changes.
 */
export function syncCookingLoaderWithAppTheme(appTheme: string): void {
  const targetCookingTheme = APP_THEME_TO_COOKING_THEME[appTheme] || 'galaxy';
  applyCookingTheme(targetCookingTheme);
}

/**
 * Displays the fullscreen Cooking Loader in the center of the screen.
 */
export function showCookingLoader(message: string = 'Cocinando tu pedido...'): void {
  const overlay = document.getElementById('cooking-loader-overlay');
  const textEl = document.getElementById('cooking-loader-text');
  if (textEl) {
    textEl.innerText = message;
  }
  if (overlay) {
    overlay.style.display = 'flex';
  }
}

/**
 * Hides the fullscreen Cooking Loader.
 */
export function hideCookingLoader(): void {
  const overlay = document.getElementById('cooking-loader-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

export function getActiveCookingThemeId(): string {
  return activeCookingThemeId;
}
