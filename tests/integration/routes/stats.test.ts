import { jest } from '@jest/globals';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

jest.unstable_mockModule('../../../src/models/index.ts', () => ({
  sequelize: {},
  Show: {},
  Song: {},
  Venue: {},
  Version: {},
}));

jest.unstable_mockModule('../../../src/services/statsService.ts', () => ({
  getStats: jest.fn(),
}));

jest.unstable_mockModule('../../../src/services/showService.ts', () => ({
  listShows: jest.fn(),
  getShow: jest.fn(),
  createShow: jest.fn(),
}));

jest.unstable_mockModule('../../../src/services/songService.ts', () => ({
  listSongs: jest.fn(),
  getSong: jest.fn(),
  lookupSongs: jest.fn(),
}));

jest.unstable_mockModule('../../../src/services/venueService.ts', () => ({
  listVenues: jest.fn(),
  getVenue: jest.fn(),
  createVenue: jest.fn(),
}));

const { getStats } = await import('../../../src/services/statsService.ts');
const { default: supertest } = await import('supertest');
const { default: app } = await import('../../../src/app.ts');

const request = supertest(app);

describe('Stats routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /v1/stats', () => {
    it('should return 200 with stats data', async () => {
      (getStats as jest.Mock).mockResolvedValue({
        totalShows: 2094,
        totalSongs: 645,
        totalVenues: 949,
        uniqueCities: 300,
        uniqueStates: 45,
        yearsActive: 30,
        mostRecentShow: { id: 1, date: '2024-08-10', venueName: 'Red Rocks' },
      } as never);

      const res = await request.get('/v1/stats');

      expect(res.status).toBe(200);
      expect(res.body.data.totalShows).toBe(2094);
      expect(res.body.data.mostRecentShow).toBeDefined();
    });
  });

  describe('Catch-all and health check', () => {
    it('should return 404 for non-existent route', async () => {
      const res = await request.get('/v1/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 200 for ELB health check', async () => {
      const res = await request.get('/').set('User-Agent', 'ELB-HealthChecker/2.0');

      expect(res.status).toBe(200);
    });
  });
});
