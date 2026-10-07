import { useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Disc3, Music2, Pencil, Search, Share2, X } from 'lucide-react';
import { albums, albumById } from '../data/songs';
import { compareFamiliarity } from '../data/familiarity';
import { RANKING_NAME_LIMIT, validateRankingName } from '../data/rankingNames';
import { calculateAlbumRatings } from '../ranking/albumRatings';
import type { Rating } from '../ranking/model';
import { AlbumArt } from './AlbumArt';

interface RankingProps {
  ratings: Rating[];
  comparisonCount: number;
  demo: boolean;
  rankingName: string;
  onRename: (name: string) => void;
  onPublish: () => void;
}

export function Ranking({ ratings, comparisonCount, demo, rankingName, onRename, onPublish }: RankingProps) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<'songs' | 'albums'>('songs');
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(rankingName);
  const [nameError, setNameError] = useState('');
  const editButton = useRef<HTMLButtonElement>(null);
  const ranked = ratings.filter((rating) => rating.comparisonCount > 0);
  const lineup = [...ranked, ...ratings.filter((rating) => rating.comparisonCount === 0).sort((a, b) => compareFamiliarity(a.song, b.song))];
  const albumRatings = useMemo(() => calculateAlbumRatings(albums.filter((album) => album.scope === 'core'), ratings), [ratings]);
  const rankedAlbums = albumRatings.filter((rating) => rating.score !== null);
  const visibleAlbums = expanded ? albumRatings.filter((rating) => rating.album.title.toLowerCase().includes(query.toLowerCase())) : rankedAlbums.slice(0, 5);
  const visible = expanded
    ? lineup.filter((rating) => `${rating.song.title} ${rating.song.album}`.toLowerCase().includes(query.toLowerCase()))
    : ranked.slice(0, 5);

  function finishEditing(): void {
    setEditing(false);
    setNameError('');
    window.requestAnimationFrame(() => editButton.current?.focus());
  }

  function saveName(): void {
    try { onRename(validateRankingName(draftName)); finishEditing(); }
    catch (error) { setNameError((error as Error).message); }
  }

  return <aside className="ranking-panel" aria-labelledby="ranking-title">
    <div className="ranking-heading">
      <div className="ranking-heading-copy"><span className="eyebrow">{demo ? 'SAMPLE RANKING' : 'YOUR RANKING'}</span><div className="ranking-name"><h2 id="ranking-title">{rankingName}</h2><button ref={editButton} className="edit-ranking-name" aria-label="Edit ranking name" title="Edit ranking name" onClick={() => { setDraftName(rankingName); setNameError(''); setEditing(true); }}><Pencil size={16} strokeWidth={1.75} /></button></div>
        {editing && <form className="ranking-name-form" onSubmit={(event) => { event.preventDefault(); saveName(); }} onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); finishEditing(); } }}>
          <label htmlFor="ranking-name-input">Name your ranking</label><input id="ranking-name-input" autoFocus value={draftName} maxLength={RANKING_NAME_LIMIT} aria-invalid={Boolean(nameError)} aria-describedby={nameError ? 'ranking-name-error' : undefined} onFocus={(event) => event.currentTarget.select()} onChange={(event) => { setDraftName(event.target.value); setNameError(''); }} />
          {nameError && <p id="ranking-name-error" role="alert">{nameError}</p>}
          <div><button type="submit"><Check size={14} /> Save name</button><button type="button" onClick={finishEditing}><X size={14} /> Cancel</button></div>
        </form>}
      </div>
      {!editing && <Disc3 className="chart-record" size={36} strokeWidth={1.25} aria-hidden="true" />}
    </div>
    <div className="ranking-content">
      <div className="ranking-kind" aria-label="Ranking type"><button aria-pressed={kind === 'songs'} onClick={() => { setKind('songs'); setQuery(''); }}><Music2 size={14} /> Songs</button><button aria-pressed={kind === 'albums'} onClick={() => { setKind('albums'); setQuery(''); }}><Disc3 size={14} /> Albums</button></div>
      {kind === 'albums' && <p className="album-rating-note">Album scores average your compared songs’ chart positions, out of 100. More compared tracks give a fuller picture.</p>}
      <div className="chart-label"><span>{expanded ? `ALL ${kind === 'songs' ? ratings.length : albumRatings.length} ${kind.toUpperCase()}` : 'TOP FIVE'}</span><span>{kind === 'albums' ? <abbr title="Average chart position: top song = 100, bottom = 0. Uncompared tracks are excluded.">/ 100</abbr> : expanded ? <abbr title="Relative preference scores, based on your votes">SCORE</abbr> : <><i className="live-dot" /> {demo ? 'DEMO' : 'LIVE'}</>}</span></div>
      {expanded && <label className="search-box"><Search size={16} /><input aria-label={`Search ${kind}`} placeholder={kind === 'songs' ? 'Find a song or album…' : 'Find an album…'} value={query} onChange={(event) => setQuery(event.target.value)} /></label>}
      {!expanded && !(kind === 'songs' ? ranked.length : rankedAlbums.length) && <div className="ranking-empty"><div className="empty-record" aria-hidden="true"><span className="record-label"><Music2 size={19} strokeWidth={1.75} /></span></div><h3>Your next number one?</h3><p>Cast a vote to start your {kind === 'songs' ? 'chart' : 'album chart'}.</p></div>}
      <ol className={`ranking-list ${expanded ? 'expanded' : ''}`} aria-label={`${kind === 'songs' ? 'Song' : 'Album'} ranking`}>
        {kind === 'albums' ? visibleAlbums.map((rating) => <li key={rating.album.id}>
          <span className="rank-number" aria-label={rating.score !== null ? `Rank ${rankedAlbums.indexOf(rating) + 1}` : 'Unranked'}>{rating.score !== null ? String(rankedAlbums.indexOf(rating) + 1).padStart(2, '0') : '—'}</span>
          <div className="mini-sleeve"><AlbumArt key={rating.album.id} album={rating.album} mini /></div>
          <div className="rank-song"><strong>{rating.album.title}</strong><small>{rating.comparedSongs} / {rating.totalSongs} songs compared{rating.comparedSongs < rating.totalSongs && rating.comparedSongs > 0 ? ' · Provisional' : ''}</small></div>
          <span className="rating" aria-label={rating.score !== null ? `${rating.score.toFixed(1)} out of 100` : 'Not rated yet'}>{rating.score !== null ? rating.score.toFixed(1) : '—'}</span>
        </li>) :
        visible.map((rating) => <li key={rating.song.id}>
          <span className="rank-number" aria-label={rating.comparisonCount ? `Rank ${ranked.indexOf(rating) + 1}` : 'Unranked'}>{rating.comparisonCount ? String(ranked.indexOf(rating) + 1).padStart(2, '0') : '—'}</span>
          <div className="mini-sleeve"><AlbumArt key={rating.song.primaryAlbumId} album={albumById.get(rating.song.primaryAlbumId)!} mini /></div>
          <div className="rank-song"><strong>{rating.song.title}</strong><small>{!rating.comparisonCount ? 'Not compared yet' : expanded ? `${rating.comparisonCount} ${rating.comparisonCount === 1 ? 'comparison' : 'comparisons'}` : rating.song.album}</small></div>
          {expanded && <span className="rating">{rating.comparisonCount ? rating.rating.toFixed(2) : '—'}</span>}
        </li>)}
      </ol>
      {expanded && !(kind === 'songs' ? visible.length : visibleAlbums.length) && <p className="no-results">No {kind} found. Try another {kind === 'songs' ? 'title or album' : 'album'}.</p>}
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
