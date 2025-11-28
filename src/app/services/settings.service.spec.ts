import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SettingsService } from './settings.service';
import { Storage } from '@ionic/storage-angular';
import { AppSettings, Language } from '../models';

describe('SettingsService', () => {
  let service: SettingsService;
  let mockStorage: jasmine.SpyObj<Storage>;
  let storedData: { [key: string]: any };

  const defaultSettings: AppSettings = {
    monthStartDay: 1,
    currency: 'USD',
    currencySymbol: '$',
    language: Language.EN
  };

  beforeEach(() => {
    storedData = {};

    mockStorage = jasmine.createSpyObj('Storage', ['create', 'get', 'set']);
    mockStorage.create.and.returnValue(Promise.resolve({} as any));
    mockStorage.get.and.callFake((key: string) => Promise.resolve(storedData[key]));
    mockStorage.set.and.callFake((key: string, value: any) => {
      storedData[key] = value;
      return Promise.resolve();
    });

    TestBed.configureTestingModule({
      providers: [
        SettingsService,
        { provide: Storage, useValue: mockStorage }
      ]
    });

    service = TestBed.inject(SettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initStorage', () => {
    it('should call storage.create on initialization', fakeAsync(() => {
      tick();
      expect(mockStorage.create).toHaveBeenCalled();
    }));
  });

  describe('get', () => {
    it('should return default settings when none exist in storage', fakeAsync(() => {
      let result: AppSettings | null = null;

      service.get().then(settings => {
        result = settings;
      });
      tick();

      expect(result).not.toBeNull();
      expect(result!.monthStartDay).toBe(1);
      expect(result!.currency).toBe('USD');
      expect(result!.currencySymbol).toBe('$');
      expect(result!.language).toBe(Language.EN);
    }));

    it('should return stored settings merged with defaults', fakeAsync(() => {
      storedData['app_settings'] = {
        monthStartDay: 15,
        currency: 'EUR',
        currencySymbol: '€'
        // language is missing - should be filled from defaults
      };

      let result: AppSettings | null = null;
      service.get().then(settings => {
        result = settings;
      });
      tick();

      expect(result!.monthStartDay).toBe(15);
      expect(result!.currency).toBe('EUR');
      expect(result!.currencySymbol).toBe('€');
      expect(result!.language).toBe(Language.EN); // Default filled in
    }));

    it('should return complete stored settings', fakeAsync(() => {
      storedData['app_settings'] = {
        monthStartDay: 25,
        currency: 'GBP',
        currencySymbol: '£',
        language: Language.DE
      };

      let result: AppSettings | null = null;
      service.get().then(settings => {
        result = settings;
      });
      tick();

      expect(result!.monthStartDay).toBe(25);
      expect(result!.currency).toBe('GBP');
      expect(result!.currencySymbol).toBe('£');
      expect(result!.language).toBe(Language.DE);
    }));
  });

  describe('getMonthStartDay', () => {
    it('should return default month start day (1) when not configured', fakeAsync(() => {
      let result = 0;

      service.getMonthStartDay().then(day => {
        result = day;
      });
      tick();

      expect(result).toBe(1);
    }));

    it('should return configured month start day', fakeAsync(() => {
      storedData['app_settings'] = {
        monthStartDay: 15
      };

      let result = 0;
      service.getMonthStartDay().then(day => {
        result = day;
      });
      tick();

      expect(result).toBe(15);
    }));
  });

  describe('update', () => {
    it('should update single setting', fakeAsync(() => {
      service.update({ monthStartDay: 20 });
      tick();

      const stored = storedData['app_settings'];
      expect(stored.monthStartDay).toBe(20);
    }));

    it('should update multiple settings', fakeAsync(() => {
      service.update({ 
        monthStartDay: 15,
        currency: 'EUR',
        currencySymbol: '€'
      });
      tick();

      const stored = storedData['app_settings'];
      expect(stored.monthStartDay).toBe(15);
      expect(stored.currency).toBe('EUR');
      expect(stored.currencySymbol).toBe('€');
    }));

    it('should preserve existing settings when updating partial', fakeAsync(() => {
      storedData['app_settings'] = {
        monthStartDay: 10,
        currency: 'USD',
        currencySymbol: '$',
        language: Language.EN
      };

      service.update({ monthStartDay: 20 });
      tick();

      const stored = storedData['app_settings'];
      expect(stored.currency).toBe('USD'); // Preserved
      expect(stored.monthStartDay).toBe(20); // Updated
    }));
  });

  describe('setMonthStartDay', () => {
    it('should set valid month start day', fakeAsync(() => {
      service.setMonthStartDay(15);
      tick();

      const stored = storedData['app_settings'];
      expect(stored.monthStartDay).toBe(15);
    }));

    it('should accept day 1 (minimum valid)', fakeAsync(() => {
      service.setMonthStartDay(1);
      tick();

      const stored = storedData['app_settings'];
      expect(stored.monthStartDay).toBe(1);
    }));

    it('should accept day 31 (maximum valid)', fakeAsync(() => {
      service.setMonthStartDay(31);
      tick();

      const stored = storedData['app_settings'];
      expect(stored.monthStartDay).toBe(31);
    }));

    it('should throw error for day 0', fakeAsync(async () => {
      await expectAsync(service.setMonthStartDay(0))
        .toBeRejectedWithError('Month start day must be between 1 and 31');
    }));

    it('should throw error for day 32', fakeAsync(async () => {
      await expectAsync(service.setMonthStartDay(32))
        .toBeRejectedWithError('Month start day must be between 1 and 31');
    }));

    it('should throw error for negative day', fakeAsync(async () => {
      await expectAsync(service.setMonthStartDay(-1))
        .toBeRejectedWithError('Month start day must be between 1 and 31');
    }));
  });

  describe('setCurrency', () => {
    it('should set currency and symbol', fakeAsync(() => {
      service.setCurrency('EUR', '€');
      tick();

      const stored = storedData['app_settings'];
      expect(stored.currency).toBe('EUR');
      expect(stored.currencySymbol).toBe('€');
    }));

    it('should support various currency formats', fakeAsync(() => {
      const currencies = [
        { code: 'USD', symbol: '$' },
        { code: 'GBP', symbol: '£' },
        { code: 'JPY', symbol: '¥' },
        { code: 'CHF', symbol: 'CHF' }
      ];

      for (const currency of currencies) {
        service.setCurrency(currency.code, currency.symbol);
        tick();

        const stored = storedData['app_settings'];
        expect(stored.currency).toBe(currency.code);
        expect(stored.currencySymbol).toBe(currency.symbol);
      }
    }));
  });

  describe('setLanguage', () => {
    it('should set language to English', fakeAsync(() => {
      service.setLanguage(Language.EN);
      tick();

      const stored = storedData['app_settings'];
      expect(stored.language).toBe(Language.EN);
    }));

    it('should set language to Dutch', fakeAsync(() => {
      service.setLanguage(Language.NL);
      tick();

      const stored = storedData['app_settings'];
      expect(stored.language).toBe(Language.NL);
    }));

    it('should set language to German', fakeAsync(() => {
      service.setLanguage(Language.DE);
      tick();

      const stored = storedData['app_settings'];
      expect(stored.language).toBe(Language.DE);
    }));

    it('should set language to French', fakeAsync(() => {
      service.setLanguage(Language.FR);
      tick();

      const stored = storedData['app_settings'];
      expect(stored.language).toBe(Language.FR);
    }));

    it('should set language to Spanish', fakeAsync(() => {
      service.setLanguage(Language.ES);
      tick();

      const stored = storedData['app_settings'];
      expect(stored.language).toBe(Language.ES);
    }));

    it('should set language to Chinese', fakeAsync(() => {
      service.setLanguage(Language.ZH);
      tick();

      const stored = storedData['app_settings'];
      expect(stored.language).toBe(Language.ZH);
    }));
  });

  describe('getSettings observable', () => {
    it('should return observable of settings', fakeAsync(() => {
      const settings$ = service.getSettings();
      let receivedSettings: AppSettings | null = null;

      settings$.subscribe(settings => {
        receivedSettings = settings;
      });
      tick();

      expect(receivedSettings).not.toBeNull();
    }));

    it('should emit default settings initially', fakeAsync(() => {
      const settings$ = service.getSettings();
      let receivedSettings: AppSettings | null = null;

      settings$.subscribe(settings => {
        receivedSettings = settings;
      });
      tick();

      expect(receivedSettings!.monthStartDay).toBe(1);
      expect(receivedSettings!.currency).toBe('USD');
    }));

    it('should emit updated settings after update', fakeAsync(() => {
      const settings$ = service.getSettings();
      let receivedSettings: AppSettings | null = null;

      settings$.subscribe(settings => {
        receivedSettings = settings;
      });
      tick();

      service.update({ monthStartDay: 25 });
      tick();

      expect(receivedSettings!.monthStartDay).toBe(25);
    }));

    it('should emit updated settings after setMonthStartDay', fakeAsync(() => {
      const settings$ = service.getSettings();
      let receivedSettings: AppSettings | null = null;

      settings$.subscribe(settings => {
        receivedSettings = settings;
      });
      tick();

      service.setMonthStartDay(15);
      tick();

      expect(receivedSettings!.monthStartDay).toBe(15);
    }));

    it('should emit updated settings after setCurrency', fakeAsync(() => {
      const settings$ = service.getSettings();
      let receivedSettings: AppSettings | null = null;

      settings$.subscribe(settings => {
        receivedSettings = settings;
      });
      tick();

      service.setCurrency('GBP', '£');
      tick();

      expect(receivedSettings!.currency).toBe('GBP');
      expect(receivedSettings!.currencySymbol).toBe('£');
    }));

    it('should emit updated settings after setLanguage', fakeAsync(() => {
      const settings$ = service.getSettings();
      let receivedSettings: AppSettings | null = null;

      settings$.subscribe(settings => {
        receivedSettings = settings;
      });
      tick();

      service.setLanguage(Language.DE);
      tick();

      expect(receivedSettings!.language).toBe(Language.DE);
    }));
  });

  describe('persistence', () => {
    it('should persist settings to storage', fakeAsync(() => {
      service.update({ monthStartDay: 10 });
      tick();

      expect(mockStorage.set).toHaveBeenCalledWith('app_settings', jasmine.any(Object));
    }));

    it('should load settings from storage on get', fakeAsync(() => {
      storedData['app_settings'] = {
        monthStartDay: 20,
        currency: 'EUR',
        currencySymbol: '€',
        language: Language.FR
      };

      let result: AppSettings | null = null;
      service.get().then(settings => {
        result = settings;
      });
      tick();

      expect(result!.monthStartDay).toBe(20);
      expect(result!.language).toBe(Language.FR);
    }));
  });

  describe('Language enum', () => {
    it('should have correct enum values', () => {
      expect(Language.EN).toBe('en');
      expect(Language.NL).toBe('nl');
      expect(Language.DE).toBe('de');
      expect(Language.FR).toBe('fr');
      expect(Language.ES).toBe('es');
      expect(Language.ZH).toBe('zh');
    });
  });

  describe('edge cases', () => {
    it('should handle empty storage gracefully', fakeAsync(() => {
      storedData['app_settings'] = {};

      let result: AppSettings | null = null;
      service.get().then(settings => {
        result = settings;
      });
      tick();

      // Should fall back to defaults
      expect(result!.monthStartDay).toBe(1);
      expect(result!.currency).toBe('USD');
    }));

    it('should handle undefined storage gracefully', fakeAsync(() => {
      delete storedData['app_settings'];

      let result: AppSettings | null = null;
      service.get().then(settings => {
        result = settings;
      });
      tick();

      expect(result!.monthStartDay).toBe(1);
      expect(result!.currency).toBe('USD');
    }));

    it('should handle multiple rapid updates', fakeAsync(() => {
      service.setMonthStartDay(5);
      tick();
      service.setMonthStartDay(10);
      tick();
      service.setMonthStartDay(15);
      tick();

      let result = 0;
      service.getMonthStartDay().then(day => {
        result = day;
      });
      tick();

      expect(result).toBe(15);
    }));
  });
});
