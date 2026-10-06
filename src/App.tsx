import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, Disc3, Heart, Info, Library, RotateCcw, SkipForward, Sparkles, Undo2, X } from 'lucide-react';
import { songs, songById, catalogSongById, totalPairs, type Song } from './data/songs';
import { calculateRatings, pairKey, selectPair, type Pair, type Strength } from './ranking/model';
import { loadProgress, saveProgress, type Progress } from './storage/progress';
import { AlbumLibrary } from './components/AlbumLibrary';
import { Comparison } from './components/Comparison';
import { Ranking } from './components/Ranking';
import { YouTubePlayer } from './components/YouTubePlayer';

type View = 'rank' | 'collection';

export default function App() {
  const [initial] = useState(loadProgress);
  const [progress, setProgress] = useState<Progress>(initial.progress);
  const [storageError, setStorageError] = useState(initial.error);
  const [saveBlocked, setSaveBlocked] = useState(Boolean(initial.error));
  const [skipped, setSkipped] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  const [dialog, setDialog] = useState<'help' | 'reset' | null>(null);
  const [view, setView] = useState<View>('rank');
  const [listeningId, setListeningId] = useState<string | null>(null);
  const transitionLock = useRef(false);
  const modalRef = useRef<HTMLDialogElement>(null);
  const modalTrigger = useRef<HTMLElement | null>(null);
  const ratings = useMemo(() => calculateRatings(songs, progress.history), [progress.history]);
  const activeSongs = progress.activePair?.map((id) => songById.get(id)!);
  const listeningSong = listeningId ? catalogSongById.get(listeningId) ?? null : null;

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
    setNotice(`Vote for ${songById.get(winnerId)!.title} recorded.`);
  }

  function skip(): void {
    setListeningId(null);
    transitionLock.current = false;
    if (!progress.activePair) return;
    const nextSkipped = [...skipped, pairKey(progress.activePair)];
    setSkipped(nextSkipped);
    setProgress({ ...progress, activePair: selectPair(songs, progress.history, nextSkipped) });
    setNotice('Pair skipped. No vote recorded.');
  }

  function undo(): void {
    setListeningId(null);
    transitionLock.current = false;
    const last = progress.history.at(-1);
    if (!last) return;
    const pair: Pair = [last.winnerId, last.loserId];
    setSkipped(skipped.filter((key) => key !== pairKey(pair)));
    setProgress({ ...progress, history: progress.history.slice(0, -1), activePair: pair });
    setNotice('Last vote undone. Try that pair again.');
  }

  function reset(): void {
    setListeningId(null);
    transitionLock.current = false;
    setSkipped([]);
    setSaveBlocked(false);
    setProgress({ version: 1, history: [], activePair: selectPair(songs, []), demo: false });
    setView('rank');
    setNotice('A fresh start. Choose your first favourite.');
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

  return <>
    <div className="top-stripe" aria-hidden="true" />
    <aside className="fan-banner" aria-label="Fan project notice"><Heart size={12} aria-hidden="true" /><p><strong>A fan project, made for the love of the music.</strong> <span>Independent of The Beatles, Apple Corps Ltd., and YouTube; no affiliation or endorsement.</span></p></aside>
    <div className="page-shell">
      <header className="site-header">
        <a className="brand" href="#" onClick={() => changeView('rank')} aria-label="Today, Oh Boy! home"><span className="brand-seal" aria-hidden="true"><Disc3 size={26} strokeWidth={1.25} /></span><div><span className="brand-kicker">THE BEATLES, IN YOUR OWN ORDER</span><h1>Today, <em>Oh Boy!</em></h1><p>Two songs. One choice. Your very own hit parade.</p></div></a>
        <img className="masthead-art" src="/art/pepper-parade.webp" alt="" aria-hidden="true" width="768" height="256" />
      </header>

      <main>
        <nav className="view-navigation" aria-label="Main navigation">
          <div className="view-tabs"><button aria-pressed={view === 'rank'} aria-controls="rank-view" onClick={() => changeView('rank')}><Disc3 size={16} /> Rank songs</button><button aria-pressed={view === 'collection'} aria-controls="collection-view" onClick={() => changeView('collection')}><Library size={16} /> Record collection</button></div>
          <div className="navigation-meta"><span className="collection-count">{songs.length} songs <span aria-hidden="true">✦</span> All you need is taste</span><button className="nav-help" onClick={() => setDialog('help')}><Info size={15} /> How it works</button></div>
        </nav>

        {storageError && <p className="storage-warning" role="alert">{storageError}</p>}

        <div id="rank-view" hidden={view !== 'rank'}>
          {progress.demo && <div className="demo-notice"><p><span className="status-dot" /><strong>A little preview.</strong> You’re looking at sample votes.</p><button onClick={() => setDialog('reset')}>Start my ranking <ArrowRight size={15} /></button></div>}
          <div className="workspace">
            <section id="compare" className="comparison-panel" aria-labelledby="comparison-title">
              <div className="panel-heading"><span className="eyebrow"><span aria-hidden="true">✦</span> THE LISTENING ROOM</span><span className="comparison-number">{activeSongs ? `No. ${String(progress.history.length + 1).padStart(3, '0')}` : progress.history.length === totalPairs ? 'Session complete' : 'Comparisons paused'}</span></div>
              <h2 id="comparison-title">Which one’s your favourite?</h2>
              <p className="comparison-hint">Pick a song. Say how much. Watch your chart take shape.</p>
              {activeSongs ? <Comparison key={progress.activePair!.join(':')} songs={activeSongs} listeningId={listeningId} onListen={listen} onAnswer={answer} /> : <div className="empty-comparison"><Sparkles size={42} /><h3>{progress.history.length === totalPairs ? 'What a splendid hit parade.' : 'A brief intermission.'}</h3><p>{progress.history.length === totalPairs ? 'You’ve compared every pair. Your ranking is ready.' : 'More songs are waiting. Ready to bring back the remaining pairs?'}</p>{progress.history.length < totalPairs && <button className="primary-button" onClick={() => { setSkipped([]); setProgress({ ...progress, activePair: selectPair(songs, progress.history) }); setNotice('Skipped pairs are ready to compare.'); }}>Revisit skipped pairs <ArrowRight size={16} /></button>}</div>}
              <div className="comparison-tools"><button onClick={undo} disabled={!progress.history.length}><Undo2 size={15} /> Undo last vote</button><button onClick={skip} disabled={!progress.activePair}>Skip this pair <SkipForward size={15} /></button></div>
              <p className="comparison-notice" role="status">{notice || 'Follow your ears. There are no wrong answers.'}</p>
              {view === 'rank' && <YouTubePlayer key={listeningId ?? 'empty'} song={listeningSong} onClose={() => setListeningId(null)} />}
            </section>
            <Ranking ratings={ratings} comparisonCount={progress.history.length} demo={progress.demo} />
          </div>
        </div>

        <div id="collection-view" hidden={view !== 'collection'}>
          {view === 'collection' && <YouTubePlayer key={listeningId ?? 'empty'} song={listeningSong} context="collection" onClose={() => setListeningId(null)} />}
          <AlbumLibrary onListen={listen} />
        </div>
      </main>

      <footer><span>FOR THE LOVE OF THE MUSIC <Heart size={12} /></span><span className="save-state">{storageError ? <Info size={14} /> : <Check size={14} />}{storageError ? 'Progress not saved' : 'Saved on this device'}</span><button onClick={() => setDialog('reset')}><RotateCcw size={14} /> Reset progress</button></footer>
    </div>
    <dialog ref={modalRef} onCancel={(event) => { event.preventDefault(); setDialog(null); }} onClick={(event) => { if (event.target === event.currentTarget) setDialog(null); }} aria-labelledby="dialog-title">
      <div className="modal-content"><button className="modal-close" aria-label="Close dialog" onClick={() => setDialog(null)}><X size={20} /></button><span className="eyebrow">{dialog === 'reset' ? 'A FRESH START' : 'A LITTLE HELP'}</span><h2 id="dialog-title">{dialog === 'reset' ? 'A brand new hit parade?' : 'Let your favourites find you.'}</h2>
        {dialog === 'reset' ? <><p>This clears all votes, including sample votes, and starts your own ranking. Your current progress will be replaced.</p><div className="modal-actions"><button className="secondary-button" onClick={() => setDialog(null)}>Keep my progress</button><button className="primary-button" onClick={reset}>Start my ranking <ArrowRight size={16} /></button></div></> : <><p>Choose a button under the song you prefer. “Slightly better” is a close call; “Much better” means a clear favourite.</p><ol className="how-list"><li><strong>Listen if you like.</strong> Load either song, then press play in the YouTube player. Listening never records a vote.</li><li><strong>See your chart take shape.</strong> Every choice updates your ranking. Open the full ranking to search songs and see their scores. Songs you haven’t compared stay unranked.</li><li><strong>Go at your own pace.</strong> Skip unfamiliar pairs, undo your last vote, or come back later. Your choices save in this browser.</li></ol><p className="modal-note">{progress.demo ? 'You’re exploring a sample ranking. Choose “Start my ranking” to begin with your own votes. ' : ''}The record collection has album stories and track lists to explore.</p><button className="primary-button" onClick={() => { changeView('rank'); setDialog(null); }}>Let’s compare <ArrowRight size={16} /></button></>}
      </div>
    </dialog>
  </>;
}
