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

jest.unstable_mockModule('../../../src/services/songService.ts', () => ({
  listSongs: jest.fn(),
  getSong: jest.fn(),
  lookupSongs: jest.fn(),
}));

// Also mock other services to prevent issues
jest.unstable_mockModule('../../../src/services/showService.ts', () => ({
  listShows: jest.fn(),
  getShow: jest.fn(),
  createShow: jest.fn(),
}));

jest.unstable_mockModule('../../../src/services/venueService.ts', () => ({
  listVenues: jest.fn(),
  getVenue: jest.fn(),
  createVenue: jest.fn(),
}));

jest.unstable_mockModule('../../../src/services/statsService.ts', () => ({
  getStats: jest.fn(),
}));

const { listSongs, getSong, lookupSongs } = await import('../../../src/services/songService.ts');
const { default: supertest } = await import('supertest');
const { default: app } = await import('../../../src/app.ts');
const { generateTestToken } = await import('../../helpers/setup.ts');
const { NotFoundError } = await import('../../../src/utils/errors.ts');

const request = supertest(app);

describe('Song routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /v1/songs', () => {
    it('should return 200 with paginated response', async () => {
      (listSongs as jest.Mock).mockResolvedValue({
        data: [{ id: 1, title: 'Test Song', author: 'Author', timesPlayed: 5 }],
        pagination: { nextCursor: null, previousCursor: null, totalItems: 1 },
      } as never);

      const res = await request.get('/v1/songs');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('should pass query params to service', async () => {
      (listSongs as jest.Mock).mockResolvedValue({
        data: [],
        pagination: { nextCursor: null, previousCursor: null, totalItems: 0 },
      } as never);

      await request.get('/v1/songs?limit=10&sortBy=author&direction=asc');

      expect(listSongs).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          sortBy: 'author',
          direction: 'asc',
        }),
      );
    });
  });

  describe('GET /v1/songs/:songId', () => {
    it('should return 200 with song detail', async () => {
      const mockSong = { id: 1, title: 'Test', author: 'Author', timesPlayed: 5, shows: [] };
      (getSong as jest.Mock).mockResolvedValue(mockSong as never);

      const res = await request.get('/v1/songs/1');

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(1);
    });

    it('should return 404 when not found', async () => {
      (getSong as jest.Mock).mockRejectedValue(new NotFoundError('Song not found') as never);

      const res = await request.get('/v1/songs/999');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /v1/songs/lookup', () => {
    it('should return 401 without auth', async () => {
      const res = await request.post('/v1/songs/lookup').send({ titles: ['Test'] });

      expect(res.status).toBe(401);
    });

    it('should return 200 with auth and valid body', async () => {
      const token = generateTestToken();
      (lookupSongs as jest.Mock).mockResolvedValue({
        resolved: { 'Test': { id: 1, title: 'Test', matchType: 'exact', confidence: 0.9 } },
        unresolved: [],
      } as never);

      const res = await request
        .post('/v1/songs/lookup')
        .set('Authorization', `Bearer ${token}`)
        .send({ titles: ['Test'] });

      expect(res.status).toBe(200);
      expect(res.body.data.resolved).toBeDefined();
    });
  });
});
