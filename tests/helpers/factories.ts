export function buildShow(overrides: Record<string, any> = {}) {
  return {
    id: 1,
    date: '2024-01-15',
    venueId: 1,
    showNotes: 'Great show',
    verified: false,
    slug: '2024-01-15',
    archiveInfo: null,
    createdBy: 1,
    updatedBy: null,
    createdByUserName: 'testuser',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    ...overrides,
  };
}

export function buildSong(overrides: Record<string, any> = {}) {
  return {
    id: 1,
    title: 'Test Song',
    author: 'Test Author',
    isSong: true,
    notes: 'Some notes',
    deleted: false,
    instrumental: false,
    slug: 'test-song',
    createdBy: 1,
    updatedBy: null,
    createdByUserName: 'testuser',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    ...overrides,
  };
}

export function buildVenue(overrides: Record<string, any> = {}) {
  return {
    id: 1,
    name: 'Test Venue',
    city: 'Test City',
    state: 'CO',
    country: 'USA',
    geom: { type: 'Point', coordinates: [-105.0, 40.0] },
    createdBy: 1,
    updatedBy: null,
    createdByUserName: 'testuser',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    ...overrides,
  };
}

export function buildVersion(overrides: Record<string, any> = {}) {
  return {
    id: 1,
    showId: 1,
    songId: 1,
    position: 1,
    setNumber: '1',
    transition: false,
    versionNotes: null,
    createdBy: 1,
    updatedBy: null,
    createdByUserName: 'testuser',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    ...overrides,
  };
}

export function buildShowSummary(overrides: Record<string, any> = {}) {
  return {
    id: 1,
    date: '2024-01-15',
    venue: {
      id: 1,
      name: 'Test Venue',
      city: 'Test City',
      state: 'CO',
      country: 'USA',
      geometry: { type: 'Point', coordinates: [-105.0, 40.0] },
    },
    notes: 'Great show',
    ...overrides,
  };
}

export function buildSongSummary(overrides: Record<string, any> = {}) {
  return {
    id: 1,
    title: 'Test Song',
    author: 'Test Author',
    timesPlayed: 5,
    ...overrides,
  };
}

export function buildVenueSummary(overrides: Record<string, any> = {}) {
  return {
    id: 1,
    name: 'Test Venue',
    city: 'Test City',
    state: 'CO',
    country: 'USA',
    geometry: { type: 'Point', coordinates: [-105.0, 40.0] },
    totalShows: 10,
    ...overrides,
  };
}
