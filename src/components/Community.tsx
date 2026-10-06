import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, Check, Copy, MessageSquare, Send, Share2, Users } from 'lucide-react';
import { albumById, songById } from '../data/songs';
import { NAME_LIMIT, NOTE_LIMIT, type RankingPost, type RankingSnapshot } from '../community/posts';
import { communityRepository, type CommunityRepository } from '../community/repository';
import { createShareUrl } from '../community/sharing';
import { AlbumArt } from './AlbumArt';

interface CommunityProps {
  active: boolean;
  ranking: RankingSnapshot;
  demo: boolean;
  sharedPost: RankingPost | null;
  sharedError: string | null;
  onDismissShared: () => void;
  onRank: () => void;
  repository?: CommunityRepository;
}

function SnapshotSongs({ songIds }: { songIds: string[] }) {
  return <ol className="ranking-list snapshot-list">
    {songIds.map((id, index) => {
      const song = songById.get(id)!;
      return <li key={id}>
        <span className="rank-number">{String(index + 1).padStart(2, '0')}</span>
        <div className="mini-sleeve"><AlbumArt album={albumById.get(song.primaryAlbumId)!} mini /></div>
        <div className="rank-song"><strong>{song.title}</strong><small>{song.album}</small></div>
      </li>;
    })}
  </ol>;
}

function ShareRanking({ post }: { post: RankingPost }) {
  const [message, setMessage] = useState('');
  const [showLink, setShowLink] = useState(false);
  const [sharing, setSharing] = useState(false);
  const shareLock = useRef(false);
  const link = createShareUrl(post, window.location.href);

  async function share(copyOnly: boolean): Promise<void> {
    if (shareLock.current) return;
    shareLock.current = true;
    setSharing(true);
    setMessage('');
    setShowLink(true);
    try {
      if (!copyOnly && typeof navigator.share === 'function') {
        await navigator.share({ title: `${post.author}’s Beatles ranking`, text: post.note || 'My Beatles chart, one choice at a time.', url: link });
        setMessage('Ranking shared.');
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
        setMessage('Link copied. Ready to share.');
      } else {
        setMessage('Select and copy the link below.');
      }
    } catch (error) {
      setMessage(error instanceof Error && error.name === 'AbortError' ? 'Sharing cancelled. You can still copy the link.' : 'Select and copy the link below.');
    } finally {
      shareLock.current = false;
      setSharing(false);
    }
  }

  return <div className="share-ranking">
    <div className="post-actions"><button className="secondary-button" disabled={sharing} onClick={() => void share(false)}><Share2 size={15} /> Share ranking</button><button className="text-button" disabled={sharing} onClick={() => void share(true)}><Copy size={14} /> Copy link</button></div>
    {showLink && <label className="share-link-label">Ranking link<input className="share-link-input" aria-label={`Ranking link for ${post.author}`} value={link} readOnly onFocus={(event) => event.currentTarget.select()} /></label>}
    <p className="share-status" role="status">{message}</p>
  </div>;
}

function RankingPostCard({ post, shared = false }: { post: RankingPost; shared?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(post.createdAt);
  return <article className={`ranking-post${shared ? ' shared-post' : ''}`} aria-label={`Ranking by ${post.author}`}>
    <header className="post-heading"><span className="fan-avatar" aria-hidden="true">{Array.from(post.author)[0].toUpperCase()}</span><div><h3>{post.author}</h3><time dateTime={post.createdAt}>{date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} · {date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</time></div><span className="post-badge">{shared ? 'SHARED CHART' : 'PUBLISHED'}</span></header>
    {post.note && <p className="post-note">{post.note}</p>}
    <div className="snapshot-meta"><span>{post.ranking.comparisonCount} {post.ranking.comparisonCount === 1 ? 'vote' : 'votes'}</span><span>{post.ranking.songIds.length} / {post.ranking.totalSongs} songs compared</span></div>
    <SnapshotSongs songIds={expanded ? post.ranking.songIds : post.ranking.songIds.slice(0, 5)} />
    {post.ranking.songIds.length > 5 && <button className="snapshot-expand text-button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? 'Back to top five' : `View all ${post.ranking.songIds.length} ranked songs`} <ArrowRight size={14} /></button>}
    <p className="snapshot-caption">A snapshot of this chart when it was published.</p>
    <ShareRanking post={post} />
  </article>;
}

export function Community({ active, ranking, demo, sharedPost, sharedError, onDismissShared, onRank, repository = communityRepository }: CommunityProps) {
  const [posts, setPosts] = useState<RankingPost[]>([]);
  const [author, setAuthor] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [publishError, setPublishError] = useState('');
  const [notice, setNotice] = useState('');
  const [reload, setReload] = useState(0);
  const publishLock = useRef(false);
  const lastPublishAt = useRef(0);
  const canPublish = !demo && ranking.comparisonCount > 0 && !loading && !loadError;

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    repository.list().then((saved) => {
      if (!cancelled) setPosts(saved);
    }).catch(() => {
      if (!cancelled) setLoadError('Your published charts could not be read. Existing posts are untouched. Try again when storage is available.');
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [active, repository, reload]);

  async function publish(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!canPublish || publishLock.current || Date.now() - lastPublishAt.current < 500) return;
    publishLock.current = true;
    lastPublishAt.current = Date.now();
    setPublishing(true);
    setPublishError('');
    setNotice('');
    try {
      const post = await repository.publish({ author, note, ranking });
      setPosts((current) => [post, ...current.filter((saved) => saved.id !== post.id)]);
      setNote('');
      setNotice('Your chart is published on this device. Share its link to pass it on.');
    } catch {
      lastPublishAt.current = 0;
      setPublishError('Your chart could not be published. Your note is still here. Please try again.');
    } finally {
      publishLock.current = false;
      setPublishing(false);
    }
  }

  return <section className="community" aria-labelledby="community-title">
    <div className="community-heading"><div><span className="eyebrow">THE FAN CLUB</span><h2 id="community-title">Every chart tells a story.</h2><p>Publish your progress. Add a thought. Pass it on.</p></div><Users className="community-seal" size={40} strokeWidth={1} aria-hidden="true" /></div>
    <p className="community-local-note"><Share2 size={14} aria-hidden="true" /> Posts are saved on this device. Share a link so someone else can open your chart.</p>
    {(sharedPost || sharedError) && <section className="shared-ranking" aria-label="Shared with you"><div className="shared-heading"><h3>Shared with you</h3><button className="text-button" onClick={onDismissShared}>Back to community <ArrowRight size={14} /></button></div>{sharedError ? <p className="storage-warning" role="alert">{sharedError}</p> : <RankingPostCard key={sharedPost!.id} post={sharedPost!} shared />}</section>}
    <div className="community-layout">
      <section className="publish-panel" aria-labelledby="publish-title">
        <span className="eyebrow">YOUR CHART, RIGHT NOW</span><h3 id="publish-title">Publish your progress</h3><p className="publish-intro">You don’t need a finished ranking. Share where you are today.</p>
        {demo ? <div className="publish-empty"><p>You’re viewing the sample chart. Start your own ranking before publishing.</p><button className="text-button" onClick={onRank}>Go to your ranking <ArrowRight size={14} /></button></div> : !ranking.comparisonCount ? <div className="publish-empty"><p>Cast your first vote to give your chart a little personality.</p><button className="text-button" onClick={onRank}>Compare some songs <ArrowRight size={14} /></button></div> : <><div className="snapshot-meta"><span>{ranking.comparisonCount} {ranking.comparisonCount === 1 ? 'vote' : 'votes'}</span><span>{ranking.songIds.length} / {ranking.totalSongs} songs compared</span></div><SnapshotSongs songIds={ranking.songIds.slice(0, 5)} /></>}
        <form onSubmit={(event) => void publish(event)}>
          <label htmlFor="community-name">Your name <span>(optional)</span></label><input id="community-name" name="author" autoComplete="nickname" maxLength={NAME_LIMIT} placeholder="A Beatles fan" value={author} disabled={publishing} onChange={(event) => setAuthor(event.target.value)} />
          <label htmlFor="community-note">One note for the fans <span>(optional)</span></label><textarea id="community-note" name="note" rows={4} maxLength={NOTE_LIMIT} placeholder="A surprise at number one? A song that’s growing on you?" value={note} disabled={publishing} onChange={(event) => setNote(event.target.value)} aria-describedby="note-length" /><p className="note-length" id="note-length">{note.length} / {NOTE_LIMIT}</p>
          <button className="primary-button publish-button" type="submit" disabled={!canPublish || publishing}><Send size={15} /> {publishing ? 'Publishing…' : 'Publish current ranking'}</button><p className="publish-footnote">Your note and all {ranking.songIds.length} compared songs will be saved together.</p>
        </form>
        {publishError && <p className="community-error" role="alert">{publishError}</p>}
        <p className="publish-status" role="status">{notice && <><Check size={15} /> {notice}</>}</p>
      </section>
      <section className="community-feed" aria-labelledby="posts-title"><div className="feed-heading"><h3 id="posts-title">Your published charts</h3><span>{posts.length} {posts.length === 1 ? 'post' : 'posts'}</span></div>
        {loadError ? <div className="community-error" role="alert"><p>{loadError}</p><button className="text-button" onClick={() => setReload((value) => value + 1)}>Try again <ArrowRight size={14} /></button></div> : loading ? <p className="community-loading" role="status">Loading charts…</p> : !posts.length ? <div className="community-empty"><span className="community-empty-mark" aria-hidden="true"><MessageSquare size={30} strokeWidth={1} /></span><h3>Leave your first little note.</h3><p>A favourite song, an unexpected top five, a work in progress. It all starts with your chart.</p><span className="eyebrow">ONE RANKING. ONE NOTE. ALL YOU.</span></div> : <div className="post-list">{posts.map((post) => <RankingPostCard key={post.id} post={post} />)}</div>}
      </section>
    </div>
  </section>;
}
