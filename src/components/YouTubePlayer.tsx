import { ArrowUpRight, Headphones, X } from 'lucide-react';
import type { Song } from '../data/songs';
import { youtubeEmbedUrl, youtubeWatchUrl } from '../media/youtube';

export function YouTubePlayer({ song, onClose }: { song: Song | null; onClose: () => void }) {
  return <section className={`listening-deck ${song ? 'is-loaded' : ''}`} id="listen" aria-label="YouTube listening player">
    <div className="listening-heading"><Headphones size={18} /><div><span className="eyebrow">THE LISTENING DECK</span><strong>{song?.title ?? 'Give either song a spin.'}</strong></div>{song && <button onClick={onClose} aria-label="Close player and stop playback"><X size={18} /></button>}</div>
    {song?.videoId ? <>
      <p className="player-instruction">Press play in the YouTube player. Then choose your favourite above.</p>
      <iframe
        key={song.videoId}
        className="youtube-player"
        src={youtubeEmbedUrl(song.videoId)}
        title={`YouTube: ${song.title} — ${song.kind === 'score' ? 'George Martin' : 'The Beatles'}`}
        referrerPolicy="strict-origin-when-cross-origin"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
      <div className="player-links"><a href={youtubeWatchUrl(song.videoId)} target="_blank" rel="noopener noreferrer">Open on YouTube <ArrowUpRight size={13} /></a><a href={song.sourceUrl} target="_blank" rel="noopener noreferrer">Song facts · Beatles Bible <ArrowUpRight size={13} /></a></div>
      <p className="player-footnote">Playback depends on YouTube availability and your region. If the player is unavailable, try opening it on YouTube.</p>
    </> : <p className="player-instruction">Choose “Listen” on a song to load its video here. Playback starts only when you press play.</p>}
  </section>;
}
