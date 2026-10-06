const videoIdPattern = /^[A-Za-z0-9_-]{11}$/;

/** Keep YouTube controls and branding intact; loading a song never starts playback. */
export function youtubeEmbedUrl(videoId: string): string {
  if (!videoIdPattern.test(videoId)) throw new Error('Invalid YouTube video ID');
  const params = new URLSearchParams({ autoplay: '0', controls: '1', playsinline: '1' });
  return `https://www.youtube.com/embed/${videoId}?${params}`;
}

export function youtubeWatchUrl(videoId: string): string {
  if (!videoIdPattern.test(videoId)) throw new Error('Invalid YouTube video ID');
  return `https://www.youtube.com/watch?v=${videoId}`;
}
