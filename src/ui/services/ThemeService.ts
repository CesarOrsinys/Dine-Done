/**
 * Theme Service
 * Manages Dark / Light luxury themes and local storage persistence.
 */

let currentTheme: string = (typeof localStorage !== 'undefined') ? localStorage.getItem('DND_THEME') || 'dark' : 'dark';

export function applyTheme(theme: string) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('DND_THEME', theme);
  }
  const themeSelector = document.getElementById('theme-selector') as HTMLSelectElement;
  if (themeSelector && themeSelector.value !== theme) {
    themeSelector.value = theme;
  }
}

export function setupThemeSelector() {
  applyTheme(currentTheme);
  const themeSelector = document.getElementById('theme-selector') as HTMLSelectElement;
  if (themeSelector) {
    themeSelector.value = currentTheme;
    themeSelector.addEventListener('change', () => {
      applyTheme(themeSelector.value);
    });
  }
}

export function getCurrentTheme(): string {
  return currentTheme;
}
