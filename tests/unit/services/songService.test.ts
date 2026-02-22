import { jest } from '@jest/globals';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

jest.unstable_mockModule('../../../src/models/index.ts', () => ({
  sequelize: {
    fn: jest.fn(),
    col: jest.fn(),
    literal: jest.fn(),
    query: jest.fn(),
  },
  Song: {
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
  },
  Version: {},
  Show: {},
  Venue: {},
}));

const { sequelize, Song } = await import('../../../src/models/index.ts');
const { listSongs, getSong, lookupSongs } = await import('../../../src/services/songService.ts');

describe('songService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listSongs', () => {
    it('should filter by isSong=true and deleted=false by default', async () => {
      (Song.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [],
        count: 0,
      } as never);

      await listSongs({});

      const call = (Song.findAndCountAll as jest.Mock).mock.calls[0] as any[];
      expect(call[0].where.isSong).toBe(true);
      expect(call[0].where.deleted).toBe(false);
    });

    it('should format songs as SongSummary', async () => {
      const mockSong = {
        id: 1,
        title: 'Fire on the Mountain',
        author: 'Mickey Hart',
        getDataValue: jest.fn().mockReturnValue(42),
      };
      (Song.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [mockSong],
        count: 1,
      } as never);

      const result = await listSongs({});

      expect(result.data[0]).toEqual({
        id: 1,
        title: 'Fire on the Mountain',
        author: 'Mickey Hart',
        timesPlayed: 42,
      });
    });

    it('should return pagination envelope', async () => {
      (Song.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [],
        count: 100,
      } as never);

      const result = await listSongs({ limit: 25 });

      expect(result.pagination.totalItems).toBe(100);
    });
  });

  describe('getSong', () => {
    it('should throw NotFoundError when song does not exist', async () => {
      (Song.findByPk as jest.Mock).mockResolvedValue(null as never);

      await expect(getSong(999)).rejects.toThrow('Song not found');
    });

    it('should return SongDetail with computed stats', async () => {
      (Song.findByPk as jest.Mock).mockResolvedValue({
        id: 1,
        title: 'Test Song',
        author: 'Test Author',
        notes: 'Some notes',
        instrumental: false,
        versions: [
          { show: { id: 10, date: '2024-01-15', venue: { name: 'Venue A' } } },
          { show: { id: 20, date: '2023-06-01', venue: { name: 'Venue B' } } },
        ],
      } as never);

      const result = await getSong(1);

      expect(result.timesPlayed).toBe(2);
      expect(result.firstPlayed).toBe('2023-06-01');
      expect(result.lastPlayed).toBe('2024-01-15');
      expect(result.shows).toHaveLength(2);
      expect(result.shows[0].showId).toBe(10);
    });
  });

  describe('lookupSongs', () => {
    it('should resolve matching titles and classify by confidence', async () => {
      (sequelize.query as jest.Mock)
        .mockResolvedValueOnce([{ id: 1, title: 'Fire on the Mountain', confidence: '0.85' }] as never)
        .mockResolvedValueOnce([{ id: 2, title: 'Dark Star', confidence: '0.55' }] as never);

      const result = await lookupSongs(['Fire on the Mountain', 'Dark Star']);

      expect(result.resolved['Fire on the Mountain'].matchType).toBe('exact');
      expect(result.resolved['Dark Star'].matchType).toBe('fuzzy');
      expect(result.unresolved).toEqual([]);
    });

    it('should add unmatched titles to unresolved', async () => {
      (sequelize.query as jest.Mock).mockResolvedValue([] as never);

      const result = await lookupSongs(['Nonexistent Song']);

      expect(result.unresolved).toEqual(['Nonexistent Song']);
      expect(Object.keys(result.resolved)).toHaveLength(0);
    });
  });
});
