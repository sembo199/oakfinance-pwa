import { TestBed } from '@angular/core/testing';
import { DatePeriodService } from './date-period.service';
import { MonthPeriod } from '../models';

describe('DatePeriodService', () => {
  let service: DatePeriodService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DatePeriodService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCurrentPeriod', () => {
    it('should return period starting on day 1 when reference date is after start day', () => {
      // Reference: Jan 15, 2024 - should be in period starting Jan 1
      const referenceDate = new Date(2024, 0, 15); // Jan 15, 2024
      const period = service.getCurrentPeriod(1, referenceDate);

      expect(period.periodStart.getFullYear()).toBe(2024);
      expect(period.periodStart.getMonth()).toBe(0); // January
      expect(period.periodStart.getDate()).toBe(1);
      expect(period.periodEnd.getMonth()).toBe(0); // January
      expect(period.periodEnd.getDate()).toBe(31);
    });

    it('should return previous month period when reference date is before start day', () => {
      // Reference: Jan 5, 2024 with start day 15 - should be in period starting Dec 15
      const referenceDate = new Date(2024, 0, 5); // Jan 5, 2024
      const period = service.getCurrentPeriod(15, referenceDate);

      expect(period.periodStart.getFullYear()).toBe(2023);
      expect(period.periodStart.getMonth()).toBe(11); // December
      expect(period.periodStart.getDate()).toBe(15);
      expect(period.periodEnd.getFullYear()).toBe(2024);
      expect(period.periodEnd.getMonth()).toBe(0); // January
      expect(period.periodEnd.getDate()).toBe(14);
    });

    it('should return current month period when reference date equals start day', () => {
      // Reference: Jan 15, 2024 with start day 15 - should be in period starting Jan 15
      const referenceDate = new Date(2024, 0, 15); // Jan 15, 2024
      const period = service.getCurrentPeriod(15, referenceDate);

      expect(period.periodStart.getFullYear()).toBe(2024);
      expect(period.periodStart.getMonth()).toBe(0); // January
      expect(period.periodStart.getDate()).toBe(15);
    });

    it('should set correct time boundaries for period start and end', () => {
      const referenceDate = new Date(2024, 0, 15);
      const period = service.getCurrentPeriod(1, referenceDate);

      // Period start should be at 00:00:00.000
      expect(period.periodStart.getHours()).toBe(0);
      expect(period.periodStart.getMinutes()).toBe(0);
      expect(period.periodStart.getSeconds()).toBe(0);
      expect(period.periodStart.getMilliseconds()).toBe(0);

      // Period end should be at 23:59:59.999
      expect(period.periodEnd.getHours()).toBe(23);
      expect(period.periodEnd.getMinutes()).toBe(59);
      expect(period.periodEnd.getSeconds()).toBe(59);
      expect(period.periodEnd.getMilliseconds()).toBe(999);
    });

    it('should handle year boundary correctly (December to January)', () => {
      // Reference: Dec 20, 2023 with start day 15 - should be in period starting Dec 15
      const referenceDate = new Date(2023, 11, 20); // Dec 20, 2023
      const period = service.getCurrentPeriod(15, referenceDate);

      expect(period.periodStart.getFullYear()).toBe(2023);
      expect(period.periodStart.getMonth()).toBe(11); // December
      expect(period.periodStart.getDate()).toBe(15);
      expect(period.periodEnd.getFullYear()).toBe(2024);
      expect(period.periodEnd.getMonth()).toBe(0); // January
      expect(period.periodEnd.getDate()).toBe(14);
    });

    it('should generate correct display label', () => {
      const referenceDate = new Date(2024, 0, 15);
      const period = service.getCurrentPeriod(1, referenceDate);

      expect(period.displayLabel).toContain('Jan 1');
      expect(period.displayLabel).toContain('Jan 31, 2024');
    });

    it('should handle start day 31 in months with fewer days', () => {
      // Reference: Feb 15, 2024 with start day 31
      // Period should start Jan 31 and end Feb 29 (2024 is leap year)
      const referenceDate = new Date(2024, 1, 15); // Feb 15, 2024
      const period = service.getCurrentPeriod(31, referenceDate);

      expect(period.periodStart.getMonth()).toBe(0); // January
      expect(period.periodStart.getDate()).toBe(31);
    });
  });

  describe('getNextPeriod', () => {
    it('should return the next month period', () => {
      const currentPeriod: MonthPeriod = {
        periodStart: new Date(2024, 0, 1),
        periodEnd: new Date(2024, 0, 31, 23, 59, 59, 999),
        displayLabel: 'Jan 1 - Jan 31, 2024'
      };

      const nextPeriod = service.getNextPeriod(currentPeriod);

      expect(nextPeriod.periodStart.getFullYear()).toBe(2024);
      expect(nextPeriod.periodStart.getMonth()).toBe(1); // February
      expect(nextPeriod.periodStart.getDate()).toBe(1);
    });

    it('should handle year boundary (December to January)', () => {
      const currentPeriod: MonthPeriod = {
        periodStart: new Date(2023, 11, 15),
        periodEnd: new Date(2024, 0, 14, 23, 59, 59, 999),
        displayLabel: 'Dec 15 - Jan 14, 2024'
      };

      const nextPeriod = service.getNextPeriod(currentPeriod);

      expect(nextPeriod.periodStart.getFullYear()).toBe(2024);
      expect(nextPeriod.periodStart.getMonth()).toBe(0); // January
      expect(nextPeriod.periodStart.getDate()).toBe(15);
    });

    it('should set correct time boundaries', () => {
      const currentPeriod: MonthPeriod = {
        periodStart: new Date(2024, 0, 1),
        periodEnd: new Date(2024, 0, 31, 23, 59, 59, 999),
        displayLabel: 'Jan 1 - Jan 31, 2024'
      };

      const nextPeriod = service.getNextPeriod(currentPeriod);

      expect(nextPeriod.periodStart.getHours()).toBe(0);
      expect(nextPeriod.periodStart.getMinutes()).toBe(0);
      expect(nextPeriod.periodEnd.getHours()).toBe(23);
      expect(nextPeriod.periodEnd.getMinutes()).toBe(59);
    });
  });

  describe('getPreviousPeriod', () => {
    it('should return the previous month period', () => {
      const currentPeriod: MonthPeriod = {
        periodStart: new Date(2024, 1, 1),
        periodEnd: new Date(2024, 1, 29, 23, 59, 59, 999),
        displayLabel: 'Feb 1 - Feb 29, 2024'
      };

      const prevPeriod = service.getPreviousPeriod(currentPeriod);

      expect(prevPeriod.periodStart.getFullYear()).toBe(2024);
      expect(prevPeriod.periodStart.getMonth()).toBe(0); // January
      expect(prevPeriod.periodStart.getDate()).toBe(1);
    });

    it('should handle year boundary (January to December)', () => {
      const currentPeriod: MonthPeriod = {
        periodStart: new Date(2024, 0, 15),
        periodEnd: new Date(2024, 1, 14, 23, 59, 59, 999),
        displayLabel: 'Jan 15 - Feb 14, 2024'
      };

      const prevPeriod = service.getPreviousPeriod(currentPeriod);

      expect(prevPeriod.periodStart.getFullYear()).toBe(2023);
      expect(prevPeriod.periodStart.getMonth()).toBe(11); // December
      expect(prevPeriod.periodStart.getDate()).toBe(15);
    });

    it('should set correct time boundaries', () => {
      const currentPeriod: MonthPeriod = {
        periodStart: new Date(2024, 1, 1),
        periodEnd: new Date(2024, 1, 29, 23, 59, 59, 999),
        displayLabel: 'Feb 1 - Feb 29, 2024'
      };

      const prevPeriod = service.getPreviousPeriod(currentPeriod);

      expect(prevPeriod.periodStart.getHours()).toBe(0);
      expect(prevPeriod.periodEnd.getHours()).toBe(23);
      expect(prevPeriod.periodEnd.getMinutes()).toBe(59);
    });
  });

  describe('calculateDueDate', () => {
    it('should return correct due date within same month period', () => {
      const period: MonthPeriod = {
        periodStart: new Date(2024, 0, 1),
        periodEnd: new Date(2024, 0, 31, 23, 59, 59, 999),
        displayLabel: 'Jan 1 - Jan 31, 2024'
      };

      const dueDate = service.calculateDueDate(15, period);

      expect(dueDate.getFullYear()).toBe(2024);
      expect(dueDate.getMonth()).toBe(0); // January
      expect(dueDate.getDate()).toBe(15);
    });

    it('should handle February 31st edge case (should cap to Feb 29 in leap year)', () => {
      // Period: Feb 1 - Feb 29, 2024 (leap year)
      const period: MonthPeriod = {
        periodStart: new Date(2024, 1, 1),
        periodEnd: new Date(2024, 1, 29, 23, 59, 59, 999),
        displayLabel: 'Feb 1 - Feb 29, 2024'
      };

      const dueDate = service.calculateDueDate(31, period);

      expect(dueDate.getMonth()).toBe(1); // February
      expect(dueDate.getDate()).toBe(29); // Last day of Feb 2024
    });

    it('should handle February 31st in non-leap year (should cap to Feb 28)', () => {
      // Period: Feb 1 - Feb 28, 2023 (non-leap year)
      const period: MonthPeriod = {
        periodStart: new Date(2023, 1, 1),
        periodEnd: new Date(2023, 1, 28, 23, 59, 59, 999),
        displayLabel: 'Feb 1 - Feb 28, 2023'
      };

      const dueDate = service.calculateDueDate(31, period);

      expect(dueDate.getMonth()).toBe(1); // February
      expect(dueDate.getDate()).toBe(28); // Last day of Feb 2023
    });

    it('should handle February 30th edge case', () => {
      const period: MonthPeriod = {
        periodStart: new Date(2024, 1, 1),
        periodEnd: new Date(2024, 1, 29, 23, 59, 59, 999),
        displayLabel: 'Feb 1 - Feb 29, 2024'
      };

      const dueDate = service.calculateDueDate(30, period);

      expect(dueDate.getMonth()).toBe(1); // February
      expect(dueDate.getDate()).toBe(29); // Capped to last day
    });

    it('should handle period spanning two months - day in start month', () => {
      // Period: Jan 15 - Feb 14, 2024, due day 20 (should be Jan 20)
      const period: MonthPeriod = {
        periodStart: new Date(2024, 0, 15),
        periodEnd: new Date(2024, 1, 14, 23, 59, 59, 999),
        displayLabel: 'Jan 15 - Feb 14, 2024'
      };

      const dueDate = service.calculateDueDate(20, period);

      expect(dueDate.getMonth()).toBe(0); // January
      expect(dueDate.getDate()).toBe(20);
    });

    it('should handle period spanning two months - day in end month', () => {
      // Period: Jan 15 - Feb 14, 2024, due day 5 (should be Feb 5)
      const period: MonthPeriod = {
        periodStart: new Date(2024, 0, 15),
        periodEnd: new Date(2024, 1, 14, 23, 59, 59, 999),
        displayLabel: 'Jan 15 - Feb 14, 2024'
      };

      const dueDate = service.calculateDueDate(5, period);

      expect(dueDate.getMonth()).toBe(1); // February
      expect(dueDate.getDate()).toBe(5);
    });

    it('should set time to midnight', () => {
      const period: MonthPeriod = {
        periodStart: new Date(2024, 0, 1),
        periodEnd: new Date(2024, 0, 31, 23, 59, 59, 999),
        displayLabel: 'Jan 1 - Jan 31, 2024'
      };

      const dueDate = service.calculateDueDate(15, period);

      expect(dueDate.getHours()).toBe(0);
      expect(dueDate.getMinutes()).toBe(0);
      expect(dueDate.getSeconds()).toBe(0);
    });

    it('should handle April 31st (should cap to April 30)', () => {
      const period: MonthPeriod = {
        periodStart: new Date(2024, 3, 1), // April 1
        periodEnd: new Date(2024, 3, 30, 23, 59, 59, 999), // April 30
        displayLabel: 'Apr 1 - Apr 30, 2024'
      };

      const dueDate = service.calculateDueDate(31, period);

      expect(dueDate.getMonth()).toBe(3); // April
      expect(dueDate.getDate()).toBe(30); // Last day of April
    });
  });

  describe('getPeriodKey', () => {
    it('should return ISO date string of period start', () => {
      const period: MonthPeriod = {
        periodStart: new Date(2024, 0, 15),
        periodEnd: new Date(2024, 1, 14, 23, 59, 59, 999),
        displayLabel: 'Jan 15 - Feb 14, 2024'
      };

      const key = service.getPeriodKey(period);

      expect(key).toBe('2024-01-15');
    });

    it('should return consistent keys for same period', () => {
      const period1: MonthPeriod = {
        periodStart: new Date(2024, 0, 1),
        periodEnd: new Date(2024, 0, 31, 23, 59, 59, 999),
        displayLabel: 'Jan 1 - Jan 31, 2024'
      };

      const period2: MonthPeriod = {
        periodStart: new Date(2024, 0, 1),
        periodEnd: new Date(2024, 0, 31, 23, 59, 59, 999),
        displayLabel: 'Different label'
      };

      expect(service.getPeriodKey(period1)).toBe(service.getPeriodKey(period2));
    });
  });

  describe('leap year handling', () => {
    it('should correctly handle Feb 29 in leap year 2024', () => {
      const referenceDate = new Date(2024, 1, 29); // Feb 29, 2024
      const period = service.getCurrentPeriod(1, referenceDate);

      expect(period.periodEnd.getMonth()).toBe(1); // February
      expect(period.periodEnd.getDate()).toBe(29);
    });

    it('should correctly handle Feb 28 in non-leap year 2023', () => {
      const referenceDate = new Date(2023, 1, 28); // Feb 28, 2023
      const period = service.getCurrentPeriod(1, referenceDate);

      expect(period.periodEnd.getMonth()).toBe(1); // February
      expect(period.periodEnd.getDate()).toBe(28);
    });
  });
});
