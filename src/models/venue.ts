class Venue {
  name: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  geometry: any;
  shows: Array<{ id: number; date: string }>;

  constructor(venue: any, shows?: any) {
    (this.name = venue.name || null),
      (this.city = venue.city || null),
      (this.state = venue.state || null),
      (this.country = venue.country || null),
      (this.geometry = JSON.parse(venue.geometry) || null),
      (this.shows = !shows ? [] : this.showFormatter(shows));
  }

  showFormatter(arr: any[]) {
    return arr.map((el) => {
      return {
        id: el.showId,
        date: el.date.toLocaleDateString(),
      };
    });
  }
}

export default Venue;
