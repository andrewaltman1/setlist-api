import { jest } from '@jest/globals';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

jest.unstable_mockModule('../../../src/models/index.ts', () => ({
  sequelize: {
    fn: jest.fn(),
    col: jest.fn(),
    literal: jest.fn(),
  },
  Venue: {
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  },
  Show: {},
  Song: {},
  Version: {},
}));

const { Venue } = await import('../../../src/models/index.ts');
const { listVenues, getVenue, createVenue } = await import('../../../src/services/venueService.ts');

describe('venueService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listVenues', () => {
    it('should call findAndCountAll with default params', async () => {
      (Venue.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [],
        count: 0,
      } as never);

      const result = await listVenues({});

      expect(Venue.findAndCountAll).toHaveBeenCalled();
      expect(result.data).toEqual([]);
      expect(result.pagination.totalItems).toBe(0);
    });

    it('should filter by state', async () => {
      (Venue.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [],
        count: 0,
      } as never);

      await listVenues({ state: 'CO' });

      const call = (Venue.findAndCountAll as jest.Mock).mock.calls[0] as any[];
      expect(call[0].where.state).toBe('CO');
    });

    it('should filter by city and country', async () => {
      (Venue.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [],
        count: 0,
      } as never);

      await listVenues({ city: 'Denver', country: 'USA' });

      const call = (Venue.findAndCountAll as jest.Mock).mock.calls[0] as any[];
      expect(call[0].where.city).toBe('Denver');
      expect(call[0].where.country).toBe('USA');
    });

    it('should format venues as VenueSummary with totalShows', async () => {
      const mockVenue = {
        id: 1,
        name: 'Red Rocks',
        city: 'Morrison',
        state: 'CO',
        country: 'USA',
        geom: { type: 'Point', coordinates: [-105.2, 39.6] },
        getDataValue: jest.fn().mockReturnValue(15),
      };
      (Venue.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [mockVenue],
        count: 1,
      } as never);

      const result = await listVenues({});

      expect(result.data[0]).toEqual({
        id: 1,
        name: 'Red Rocks',
        city: 'Morrison',
        state: 'CO',
        country: 'USA',
        geometry: { type: 'Point', coordinates: [-105.2, 39.6] },
        totalShows: 15,
      });
    });
  });

  describe('getVenue', () => {
    it('should throw NotFoundError when venue does not exist', async () => {
      (Venue.findByPk as jest.Mock).mockResolvedValue(null as never);

      await expect(getVenue(999)).rejects.toThrow('Venue not found');
    });

    it('should return VenueDetail with shows', async () => {
      (Venue.findByPk as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Red Rocks',
        city: 'Morrison',
        state: 'CO',
        country: 'USA',
        geom: null,
        shows: [
          { id: 10, date: '2024-01-15' },
          { id: 20, date: '2023-06-01' },
        ],
      } as never);

      const result = await getVenue(1);

      expect(result.totalShows).toBe(2);
      expect(result.shows).toHaveLength(2);
    });
  });

  describe('createVenue', () => {
    it('should create venue with correct fields', async () => {
      (Venue.create as jest.Mock).mockResolvedValue({
        id: 5,
        name: 'New Venue',
        city: 'Boulder',
        state: 'CO',
        country: 'USA',
        geom: null,
      } as never);

      const result = await createVenue(
        { name: 'New Venue', city: 'Boulder', state: 'CO', country: 'USA' },
        1,
      );

      expect(Venue.create).toHaveBeenCalledWith({
        name: 'New Venue',
        city: 'Boulder',
        state: 'CO',
        country: 'USA',
        geom: null,
        createdBy: 1,
      });
      expect(result.id).toBe(5);
      expect(result.totalShows).toBe(0);
    });
  });
});
