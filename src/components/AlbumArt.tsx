import { useState } from 'react';
import type { Album } from '../data/songs';
import { SleeveArt } from './SleeveArt';

export function AlbumArt({ album, mini = false }: { album: Album; mini?: boolean }) {
  const [failed, setFailed] = useState(false);
  return failed ? <SleeveArt art={album.art} mini={mini} /> : <img className="album-cover" src={album.cover.url} srcSet={album.cover.srcSet} sizes={mini ? '45px' : '(max-width: 650px) 160px, (max-width: 1050px) 240px, 350px'} alt={`${album.title} album cover`} loading="lazy" onError={() => setFailed(true)} />;
}
