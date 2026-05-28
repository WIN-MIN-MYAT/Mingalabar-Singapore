import supabaseClient from './supabaseClient';

export async function vote(userId, postId, voteType) {
  try {
    const { data: existingVote, error: checkError } = await supabaseClient
      .from('votes')
      .select('*')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingVote) {
      if (existingVote.vote_type === voteType) {
        const { error: deleteError } = await supabaseClient
          .from('votes')
          .delete()
          .eq('id', existingVote.id);

        if (deleteError) throw deleteError;
        return { action: 'removed', voteType: null };
      } else {
        const { error: updateError } = await supabaseClient
          .from('votes')
          .update({ vote_type: voteType })
          .eq('id', existingVote.id);

        if (updateError) throw updateError;
        return { action: 'updated', voteType };
      }
    } else {
      const { error: insertError } = await supabaseClient
        .from('votes')
        .insert({
          user_id: userId,
          post_id: postId,
          vote_type: voteType,
        });

      if (insertError) throw insertError;
      return { action: 'created', voteType };
    }
  } catch (error) {
    console.error('Vote service error:', error);
    throw error;
  }
}

export async function getUserVote(userId, postId) {
  try {
    const { data, error } = await supabaseClient
      .from('votes')
      .select('vote_type')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .maybeSingle();

    if (error) throw error;
    return data?.vote_type || null;
  } catch (error) {
    console.error('Get user vote error:', error);
    throw error;
  }
}