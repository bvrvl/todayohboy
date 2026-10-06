import { ArrowUpRight, Headphones, X } from 'lucide-react';
import type { Song } from '../data/songs';
import { youtubeEmbedUrl, youtubeWatchUrl } from '../media/youtube';

interface YouTubePlayerProps {
  song: Song | null;
  onClose: () => void;
  context?: 'comparison' | 'collection';
}

export function YouTubePlayer({ song, onClose, context = 'comparison' }: YouTubePlayerProps) {
  if (!song) return null;
  return <section className="listening-deck" id="listen" aria-label="YouTube listening player">
    <div className="listening-heading"><Headphones size={18} /><div><span className="eyebrow">THE LISTENING DECK</span><strong>{song.title}</strong></div><button onClick={onClose} aria-label="Close player and stop playback"><X size={18} /></button></div>
    {song.videoId ? <>
      <p className="player-instruction">Press play in the YouTube player. {context === 'comparison' ? 'Then choose your favourite above.' : 'Explore more tracks in the collection below.'}</p>
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
      <p className="player-footnote">If the video won’t play, try opening it on YouTube.</p>
    </> : <p className="player-instruction">No video is available for this song. <a className="source-link" href={song.sourceUrl} target="_blank" rel="noopener noreferrer">Read its story on Beatles Bible ↗</a></p>}
  </section>;
}
