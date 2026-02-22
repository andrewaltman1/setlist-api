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

jest.unstable_mockModule('../../../src/services/venueService.ts', () => ({
  listVenues: jest.fn(),
  getVenue: jest.fn(),
  createVenue: jest.fn(),
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

jest.unstable_mockModule('../../../src/services/statsService.ts', () => ({
  getStats: jest.fn(),
}));

const { listVenues, getVenue, createVenue } = await import('../../../src/services/venueService.ts');
const { default: supertest } = await import('supertest');
const { default: app } = await import('../../../src/app.ts');
const { generateTestToken } = await import('../../helpers/setup.ts');
const { NotFoundError } = await import('../../../src/utils/errors.ts');

const request = supertest(app);

describe('Venue routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /v1/venues', () => {
    it('should return 200 with paginated response', async () => {
      (listVenues as jest.Mock).mockResolvedValue({
        data: [{ id: 1, name: 'Red Rocks', city: 'Morrison', state: 'CO', country: 'USA', geometry: null, totalShows: 10 }],
        pagination: { nextCursor: null, previousCursor: null, totalItems: 1 },
      } as never);

      const res = await request.get('/v1/venues');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('should pass query params to service', async () => {
      (listVenues as jest.Mock).mockResolvedValue({
        data: [],
        pagination: { nextCursor: null, previousCursor: null, totalItems: 0 },
      } as never);

      await request.get('/v1/venues?state=CO&sortBy=name&direction=asc');

      expect(listVenues).toHaveBeenCalledWith(
        expect.objectContaining({
          state: 'CO',
          sortBy: 'name',
          direction: 'asc',
        }),
      );
    });
  });

  describe('GET /v1/venues/:venueId', () => {
    it('should return 200 with venue detail', async () => {
      (getVenue as jest.Mock).mockResolvedValue({
        id: 1, name: 'Red Rocks', city: 'Morrison', state: 'CO', country: 'USA',
        geometry: null, totalShows: 5, shows: [],
      } as never);

      const res = await request.get('/v1/venues/1');

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(1);
    });

    it('should return 404 when not found', async () => {
      (getVenue as jest.Mock).mockRejectedValue(new NotFoundError('Venue not found') as never);

      const res = await request.get('/v1/venues/999');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /v1/venues', () => {
    it('should return 401 without auth', async () => {
      const res = await request.post('/v1/venues').send({
        name: 'Test', city: 'Test', state: 'CO', country: 'USA',
      });

      expect(res.status).toBe(401);
    });

    it('should return 201 with auth and valid body', async () => {
      const token = generateTestToken();
      (createVenue as jest.Mock).mockResolvedValue({
        id: 5, name: 'New Venue', city: 'Boulder', state: 'CO', country: 'USA',
        geometry: null, totalShows: 0,
      } as never);

      const res = await request
        .post('/v1/venues')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Venue', city: 'Boulder', state: 'CO', country: 'USA' });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe(5);
    });

    it('should return 400 with auth and invalid body', async () => {
      const token = generateTestToken();

      const res = await request
        .post('/v1/venues')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Missing fields' });

      expect(res.status).toBe(400);
    });
  });
});
