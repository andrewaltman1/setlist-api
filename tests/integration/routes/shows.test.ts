import { jest } from '@jest/globals';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

// Mock models to prevent DB connection
jest.unstable_mockModule('../../../src/models/index.ts', () => ({
  sequelize: { transaction: jest.fn() },
  Show: {},
  Song: {},
  Venue: {},
  Version: {},
}));

// Mock the show service
jest.unstable_mockModule('../../../src/services/showService.ts', () => ({
  listShows: jest.fn(),
  getShow: jest.fn(),
  createShow: jest.fn(),
}));

const { listShows, getShow, createShow } = await import('../../../src/services/showService.ts');
const { default: supertest } = await import('supertest');
const { default: app } = await import('../../../src/app.ts');
const { generateTestToken } = await import('../../helpers/setup.ts');
const { NotFoundError } = await import('../../../src/utils/errors.ts');

const request = supertest(app);

describe('Show routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /v1/shows', () => {
    it('should return 200 with paginated response', async () => {
      const mockResponse = {
        data: [{ id: 1, date: '2024-01-15', venue: { id: 1, name: 'Red Rocks' }, notes: null }],
        pagination: { nextCursor: null, previousCursor: null, totalItems: 1 },
      };
      (listShows as jest.Mock).mockResolvedValue(mockResponse as never);

      const res = await request.get('/v1/shows');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination).toBeDefined();
    });

    it('should pass query params to service', async () => {
      (listShows as jest.Mock).mockResolvedValue({
        data: [],
        pagination: { nextCursor: null, previousCursor: null, totalItems: 0 },
      } as never);

      await request.get('/v1/shows?limit=10&sortBy=date&direction=asc&year=2024');

      expect(listShows).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          sortBy: 'date',
          direction: 'asc',
          year: 2024,
        }),
      );
    });

    it('should return 400 for invalid query params', async () => {
      const res = await request.get('/v1/shows?limit=0');

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('GET /v1/shows/:showId', () => {
    it('should return 200 with show detail', async () => {
      const mockShow = { id: 1, date: '2024-01-15', sets: {}, setCount: 1, didEncore: false };
      (getShow as jest.Mock).mockResolvedValue(mockShow as never);

      const res = await request.get('/v1/shows/1');

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(1);
    });

    it('should return 404 when show not found', async () => {
      (getShow as jest.Mock).mockRejectedValue(new NotFoundError('Show not found') as never);

      const res = await request.get('/v1/shows/999999');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /v1/shows', () => {
    it('should return 401 without auth', async () => {
      const res = await request.post('/v1/shows').send({
        date: '2024-06-01',
        venueId: 1,
        songs: [],
      });

      expect(res.status).toBe(401);
    });

    it('should return 201 with auth and valid body', async () => {
      (createShow as jest.Mock).mockResolvedValue({ id: 10, date: '2024-06-01' } as never);
      const token = generateTestToken();

      const res = await request
        .post('/v1/shows')
        .set('Authorization', `Bearer ${token}`)
        .send({
          date: '2024-06-01',
          venueId: 1,
          songs: [{ songId: 1, position: 1, setNumber: '1', transition: false }],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe(10);
    });

    it('should return 422 with auth and invalid body', async () => {
      const token = generateTestToken();

      const res = await request
        .post('/v1/shows')
        .set('Authorization', `Bearer ${token}`)
        .send({ date: 'not-a-date' });

      expect(res.status).toBe(422);
    });
  });
});
