import { Check, ChevronDown, Play } from 'lucide-react';
import { albumById, type Song } from '../data/songs';
import type { Strength } from '../ranking/model';
import { AlbumArt } from './AlbumArt';

const strengths: { value: Strength; label: string; hint: string }[] = [
  { value: 'slight', label: 'Slightly better', hint: 'A close call' },
  { value: 'better', label: 'Better', hint: 'My pick' },
  { value: 'much', label: 'Much better', hint: 'Clear favourite' },
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
            {strengths.map(({ value, label, hint }) => <button key={value} onClick={() => onAnswer(song.id, value)} aria-label={`${song.title}: ${label}`}>
              <span className="vote-copy"><strong>{label}</strong><small>{hint}</small></span>
              <span className="vote-action" aria-hidden="true"><Check size={14} strokeWidth={2} /></span>
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
