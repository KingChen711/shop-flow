import { describe, it, expect } from 'vitest';
import { cn, formatCurrency, formatDate, truncate, generateId } from './utils';

describe('Utility Functions', () => {
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
  });

  describe('formatCurrency', () => {
    it('should format positive numbers as USD', () => {
      expect(formatCurrency(99.99)).toBe('$99.99');
    });

    it('should format large numbers with commas', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });

    it('should format zero', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });
  });

  describe('formatDate', () => {
    it('should format date string', () => {
      const result = formatDate('2024-01-15');
      expect(result).toContain('January');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('should format Date object', () => {
      const result = formatDate(new Date('2024-06-20'));
      expect(result).toContain('June');
      expect(result).toContain('20');
      expect(result).toContain('2024');
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      expect(truncate('Hello World!', 5)).toBe('Hello...');
    });

    it('should not truncate short strings', () => {
      expect(truncate('Hi', 10)).toBe('Hi');
    });

    it('should handle exact length', () => {
      expect(truncate('Hello', 5)).toBe('Hello');
    });
  });

  describe('generateId', () => {
    it('should generate a string', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
    });

    it('should generate unique ids', () => {
      const ids = new Set([generateId(), generateId(), generateId()]);
      expect(ids.size).toBe(3);
    });
  });
});
