import Venue from "./venue.ts";

interface SongData {
  title: string;
  position: number;
  setNumber: string | number;
  versionNotes: string | null;
  transition: boolean;
}

interface FormattedSong {
  title: string;
  position: number;
  setNumber: string | number;
  versionNotes: string | null;
  transition: boolean;
}

class Show {
  date: string | null;
  venue: Venue;
  notes: string;
  setCount: number | null;
  didEncore: boolean | null;
  songs: Array<FormattedSong>;
  sets: Record<string | number, FormattedSong[]>;

  constructor(date: string, venue: any, songs: SongData[], notes: any) {
    (this.date = new Date(date).toLocaleDateString('en-US', {timeZone: 'UTC'}) || null),
      (this.venue = new Venue(venue) || null),
      (this.notes = notes || null),
      (this.setCount =
        Math.max(
          ...songs
            .filter((song) => song.setNumber != "Encore")
            .map((el) => +el.setNumber)
        ) || null),
      (this.didEncore =
        songs.some((song) => song.setNumber == "Encore") || null),
      (this.songs = this.songFormatter(songs) || []),
      (this.sets = this.sortSets() || {});
  }

  songFormatter(arr: SongData[]) {
    return arr.map((el) => {
      return {
        title: el.title + `${el.transition ? " >" : ""}`,
        position: el.position,
        setNumber: el.setNumber,
        versionNotes: el.versionNotes,
        transition: el.transition,
      };
    });
  }

  sortSets(): Record<string | number, FormattedSong[]> {
    return this.songs.reduce(function (r: Record<string | number, FormattedSong[]>, a) {
      r[a.setNumber] = r[a.setNumber] || [];
      r[a.setNumber].push(a);
      return r;
    }, Object.create(null));
  }
}

export default Show;
