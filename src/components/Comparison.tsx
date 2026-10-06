import { ChevronDown, Play } from 'lucide-react';
import { albumById, type Song } from '../data/songs';
import type { Strength } from '../ranking/model';
import { AlbumArt } from './AlbumArt';

const strengths: { value: Strength; label: string; level: number }[] = [
  { value: 'slight', label: 'Slightly better', level: 1 },
  { value: 'better', label: 'Better', level: 2 },
  { value: 'much', label: 'Much better', level: 3 },
];

interface ComparisonProps {
  songs: Song[];
  listeningId: string | null;
  onListen: (song: Song) => void;
  onAnswer: (songId: string, strength: Strength) => void;
}

export function Comparison({ songs, listeningId, onListen, onAnswer }: ComparisonProps) {
  return <>
    <div className="song-pair">
      {songs.map((song, index) => {
        const album = albumById.get(song.primaryAlbumId)!;
        return <article className={`song-card song-${index}`} key={song.id} aria-labelledby={`song-${song.id}`}>
          <div className="song-side"><span aria-hidden="true">SIDE {index === 0 ? 'A' : 'B'}</span><button className={`listen-button ${listeningId === song.id ? 'selected' : ''}`} aria-pressed={listeningId === song.id} onClick={() => onListen(song)} aria-label={`Listen to ${song.title}`}><Play size={14} /><span>{listeningId === song.id ? 'In the player' : 'Listen'}</span></button></div>
          <div className="sleeve"><AlbumArt key={album.id} album={album} /></div>
          <div className="song-caption">
            <h3 id={`song-${song.id}`}>{song.title}</h3>
            <p>{song.album} <span>· {album.year}</span></p>
          </div>
          <div className="vote-buttons" role="group" aria-label={`Prefer ${song.title}`}>
            <span className="vote-label">I prefer this song…</span>
            {strengths.map(({ value, label, level }) => <button key={value} onClick={() => onAnswer(song.id, value)} aria-label={`${song.title}: ${label}`}>
              <span>{label}</span>
              <span className="strength-meter" aria-hidden="true">{[1, 2, 3].map((step) => <i key={step} className={step <= level ? 'filled' : ''} />)}</span>
            </button>)}
          </div>
        </article>;
      })}
      <span className="versus" aria-hidden="true">or</span>
    </div>
    <details className="comparison-details">
      <summary>About these songs <ChevronDown size={15} /></summary>
      <div className="song-details-grid">{songs.map((song) => <div className="song-facts" key={song.id}>
        <h3>{song.title}</h3>
        <dl>
          {song.writers && <><dt>Written by</dt><dd>{song.writers}</dd></>}
          {song.releaseText && <><dt>First released</dt><dd>{song.releaseText}</dd></>}
          {song.producer && <><dt>Producer</dt><dd>{song.producer}</dd></>}
        </dl>
        <a href={song.sourceUrl} target="_blank" rel="noopener noreferrer">Read the story on Beatles Bible ↗</a>
      </div>)}</div>
    </details>
  </>;
}
