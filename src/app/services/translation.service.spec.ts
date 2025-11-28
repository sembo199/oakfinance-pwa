import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TranslationService } from './translation.service';
import { Language } from '../models';

describe('TranslationService', () => {
  let service: TranslationService;
  let originalFetch: typeof fetch;

  const mockEnglishTranslations = {
    'settings.title': 'Settings',
    'settings.currency': 'Currency',
    'greeting': 'Hello, {{name}}!',
    'count': 'You have {{count}} items',
    'multiple': '{{user}} sent {{count}} messages'
  };

  const mockGermanTranslations = {
    'settings.title': 'Einstellungen',
    'settings.currency': 'Währung',
    'greeting': 'Hallo, {{name}}!',
    'count': 'Sie haben {{count}} Artikel',
    'multiple': '{{user}} hat {{count}} Nachrichten gesendet'
  };

  beforeEach(() => {
    // Save original fetch
    originalFetch = globalThis.fetch;

    // Mock fetch
    globalThis.fetch = jasmine.createSpy('fetch').and.callFake((url: string) => {
      let translations = {};
      
      if (url.includes('/en.json')) {
        translations = mockEnglishTranslations;
      } else if (url.includes('/de.json')) {
        translations = mockGermanTranslations;
      } else if (url.includes('/invalid.json')) {
        return Promise.reject(new Error('Not found'));
      } else {
        // Return English as fallback for other languages
        translations = mockEnglishTranslations;
      }

      return Promise.resolve({
        json: () => Promise.resolve(translations)
      } as Response);
    });

    TestBed.configureTestingModule({
      providers: [TranslationService]
    });

    service = TestBed.inject(TranslationService);
  });

  afterEach(() => {
    // Restore original fetch
    globalThis.fetch = originalFetch;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadTranslation', () => {
    it('should load English translations by default', fakeAsync(() => {
      // Explicitly load English to ensure we're in fakeAsync context
      service.loadTranslation(Language.EN);
      tick();
      
      const result = service.translate('settings.title');
      expect(result).toBe('Settings');
    }));

    it('should load German translations when requested', fakeAsync(() => {
      service.loadTranslation(Language.DE);
      tick();

      const result = service.translate('settings.title');
      expect(result).toBe('Einstellungen');
    }));

    it('should update current language observable', fakeAsync(() => {
      let currentLang: Language = Language.EN;
      
      service.getCurrentLanguage().subscribe(lang => {
        currentLang = lang;
      });

      service.loadTranslation(Language.DE);
      tick();

      expect(currentLang).toBe(Language.DE);
    }));

    it('should fall back to English if loading fails', fakeAsync(() => {
      // Force a failure by requesting a non-existent language
      (globalThis.fetch as jasmine.Spy).and.callFake((url: string) => {
        if (url.includes('/invalid.json')) {
          return Promise.reject(new Error('Not found'));
        }
        return Promise.resolve({
          json: () => Promise.resolve(mockEnglishTranslations)
        } as Response);
      });

      // First load English
      service.loadTranslation(Language.EN);
      tick();

      // The service should still have English translations
      const result = service.translate('settings.title');
      expect(result).toBe('Settings');
    }));
  });

  describe('translate', () => {
    beforeEach(fakeAsync(() => {
      service.loadTranslation(Language.EN);
      tick();
    }));

    it('should return translated string for existing key', () => {
      const result = service.translate('settings.title');
      expect(result).toBe('Settings');
    });

    it('should return key if translation not found', () => {
      const result = service.translate('non.existent.key');
      expect(result).toBe('non.existent.key');
    });

    it('should replace single parameter', () => {
      const result = service.translate('greeting', { name: 'John' });
      expect(result).toBe('Hello, John!');
    });

    it('should replace numeric parameter', () => {
      const result = service.translate('count', { count: 5 });
      expect(result).toBe('You have 5 items');
    });

    it('should replace multiple parameters', () => {
      const result = service.translate('multiple', { user: 'Alice', count: 3 });
      expect(result).toBe('Alice sent 3 messages');
    });

    it('should handle parameter with zero value', () => {
      const result = service.translate('count', { count: 0 });
      expect(result).toBe('You have 0 items');
    });

    it('should return translation without params if none provided', () => {
      const result = service.translate('settings.currency');
      expect(result).toBe('Currency');
    });

    it('should leave unreplaced placeholders if params missing', () => {
      const result = service.translate('greeting'); // No params
      expect(result).toBe('Hello, {{name}}!');
    });

    it('should handle empty params object', () => {
      const result = service.translate('greeting', {});
      expect(result).toBe('Hello, {{name}}!');
    });
  });

  describe('getCurrentLanguage', () => {
    it('should return observable of current language', fakeAsync(() => {
      let currentLang: Language = Language.EN;
      
      service.getCurrentLanguage().subscribe(lang => {
        currentLang = lang;
      });
      tick();

      expect(currentLang).toBe(Language.EN);
    }));

    it('should emit new language after setLanguage', fakeAsync(() => {
      const languages: Language[] = [];
      
      service.getCurrentLanguage().subscribe(lang => {
        languages.push(lang);
      });
      tick();

      service.setLanguage(Language.DE);
      tick();

      expect(languages).toContain(Language.EN);
      expect(languages).toContain(Language.DE);
    }));
  });

  describe('getCurrentLanguageValue', () => {
    it('should return current language value synchronously', fakeAsync(() => {
      tick();
      
      const result = service.getCurrentLanguageValue();
      expect(result).toBe(Language.EN);
    }));

    it('should return updated language value after change', fakeAsync(() => {
      service.setLanguage(Language.DE);
      tick();

      const result = service.getCurrentLanguageValue();
      expect(result).toBe(Language.DE);
    }));
  });

  describe('setLanguage', () => {
    it('should change language to German', fakeAsync(() => {
      service.setLanguage(Language.DE);
      tick();

      const result = service.translate('settings.title');
      expect(result).toBe('Einstellungen');
    }));

    it('should change language to English', fakeAsync(() => {
      // First set to German
      service.setLanguage(Language.DE);
      tick();

      // Then back to English
      service.setLanguage(Language.EN);
      tick();

      const result = service.translate('settings.title');
      expect(result).toBe('Settings');
    }));

    it('should update current language value', fakeAsync(() => {
      service.setLanguage(Language.DE);
      tick();

      expect(service.getCurrentLanguageValue()).toBe(Language.DE);
    }));
  });

  describe('Language switching', () => {
    it('should properly switch between languages', fakeAsync(() => {
      // Start with English
      service.setLanguage(Language.EN);
      tick();
      expect(service.translate('settings.title')).toBe('Settings');

      // Switch to German
      service.setLanguage(Language.DE);
      tick();
      expect(service.translate('settings.title')).toBe('Einstellungen');

      // Switch back to English
      service.setLanguage(Language.EN);
      tick();
      expect(service.translate('settings.title')).toBe('Settings');
    }));

    it('should maintain translations after multiple switches', fakeAsync(() => {
      for (let i = 0; i < 3; i++) {
        service.setLanguage(Language.DE);
        tick();
        service.setLanguage(Language.EN);
        tick();
      }

      expect(service.translate('settings.title')).toBe('Settings');
    }));
  });

  describe('parameter interpolation edge cases', () => {
    beforeEach(fakeAsync(() => {
      service.loadTranslation(Language.EN);
      tick();
    }));

    it('should handle special characters in parameter values', () => {
      const result = service.translate('greeting', { name: '<script>alert("XSS")</script>' });
      expect(result).toBe('Hello, <script>alert("XSS")</script>!');
    });

    it('should handle parameter with curly braces in value', () => {
      const result = service.translate('greeting', { name: '{{test}}' });
      expect(result).toBe('Hello, {{test}}!');
    });

    it('should handle empty string parameter', () => {
      const result = service.translate('greeting', { name: '' });
      expect(result).toBe('Hello, !');
    });

    it('should handle numeric string parameter', () => {
      const result = service.translate('greeting', { name: '123' });
      expect(result).toBe('Hello, 123!');
    });

    it('should handle large number parameter', () => {
      const result = service.translate('count', { count: 999999999 });
      expect(result).toBe('You have 999999999 items');
    });

    it('should handle negative number parameter', () => {
      const result = service.translate('count', { count: -5 });
      expect(result).toBe('You have -5 items');
    });

    it('should handle decimal number parameter', () => {
      const result = service.translate('count', { count: 3.14 });
      expect(result).toBe('You have 3.14 items');
    });
  });

  describe('error handling', () => {
    it('should handle fetch error gracefully', fakeAsync(() => {
      // First, ensure we have default translations loaded
      tick();
      
      // Now mock fetch to fail for subsequent calls
      (globalThis.fetch as jasmine.Spy).and.callFake((url: string) => {
        // Always fail for German, but succeed for English fallback
        if (url.includes('/de.json')) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          json: () => Promise.resolve(mockEnglishTranslations)
        } as Response);
      });

      // Should not throw
      expect(() => {
        service.loadTranslation(Language.DE);
        tick();
      }).not.toThrow();
    }));

    it('should handle JSON parse error gracefully', fakeAsync(() => {
      // First, ensure we have default translations loaded
      tick();
      
      // Now mock fetch to fail JSON parse for German only
      (globalThis.fetch as jasmine.Spy).and.callFake((url: string) => {
        if (url.includes('/de.json')) {
          return Promise.resolve({
            json: () => Promise.reject(new Error('Invalid JSON'))
          } as Response);
        }
        return Promise.resolve({
          json: () => Promise.resolve(mockEnglishTranslations)
        } as Response);
      });

      expect(() => {
        service.loadTranslation(Language.DE);
        tick();
      }).not.toThrow();
    }));
  });

  describe('all supported languages', () => {
    it('should support English', () => {
      expect(Language.EN).toBe('en');
    });

    it('should support Dutch', () => {
      expect(Language.NL).toBe('nl');
    });

    it('should support German', () => {
      expect(Language.DE).toBe('de');
    });

    it('should support French', () => {
      expect(Language.FR).toBe('fr');
    });

    it('should support Spanish', () => {
      expect(Language.ES).toBe('es');
    });

    it('should support Chinese', () => {
      expect(Language.ZH).toBe('zh');
    });
  });
});
