export const isDarkMode = () => document.documentElement.classList.contains('dark');

/**
 * set theme mode
 * @param mode
 */
export function setMode(mode: 'dark' | 'light') {
  localStorage.setItem('color-theme', mode);
  if (mode == 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

/**
 * get current theme mode
 * @returns dark or light
 */
export const getMode = () => (isDarkMode() ? 'dark' : 'light');

/**
 * enable auto dark mode
 */
export function darkModeAuto() {
  // On page load or when changing themes, best to add inline in `head` to avoid FOUC
  if (
    localStorage.getItem('color-theme') === 'dark' ||
    (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
  ) {
    setMode('dark');
  } else {
    setMode('light');
  }
}

/**
 * toggle dark mode
 * @returns current mode
 */
export function toggleDarkMode() {
  if (isDarkMode()) {
    setMode('light');
    return 'light';
  } else {
    setMode('dark');
    return 'dark';
  }
}
