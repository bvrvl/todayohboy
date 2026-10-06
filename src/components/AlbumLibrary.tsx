import { useState } from 'react';
import { ArrowUpRight, Play, Search } from 'lucide-react';
import { albums, catalogSongById, type Song } from '../data/songs';
import { AlbumArt } from './AlbumArt';

export function AlbumLibrary({ onListen }: { onListen: (song: Song) => void }) {
  const [selectedId, setSelectedId] = useState('sgt-peppers-lonely-hearts-club-band');
  const [query, setQuery] = useState('');
  const [archive, setArchive] = useState(false);
  const selected = albums.find((a) => a.id === selectedId)!;
  const filtered = albums.filter((a) => (archive || a.scope === 'core') && a.title.toLowerCase().includes(query.toLowerCase()));

  return <section className="album-library" id="library" aria-labelledby="library-title">
    <div className="library-heading"><div><span className="eyebrow">THE RECORD COLLECTION</span><h2 id="library-title">Every sleeve tells a story.</h2><p>The core albums, singles on Past Masters, and a little more to explore.</p></div><span className="collection-seal">13 ALBUMS<br /><b>+</b><br />PAST MASTERS</span></div>
    <div className="library-controls"><label className="search-box"><Search size={16} /><input aria-label="Search albums" placeholder="Find an album…" value={query} onChange={(e) => setQuery(e.target.value)} /></label><label className="archive-toggle"><input type="checkbox" checked={archive} onChange={(e) => setArchive(e.target.checked)} /> Include compilations & live releases</label></div>
    <div className="library-body"><div className="album-grid" aria-label="Album collection">{filtered.map((album) => <button key={album.id} className={`album-tile ${selectedId === album.id ? 'selected' : ''}`} aria-pressed={selectedId === album.id} onClick={() => setSelectedId(album.id)}><div><AlbumArt key={album.id} album={album} /></div><strong>{album.title}</strong><small>{album.year} · {album.scope === 'core' ? 'Core collection' : 'Archive'}</small></button>)}{!filtered.length && <p className="no-results">No albums found.</p>}</div>
      <article className="album-detail" aria-labelledby="album-title"><span className="eyebrow">ON THE TURNTABLE</span><h3 id="album-title">{selected.title}</h3><p className="album-release">Released {selected.releaseText}</p><p>{selected.note}</p><a className="source-link" href={selected.sourceUrl} target="_blank" rel="noopener noreferrer">The album story · Beatles Bible <ArrowUpRight size={14} /></a><h4>{selected.edition} · {selected.tracks.length} tracks</h4><ol className="album-tracks">{selected.tracks.map((track) => {
        const song = track.songId ? catalogSongById.get(track.songId) : undefined;
        // An album appearance can be a different recording from the canonical song's embed.
        const playable = song?.videoId && selected.scope === 'core';
        return <li key={track.position}><span>{String(track.position).padStart(2, '0')}</span><div><strong>{track.title}</strong>{track.version && <small>{track.version}</small>}{track.kind === 'score' && <small>George Martin orchestral score · outside song rankings</small>}</div>{playable && <button onClick={() => onListen(song)} aria-label={`Listen to ${track.title}`}><Play size={14} /></button>}</li>;
      })}</ol>{selected.scope === 'archive' && <p className="archive-note">Archive editions contain alternate mixes, takes, live performances, and speech. Explore their stories at the source; song rankings use the core collection.</p>}</article>
    </div>
    <p className="catalog-credit">Catalog facts and cover images from <a href="https://www.beatlesbible.com/albums/" target="_blank" rel="noopener noreferrer">The Beatles Bible</a>. Album artwork © its respective owners. Videos use the embeds on its song pages.</p>
  </section>;
}
