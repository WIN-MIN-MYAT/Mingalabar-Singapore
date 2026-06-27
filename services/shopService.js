import supabaseClient from './supabaseClient';

// In-memory cache so repeated callers don't re-fetch categories.
let categoriesCache = null;

/**
 * Fetch all shop categories (chips + icon mapping). Cached per session.
 */
export async function getCategories() {
  if (categoriesCache) return categoriesCache;

  const { data, error } = await supabaseClient
    .from('shop_categories')
    .select('id, label, icon, sort_order')
    .order('sort_order', { ascending: true })
    .order('label', { ascending: true });

  if (error) throw error;

  categoriesCache = (data || []).map((c) => ({
    id: c.id,
    label: c.label,
    icon: c.icon,
  }));
  return categoriesCache;
}

/**
 * Fetch all shops. `rating` and `review_count` are cached on the table
 * and kept in sync by a database trigger.
 */
export async function getShops() {
  const { data, error } = await supabaseClient
    .from('shops')
    .select('id, name, type, category, description, lat, lng, image_url, images, rating, review_count')
    .order('name', { ascending: true });

  if (error) throw error;

  return (data || []).map((s) => ({
    id: s.id,
    name: s.name,
    type: s.type,
    category: s.category,
    description: s.description,
    lat: s.lat,
    lng: s.lng,
    image: s.image_url || null,
    images: s.images || [],
    rating: s.rating ?? 0,
    reviewCount: s.review_count ?? 0,
  }));
}

function shapeReview(r) {
  const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
  return {
    id: r.id,
    author: profile?.username || profile?.full_name || 'User',
    avatarUrl: profile?.avatar_url || null,
    rating: r.rating,
    content: r.content,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    upvotes: 0,
    downvotes: 0,
    userVote: null,
  };
}

/**
 * Fetch reviews for a shop, with aggregated vote counts and the
 * current user's vote on each (mirrors the feed's aggregation).
 */
export async function getShopReviews(shopId, userId = null) {
  const { data: reviews, error } = await supabaseClient
    .from('shop_reviews')
    .select(`
      id, rating, content, created_at, updated_at,
      profiles ( id, username, full_name, avatar_url )
    `)
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!reviews || reviews.length === 0) return [];

  const reviewIds = reviews.map((r) => r.id);

  const [{ data: voteStats }, { data: userVotes }] = await Promise.all([
    supabaseClient
      .from('shop_review_votes')
      .select('review_id, vote_type')
      .in('review_id', reviewIds),
    userId
      ? supabaseClient
          .from('shop_review_votes')
          .select('review_id, vote_type')
          .in('review_id', reviewIds)
          .eq('user_id', userId)
      : Promise.resolve({ data: [] }),
  ]);

  const counts = {};
  (voteStats || []).forEach((v) => {
    if (!counts[v.review_id]) counts[v.review_id] = { upvotes: 0, downvotes: 0 };
    if (v.vote_type === 'up') counts[v.review_id].upvotes += 1;
    else counts[v.review_id].downvotes += 1;
  });

  const userMap = {};
  (userVotes || []).forEach((v) => {
    userMap[v.review_id] = v.vote_type;
  });

  return reviews.map((r) => ({
    ...shapeReview(r),
    upvotes: counts[r.id]?.upvotes || 0,
    downvotes: counts[r.id]?.downvotes || 0,
    userVote: userMap[r.id] || null,
  }));
}

/**
 * Fetch the current user's existing review for a shop (if any), so the
 * form can pre-fill and switch to "Update" mode.
 */
export async function getMyReview(shopId, userId) {
  if (!userId) return null;
  const { data, error } = await supabaseClient
    .from('shop_reviews')
    .select('id, rating, content')
    .eq('shop_id', shopId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Create or update the current user's review for a shop.
 * Uses upsert on (shop_id, user_id) so a user can only have one review
 * per shop — re-submitting updates their existing rating.
 */
export async function addShopReview(shopId, userId, rating, content) {
  const { data, error } = await supabaseClient
    .from('shop_reviews')
    .upsert(
      { shop_id: shopId, user_id: userId, rating, content },
      { onConflict: 'shop_id,user_id' }
    )
    .select(`
      id, rating, content, created_at, updated_at,
      profiles ( id, username, full_name, avatar_url )
    `)
    .single();

  if (error) throw error;
  return shapeReview(data);
}

/**
 * Toggle / update / remove a vote on a review. Same semantics as the
 * existing voteService for posts.
 */
export async function voteShopReview(userId, reviewId, voteType) {
  const { data: existing, error: checkError } = await supabaseClient
    .from('shop_review_votes')
    .select('id, vote_type')
    .eq('user_id', userId)
    .eq('review_id', reviewId)
    .maybeSingle();

  if (checkError) throw checkError;

  if (existing) {
    if (existing.vote_type === voteType) {
      // Same vote again → remove it
      const { error } = await supabaseClient
        .from('shop_review_votes')
        .delete()
        .eq('id', existing.id);
      if (error) throw error;
      return { action: 'removed', voteType: null };
    }
    // Different vote → flip it
    const { error } = await supabaseClient
      .from('shop_review_votes')
      .update({ vote_type: voteType })
      .eq('id', existing.id);
    if (error) throw error;
    return { action: 'updated', voteType };
  }

  // No existing vote → create
  const { error } = await supabaseClient
    .from('shop_review_votes')
    .insert({ user_id: userId, review_id: reviewId, vote_type: voteType });
  if (error) throw error;
  return { action: 'created', voteType };
}
