import { useState } from 'react';
import { ArrowLeft, ArrowRight, Search, Share2 } from 'lucide-react';
import { albumById } from '../data/songs';
import type { Rating } from '../ranking/model';
import { AlbumArt } from './AlbumArt';

interface RankingProps {
  ratings: Rating[];
  comparisonCount: number;
  demo: boolean;
  onPublish: () => void;
}

export function Ranking({ ratings, comparisonCount, demo, onPublish }: RankingProps) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const ranked = ratings.filter((rating) => rating.comparisonCount > 0);
  const lineup = [...ranked, ...ratings.filter((rating) => rating.comparisonCount === 0)];
  const visible = expanded
    ? lineup.filter((rating) => `${rating.song.title} ${rating.song.album}`.toLowerCase().includes(query.toLowerCase()))
    : ranked.slice(0, 5);

  return <aside className="ranking-panel" aria-labelledby="ranking-title">
    <div className="ranking-heading">
      <div><span className="eyebrow">{demo ? 'SAMPLE RANKING' : 'YOUR RANKING'}</span><h2 id="ranking-title">The hit parade</h2></div>
      <span className="chart-star" aria-hidden="true">✺</span>
    </div>
    <div className="ranking-content">
      <div className="chart-label"><span>{expanded ? `ALL ${ratings.length} SONGS` : 'TOP FIVE'}</span><span>{expanded ? <abbr title="Relative preference scores, based on your votes">SCORE</abbr> : <><i className="live-dot" /> {demo ? 'DEMO' : 'LIVE'}</>}</span></div>
      {expanded && <label className="search-box"><Search size={16} /><input aria-label="Search songs" placeholder="Find a song or album…" value={query} onChange={(event) => setQuery(event.target.value)} /></label>}
      {!expanded && !ranked.length && <div className="ranking-empty"><div className="empty-record" aria-hidden="true">✺</div><h3>Your next number one?</h3><p>Cast a vote to start your chart.</p></div>}
      <ol className={`ranking-list ${expanded ? 'expanded' : ''}`}>
        {visible.map((rating) => <li key={rating.song.id}>
          <span className="rank-number" aria-label={rating.comparisonCount ? `Rank ${ranked.indexOf(rating) + 1}` : 'Unranked'}>{rating.comparisonCount ? String(ranked.indexOf(rating) + 1).padStart(2, '0') : '—'}</span>
          <div className="mini-sleeve"><AlbumArt key={rating.song.primaryAlbumId} album={albumById.get(rating.song.primaryAlbumId)!} mini /></div>
          <div className="rank-song"><strong>{rating.song.title}</strong><small>{!rating.comparisonCount ? 'Not compared yet' : expanded ? `${rating.comparisonCount} ${rating.comparisonCount === 1 ? 'comparison' : 'comparisons'}` : rating.song.album}</small></div>
          {expanded && <span className="rating">{rating.comparisonCount ? rating.rating.toFixed(2) : '—'}</span>}
        </li>)}
      </ol>
      {expanded && !visible.length && <p className="no-results">No songs found. Try another title or album.</p>}
      <button className="view-ranking" aria-expanded={expanded} onClick={() => { setExpanded(!expanded); setQuery(''); }}>{expanded ? <><ArrowLeft size={15} /> Back to top five</> : <>View full ranking <ArrowRight size={15} /></>}</button>
      <div className="progress-section">
        <div className="progress-title"><span>Songs compared</span><span><strong>{ranked.length}</strong> / {ratings.length}</span></div>
        <div className="progress-bar" role="progressbar" aria-label="Songs encountered" aria-valuemin={0} aria-valuemax={ratings.length} aria-valuenow={ranked.length}><div style={{ width: `${ranked.length / ratings.length * 100}%` }} /></div>
        <p><strong data-testid="comparison-count">{comparisonCount}</strong> {comparisonCount === 1 ? 'vote' : 'votes'}{demo && <span>Sample votes</span>}</p>
        <button className="ranking-publish text-button" onClick={onPublish}><Share2 size={14} /> Publish & share your progress <ArrowRight size={14} /></button>
      </div>
    </div>
  </aside>;
}
