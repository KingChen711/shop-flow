import { describe, it, expect } from 'vitest';
import { cn, formatCurrency, formatDate, formatDateTime } from './utils';

describe('Admin Utility Functions', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      const condition = false;
      expect(cn('foo', condition && 'bar', 'baz')).toBe('foo baz');
    });

    it('should deduplicate tailwind classes', () => {
      expect(cn('px-4', 'px-6')).toBe('px-6');
    });

    it('should handle arrays', () => {
      expect(cn(['foo', 'bar'])).toBe('foo bar');
    });
  });

  describe('formatCurrency', () => {
    it('should format positive numbers as USD', () => {
      expect(formatCurrency(99.99)).toBe('$99.99');
    });

    it('should format large numbers with commas', () => {
      expect(formatCurrency(1234567.89)).toBe('$1,234,567.89');
    });

    it('should format zero', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should handle decimal precision', () => {
      expect(formatCurrency(10)).toBe('$10.00');
    });
  });

  describe('formatDate', () => {
    it('should format date string', () => {
      const result = formatDate('2024-01-15');
      expect(result).toContain('Jan');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('should format Date object', () => {
      const result = formatDate(new Date('2024-06-20'));
      expect(result).toContain('Jun');
      expect(result).toContain('20');
      expect(result).toContain('2024');
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time', () => {
      const result = formatDateTime('2024-01-15T14:30:00');
      expect(result).toContain('Jan');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });
  });
});
