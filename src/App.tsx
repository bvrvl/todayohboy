import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronDown, Disc3, Headphones, Heart, Info, Play, RotateCcw, Search, SkipForward, Sparkles, Undo2, X } from 'lucide-react';
import { songs, songById, catalogSongById, albumById, totalPairs, type Song } from './data/songs';
import { calculateRatings, pairKey, selectPair, type Pair, type Strength } from './ranking/model';
import { createDemo, loadProgress, saveProgress, type Progress } from './storage/progress';
import { AlbumArt } from './components/AlbumArt';
import { AlbumLibrary } from './components/AlbumLibrary';
import { YouTubePlayer } from './components/YouTubePlayer';

const strengths: { value: Strength; label: string; dots: string }[] = [
  { value: 'slight', label: 'Slightly better', dots: '♡' },
  { value: 'better', label: 'Better', dots: '♡♡' },
  { value: 'much', label: 'Much better', dots: '♡♡♡' },
];

export default function App() {
  const [initial] = useState(loadProgress);
  const [progress, setProgress] = useState<Progress>(initial.progress);
  const [storageError, setStorageError] = useState(initial.error);
  const [saveBlocked, setSaveBlocked] = useState(Boolean(initial.error));
  const [skipped, setSkipped] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  const [dialog, setDialog] = useState<'help' | 'reset' | null>(null);
  const [allSongs, setAllSongs] = useState(false);
  const [query, setQuery] = useState('');
  const [listeningId, setListeningId] = useState<string | null>(null);
  const transitionLock = useRef(false);
  const modalRef = useRef<HTMLDialogElement>(null);
  const modalTrigger = useRef<HTMLElement | null>(null);
  const ratings = useMemo(() => calculateRatings(songs, progress.history), [progress.history]);
  const encountered = ratings.filter((r) => r.comparisonCount > 0).length;
  const activeSongs = progress.activePair?.map((id) => songById.get(id)!);
  const filtered = ratings.filter((r) => `${r.song.title} ${r.song.album}`.toLowerCase().includes(query.toLowerCase()));
  const visible = allSongs ? filtered : ratings.slice(0, 5);

  useEffect(() => {
    if (saveBlocked) return;
    try { saveProgress(progress); setStorageError(null); }
    catch { setStorageError('Your browser could not save progress. This session still works, but may not survive a refresh.'); }
  }, [progress, saveBlocked]);

  useEffect(() => {
    if (dialog) {
      modalTrigger.current = document.activeElement as HTMLElement;
      modalRef.current?.showModal();
    } else {
      modalRef.current?.close();
      modalTrigger.current?.focus();
    }
  }, [dialog]);

  function answer(winnerId: string, strength: Strength) {
    if (!progress.activePair || transitionLock.current) return;
    transitionLock.current = true;
    setListeningId(null);
    window.setTimeout(() => { transitionLock.current = false; }, 250);
    const pair = progress.activePair;
    const history = [...progress.history, { id: crypto.randomUUID(), winnerId, loserId: pair.find((id) => id !== winnerId)!, strength }];
    setProgress({ ...progress, history, activePair: selectPair(songs, history, skipped) });
    setNotice(`${songById.get(winnerId)!.title} gets your vote. Hit parade updated.`);
  }

  function skip() {
    setListeningId(null);
    transitionLock.current = false;
    if (!progress.activePair) return;
    const nextSkipped = [...skipped, pairKey(progress.activePair)];
    setSkipped(nextSkipped);
    setProgress({ ...progress, activePair: selectPair(songs, progress.history, nextSkipped) });
    setNotice('Pair skipped. Your ranking stays the same.');
  }

  function undo() {
    setListeningId(null);
    transitionLock.current = false;
    const last = progress.history.at(-1);
    if (!last) return;
    const pair: Pair = [last.winnerId, last.loserId];
    setSkipped(skipped.filter((key) => key !== pairKey(pair)));
    setProgress({ ...progress, history: progress.history.slice(0, -1), activePair: pair });
    setNotice('Last comparison undone. Give this pair another listen.');
  }

  function reset(demo: boolean) {
    setListeningId(null);
    transitionLock.current = false;
    setSkipped([]);
    setSaveBlocked(false);
    setProgress(demo ? createDemo() : { version: 1, history: [], activePair: selectPair(songs, []), demo: false });
    setNotice(demo ? 'Sample session restored.' : 'A fresh start. Make this hit parade your own.');
    setDialog(null);
  }

  function listen(song: Song) {
    setListeningId(song.id);
    window.requestAnimationFrame(() => document.getElementById('listen')?.scrollIntoView({ behavior: 'auto', block: 'nearest' }));
  }

  return <>
    <div className="top-stripe" />
    <div className="page-shell">
      <header className="site-header">
        <a className="brand" href="#" aria-label="Beatles Ranker home"><span className="brand-seal">B<span>★</span></span><span>Beatles Ranker<small>YOUR PERSONAL HIT PARADE</small></span></a>
        <nav aria-label="Main navigation"><a className="nav-current" href="#compare">The listening room <span>↗</span></a><a className="nav-library" href="#library">The record collection</a><button className="nav-help" onClick={() => setDialog('help')}>How it works <Info size={15} /></button></nav>
        <span className="edition">EST. 1962 <span>✦</span> REIMAGINED FOR YOU</span>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy"><div className="eyebrow"><span className="tiny-sun">✳</span> ALL YOU NEED IS A LITTLE OPINION</div><h1 id="hero-title">Your taste.<br />Their <em>timeless</em> tunes.</h1><p>Two songs. One choice. A Beatles ranking that’s<br className="desktop-break" /> unmistakably, wonderfully yours.</p></div>
          <div className="hero-art" aria-hidden="true"><span className="orbit-caption">A SPLENDID TIME IS GUARANTEED</span><div className="hero-flower">{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ transform: `rotate(${i * 30}deg)` }} />)}<span><Disc3 size={43} strokeWidth={1.3} /></span></div><span className="hero-star star-one">✦</span><span className="hero-star star-two">✧</span><span className="hero-star star-three">✳</span><span className="hero-footnote">{songs.length} songs. Endless good taste.</span></div>
        </section>

        <div className="session-bar"><div><span className="status-dot" /><strong>{progress.demo ? 'A little preview' : 'Your listening session'}</strong><span className="session-text">{progress.demo ? 'Sample votes are loaded. Play around, or start your own.' : 'Every choice brings your favourites into focus.'}</span></div><button onClick={() => progress.demo ? setDialog('reset') : reset(true)}>{progress.demo ? 'Start fresh' : 'Load demo'} <ArrowUpRight size={15} /></button></div>
        {storageError && <p className="storage-warning" role="alert">{storageError}</p>}

        <div className="workspace">
          <section id="compare" className="comparison-panel" aria-labelledby="comparison-title">
            <div className="panel-heading"><div><span className="eyebrow">SIDE A / THE COMPARISON</span><h2 id="comparison-title">Which one strikes a chord?</h2></div><span className="round-icon"><Headphones size={22} strokeWidth={1.5} /></span></div>
            <p className="comparison-hint">Go with your gut. How much more do you love it?</p>
            {activeSongs ? <div className="song-pair" key={progress.activePair!.join(':')}>
              {activeSongs.map((song, index) => <article className={`song-card song-${index}`} key={song.id}>
                <div className="sleeve"><AlbumArt key={song.primaryAlbumId} album={albumById.get(song.primaryAlbumId)!} /></div>
                <div className="song-caption"><span className="track-side">{index === 0 ? '01 / LEFT TRACK' : '02 / RIGHT TRACK'}</span><h3>{song.title}</h3><p>{song.album} <span>· {albumById.get(song.primaryAlbumId)!.year}</span></p></div>
                <button className={`listen-button ${listeningId === song.id ? 'selected' : ''}`} aria-pressed={listeningId === song.id} onClick={() => listen(song)} aria-label={`Listen to ${song.title}`}><Play size={14} /><span>{listeningId === song.id ? 'Loaded in player' : 'Listen on YouTube'}</span></button>
                <details className="song-facts"><summary>Behind the song</summary><dl>{song.writers && <><dt>Written by</dt><dd>{song.writers}</dd></>}{song.releaseText && <><dt>First released</dt><dd>{song.releaseText}</dd></>}{song.producer && <><dt>Producer</dt><dd>{song.producer}</dd></>}</dl><a href={song.sourceUrl} target="_blank" rel="noopener noreferrer">Read the story · Beatles Bible <ArrowUpRight size={12} /></a></details>
                <div className="vote-buttons">{strengths.map(({ value, label, dots }) => <button key={value} onClick={() => answer(song.id, value)} aria-label={`${song.title}: ${label}`}><span>{label}</span><span className="vote-hearts" aria-hidden="true">{dots}</span></button>)}</div>
              </article>)}
              <span className="versus" aria-hidden="true">or</span>
            </div> : <div className="empty-comparison"><Sparkles size={42} /><h3>{progress.history.length === totalPairs ? 'What a splendid hit parade.' : 'A brief intermission.'}</h3><p>{progress.history.length === totalPairs ? 'You’ve compared every pair. Your ranking is ready.' : 'More songs are waiting. Ready to bring back the remaining pairs?'}</p>{progress.history.length < totalPairs && <button className="primary-button" onClick={() => { setSkipped([]); setProgress({ ...progress, activePair: selectPair(songs, progress.history) }); }}>Revisit skipped pairs <ArrowRight size={16} /></button>}</div>}
            <YouTubePlayer key={listeningId ?? 'empty'} song={listeningId ? catalogSongById.get(listeningId) ?? null : null} onClose={() => setListeningId(null)} />
            <div className="comparison-tools"><button onClick={undo} disabled={!progress.history.length}><Undo2 size={15} /> Undo last</button><span>No wrong answers. Just your favourites.</span><button onClick={skip} disabled={!progress.activePair}>Skip pair <SkipForward size={15} /></button></div>
            <p className="sr-only" role="status">{notice}</p>
          </section>

          <aside className="ranking-panel" aria-labelledby="ranking-title">
            <div className="ranking-heading"><div><span className="eyebrow">SIDE B / YOUR CHARTS</span><h2 id="ranking-title">The hit parade<span>✦</span></h2></div><p>A little more you with every choice.</p></div>
            <div className="ranking-content"><div className="chart-label"><span>{allSongs ? 'THE FULL LINEUP' : 'YOUR TOP FIVE'}</span><span>RATING <ArrowDown size={11} /></span></div>
              {allSongs && <label className="search-box"><Search size={16} /><input aria-label="Search songs" placeholder="Find a song or album…" value={query} onChange={(e) => setQuery(e.target.value)} /></label>}
              <ol className={`ranking-list ${allSongs ? 'expanded' : ''}`}>{visible.map((r) => <li key={r.song.id}><span className="rank-number">{String(ratings.indexOf(r) + 1).padStart(2, '0')}</span><div className="mini-sleeve"><AlbumArt key={r.song.primaryAlbumId} album={albumById.get(r.song.primaryAlbumId)!} mini /></div><div className="rank-song"><strong>{r.song.title}</strong><small>{r.comparisonCount ? `${r.comparisonCount} ${r.comparisonCount === 1 ? 'comparison' : 'comparisons'}` : 'Untested'}</small></div><span className={`rating ${!r.comparisonCount ? 'untested' : ''}`}>{r.comparisonCount ? r.rating.toFixed(2) : '—'}</span></li>)}</ol>
              {allSongs && !visible.length && <p className="no-results">No songs found. Try another title or album.</p>}
              <button className="view-ranking" onClick={() => { setAllSongs(!allSongs); setQuery(''); }}>{allSongs ? 'Back to your top five' : `Explore all ${songs.length} songs`}<ChevronDown size={16} className={allSongs ? 'rotated' : ''} /></button>
              <div className="progress-section"><div className="progress-title"><span>Getting to know your taste</span><span>✳</span></div><div className="progress-bar" role="progressbar" aria-label="Songs encountered" aria-valuemin={0} aria-valuemax={songs.length} aria-valuenow={encountered}><div style={{ width: `${encountered / songs.length * 100}%` }} /></div><div className="progress-stats"><div><strong>{encountered}<span> / {songs.length}</span></strong><small>Songs encountered</small></div><div><strong data-testid="comparison-count">{progress.history.length}</strong><small>Comparisons made</small></div></div><p>Good taste takes its time. Keep going.</p></div>
            </div>
          </aside>
        </div>

        <AlbumLibrary onListen={listen} />

        <section className="little-help"><span className="help-flower" aria-hidden="true">✳</span><div><h3>A little help from your preferences.</h3><p>We learn from your choices, then find the next pair worth comparing. Your favourites find their way to the top.</p></div><button aria-label="Learn how ranking works" onClick={() => setDialog('help')}><ArrowUpRight size={24} /></button></section>
      </main>

      <footer><span>MADE FOR THE LOVE OF THE MUSIC <Heart size={12} /></span><span className="save-state">{storageError ? <Info size={13} /> : <Check size={13} />}{storageError ? 'Progress not saved' : 'Saved on this device'}</span><button onClick={() => setDialog('reset')}><RotateCcw size={12} /> Reset progress</button></footer>
    </div>
    <dialog ref={modalRef} onCancel={(e) => { e.preventDefault(); setDialog(null); }} onClick={(e) => { if (e.target === e.currentTarget) setDialog(null); }} aria-labelledby="dialog-title">
      <div className="modal-content"><button className="modal-close" aria-label="Close dialog" onClick={() => setDialog(null)}><X size={20} /></button><span className="eyebrow">A LITTLE HELP</span><h2 id="dialog-title">{dialog === 'reset' ? 'A brand new hit parade?' : 'Let your favourites find you.'}</h2>
      {dialog === 'reset' ? <><p>This clears all votes, including sample votes, and starts your own ranking. Your current progress will be replaced.</p><div className="modal-actions"><button className="secondary-button" onClick={() => setDialog(null)}>Keep my progress</button><button className="primary-button" onClick={() => reset(false)}>Start my ranking <ArrowRight size={16} /></button></div></> : <><p>Pick the song you prefer, then tell us how much: slightly better, better, or much better. Stronger preferences make a bigger difference.</p><ol className="how-list"><li><strong>Follow your feeling.</strong> Load either song in the YouTube player, choose from memory, or skip an unfamiliar pair.</li><li><strong>Watch your chart take shape.</strong> We introduce new songs and compare close contenders. Untested songs are marked in the full lineup.</li><li><strong>Make yourself at home.</strong> Undo any answer, or return later. Your votes stay in this browser.</li></ol><p className="modal-note">Sample votes help you try the app. Choose “Start fresh” for your own ranking. The core collection has {songs.length} songs; repeated album appearances share a ranking entry. Listening never changes your votes.</p><button className="primary-button" onClick={() => setDialog(null)}>Let’s compare <ArrowRight size={16} /></button></>}
      </div>
    </dialog>
  </>;
}
