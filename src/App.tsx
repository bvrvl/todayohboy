import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, Disc3, Info, Library, RotateCcw, SkipForward, Sparkles, Undo2, Users, X } from 'lucide-react';
import { songs, songById, catalogSongById, totalPairs, type Song } from './data/songs';
import { calculateRatings, pairKey, selectPair, type Pair, type Strength } from './ranking/model';
import { loadProgress, saveProgress, type Progress } from './storage/progress';
import { AlbumLibrary } from './components/AlbumLibrary';
import { Comparison } from './components/Comparison';
import { Ranking } from './components/Ranking';
import { YouTubePlayer } from './components/YouTubePlayer';
import { Community } from './components/Community';
import { createRankingSnapshot } from './community/posts';
import { readSharedRanking } from './community/sharing';

type View = 'rank' | 'collection' | 'community';

export default function App() {
  const [initial] = useState(loadProgress);
  const [progress, setProgress] = useState<Progress>(initial.progress);
  const [storageError, setStorageError] = useState(initial.error);
  const [saveBlocked, setSaveBlocked] = useState(Boolean(initial.error));
  const [skipped, setSkipped] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  const [dialog, setDialog] = useState<'help' | 'reset' | null>(null);
  const [sharedRanking, setSharedRanking] = useState(() => readSharedRanking(window.location.hash));
  const [view, setView] = useState<View>(() => window.location.hash.startsWith('#ranking=') ? 'community' : 'rank');
  const [rankingSession, setRankingSession] = useState(0);
  const [listeningId, setListeningId] = useState<string | null>(null);
  const transitionLock = useRef(false);
  const modalRef = useRef<HTMLDialogElement>(null);
  const modalTrigger = useRef<HTMLElement | null>(null);
  const ratings = useMemo(() => calculateRatings(songs, progress.history), [progress.history]);
  const snapshot = useMemo(() => createRankingSnapshot(ratings, progress.history.length), [ratings, progress.history.length]);
  const activeSongs = progress.activePair?.map((id) => songById.get(id)!);
  const listeningSong = listeningId ? catalogSongById.get(listeningId) ?? null : null;

  useEffect(() => {
    function readLink(): void {
      setSharedRanking(readSharedRanking(window.location.hash));
      if (window.location.hash.startsWith('#ranking=')) { setView('community'); setListeningId(null); }
    }
    window.addEventListener('hashchange', readLink);
    return () => window.removeEventListener('hashchange', readLink);
  }, []);

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

  function answer(winnerId: string, strength: Strength): void {
    if (!progress.activePair || transitionLock.current) return;
    transitionLock.current = true;
    setListeningId(null);
    window.setTimeout(() => { transitionLock.current = false; }, 250);
    const pair = progress.activePair;
    const history = [...progress.history, { id: crypto.randomUUID(), winnerId, loserId: pair.find((id) => id !== winnerId)!, strength }];
    setProgress({ ...progress, history, activePair: selectPair(songs, history, skipped) });
    setNotice(`Voted for ${songById.get(winnerId)!.title}`);
  }

  function skip(): void {
    setListeningId(null);
    transitionLock.current = false;
    if (!progress.activePair) return;
    const nextSkipped = [...skipped, pairKey(progress.activePair)];
    setSkipped(nextSkipped);
    setProgress({ ...progress, activePair: selectPair(songs, progress.history, nextSkipped) });
    setNotice('Pair skipped');
  }

  function undo(): void {
    setListeningId(null);
    transitionLock.current = false;
    const last = progress.history.at(-1);
    if (!last) return;
    const pair: Pair = [last.winnerId, last.loserId];
    setSkipped(skipped.filter((key) => key !== pairKey(pair)));
    setProgress({ ...progress, history: progress.history.slice(0, -1), activePair: pair });
    setNotice('Last vote undone');
  }

  function reset(): void {
    setListeningId(null);
    transitionLock.current = false;
    setSkipped([]);
    setSaveBlocked(false);
    setProgress({ version: 1, history: [], activePair: selectPair(songs, []), demo: false });
    setView('rank');
    setRankingSession((session) => session + 1);
    setNotice('Ready for your first vote');
    setDialog(null);
    window.requestAnimationFrame(() => document.getElementById('compare')?.scrollIntoView({ block: 'start', behavior: 'auto' }));
  }

  function listen(song: Song): void {
    setListeningId(song.id);
    window.requestAnimationFrame(() => document.getElementById('listen')?.scrollIntoView({ behavior: 'auto', block: 'nearest' }));
  }

  function changeView(nextView: View): void {
    if (nextView === view) return;
    setListeningId(null);
    setView(nextView);
  }

  function dismissShared(): void {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    setSharedRanking({ post: null, error: null });
  }

  return <>
    <div className="top-stripe" aria-hidden="true" />
    <aside className="fan-banner" aria-label="Fan project notice"><p><strong>Fan project</strong> · Not affiliated with or endorsed by The Beatles, Apple Corps Ltd., or YouTube.</p></aside>
    <div className="page-shell">
      <header className="site-header">
        <a className="brand" href="#" onClick={() => changeView('rank')} aria-label="Today, Oh Boy! home"><span className="brand-seal" aria-hidden="true"><Disc3 size={30} strokeWidth={1.25} /></span><div><span className="brand-kicker">THE BEATLES. YOUR WAY.</span><h1>Today, <em>Oh Boy!</em></h1><p>A personal hit parade, one choice at a time.</p></div></a>
        <img className="masthead-art" src="/art/record-shop.webp" alt="" aria-hidden="true" width="2172" height="724" />
      </header>

      <main>
        <nav className="view-navigation" aria-label="Main navigation">
          <div className="view-tabs"><button aria-pressed={view === 'rank'} aria-controls="rank-view" onClick={() => changeView('rank')}><Disc3 size={16} /> Rank songs</button><button aria-pressed={view === 'collection'} aria-controls="collection-view" onClick={() => changeView('collection')}><Library size={16} /> Record collection</button><button aria-pressed={view === 'community'} aria-controls="community-view" onClick={() => changeView('community')}><Users size={16} /> Community</button></div>
          <div className="navigation-meta"><span className="collection-count">{songs.length} songs <span aria-hidden="true">✦</span> 1962–1970</span><button className="nav-help" aria-label="How it works" onClick={() => setDialog('help')}><Info size={16} /> How it works</button></div>
        </nav>

        {storageError && <p className="storage-warning" role="alert">{storageError}</p>}

        <div id="rank-view" hidden={view !== 'rank'}>
          {progress.demo && <div className="demo-notice"><p><span className="demo-badge">DEMO</span> A sample chart. Ready to make it yours?</p><button onClick={() => setDialog('reset')}>Start my ranking <ArrowRight size={15} /></button></div>}
          <div className="workspace">
            <section id="compare" className="comparison-panel" aria-labelledby="comparison-title">
              <div className="panel-heading"><span className="eyebrow"><span aria-hidden="true">✦</span> THE LISTENING ROOM</span><span className="comparison-number">{activeSongs ? `PAIR ${String(progress.history.length + 1).padStart(3, '0')}` : progress.history.length === totalPairs ? 'Complete' : 'Paused'}</span></div>
              <h2 id="comparison-title">Which do you prefer?</h2>
              <p className="comparison-hint">Choose a song, then how much.</p>
              {activeSongs ? <Comparison key={progress.activePair!.join(':')} songs={activeSongs} listeningId={listeningId} onListen={listen} onAnswer={answer} /> : <div className="empty-comparison"><Sparkles size={42} /><h3>{progress.history.length === totalPairs ? 'Your chart is complete.' : 'All remaining pairs are skipped.'}</h3><p>{progress.history.length === totalPairs ? 'You’ve compared every pair.' : 'Bring them back when you’re ready.'}</p>{progress.history.length < totalPairs && <button className="primary-button" onClick={() => { setSkipped([]); setProgress({ ...progress, activePair: selectPair(songs, progress.history) }); setNotice('Skipped pairs restored'); }}>Revisit skipped pairs <ArrowRight size={16} /></button>}</div>}
              <div className="comparison-tools"><button onClick={undo} disabled={!progress.history.length}><Undo2 size={16} /> Undo</button><span className="comparison-notice" role="status">{notice}</span><button onClick={skip} disabled={!progress.activePair}>Skip <SkipForward size={16} /></button></div>
              {view === 'rank' && <YouTubePlayer key={listeningId ?? 'empty'} song={listeningSong} onClose={() => setListeningId(null)} />}
            </section>
            <Ranking key={rankingSession} ratings={ratings} comparisonCount={progress.history.length} demo={progress.demo} onPublish={() => changeView('community')} />
          </div>
        </div>

        <div id="collection-view" hidden={view !== 'collection'}>
          {view === 'collection' && <YouTubePlayer key={listeningId ?? 'empty'} song={listeningSong} context="collection" onClose={() => setListeningId(null)} />}
          <AlbumLibrary onListen={listen} />
        </div>

        <div id="community-view" hidden={view !== 'community'}>
          <Community active={view === 'community'} ranking={snapshot} demo={progress.demo} sharedPost={sharedRanking.post} sharedError={sharedRanking.error} onDismissShared={dismissShared} onRank={() => changeView('rank')} />
        </div>
      </main>

      <footer><span className="fan-credit">An independent fan project <span aria-hidden="true">✦</span></span><span className="save-state">{storageError ? <Info size={14} /> : <Check size={14} />}{storageError ? 'Progress not saved' : 'Saved on this device'}</span><button onClick={() => setDialog('reset')}><RotateCcw size={14} /> Reset progress</button></footer>
    </div>
    <dialog ref={modalRef} onCancel={(event) => { event.preventDefault(); setDialog(null); }} onClick={(event) => { if (event.target === event.currentTarget) setDialog(null); }} aria-labelledby="dialog-title">
      <div className="modal-content"><button className="modal-close" aria-label="Close dialog" onClick={() => setDialog(null)}><X size={20} /></button><span className="eyebrow">{dialog === 'reset' ? 'A FRESH START' : 'HOW IT WORKS'}</span><h2 id="dialog-title">{dialog === 'reset' ? 'Start a new ranking?' : 'Two songs. Your call.'}</h2>
        {dialog === 'reset' ? <><p>{progress.demo ? 'Clear the sample votes and start with your own choices.' : 'This clears your votes and starts again. Your current ranking will be lost.'}</p><div className="modal-actions"><button className="secondary-button" onClick={() => setDialog(null)}>Cancel</button><button className="primary-button" onClick={reset}>{progress.demo ? 'Start my ranking' : 'Reset ranking'} <ArrowRight size={16} /></button></div></> : <><p>Use a button beneath your favourite. “Slightly better” is a close call; “Much better” is a clear favourite.</p><ol className="how-list"><li><strong>Need a listen?</strong> Select Listen, then press play in the YouTube player.</li><li><strong>Your votes build your chart.</strong> The full ranking includes scores and songs you haven’t compared.</li><li><strong>Take your time.</strong> Skip a pair or undo a vote. Progress saves on this device.</li></ol>{progress.demo && <p className="modal-note">This is a sample chart. Choose “Start my ranking” to begin your own.</p>}<button className="primary-button" onClick={() => { changeView('rank'); setDialog(null); }}>Let’s compare <ArrowRight size={16} /></button></>}
      </div>
    </dialog>
  </>;
}
