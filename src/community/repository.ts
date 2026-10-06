import type { PublishRankingInput, RankingPost } from './posts';
import { localCommunityRepository } from '../storage/community';

// Replace this adapter with API calls when adding a shared feed and auth.
// An authenticated backend should derive the author identity from its session.
export interface CommunityRepository {
  list(): Promise<RankingPost[]>;
  publish(input: PublishRankingInput): Promise<RankingPost>;
}

export const communityRepository: CommunityRepository = localCommunityRepository;
