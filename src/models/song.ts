class Song {
  id: number | null;
  title: string | null;
  author: string | null;
  notes: string | null;
  instrumental: boolean | null;
  timesPlayed: number | null;
  firstTimePlayed: string | null;
  mostRecent: string | null;

  constructor(data: any) {
    (this.id = data.id || null),
      (this.title = data.title || null),
      (this.author = data.author || null),
      (this.notes = data.notes || null),
      (this.instrumental = data.instrumental || null),
      (this.timesPlayed = data.timesPlayed || null),
      (this.firstTimePlayed = data.firstTimePlayed || null),
      (this.mostRecent = data.mostRecent || null);
  }
}

export default Song;
