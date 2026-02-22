import { encodeCursor, decodeCursor, buildPaginatedResponse } from '../../../src/utils/pagination.ts';
import { BadRequestError } from '../../../src/utils/errors.ts';

describe('pagination utilities', () => {
  describe('encodeCursor / decodeCursor', () => {
    it('should round-trip encode and decode a cursor', () => {
      const data = { id: 100, v: '2024-01-15' };
      const encoded = encodeCursor(data);
      const decoded = decodeCursor(encoded);
      expect(decoded).toEqual(data);
    });

    it('should round-trip with numeric sort value', () => {
      const data = { id: 42, v: 99 };
      const encoded = encodeCursor(data);
      const decoded = decodeCursor(encoded);
      expect(decoded).toEqual(data);
    });

    it('should throw BadRequestError for invalid base64', () => {
      expect(() => decodeCursor('not-valid-base64!!!')).toThrow(BadRequestError);
    });

    it('should throw BadRequestError for valid base64 but invalid JSON', () => {
      const encoded = Buffer.from('not json').toString('base64');
      expect(() => decodeCursor(encoded)).toThrow(BadRequestError);
    });

    it('should throw BadRequestError for missing id field', () => {
      const encoded = Buffer.from(JSON.stringify({ v: 'test' })).toString('base64');
      expect(() => decodeCursor(encoded)).toThrow(BadRequestError);
    });

    it('should throw BadRequestError for missing v field', () => {
      const encoded = Buffer.from(JSON.stringify({ id: 1 })).toString('base64');
      expect(() => decodeCursor(encoded)).toThrow(BadRequestError);
    });
  });

  describe('buildPaginatedResponse', () => {
    it('should produce correct envelope with next cursor when more rows exist', () => {
      const rows = [
        { id: 3, date: '2024-03-01', name: 'C' },
        { id: 2, date: '2024-02-01', name: 'B' },
        { id: 1, date: '2024-01-01', name: 'A' },
      ];

      const result = buildPaginatedResponse({
        rows,
        totalItems: 10,
        limit: 2,
        sortKey: 'date',
        direction: 'desc',
      });

      expect(result.data).toHaveLength(2);
      expect(result.pagination.nextCursor).not.toBeNull();
      expect(result.pagination.previousCursor).toBeNull();
      expect(result.pagination.totalItems).toBe(10);

      // Verify the cursor encodes the last item's data
      const decoded = decodeCursor(result.pagination.nextCursor!);
      expect(decoded.id).toBe(2);
      expect(decoded.v).toBe('2024-02-01');
    });

    it('should have null nextCursor on last page', () => {
      const rows = [
        { id: 1, date: '2024-01-01', name: 'A' },
      ];

      const result = buildPaginatedResponse({
        rows,
        totalItems: 5,
        limit: 25,
        sortKey: 'date',
        direction: 'desc',
      });

      expect(result.data).toHaveLength(1);
      expect(result.pagination.nextCursor).toBeNull();
      expect(result.pagination.previousCursor).toBeNull();
    });

    it('should set previousCursor to null', () => {
      const result = buildPaginatedResponse({
        rows: [{ id: 1, date: '2024-01-01' }],
        totalItems: 1,
        limit: 25,
        sortKey: 'date',
        direction: 'asc',
      });

      expect(result.pagination.previousCursor).toBeNull();
    });

    it('should pass totalItems through correctly', () => {
      const result = buildPaginatedResponse({
        rows: [],
        totalItems: 42,
        limit: 25,
        sortKey: 'date',
        direction: 'desc',
      });

      expect(result.pagination.totalItems).toBe(42);
    });
  });
});
