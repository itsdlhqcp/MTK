import { supabase } from '../lib/supabase';

export const createPoll = async (pollData) => {
  try {
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        user_id: pollData?.user_id,
        question: pollData?.question,
        description: pollData?.description,
        is_anonymous: pollData?.is_anonymous || false,
        is_multiple_choice: pollData?.is_multiple_choice || false,
        allows_multiple_answers: pollData?.allows_multiple_answers || false,
        expires_at: pollData?.expires_at
      })
      .select()
      .single();

    if (pollError) {
      return { success: false, msg: pollError.message };
    }

    const optionsData = pollData.options.map((option, index) => ({
      poll_id: poll?.id,
      option_text: option,
      option_order: index + 1
    }));

    const { data: options, error: optionsError } = await supabase
      .from('poll_options')
      .insert(optionsData)
      .select();

    if (optionsError) {
      return { success: false, msg: optionsError.message };
    }

    return { success: true, data: { ...poll, options } };
  } catch (error) {
    console.log('Create poll error:', error);
    return { success: false, msg: 'Could not create poll' };
  }
};

export const fetchPolls = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('polls')
      .select(`
        *,
        user: users (id, name, image),
        poll_options (
          id,
          option_text,
          option_order,
          vote_count: poll_votes(count)
        ),
        total_votes: poll_votes(count)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { success: false, msg: 'Could not fetch polls' };
    }

    // Process the data to get proper vote counts
    const processedData = data.map(poll => {
      const totalVotes = poll.poll_options.reduce((sum, option) => 
        sum + (option.vote_count?.[0]?.count || 0), 0
      );
      
      return {
        ...poll,
        total_votes: totalVotes,
        poll_options: poll.poll_options.map(option => ({
          ...option,
          vote_count: option.vote_count?.[0]?.count || 0
        }))
      };
    });

    return { success: true, data: processedData };
  } catch (error) {
    console.log('Fetch polls error:', error);
    return { success: false, msg: 'Could not fetch polls' };
  }
};

export const fetchPollById = async (pollId) => {
    try {
      const { data, error } = await supabase
        .from('polls')
        .select(`
          *,
          user: users (id, name, image),
          poll_options (
            id,
            option_text,
            option_order,
            vote_count: poll_votes(count)
          ),
          total_votes: poll_votes(count)
        `)
        .eq('id', pollId)
        .single();
  
      if (error) {
        return { success: false, msg: 'Could not fetch poll' };
      }
  
      // Process the data to get proper vote counts
      const totalVotes = data.poll_options.reduce((sum, option) => 
        sum + (option.vote_count?.[0]?.count || 0), 0
      );
      
      const processedData = {
        ...data,
        total_votes: totalVotes,
        poll_options: data.poll_options.map(option => ({
          ...option,
          vote_count: option.vote_count?.[0]?.count || 0
        }))
      };
  
      return { success: true, data: processedData };
    } catch (error) {
      console.log('Fetch poll by ID error:', error);
      return { success: false, msg: 'Could not fetch poll' };
    }
  };

  export const votePoll = async (pollId, optionId, userId) => {
    try {
      // First, let's use a more comprehensive check for existing votes
      const { data: existingVotes, error: checkError } = await supabase
        .from('poll_votes')
        .select('*')
        .eq('poll_id', pollId)
        .eq('user_id', userId);
  
      if (checkError) {
        console.log('Error checking existing vote:', checkError);
        return { success: false, msg: 'Error checking existing vote' };
      }
  
      // If user has voted before
      if (existingVotes && existingVotes.length > 0) {
        const existingVote = existingVotes[0];
        
        // If user is trying to vote for the same option
        if (existingVote.option_id === optionId) {
          return { success: false, msg: 'You have already voted for this option' };
        }
  
        // Delete existing vote first
        const { error: deleteError } = await supabase
          .from('poll_votes')
          .delete()
          .eq('poll_id', pollId)
          .eq('user_id', userId);
  
        if (deleteError) {
          console.log('Error deleting existing vote:', deleteError);
          return { success: false, msg: 'Error updating your vote' };
        }
  
      }
  
      // Insert new vote
      const { data: newVote, error: insertError } = await supabase
        .from('poll_votes')
        .insert({
          poll_id: pollId,
          option_id: optionId,
          user_id: userId
        })
        .select()
        .single();
  
      if (insertError) {
        console.log('Error inserting new vote:', insertError);
        return { success: false, msg: insertError.message };
      }
  
      const updatedPoll = await fetchPollById(pollId);
      
      return { 
        success: true, 
        data: newVote,
        updatedPoll: updatedPoll.success ? updatedPoll.data : null,
        isVoteChange: existingVotes && existingVotes.length > 0
      };
  
    } catch (error) {
      console.log('Vote poll error:', error);
      return { success: false, msg: 'Could not vote on poll' };
    }
  };

// Get user's vote for a specific poll
export const getUserVote = async (pollId, userId) => {
  try {
    const { data, error } = await supabase
      .from('poll_votes')
      .select('option_id')
      .eq('poll_id', pollId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return { success: false, msg: error.message };
    }

    return { success: true, data: data?.option_id || null };
  } catch (error) {
    console.log('Get user vote error:', error);
    return { success: false, msg: 'Could not get user vote' };
  }
};

export const deletePoll = async (pollId, userId) => {
  try {
    const { error } = await supabase
      .from('polls')
      .delete()
      .eq('id', pollId)
      .eq('user_id', userId);

    if (error) {
      return { success: false, msg: error.message };
    }

    return { success: true };
  } catch (error) {
    console.log('Delete poll error:', error);
    return { success: false, msg: 'Could not delete poll' };
  }
};

export const deleteVote = async (pollId, userId) => {
    try {
      const { error } = await supabase
        .from('poll_votes')
        .delete()
        .eq('poll_id', pollId)
        .eq('user_id', userId);
  
      if (error) {
        console.log('Error deleting vote:', error);
        return { success: false, msg: error.message };
      }
  
      const updatedPoll = await fetchPollById(pollId);
      
      return { 
        success: true,
        updatedPoll: updatedPoll.success ? updatedPoll.data : null
      };
    } catch (error) {
      console.log('Delete vote error:', error);
      return { success: false, msg: 'Could not delete vote' };
    }
  };