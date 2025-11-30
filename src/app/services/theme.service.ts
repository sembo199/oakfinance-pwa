import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'oak-theme-preference';
  private themeSubject = new BehaviorSubject<ThemeMode>('system');
  private systemThemeMediaQuery: MediaQueryList;

  theme$: Observable<ThemeMode> = this.themeSubject.asObservable();

  constructor() {
    this.systemThemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.initializeTheme();
    this.setupSystemThemeListener();
  }

  /**
   * Initialize theme from localStorage or default to system preference
   */
  private initializeTheme(): void {
    const savedTheme = localStorage.getItem(this.THEME_KEY) as ThemeMode | null;

    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      this.setTheme(savedTheme);
    } else {
      // Default to system theme
      this.setTheme('system');
    }
  }

  /**
   * Listen for system theme changes when using 'system' mode
   */
  private setupSystemThemeListener(): void {
    this.systemThemeMediaQuery.addEventListener('change', (e) => {
      if (this.themeSubject.value === 'system') {
        this.applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  /**
   * Set the theme preference
   */
  setTheme(mode: ThemeMode): void {
    this.themeSubject.next(mode);
    localStorage.setItem(this.THEME_KEY, mode);

    if (mode === 'system') {
      const systemPrefersDark = this.systemThemeMediaQuery.matches;
      this.applyTheme(systemPrefersDark ? 'dark' : 'light');
    } else {
      this.applyTheme(mode);
    }
  }

  /**
   * Apply the theme to the DOM
   */
  private applyTheme(theme: 'light' | 'dark'): void {
    const root = document.documentElement;

    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
    } else {
      root.removeAttribute('data-theme');
      root.classList.remove('light-theme');
      root.classList.add('dark-theme');
    }
  }

  /**
   * Get current theme preference
   */
  getCurrentTheme(): ThemeMode {
    return this.themeSubject.value;
  }

  /**
   * Get the actual applied theme (resolves 'system' to 'light' or 'dark')
   */
  getAppliedTheme(): 'light' | 'dark' {
    const currentTheme = this.themeSubject.value;

    if (currentTheme === 'system') {
      return this.systemThemeMediaQuery.matches ? 'dark' : 'light';
    }

    return currentTheme;
  }

  /**
   * Toggle between light and dark (ignores system mode)
   */
  toggleTheme(): void {
    const currentApplied = this.getAppliedTheme();
    this.setTheme(currentApplied === 'light' ? 'dark' : 'light');
  }
}
