import { BadRequestError } from './errors.ts';

interface CursorData {
  id: number;
  v: string | number;
}

export function encodeCursor(data: CursorData): string {
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

export function decodeCursor(cursor: string): CursorData {
  try {
    const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
    if (typeof decoded.id !== 'number' || decoded.v === undefined) {
      throw new Error('Invalid cursor shape');
    }
    return decoded as CursorData;
  } catch {
    throw new BadRequestError('Invalid cursor');
  }
}

interface PaginatedInput<T> {
  rows: T[];
  totalItems: number;
  limit: number;
  sortKey: string;
  direction: 'asc' | 'desc';
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    nextCursor: string | null;
    previousCursor: string | null;
    totalItems: number;
  };
}

export function buildPaginatedResponse<T extends Record<string, any>>(
  input: PaginatedInput<T>,
): PaginatedResponse<T> {
  const { rows, totalItems, limit, sortKey, direction: _direction } = input;
  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;

  let nextCursor: string | null = null;
  if (hasMore && data.length > 0) {
    const lastItem = data[data.length - 1];
    nextCursor = encodeCursor({ id: lastItem.id, v: lastItem[sortKey] });
  }

  return {
    data,
    pagination: {
      nextCursor,
      previousCursor: null,
      totalItems,
    },
  };
}
