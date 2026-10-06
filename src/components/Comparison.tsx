import { useId, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, Play } from 'lucide-react';
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const choiceGroup = useId();
  const selectedSong = songs.find((song) => song.id === selectedId);
  const selectedSide = songs.findIndex((song) => song.id === selectedId);

  return <>
    <div className="song-pair" role="group" aria-label="Choose the song you prefer">
      {songs.map((song, index) => {
        const album = albumById.get(song.primaryAlbumId)!;
        const selected = selectedId === song.id;
        return <article className={`song-card song-${index}${selected ? ' is-chosen' : ''}`} key={song.id} aria-labelledby={`song-${song.id}`} onClick={() => setSelectedId(song.id)}>
          <div className="song-side"><span className="song-choice-badge" aria-hidden="true"><span className="song-choice-mark">{selected && <Check size={12} />}</span>SIDE {index === 0 ? 'A' : 'B'}{selected && <span className="chosen-label"> · YOUR PICK</span>}</span><button className={`listen-button ${listeningId === song.id ? 'selected' : ''}`} aria-pressed={listeningId === song.id} onClick={(event) => { event.stopPropagation(); onListen(song); }} aria-label={`Listen to ${song.title}`}><Play size={14} /><span>{listeningId === song.id ? 'In the player' : 'Listen'}</span></button></div>
          <label className="song-choice">
            <input className="song-choice-input" type="radio" name={choiceGroup} value={song.id} checked={selected} onChange={() => setSelectedId(song.id)} aria-label={`Prefer ${song.title}`} />
            <div className="sleeve"><AlbumArt key={album.id} album={album} /></div>
            <div className="song-caption">
              <h3 id={`song-${song.id}`}>{song.title}</h3>
              <p>{song.album} <span>· {album.year}</span></p>
            </div>
          </label>
        </article>;
      })}
    </div>
    <div className={`vote-tray${selectedSong ? ` choice-${selectedSide === 0 ? 'a' : 'b'}` : ''}`}>
      <p className="vote-prompt" role="status">{selectedSong ? <>{selectedSide === 0 ? <ArrowLeft size={15} aria-hidden="true" /> : <ArrowRight size={15} aria-hidden="true" />}<span><strong>{selectedSong.title}</strong> is…</span></> : <span>Pick a song above, then choose how much.</span>}</p>
      <div className="vote-buttons" role="group" aria-label={selectedSong ? `How much do you prefer ${selectedSong.title}?` : 'Preference strength'}>
        {strengths.map(({ value, label, hint }) => <button key={value} disabled={!selectedSong} onClick={() => { if (selectedSong) onAnswer(selectedSong.id, value); }} aria-label={selectedSong ? `${selectedSong.title}: ${label}` : label}>
          <span className="vote-copy"><strong>{label}</strong><small>{hint}</small></span>
        </button>)}
      </div>
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
