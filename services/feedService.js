import contentfulClient from './contentfulClient';
import supabaseClient from './supabaseClient';

function formatTimestamp(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

export async function getFeed({ limit = 20, skip = 0, userId = null }) {
  try {
    const { items: posts, total } = await contentfulClient.getEntries({
      content_type: 'post',
      limit,
      skip,
      order: ['-sys.createdAt'],
    });

    if (!posts.length) return { posts: [], total: 0 };

    const postIds = posts.map(p => p.sys.id);

    const [
      { data: voteStats, error: voteError },
      { data: userVotes, error: userVoteError },
      { data: commentCounts, error: commentError },
    ] = await Promise.all([
      supabaseClient
        .from('votes')
        .select('post_id, vote_type')
        .in('post_id', postIds),

      userId
        ? supabaseClient
            .from('votes')
            .select('post_id, vote_type')
            .in('post_id', postIds)
            .eq('user_id', userId)
        : Promise.resolve({ data: [] }),

      supabaseClient
        .from('comments')
        .select('post_id')
        .in('post_id', postIds),
    ]);

    if (voteError) console.error('Vote stats error:', voteError);
    if (userVoteError) console.error('User vote error:', userVoteError);
    if (commentError) console.error('Comment count error:', commentError);

    const voteMap = {};
    (voteStats || []).forEach(vote => {
      if (!voteMap[vote.post_id]) {
        voteMap[vote.post_id] = { upvotes: 0, downvotes: 0 };
      }
      if (vote.vote_type === 'up') voteMap[vote.post_id].upvotes++;
      else voteMap[vote.post_id].downvotes++;
    });

    const userVoteMap = {};
    (userVotes || []).forEach(vote => {
      userVoteMap[vote.post_id] = vote.vote_type;
    });

    const commentCountMap = {};
    (commentCounts || []).forEach(comment => {
      commentCountMap[comment.post_id] = (commentCountMap[comment.post_id] || 0) + 1;
    });

    const mergedPosts = posts.map(post => {
      const stats = voteMap[post.sys.id] || { upvotes: 0, downvotes: 0 };
      const rawImages = (post.fields.images || []).map(img => img.fields?.file?.url || '');
      const images = rawImages.map(url => url.startsWith('//') ? `https:${url}` : url);
      return {
        id: post.sys.id,
        title: post.fields.title || '',
        content: post.fields.content || '',
        author: post.fields.author || 'Admin Team',
        images: images,
        tags: post.fields.tags || [],
        timestamp: formatTimestamp(post.sys.createdAt),
        upvotes: stats.upvotes,
        downvotes: stats.downvotes,
        comments: commentCountMap[post.sys.id] || 0,
        userVote: userVoteMap[post.sys.id] || null,
      };
    });

    return { posts: mergedPosts, total };
  } catch (error) {
    console.error('Feed service error:', error);
    throw error;
  }
}

export async function getPostById(postId, userId = null) {
  try {
    const post = await contentfulClient.getEntry(postId);

    const [
      { data: voteStats },
      { data: userVote },
      { data: comments },
    ] = await Promise.all([
      supabaseClient
        .from('votes')
        .select('vote_type')
        .eq('post_id', postId),

      userId
        ? supabaseClient
            .from('votes')
            .select('vote_type')
            .eq('post_id', postId)
            .eq('user_id', userId)
            .maybeSingle()
        : Promise.resolve({ data: null }),

      supabaseClient
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true }),
    ]);

    const upvotes = (voteStats || []).filter(v => v.vote_type === 'up').length;
    const downvotes = (voteStats || []).filter(v => v.vote_type === 'down').length;

    return {
      id: post.sys.id,
      title: post.fields.title || '',
      content: post.fields.content || '',
      author: post.fields.author || 'Admin Team',
      images: (post.fields.images || []).map(img => img.fields?.file?.url || ''),
      tags: post.fields.tags || [],
      timestamp: post.sys.createdAt,
      upvotes,
      downvotes,
      comments: (comments || []).length,
      userVote: userVote?.vote_type || null,
      commentsData: comments || [],
    };
  } catch (error) {
    console.error('Post service error:', error);
    throw error;
  }
}

export async function getPostStats(postId) {
  try {
    const [{ data: votes }, { data: comments }] = await Promise.all([
      supabaseClient
        .from('votes')
        .select('vote_type')
        .eq('post_id', postId),

      supabaseClient
        .from('comments')
        .select('id')
        .eq('post_id', postId),
    ]);

    const upvotes = (votes || []).filter(v => v.vote_type === 'up').length;
    const downvotes = (votes || []).filter(v => v.vote_type === 'down').length;

    return {
      upvotes,
      downvotes,
      comments: (comments || []).length,
    };
  } catch (error) {
    console.error('Stats service error:', error);
    throw error;
  }
}