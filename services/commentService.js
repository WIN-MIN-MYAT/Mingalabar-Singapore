import supabaseClient from './supabaseClient';

export async function getComments(postId, limit = 50) {
  try {
    const { data, error } = await supabaseClient
      .from('comments')
      .select(`
        *,
        profiles (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Get comments error:', error);
    throw error;
  }
}

export async function addComment(userId, postId, content) {
  try {
    const { data, error } = await supabaseClient
      .from('comments')
      .insert({
        user_id: userId,
        post_id: postId,
        content,
      })
      .select(`
        *,
        profiles (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Add comment error:', error);
    throw error;
  }
}

export async function deleteComment(commentId, userId) {
  try {
    const { error } = await supabaseClient
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Delete comment error:', error);
    throw error;
  }
}

export async function getCommentCount(postId) {
  try {
    const { count, error } = await supabaseClient
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Get comment count error:', error);
    throw error;
  }
}