import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PaymentLogService, ForecastData } from './payment-log.service';
import { DatePeriodService } from './date-period.service';
import { Storage } from '@ionic/storage-angular';
import { PaymentLog, RecurringPayment, MonthPeriod } from '../models';

describe('PaymentLogService', () => {
  let service: PaymentLogService;
  let mockStorage: jasmine.SpyObj<Storage>;
  let mockDatePeriodService: jasmine.SpyObj<DatePeriodService>;
  let storedData: { [key: string]: any };

  const testPeriod: MonthPeriod = {
    periodStart: new Date(2024, 0, 1),
    periodEnd: new Date(2024, 0, 31, 23, 59, 59, 999),
    displayLabel: 'Jan 1 - Jan 31, 2024'
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

    mockDatePeriodService = jasmine.createSpyObj('DatePeriodService', ['getPeriodKey', 'calculateDueDate']);
    mockDatePeriodService.getPeriodKey.and.callFake((period: MonthPeriod) => {
      return period.periodStart.toISOString().split('T')[0];
    });
    mockDatePeriodService.calculateDueDate.and.callFake((dayOfMonth: number, period: MonthPeriod) => {
      return new Date(period.periodStart.getFullYear(), period.periodStart.getMonth(), dayOfMonth);
    });

    TestBed.configureTestingModule({
      providers: [
        PaymentLogService,
        { provide: Storage, useValue: mockStorage },
        { provide: DatePeriodService, useValue: mockDatePeriodService }
      ]
    });

    service = TestBed.inject(PaymentLogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('should return empty array when no logs exist', fakeAsync(() => {
      let result: PaymentLog[] = [];
      
      service.getAll().then(logs => {
        result = logs;
      });
      tick();

      expect(result).toEqual([]);
    }));

    it('should deserialize logs from storage', fakeAsync(() => {
      const storedLog = {
        id: 'test-id',
        recurringPaymentId: 'payment-id',
        name: 'Test Log',
        amount: 100,
        iconName: 'cash',
        dayOfMonth: 15,
        type: 'expense',
        periodStart: '2024-01-01T00:00:00.000Z',
        periodEnd: '2024-01-31T23:59:59.999Z',
        dueDate: '2024-01-15T00:00:00.000Z',
        isCompleted: false,
        createdAt: '2024-01-01T00:00:00.000Z'
      };
      storedData['payment_logs'] = [storedLog];

      let result: PaymentLog[] = [];
      service.getAll().then(logs => {
        result = logs;
      });
      tick();

      expect(result.length).toBe(1);
      expect(result[0].periodStart instanceof Date).toBe(true);
      expect(result[0].periodEnd instanceof Date).toBe(true);
      expect(result[0].dueDate instanceof Date).toBe(true);
      expect(result[0].createdAt instanceof Date).toBe(true);
    }));
  });

  describe('getLogsByPeriod', () => {
    it('should return logs filtered by period', fakeAsync(() => {
      storedData['payment_logs'] = [
        {
          id: 'log-1',
          name: 'Jan Log',
          amount: 100,
          type: 'expense',
          periodStart: '2024-01-01T00:00:00.000Z',
          periodEnd: '2024-01-31T23:59:59.999Z',
          dueDate: '2024-01-15T00:00:00.000Z',
          isCompleted: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          iconName: 'cash',
          dayOfMonth: 15
        },
        {
          id: 'log-2',
          name: 'Feb Log',
          amount: 200,
          type: 'expense',
          periodStart: '2024-02-01T00:00:00.000Z',
          periodEnd: '2024-02-29T23:59:59.999Z',
          dueDate: '2024-02-15T00:00:00.000Z',
          isCompleted: false,
          createdAt: '2024-02-01T00:00:00.000Z',
          iconName: 'cash',
          dayOfMonth: 15
        }
      ];

      let result: PaymentLog[] = [];
      service.getLogsByPeriod(testPeriod).then(logs => {
        result = logs;
      });
      tick();

      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Jan Log');
    }));

    it('should return logs sorted by due date', fakeAsync(() => {
      storedData['payment_logs'] = [
        {
          id: 'log-1',
          name: 'Day 20',
          amount: 100,
          type: 'expense',
          periodStart: '2024-01-01T00:00:00.000Z',
          periodEnd: '2024-01-31T23:59:59.999Z',
          dueDate: '2024-01-20T00:00:00.000Z',
          isCompleted: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          iconName: 'cash',
          dayOfMonth: 20
        },
        {
          id: 'log-2',
          name: 'Day 5',
          amount: 200,
          type: 'expense',
          periodStart: '2024-01-01T00:00:00.000Z',
          periodEnd: '2024-01-31T23:59:59.999Z',
          dueDate: '2024-01-05T00:00:00.000Z',
          isCompleted: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          iconName: 'cash',
          dayOfMonth: 5
        }
      ];

      let result: PaymentLog[] = [];
      service.getLogsByPeriod(testPeriod).then(logs => {
        result = logs;
      });
      tick();

      expect(result[0].name).toBe('Day 5');
      expect(result[1].name).toBe('Day 20');
    }));
  });

  describe('ensureLogsForPeriod', () => {
    it('should create logs for payments without existing logs', fakeAsync(() => {
      const recurringPayments: RecurringPayment[] = [
        {
          id: 'payment-1',
          name: 'Rent',
          defaultAmount: 1000,
          dayOfMonth: 1,
          iconName: 'home',
          type: 'expense',
          createdAt: new Date(),
          isActive: true
        }
      ];

      service.ensureLogsForPeriod(testPeriod, recurringPayments);
      tick();

      const stored = storedData['payment_logs'];
      expect(stored.length).toBe(1);
      expect(stored[0].name).toBe('Rent');
      expect(stored[0].amount).toBe(1000);
    }));

    it('should not create duplicate logs for existing payments', fakeAsync(() => {
      storedData['payment_logs'] = [
        {
          id: 'existing-log',
          recurringPaymentId: 'payment-1',
          name: 'Existing',
          amount: 100,
          type: 'expense',
          periodStart: '2024-01-01T00:00:00.000Z',
          periodEnd: '2024-01-31T23:59:59.999Z',
          dueDate: '2024-01-15T00:00:00.000Z',
          isCompleted: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          iconName: 'cash',
          dayOfMonth: 15
        }
      ];

      const recurringPayments: RecurringPayment[] = [
        {
          id: 'payment-1',
          name: 'Rent',
          defaultAmount: 1000,
          dayOfMonth: 1,
          iconName: 'home',
          type: 'expense',
          createdAt: new Date(),
          isActive: true
        }
      ];

      service.ensureLogsForPeriod(testPeriod, recurringPayments);
      tick();

      const stored = storedData['payment_logs'];
      expect(stored.length).toBe(1);
    }));

    it('should skip inactive payments', fakeAsync(() => {
      const recurringPayments: RecurringPayment[] = [
        {
          id: 'payment-1',
          name: 'Inactive',
          defaultAmount: 100,
          dayOfMonth: 1,
          iconName: 'home',
          type: 'expense',
          createdAt: new Date(),
          isActive: false
        }
      ];

      service.ensureLogsForPeriod(testPeriod, recurringPayments);
      tick();

      const stored = storedData['payment_logs'];
      expect(stored).toBeUndefined();
    }));

    it('should create logs for multiple missing payments', fakeAsync(() => {
      const recurringPayments: RecurringPayment[] = [
        {
          id: 'payment-1',
          name: 'Rent',
          defaultAmount: 1000,
          dayOfMonth: 1,
          iconName: 'home',
          type: 'expense',
          createdAt: new Date(),
          isActive: true
        },
        {
          id: 'payment-2',
          name: 'Salary',
          defaultAmount: 5000,
          dayOfMonth: 25,
          iconName: 'cash',
          type: 'income',
          createdAt: new Date(),
          isActive: true
        }
      ];

      service.ensureLogsForPeriod(testPeriod, recurringPayments);
      tick();

      const stored = storedData['payment_logs'];
      expect(stored.length).toBe(2);
    }));
  });

  describe('create', () => {
    it('should create log with generated ID and timestamp', fakeAsync(() => {
      const newLog: Omit<PaymentLog, 'id' | 'createdAt'> = {
        recurringPaymentId: 'payment-id',
        name: 'Test',
        amount: 100,
        iconName: 'cash',
        dayOfMonth: 15,
        type: 'expense',
        periodStart: testPeriod.periodStart,
        periodEnd: testPeriod.periodEnd,
        dueDate: new Date(2024, 0, 15),
        isCompleted: false
      };

      let result: PaymentLog | null = null;
      service.create(newLog).then(log => {
        result = log;
      });
      tick();

      expect(result).not.toBeNull();
      expect(result!.id).toBeTruthy();
      expect(result!.createdAt instanceof Date).toBe(true);
    }));
  });

  describe('createMultiple', () => {
    it('should create multiple logs at once', fakeAsync(() => {
      const logs: Omit<PaymentLog, 'id' | 'createdAt'>[] = [
        {
          recurringPaymentId: 'payment-1',
          name: 'Log 1',
          amount: 100,
          iconName: 'cash',
          dayOfMonth: 10,
          type: 'expense',
          periodStart: testPeriod.periodStart,
          periodEnd: testPeriod.periodEnd,
          dueDate: new Date(2024, 0, 10),
          isCompleted: false
        },
        {
          recurringPaymentId: 'payment-2',
          name: 'Log 2',
          amount: 200,
          iconName: 'wallet',
          dayOfMonth: 20,
          type: 'income',
          periodStart: testPeriod.periodStart,
          periodEnd: testPeriod.periodEnd,
          dueDate: new Date(2024, 0, 20),
          isCompleted: false
        }
      ];

      let result: PaymentLog[] = [];
      service.createMultiple(logs).then(created => {
        result = created;
      });
      tick();

      expect(result.length).toBe(2);
      expect(result[0].id).not.toBe(result[1].id);
    }));
  });

  describe('update', () => {
    it('should update existing log', fakeAsync(() => {
      storedData['payment_logs'] = [
        {
          id: 'update-id',
          name: 'Original',
          amount: 100,
          type: 'expense',
          periodStart: '2024-01-01T00:00:00.000Z',
          periodEnd: '2024-01-31T23:59:59.999Z',
          dueDate: '2024-01-15T00:00:00.000Z',
          isCompleted: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          iconName: 'cash',
          dayOfMonth: 15
        }
      ];

      service.update('update-id', { name: 'Updated', amount: 200 });
      tick();

      const stored = storedData['payment_logs'];
      expect(stored[0].name).toBe('Updated');
      expect(stored[0].amount).toBe(200);
    }));
  });

  describe('updateLogAmount', () => {
    it('should update only the amount', fakeAsync(() => {
      storedData['payment_logs'] = [
        {
          id: 'amount-id',
          name: 'Test',
          amount: 100,
          type: 'expense',
          periodStart: '2024-01-01T00:00:00.000Z',
          periodEnd: '2024-01-31T23:59:59.999Z',
          dueDate: '2024-01-15T00:00:00.000Z',
          isCompleted: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          iconName: 'cash',
          dayOfMonth: 15
        }
      ];

      service.updateLogAmount('amount-id', 500);
      tick();

      const stored = storedData['payment_logs'];
      expect(stored[0].amount).toBe(500);
      expect(stored[0].name).toBe('Test');
    }));
  });

  describe('markAsCompleted', () => {
    it('should mark log as completed with timestamp', fakeAsync(() => {
      storedData['payment_logs'] = [
        {
          id: 'complete-id',
          name: 'Test',
          amount: 100,
          type: 'expense',
          periodStart: '2024-01-01T00:00:00.000Z',
          periodEnd: '2024-01-31T23:59:59.999Z',
          dueDate: '2024-01-15T00:00:00.000Z',
          isCompleted: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          iconName: 'cash',
          dayOfMonth: 15
        }
      ];

      service.markAsCompleted('complete-id');
      tick();

      const stored = storedData['payment_logs'];
      expect(stored[0].isCompleted).toBe(true);
      expect(stored[0].completedDate).toBeTruthy();
    }));
  });

  describe('markAsIncomplete', () => {
    it('should mark log as incomplete and remove completed date', fakeAsync(() => {
      storedData['payment_logs'] = [
        {
          id: 'incomplete-id',
          name: 'Test',
          amount: 100,
          type: 'expense',
          periodStart: '2024-01-01T00:00:00.000Z',
          periodEnd: '2024-01-31T23:59:59.999Z',
          dueDate: '2024-01-15T00:00:00.000Z',
          isCompleted: true,
          completedDate: '2024-01-15T10:00:00.000Z',
          createdAt: '2024-01-01T00:00:00.000Z',
          iconName: 'cash',
          dayOfMonth: 15
        }
      ];

      service.markAsIncomplete('incomplete-id');
      tick();

      const stored = storedData['payment_logs'];
      expect(stored[0].isCompleted).toBe(false);
      expect(stored[0].completedDate).toBeUndefined();
    }));
  });

  describe('delete', () => {
    it('should remove log from storage', fakeAsync(() => {
      storedData['payment_logs'] = [
        {
          id: 'delete-id',
          name: 'To Delete',
          amount: 100,
          type: 'expense',
          periodStart: '2024-01-01T00:00:00.000Z',
          periodEnd: '2024-01-31T23:59:59.999Z',
          dueDate: '2024-01-15T00:00:00.000Z',
          isCompleted: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          iconName: 'cash',
          dayOfMonth: 15
        }
      ];

      service.delete('delete-id');
      tick();

      const stored = storedData['payment_logs'];
      expect(stored.length).toBe(0);
    }));
  });

  describe('calculateForecast', () => {
    it('should calculate forecast with pending expenses and income', () => {
      const logs: PaymentLog[] = [
        {
          id: '1',
          name: 'Expense 1',
          amount: 100,
          type: 'expense',
          isCompleted: false,
          periodStart: new Date(),
          periodEnd: new Date(),
          dueDate: new Date(),
          createdAt: new Date(),
          iconName: 'cash',
          dayOfMonth: 10
        },
        {
          id: '2',
          name: 'Expense 2',
          amount: 200,
          type: 'expense',
          isCompleted: false,
          periodStart: new Date(),
          periodEnd: new Date(),
          dueDate: new Date(),
          createdAt: new Date(),
          iconName: 'cash',
          dayOfMonth: 15
        },
        {
          id: '3',
          name: 'Income 1',
          amount: 500,
          type: 'income',
          isCompleted: false,
          periodStart: new Date(),
          periodEnd: new Date(),
          dueDate: new Date(),
          createdAt: new Date(),
          iconName: 'wallet',
          dayOfMonth: 25
        }
      ];

      const forecast = service.calculateForecast(1000, logs);

      expect(forecast.pendingExpenses).toBe(300);
      expect(forecast.pendingIncome).toBe(500);
      expect(forecast.forecastedBalance).toBe(1200); // 1000 - 300 + 500
    });

    it('should exclude completed logs from forecast', () => {
      const logs: PaymentLog[] = [
        {
          id: '1',
          name: 'Completed Expense',
          amount: 100,
          type: 'expense',
          isCompleted: true,
          completedDate: new Date(),
          periodStart: new Date(),
          periodEnd: new Date(),
          dueDate: new Date(),
          createdAt: new Date(),
          iconName: 'cash',
          dayOfMonth: 10
        },
        {
          id: '2',
          name: 'Pending Expense',
          amount: 200,
          type: 'expense',
          isCompleted: false,
          periodStart: new Date(),
          periodEnd: new Date(),
          dueDate: new Date(),
          createdAt: new Date(),
          iconName: 'cash',
          dayOfMonth: 15
        }
      ];

      const forecast = service.calculateForecast(1000, logs);

      expect(forecast.pendingExpenses).toBe(200);
      expect(forecast.forecastedBalance).toBe(800);
    });

    it('should return zero for pending amounts when all logs are completed', () => {
      const logs: PaymentLog[] = [
        {
          id: '1',
          name: 'Completed',
          amount: 100,
          type: 'expense',
          isCompleted: true,
          completedDate: new Date(),
          periodStart: new Date(),
          periodEnd: new Date(),
          dueDate: new Date(),
          createdAt: new Date(),
          iconName: 'cash',
          dayOfMonth: 10
        }
      ];

      const forecast = service.calculateForecast(1000, logs);

      expect(forecast.pendingExpenses).toBe(0);
      expect(forecast.pendingIncome).toBe(0);
      expect(forecast.forecastedBalance).toBe(1000);
    });

    it('should handle empty logs array', () => {
      const forecast = service.calculateForecast(500, []);

      expect(forecast.pendingExpenses).toBe(0);
      expect(forecast.pendingIncome).toBe(0);
      expect(forecast.forecastedBalance).toBe(500);
    });

    it('should handle negative balance scenario', () => {
      const logs: PaymentLog[] = [
        {
          id: '1',
          name: 'Large Expense',
          amount: 2000,
          type: 'expense',
          isCompleted: false,
          periodStart: new Date(),
          periodEnd: new Date(),
          dueDate: new Date(),
          createdAt: new Date(),
          iconName: 'cash',
          dayOfMonth: 10
        }
      ];

      const forecast = service.calculateForecast(500, logs);

      expect(forecast.forecastedBalance).toBe(-1500);
    });

    it('should handle decimal amounts correctly', () => {
      const logs: PaymentLog[] = [
        {
          id: '1',
          name: 'Expense',
          amount: 99.99,
          type: 'expense',
          isCompleted: false,
          periodStart: new Date(),
          periodEnd: new Date(),
          dueDate: new Date(),
          createdAt: new Date(),
          iconName: 'cash',
          dayOfMonth: 10
        },
        {
          id: '2',
          name: 'Income',
          amount: 49.50,
          type: 'income',
          isCompleted: false,
          periodStart: new Date(),
          periodEnd: new Date(),
          dueDate: new Date(),
          createdAt: new Date(),
          iconName: 'wallet',
          dayOfMonth: 25
        }
      ];

      const forecast = service.calculateForecast(100.01, logs);

      expect(forecast.pendingExpenses).toBe(99.99);
      expect(forecast.pendingIncome).toBe(49.50);
      expect(forecast.forecastedBalance).toBeCloseTo(49.52, 2);
    });
  });

  describe('getLogs observable', () => {
    it('should return observable of logs', fakeAsync(() => {
      const logs$ = service.getLogs();
      let receivedLogs: PaymentLog[] = [];

      logs$.subscribe(logs => {
        receivedLogs = logs;
      });
      tick();

      expect(Array.isArray(receivedLogs)).toBe(true);
    }));
  });

  describe('serialization', () => {
    it('should properly serialize completedDate when present', fakeAsync(() => {
      const newLog: Omit<PaymentLog, 'id' | 'createdAt'> = {
        recurringPaymentId: 'payment-id',
        name: 'Completed Test',
        amount: 100,
        iconName: 'cash',
        dayOfMonth: 15,
        type: 'expense',
        periodStart: testPeriod.periodStart,
        periodEnd: testPeriod.periodEnd,
        dueDate: new Date(2024, 0, 15),
        isCompleted: true,
        completedDate: new Date(2024, 0, 15, 10, 30)
      };

      service.create(newLog);
      tick();

      const stored = storedData['payment_logs'][0];
      expect(typeof stored.completedDate).toBe('string');
    }));

    it('should handle undefined completedDate', fakeAsync(() => {
      storedData['payment_logs'] = [
        {
          id: 'no-completed',
          name: 'Test',
          amount: 100,
          type: 'expense',
          periodStart: '2024-01-01T00:00:00.000Z',
          periodEnd: '2024-01-31T23:59:59.999Z',
          dueDate: '2024-01-15T00:00:00.000Z',
          isCompleted: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          iconName: 'cash',
          dayOfMonth: 15
        }
      ];

      let result: PaymentLog[] = [];
      service.getAll().then(logs => {
        result = logs;
      });
      tick();

      expect(result[0].completedDate).toBeUndefined();
    }));
  });
});
