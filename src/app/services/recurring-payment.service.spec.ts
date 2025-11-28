import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RecurringPaymentService } from './recurring-payment.service';
import { Storage } from '@ionic/storage-angular';
import { RecurringPayment } from '../models';

describe('RecurringPaymentService', () => {
  let service: RecurringPaymentService;
  let mockStorage: jasmine.SpyObj<Storage>;
  let storedData: { [key: string]: any };

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
        RecurringPaymentService,
        { provide: Storage, useValue: mockStorage }
      ]
    });

    service = TestBed.inject(RecurringPaymentService);
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
    it('should return empty array when no payments exist', fakeAsync(() => {
      let result: RecurringPayment[] = [];
      
      service.getAll().then(payments => {
        result = payments;
      });
      tick();

      expect(result).toEqual([]);
    }));

    it('should deserialize payments from storage', fakeAsync(() => {
      const storedPayment = {
        id: 'test-id',
        name: 'Test Payment',
        defaultAmount: 100,
        dayOfMonth: 15,
        iconName: 'cash',
        type: 'expense',
        createdAt: '2024-01-01T00:00:00.000Z',
        isActive: true
      };
      storedData['recurring_payments'] = [storedPayment];

      let result: RecurringPayment[] = [];
      service.getAll().then(payments => {
        result = payments;
      });
      tick();

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('test-id');
      expect(result[0].createdAt instanceof Date).toBe(true);
    }));
  });

  describe('getByType', () => {
    it('should return only active payments of specified type', fakeAsync(() => {
      storedData['recurring_payments'] = [
        { id: '1', name: 'Expense 1', type: 'expense', isActive: true, dayOfMonth: 10, createdAt: '2024-01-01T00:00:00.000Z' },
        { id: '2', name: 'Income 1', type: 'income', isActive: true, dayOfMonth: 5, createdAt: '2024-01-01T00:00:00.000Z' },
        { id: '3', name: 'Expense 2', type: 'expense', isActive: false, dayOfMonth: 20, createdAt: '2024-01-01T00:00:00.000Z' },
        { id: '4', name: 'Expense 3', type: 'expense', isActive: true, dayOfMonth: 1, createdAt: '2024-01-01T00:00:00.000Z' }
      ];

      let expenses: RecurringPayment[] = [];
      service.getByType('expense').then(payments => {
        expenses = payments;
      });
      tick();

      expect(expenses.length).toBe(2);
      expect(expenses.every(p => p.type === 'expense')).toBe(true);
      expect(expenses.every(p => p.isActive)).toBe(true);
    }));

    it('should return payments sorted by dayOfMonth', fakeAsync(() => {
      storedData['recurring_payments'] = [
        { id: '1', name: 'Day 15', type: 'expense', isActive: true, dayOfMonth: 15, createdAt: '2024-01-01T00:00:00.000Z' },
        { id: '2', name: 'Day 5', type: 'expense', isActive: true, dayOfMonth: 5, createdAt: '2024-01-01T00:00:00.000Z' },
        { id: '3', name: 'Day 25', type: 'expense', isActive: true, dayOfMonth: 25, createdAt: '2024-01-01T00:00:00.000Z' }
      ];

      let expenses: RecurringPayment[] = [];
      service.getByType('expense').then(payments => {
        expenses = payments;
      });
      tick();

      expect(expenses[0].dayOfMonth).toBe(5);
      expect(expenses[1].dayOfMonth).toBe(15);
      expect(expenses[2].dayOfMonth).toBe(25);
    }));
  });

  describe('getAllSortedByDay', () => {
    it('should return all active payments sorted by day', fakeAsync(() => {
      storedData['recurring_payments'] = [
        { id: '1', name: 'Day 15', type: 'expense', isActive: true, dayOfMonth: 15, createdAt: '2024-01-01T00:00:00.000Z' },
        { id: '2', name: 'Day 5', type: 'income', isActive: true, dayOfMonth: 5, createdAt: '2024-01-01T00:00:00.000Z' },
        { id: '3', name: 'Inactive', type: 'expense', isActive: false, dayOfMonth: 1, createdAt: '2024-01-01T00:00:00.000Z' }
      ];

      let payments: RecurringPayment[] = [];
      service.getAllSortedByDay().then(p => {
        payments = p;
      });
      tick();

      expect(payments.length).toBe(2);
      expect(payments[0].dayOfMonth).toBe(5);
      expect(payments[1].dayOfMonth).toBe(15);
    }));
  });

  describe('getById', () => {
    it('should return payment by ID', fakeAsync(() => {
      storedData['recurring_payments'] = [
        { id: 'test-id', name: 'Test', type: 'expense', isActive: true, dayOfMonth: 15, createdAt: '2024-01-01T00:00:00.000Z' }
      ];

      let result: RecurringPayment | undefined;
      service.getById('test-id').then(p => {
        result = p;
      });
      tick();

      expect(result).toBeDefined();
      expect(result?.id).toBe('test-id');
    }));

    it('should return undefined for non-existent ID', fakeAsync(() => {
      storedData['recurring_payments'] = [];

      let result: RecurringPayment | undefined;
      service.getById('non-existent').then(p => {
        result = p;
      });
      tick();

      expect(result).toBeUndefined();
    }));
  });

  describe('create', () => {
    it('should create payment with generated ID and metadata', fakeAsync(() => {
      const newPayment = {
        name: 'New Payment',
        defaultAmount: 500,
        dayOfMonth: 10,
        iconName: 'wallet',
        type: 'income' as const
      };

      let result: RecurringPayment | null = null;
      service.create(newPayment).then(p => {
        result = p;
      });
      tick();

      expect(result).not.toBeNull();
      expect(result!.id).toBeTruthy();
      expect(result!.name).toBe('New Payment');
      expect(result!.defaultAmount).toBe(500);
      expect(result!.isActive).toBe(true);
      expect(result!.createdAt instanceof Date).toBe(true);
    }));

    it('should persist payment to storage', fakeAsync(() => {
      const newPayment = {
        name: 'Persist Test',
        defaultAmount: 200,
        dayOfMonth: 5,
        iconName: 'cash',
        type: 'expense' as const
      };

      service.create(newPayment);
      tick();

      const stored = storedData['recurring_payments'];
      expect(stored.length).toBe(1);
      expect(stored[0].name).toBe('Persist Test');
    }));

    it('should generate unique IDs for multiple payments', fakeAsync(() => {
      const payment1 = { name: 'Payment 1', defaultAmount: 100, dayOfMonth: 1, iconName: 'cash', type: 'expense' as const };
      const payment2 = { name: 'Payment 2', defaultAmount: 200, dayOfMonth: 2, iconName: 'cash', type: 'expense' as const };

      let result1: RecurringPayment | null = null;
      let result2: RecurringPayment | null = null;

      service.create(payment1).then(p => { result1 = p; });
      tick();
      service.create(payment2).then(p => { result2 = p; });
      tick();

      expect(result1!.id).not.toBe(result2!.id);
    }));
  });

  describe('update', () => {
    it('should update existing payment', fakeAsync(() => {
      storedData['recurring_payments'] = [
        { id: 'update-id', name: 'Original', defaultAmount: 100, dayOfMonth: 15, iconName: 'cash', type: 'expense', isActive: true, createdAt: '2024-01-01T00:00:00.000Z' }
      ];

      service.update('update-id', { name: 'Updated', defaultAmount: 200 });
      tick();

      const stored = storedData['recurring_payments'];
      expect(stored[0].name).toBe('Updated');
      expect(stored[0].defaultAmount).toBe(200);
    }));

    it('should not modify other payments', fakeAsync(() => {
      storedData['recurring_payments'] = [
        { id: 'id-1', name: 'Payment 1', defaultAmount: 100, dayOfMonth: 15, iconName: 'cash', type: 'expense', isActive: true, createdAt: '2024-01-01T00:00:00.000Z' },
        { id: 'id-2', name: 'Payment 2', defaultAmount: 200, dayOfMonth: 20, iconName: 'wallet', type: 'income', isActive: true, createdAt: '2024-01-01T00:00:00.000Z' }
      ];

      service.update('id-1', { name: 'Updated' });
      tick();

      const stored = storedData['recurring_payments'];
      expect(stored[1].name).toBe('Payment 2');
    }));

    it('should not throw for non-existent ID', fakeAsync(() => {
      storedData['recurring_payments'] = [];

      expect(() => {
        service.update('non-existent', { name: 'Test' });
        tick();
      }).not.toThrow();
    }));
  });

  describe('delete (soft delete)', () => {
    it('should soft delete payment by setting isActive to false', fakeAsync(() => {
      storedData['recurring_payments'] = [
        { id: 'delete-id', name: 'To Delete', defaultAmount: 100, dayOfMonth: 15, iconName: 'cash', type: 'expense', isActive: true, createdAt: '2024-01-01T00:00:00.000Z' }
      ];

      service.delete('delete-id');
      tick();

      const stored = storedData['recurring_payments'];
      expect(stored[0].isActive).toBe(false);
    }));

    it('should keep payment in storage after soft delete', fakeAsync(() => {
      storedData['recurring_payments'] = [
        { id: 'delete-id', name: 'To Delete', defaultAmount: 100, dayOfMonth: 15, iconName: 'cash', type: 'expense', isActive: true, createdAt: '2024-01-01T00:00:00.000Z' }
      ];

      service.delete('delete-id');
      tick();

      const stored = storedData['recurring_payments'];
      expect(stored.length).toBe(1);
    }));
  });

  describe('permanentDelete', () => {
    it('should remove payment from storage completely', fakeAsync(() => {
      storedData['recurring_payments'] = [
        { id: 'perm-delete-id', name: 'To Delete', defaultAmount: 100, dayOfMonth: 15, iconName: 'cash', type: 'expense', isActive: true, createdAt: '2024-01-01T00:00:00.000Z' }
      ];

      service.permanentDelete('perm-delete-id');
      tick();

      const stored = storedData['recurring_payments'];
      expect(stored.length).toBe(0);
    }));

    it('should not affect other payments', fakeAsync(() => {
      storedData['recurring_payments'] = [
        { id: 'id-1', name: 'Payment 1', defaultAmount: 100, dayOfMonth: 15, iconName: 'cash', type: 'expense', isActive: true, createdAt: '2024-01-01T00:00:00.000Z' },
        { id: 'id-2', name: 'Payment 2', defaultAmount: 200, dayOfMonth: 20, iconName: 'wallet', type: 'income', isActive: true, createdAt: '2024-01-01T00:00:00.000Z' }
      ];

      service.permanentDelete('id-1');
      tick();

      const stored = storedData['recurring_payments'];
      expect(stored.length).toBe(1);
      expect(stored[0].id).toBe('id-2');
    }));
  });

  describe('getPayments observable', () => {
    it('should return observable of payments', fakeAsync(() => {
      const payments$ = service.getPayments();
      let receivedPayments: RecurringPayment[] = [];

      payments$.subscribe(payments => {
        receivedPayments = payments;
      });
      tick();

      expect(Array.isArray(receivedPayments)).toBe(true);
    }));

    it('should emit updated payments after create', fakeAsync(() => {
      const payments$ = service.getPayments();
      let receivedPayments: RecurringPayment[] = [];

      payments$.subscribe(payments => {
        receivedPayments = payments;
      });
      tick();

      const newPayment = {
        name: 'Observable Test',
        defaultAmount: 100,
        dayOfMonth: 15,
        iconName: 'cash',
        type: 'expense' as const
      };

      service.create(newPayment);
      tick();

      expect(receivedPayments.length).toBe(1);
      expect(receivedPayments[0].name).toBe('Observable Test');
    }));
  });

  describe('serialization and deserialization', () => {
    it('should properly serialize Date objects', fakeAsync(() => {
      const newPayment = {
        name: 'Date Test',
        defaultAmount: 100,
        dayOfMonth: 15,
        iconName: 'cash',
        type: 'expense' as const
      };

      service.create(newPayment);
      tick();

      const stored = storedData['recurring_payments'][0];
      expect(typeof stored.createdAt).toBe('string');
      expect(stored.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    }));

    it('should properly deserialize Date objects', fakeAsync(() => {
      const dateString = '2024-06-15T10:30:00.000Z';
      storedData['recurring_payments'] = [
        { id: 'date-test', name: 'Date Test', defaultAmount: 100, dayOfMonth: 15, iconName: 'cash', type: 'expense', isActive: true, createdAt: dateString }
      ];

      let result: RecurringPayment[] = [];
      service.getAll().then(payments => {
        result = payments;
      });
      tick();

      expect(result[0].createdAt instanceof Date).toBe(true);
      expect(result[0].createdAt.toISOString()).toBe(dateString);
    }));
  });
});
