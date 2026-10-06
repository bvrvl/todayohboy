import { parseRankingPost, type PublishRankingInput, type RankingPost } from '../community/posts';
import type { CommunityRepository } from '../community/repository';

export const COMMUNITY_STORAGE_KEY = 'beatles-ranker-community-v1';

export function parseCommunityPosts(raw: string): RankingPost[] {
  const value = JSON.parse(raw);
  if (!value || value.version !== 1 || !Array.isArray(value.posts)) throw new Error('Unsupported saved posts.');
  const posts: RankingPost[] = value.posts.map(parseRankingPost);
  if (new Set(posts.map((post) => post.id)).size !== posts.length) throw new Error('Duplicate saved posts.');
  return posts;
}

export const localCommunityRepository: CommunityRepository = {
  async list(): Promise<RankingPost[]> {
    const raw = localStorage.getItem(COMMUNITY_STORAGE_KEY);
    return raw ? parseCommunityPosts(raw) : [];
  },
  async publish(input: PublishRankingInput): Promise<RankingPost> {
    // Read and validate before writing, preserving corrupt saves on failure.
    const posts = await this.list();
    const post = parseRankingPost({
      version: 1,
      id: crypto.randomUUID(),
      author: input.author.trim() || 'A Beatles fan',
      note: input.note.trim(),
      createdAt: new Date().toISOString(),
      ranking: input.ranking,
    });
    localStorage.setItem(COMMUNITY_STORAGE_KEY, JSON.stringify({ version: 1, posts: [post, ...posts] }));
    return post;
  },
};
