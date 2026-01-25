interface Feature {
  type: "Feature";
  properties: {
    venueId: number | null;
    venue: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    date: string | null;
    showId: number | null;
    total: number | null;
    mostRecent: string | null;
  };
  geometry: any;
}

class FeatureCollection {
  type: "FeatureCollection";
  features: Feature[];

  constructor(features: any[]) {
    (this.type = "FeatureCollection"),
      (this.features = features.map((feature) => {
        return {
          type: "Feature" as const,
          properties: {
            venueId: +feature.venueId || null,
            venue: feature.venueName || null,
            city: feature.city || null,
            state: feature.state || null,
            country: feature.country || null,
            date: !feature.date
              ? null
              : feature.date,
            showId: +feature.showId || null,
            total: +feature.total || null,
            mostRecent: feature.mostRecent || null,
          },
          geometry: JSON.parse(feature.geometry),
        };
      }));
  }
}

export default FeatureCollection;
