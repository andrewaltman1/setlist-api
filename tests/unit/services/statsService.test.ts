import { jest } from '@jest/globals';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

jest.unstable_mockModule('../../../src/models/index.ts', () => ({
  sequelize: {},
  Show: {
    count: jest.fn(),
    min: jest.fn(),
    max: jest.fn(),
    findOne: jest.fn(),
  },
  Song: {
    count: jest.fn(),
  },
  Venue: {
    count: jest.fn(),
  },
  Version: {},
}));

const { Show, Song, Venue } = await import('../../../src/models/index.ts');
const { getStats } = await import('../../../src/services/statsService.ts');

describe('statsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return stats matching the Stats schema', async () => {
    (Show.count as jest.Mock).mockResolvedValue(2094 as never);
    (Song.count as jest.Mock).mockResolvedValue(645 as never);
    // Venue.count is called 3 times: total, distinct city, distinct state
    (Venue.count as jest.Mock)
      .mockResolvedValueOnce(949 as never)
      .mockResolvedValueOnce(300 as never)
      .mockResolvedValueOnce(45 as never);

    (Show.min as jest.Mock).mockResolvedValue('1995-06-15' as never);
    (Show.max as jest.Mock).mockResolvedValue('2024-08-10' as never);

    (Show.findOne as jest.Mock).mockResolvedValue({
      id: 2094,
      date: '2024-08-10',
      venue: { name: 'Red Rocks' },
    } as never);

    const result = await getStats();

    expect(result.totalShows).toBe(2094);
    expect(result.totalSongs).toBe(645);
    expect(result.totalVenues).toBe(949);
    expect(result.uniqueCities).toBe(300);
    expect(result.uniqueStates).toBe(45);
    expect(result.yearsActive).toBe(30); // 2024 - 1995 + 1
    expect(result.mostRecentShow).toEqual({
      id: 2094,
      date: '2024-08-10',
      venueName: 'Red Rocks',
    });
  });

  it('should handle no shows gracefully', async () => {
    (Show.count as jest.Mock).mockResolvedValue(0 as never);
    (Song.count as jest.Mock).mockResolvedValue(0 as never);
    (Venue.count as jest.Mock).mockResolvedValue(0 as never);
    (Show.min as jest.Mock).mockResolvedValue(null as never);
    (Show.max as jest.Mock).mockResolvedValue(null as never);
    (Show.findOne as jest.Mock).mockResolvedValue(null as never);

    const result = await getStats();

    expect(result.yearsActive).toBe(0);
    expect(result.mostRecentShow).toBeNull();
  });
});
