import { jest } from '@jest/globals';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

// Mock the models module
jest.unstable_mockModule('../../../src/models/index.ts', () => ({
  sequelize: {
    where: jest.fn(),
    fn: jest.fn(),
    literal: jest.fn(),
    col: jest.fn(),
    transaction: jest.fn(),
  },
  Show: {
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  },
  Venue: {
    findByPk: jest.fn(),
  },
  Version: {
    bulkCreate: jest.fn(),
  },
  Song: {},
}));

const { sequelize, Show, Venue, Version } = await import('../../../src/models/index.ts');
const { listShows, getShow, createShow } = await import('../../../src/services/showService.ts');

describe('showService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listShows', () => {
    it('should call findAndCountAll with default params', async () => {
      (Show.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [],
        count: 0,
      } as never);

      const result = await listShows({});

      expect(Show.findAndCountAll).toHaveBeenCalled();
      expect(result.data).toEqual([]);
      expect(result.pagination.totalItems).toBe(0);
      expect(result.pagination.nextCursor).toBeNull();
    });

    it('should format show rows correctly', async () => {
      (Show.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [
          {
            id: 1,
            date: '2024-01-15',
            showNotes: 'Great show',
            venue: {
              id: 1,
              name: 'Red Rocks',
              city: 'Morrison',
              state: 'CO',
              country: 'USA',
              geom: { type: 'Point', coordinates: [-105.2, 39.6] },
            },
          },
        ],
        count: 1,
      } as never);

      const result = await listShows({});

      expect(result.data[0]).toEqual({
        id: 1,
        date: '2024-01-15',
        venue: {
          id: 1,
          name: 'Red Rocks',
          city: 'Morrison',
          state: 'CO',
          country: 'USA',
          geometry: { type: 'Point', coordinates: [-105.2, 39.6] },
        },
        notes: 'Great show',
      });
    });

    it('should pass venueId filter as where condition', async () => {
      (Show.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [],
        count: 0,
      } as never);

      await listShows({ venueId: 42 });

      const call = (Show.findAndCountAll as jest.Mock).mock.calls[0] as any[];
      expect(call[0].where.venueId).toBe(42);
    });

    it('should return pagination envelope with totalItems', async () => {
      (Show.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [],
        count: 50,
      } as never);

      const result = await listShows({ limit: 25 });

      expect(result.pagination.totalItems).toBe(50);
    });
  });

  describe('getShow', () => {
    it('should throw NotFoundError when show does not exist', async () => {
      (Show.findByPk as jest.Mock).mockResolvedValue(null as never);

      await expect(getShow(999)).rejects.toThrow('Show not found');
    });

    it('should return ShowDetail shape with sets grouped correctly', async () => {
      (Show.findByPk as jest.Mock).mockResolvedValue({
        id: 1,
        date: '2024-01-15',
        showNotes: 'Test notes',
        venue: {
          id: 1,
          name: 'Red Rocks',
          city: 'Morrison',
          state: 'CO',
          country: 'USA',
          geom: null,
        },
        versions: [
          { setNumber: '1', position: 1, transition: false, versionNotes: null, song: { id: 1, title: 'Song A' } },
          { setNumber: '1', position: 2, transition: true, versionNotes: null, song: { id: 2, title: 'Song B' } },
          { setNumber: '2', position: 1, transition: false, versionNotes: null, song: { id: 3, title: 'Song C' } },
          { setNumber: 'Encore', position: 1, transition: false, versionNotes: 'epic', song: { id: 4, title: 'Song D' } },
        ],
      } as never);

      const result = await getShow(1);

      expect(result.id).toBe(1);
      expect(result.setCount).toBe(2);
      expect(result.didEncore).toBe(true);
      expect(result.sets['1']).toHaveLength(2);
      expect(result.sets['2']).toHaveLength(1);
      expect(result.sets['E']).toHaveLength(1);
      expect(result.sets['E'][0].versionNotes).toBe('epic');
    });

    it('should map set_number values correctly', async () => {
      (Show.findByPk as jest.Mock).mockResolvedValue({
        id: 1,
        date: '2024-01-15',
        showNotes: null,
        venue: { id: 1, name: 'V', city: 'C', state: 'S', country: 'USA', geom: null },
        versions: [
          { setNumber: '1st Encore', position: 1, transition: false, versionNotes: null, song: { id: 1, title: 'A' } },
          { setNumber: '2nd Encore', position: 1, transition: false, versionNotes: null, song: { id: 2, title: 'B' } },
          { setNumber: '', position: 1, transition: false, versionNotes: null, song: { id: 3, title: 'C' } },
        ],
      } as never);

      const result = await getShow(1);

      expect(result.sets['E1']).toHaveLength(1);
      expect(result.sets['E2']).toHaveLength(1);
      expect(result.sets['0']).toHaveLength(1);
    });
  });

  describe('createShow', () => {
    it('should create show and versions in a transaction', async () => {
      const mockShow = { id: 10, date: '2024-06-01' };
      (sequelize.transaction as jest.Mock).mockImplementation(async (cb: any) => {
        return cb({});
      });
      (Venue.findByPk as jest.Mock).mockResolvedValue({ id: 1 } as never);
      (Show.create as jest.Mock).mockResolvedValue(mockShow as never);
      (Version.bulkCreate as jest.Mock).mockResolvedValue([] as never);

      const payload = {
        date: '2024-06-01',
        venueId: 1,
        notes: null,
        songs: [
          { songId: 1, position: 1, setNumber: '1', transition: false, versionNotes: null },
        ],
      };

      const result = await createShow(payload, 1);

      expect(result.id).toBe(10);
      expect(result.date).toBe('2024-06-01');
      expect(Show.create).toHaveBeenCalled();
      expect(Version.bulkCreate).toHaveBeenCalled();
    });

    it('should throw ValidationError if venue not found', async () => {
      (sequelize.transaction as jest.Mock).mockImplementation(async (cb: any) => {
        return cb({});
      });
      (Venue.findByPk as jest.Mock).mockResolvedValue(null as never);

      const payload = {
        date: '2024-06-01',
        venueId: 999,
        songs: [{ songId: 1, position: 1, setNumber: '1' }],
      };

      await expect(createShow(payload, 1)).rejects.toThrow('Venue not found');
    });
  });
});
