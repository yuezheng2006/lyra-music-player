// scripts/music-provider-adapters/example-provider-adapter.mjs
// Template for native provider adapters. Copy this file and implement the three handlers.

export async function search({ provider, query, limit, offset }) {
  void provider;
  void query;
  void limit;
  void offset;
  return {
    songs: [],
    total: 0,
    hasMore: false,
  };
}

export async function audio({ provider, id, song, quality }) {
  void provider;
  void id;
  void song;
  void quality;
  return {
    audioUrl: null,
  };
}

export async function lyrics({ provider, id }) {
  void provider;
  void id;
  return {
    lyrics: null,
  };
}
