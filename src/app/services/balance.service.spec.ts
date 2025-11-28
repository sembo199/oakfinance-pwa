import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BalanceService } from './balance.service';
import { DatePeriodService } from './date-period.service';
import { Storage } from '@ionic/storage-angular';
import { PeriodBalance, MonthPeriod } from '../models';

describe('BalanceService', () => {
  let service: BalanceService;
  let mockStorage: jasmine.SpyObj<Storage>;
  let mockDatePeriodService: jasmine.SpyObj<DatePeriodService>;
  let storedData: { [key: string]: any };

  const testPeriod: MonthPeriod = {
    periodStart: new Date(2024, 0, 1),
    periodEnd: new Date(2024, 0, 31, 23, 59, 59, 999),
    displayLabel: 'Jan 1 - Jan 31, 2024'
  };

  const testPeriod2: MonthPeriod = {
    periodStart: new Date(2024, 1, 1),
    periodEnd: new Date(2024, 1, 29, 23, 59, 59, 999),
    displayLabel: 'Feb 1 - Feb 29, 2024'
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

    mockDatePeriodService = jasmine.createSpyObj('DatePeriodService', ['getPeriodKey']);
    mockDatePeriodService.getPeriodKey.and.callFake((period: MonthPeriod) => {
      return period.periodStart.toISOString().split('T')[0];
    });

    TestBed.configureTestingModule({
      providers: [
        BalanceService,
        { provide: Storage, useValue: mockStorage },
        { provide: DatePeriodService, useValue: mockDatePeriodService }
      ]
    });

    service = TestBed.inject(BalanceService);
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

  describe('getAll', () => {
    it('should return empty array when no balances exist', fakeAsync(() => {
      let result: PeriodBalance[] = [];

      service.getAll().then(balances => {
        result = balances;
      });
      tick();

      expect(result).toEqual([]);
    }));

    it('should return stored balances', fakeAsync(() => {
      storedData['period_balances'] = [
        { periodKey: '2024-01-01', currentAccountBalance: 1000 },
        { periodKey: '2024-02-01', currentAccountBalance: 2000 }
      ];

      let result: PeriodBalance[] = [];
      service.getAll().then(balances => {
        result = balances;
      });
      tick();

      expect(result.length).toBe(2);
      expect(result[0].periodKey).toBe('2024-01-01');
      expect(result[0].currentAccountBalance).toBe(1000);
    }));
  });

  describe('getBalanceForPeriod', () => {
    it('should return 0 when no balance exists for period', fakeAsync(() => {
      storedData['period_balances'] = [];

      let result = 0;
      service.getBalanceForPeriod(testPeriod).then(balance => {
        result = balance;
      });
      tick();

      expect(result).toBe(0);
    }));

    it('should return stored balance for period', fakeAsync(() => {
      storedData['period_balances'] = [
        { periodKey: '2024-01-01', currentAccountBalance: 1500 }
      ];

      let result = 0;
      service.getBalanceForPeriod(testPeriod).then(balance => {
        result = balance;
      });
      tick();

      expect(result).toBe(1500);
    }));

    it('should return correct balance when multiple periods exist', fakeAsync(() => {
      storedData['period_balances'] = [
        { periodKey: '2024-01-01', currentAccountBalance: 1000 },
        { periodKey: '2024-02-01', currentAccountBalance: 2000 }
      ];

      let result = 0;
      service.getBalanceForPeriod(testPeriod2).then(balance => {
        result = balance;
      });
      tick();

      expect(result).toBe(2000);
    }));

    it('should handle negative balances', fakeAsync(() => {
      storedData['period_balances'] = [
        { periodKey: '2024-01-01', currentAccountBalance: -500 }
      ];

      let result = 0;
      service.getBalanceForPeriod(testPeriod).then(balance => {
        result = balance;
      });
      tick();

      expect(result).toBe(-500);
    }));

    it('should handle decimal balances', fakeAsync(() => {
      storedData['period_balances'] = [
        { periodKey: '2024-01-01', currentAccountBalance: 1234.56 }
      ];

      let result = 0;
      service.getBalanceForPeriod(testPeriod).then(balance => {
        result = balance;
      });
      tick();

      expect(result).toBe(1234.56);
    }));
  });

  describe('setBalanceForPeriod', () => {
    it('should create new balance entry when none exists', fakeAsync(() => {
      service.setBalanceForPeriod(testPeriod, 1000);
      tick();

      const stored = storedData['period_balances'];
      expect(stored.length).toBe(1);
      expect(stored[0].periodKey).toBe('2024-01-01');
      expect(stored[0].currentAccountBalance).toBe(1000);
    }));

    it('should update existing balance entry', fakeAsync(() => {
      storedData['period_balances'] = [
        { periodKey: '2024-01-01', currentAccountBalance: 500 }
      ];

      service.setBalanceForPeriod(testPeriod, 1500);
      tick();

      const stored = storedData['period_balances'];
      expect(stored.length).toBe(1);
      expect(stored[0].currentAccountBalance).toBe(1500);
    }));

    it('should not affect other period balances', fakeAsync(() => {
      storedData['period_balances'] = [
        { periodKey: '2024-01-01', currentAccountBalance: 1000 },
        { periodKey: '2024-02-01', currentAccountBalance: 2000 }
      ];

      service.setBalanceForPeriod(testPeriod, 1500);
      tick();

      const stored = storedData['period_balances'];
      expect(stored.find((b: PeriodBalance) => b.periodKey === '2024-02-01')?.currentAccountBalance).toBe(2000);
    }));

    it('should add new period when updating non-existing period', fakeAsync(() => {
      storedData['period_balances'] = [
        { periodKey: '2024-01-01', currentAccountBalance: 1000 }
      ];

      service.setBalanceForPeriod(testPeriod2, 2000);
      tick();

      const stored = storedData['period_balances'];
      expect(stored.length).toBe(2);
    }));

    it('should handle setting balance to zero', fakeAsync(() => {
      storedData['period_balances'] = [
        { periodKey: '2024-01-01', currentAccountBalance: 1000 }
      ];

      service.setBalanceForPeriod(testPeriod, 0);
      tick();

      const stored = storedData['period_balances'];
      expect(stored[0].currentAccountBalance).toBe(0);
    }));

    it('should handle setting negative balance', fakeAsync(() => {
      service.setBalanceForPeriod(testPeriod, -500);
      tick();

      const stored = storedData['period_balances'];
      expect(stored[0].currentAccountBalance).toBe(-500);
    }));

    it('should handle setting large balance values', fakeAsync(() => {
      const largeBalance = 999999999.99;
      service.setBalanceForPeriod(testPeriod, largeBalance);
      tick();

      const stored = storedData['period_balances'];
      expect(stored[0].currentAccountBalance).toBe(largeBalance);
    }));
  });

  describe('getBalances observable', () => {
    it('should return observable of balance map', fakeAsync(() => {
      const balances$ = service.getBalances();
      let receivedBalances: Map<string, number> | null = null;

      balances$.subscribe(balances => {
        receivedBalances = balances;
      });
      tick();

      expect(receivedBalances).not.toBeNull();
      expect(receivedBalances).toBeInstanceOf(Map);
    }));

    it('should emit updated balances after setBalanceForPeriod', fakeAsync(() => {
      const balances$ = service.getBalances();
      let receivedBalances: Map<string, number> = new Map();

      balances$.subscribe(balances => {
        receivedBalances = balances;
      });
      tick();

      service.setBalanceForPeriod(testPeriod, 1500);
      tick();

      expect(receivedBalances.get('2024-01-01')).toBe(1500);
    }));

    it('should emit map with multiple period balances', fakeAsync(() => {
      // Set up data and trigger a reload by setting a balance
      service.setBalanceForPeriod(testPeriod, 1000);
      tick();
      service.setBalanceForPeriod(testPeriod2, 2000);
      tick();

      const balances$ = service.getBalances();
      let receivedBalances: Map<string, number> = new Map();

      balances$.subscribe(balances => {
        receivedBalances = balances;
      });
      tick();

      expect(receivedBalances.size).toBe(2);
      expect(receivedBalances.get('2024-01-01')).toBe(1000);
      expect(receivedBalances.get('2024-02-01')).toBe(2000);
    }));
  });

  describe('persistence', () => {
    it('should persist balance to storage', fakeAsync(() => {
      service.setBalanceForPeriod(testPeriod, 1000);
      tick();

      expect(mockStorage.set).toHaveBeenCalledWith('period_balances', jasmine.any(Array));
    }));

    it('should call storage.get when loading balances', fakeAsync(() => {
      // Call getAll which should trigger storage.get
      service.getAll();
      tick();
      
      expect(mockStorage.get).toHaveBeenCalledWith('period_balances');
    }));
  });

  describe('edge cases', () => {
    it('should handle period at year boundary', fakeAsync(() => {
      const yearEndPeriod: MonthPeriod = {
        periodStart: new Date(2023, 11, 15),
        periodEnd: new Date(2024, 0, 14, 23, 59, 59, 999),
        displayLabel: 'Dec 15, 2023 - Jan 14, 2024'
      };

      service.setBalanceForPeriod(yearEndPeriod, 3000);
      tick();

      let result = 0;
      service.getBalanceForPeriod(yearEndPeriod).then(balance => {
        result = balance;
      });
      tick();

      expect(result).toBe(3000);
    }));

    it('should handle multiple consecutive setBalance calls', fakeAsync(() => {
      service.setBalanceForPeriod(testPeriod, 1000);
      tick();
      service.setBalanceForPeriod(testPeriod, 2000);
      tick();
      service.setBalanceForPeriod(testPeriod, 3000);
      tick();

      let result = 0;
      service.getBalanceForPeriod(testPeriod).then(balance => {
        result = balance;
      });
      tick();

      expect(result).toBe(3000);
    }));

    it('should handle very small decimal balances', fakeAsync(() => {
      service.setBalanceForPeriod(testPeriod, 0.01);
      tick();

      let result = 0;
      service.getBalanceForPeriod(testPeriod).then(balance => {
        result = balance;
      });
      tick();

      expect(result).toBe(0.01);
    }));
  });

  describe('concurrent access', () => {
    it('should handle multiple periods being updated in sequence', fakeAsync(() => {
      service.setBalanceForPeriod(testPeriod, 1000);
      tick();
      service.setBalanceForPeriod(testPeriod2, 2000);
      tick();

      let balance1 = 0;
      let balance2 = 0;

      service.getBalanceForPeriod(testPeriod).then(b => { balance1 = b; });
      tick();
      service.getBalanceForPeriod(testPeriod2).then(b => { balance2 = b; });
      tick();

      expect(balance1).toBe(1000);
      expect(balance2).toBe(2000);
    }));
  });
});
