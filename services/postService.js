import { uploadProfileImage } from "./imageService";
import { supabase } from "../lib/supabase";

export const createOrUpdatePost = async (post) => {
  try {
    if (post.file && typeof post.file === "object") {
      let isImage = post.file.type === "image";
      let folderName = isImage ? "postImage" : "postVideo";
      let fileResult = await uploadProfileImage(folderName, post.file.uri, isImage);
      if (fileResult.success) {
        post.file = fileResult.data;
      } else {
        return fileResult;
      }
    }
    const {data, error} = await supabase.from('posts').upsert(post).select().single();

    if (error){
      console.error("Error in createOrUpdatePost:", error);
      return { success: false, msg: "Could not create or update your post", error: error.message };
    }
    return {success: true, data};
  } catch (error) {
    console.error("Error in createOrUpdatePost:", error);
    return { success: false, msg: "Could not create or update your post", error: error.message };
  }
};

export const fetchPosts = async (limit=10,userId) => {
    try {
     
      if(userId){
        const { data, error } = await supabase
        .from('posts')
        .select(`*,user: users (id, name, image),
          postLikes (*),
          comments  (count)
          `,
        )
        .order('created_at', { ascending: false })
        .eq('userId', userId)
        .limit(limit);
      if (error) {
        return { success: false, msg: 'Could not fetch the posts' };
      }
      return { success: true, data };
      }else{
        const { data, error } = await supabase
        .from('posts')
        .select(`*,user: users (id, name, image),
          postLikes (*),
          comments  (count)
          `,
          
        )
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) {
        return { success: false, msg: 'Could not fetch the posts' };
      }
      return { success: true, data };
      }
    } catch (error) {
      return { success: false, msg: 'Could not fetch the posts due to an exception' };
    }
  };

  // Like service
export const createPostLike = async (postLike) => {
  try {
    // First check if like already exists
    const { data: existingLike } = await supabase
      .from('postLikes')
      .select()
      .match({ userId: postLike.userId, postId: postLike.postId })
      .single();

    if (existingLike) {
      // Unlike if already liked
      const { error } = await supabase
        .from('postLikes')
        .delete()
        .match({ userId: postLike.userId, postId: postLike.postId });

      if (error) throw error;
      return { success: true, data: null, action: 'unliked' };
    }

    // Create new like if not exists
    const { data, error } = await supabase
      .from('postLikes')
      .insert(postLike)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, action: 'liked' };

  } catch (error) {
    console.log('postLike error: ', error);
    return { 
      success: false, 
      msg: 'Could not process like action' 
    };
  }
};

  
  export const removePostLike = async (postId, userId) => {
    try {
      const {error} = await supabase.from('postLikes').
      delete().
      eq('postId', postId).
      eq('userId', userId);
   
      if (error) {
        console.log('postLike error: ', error);
        return { success: false, msg: 'Could not remove feed like' };
      }
      return { success: true};
    } catch (error) {
      return { success: false, msg: 'Could not remove feed like' };
    }
  };

  export const fetchPostDetails = async (postId) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`*,user: users (id, name, image),
          postLikes(*),
          comments(*,
           user: users(id, name, image),
           reply(*))
          `,
          
        )
        .eq('id', postId)
        .order("created_at", { ascending: false, foreignTable: "comments", foreignColumn: "reply" })
        .single();
      if (error) {
        console.log('Fech post details error: ', error);
        return { success: false, msg: 'Could not fetch posts' };
      }
      return { success: true, data };
    } catch (error) {
      return { success: false, msg: 'Could not fetch the posts due to an exception' };
    }
  };




  export const createComment = async (comment) => {
    try {
        const { data, error } = await supabase  // Destructure both data and error
            .from('comments')
            .insert(comment)
            .select()
            .single();
    
        if (error) {
            console.log('post comment error: ', error);
            return { 
                success: false, 
                msg: 'Could not create post comment' 
            };
        }
        
        return { 
            success: true, 
            data, 
            action: 'post commented' 
        };
    
    } catch (error) {
        console.log('post comment error: ', error);
        return { 
            success: false, 
            msg: 'Could not process post comment action' 
        };
    }
}


export const removeComment = async (commentId) => {
  try {
    const {error} = await supabase.from('comments').
    delete().
    eq('id', commentId);
 
    if (error) {
      console.log('removeComment error: ', error);
      return { success: false, msg: 'Could not remove comment' };
    }
    return { success: true, data: {commentId}};
  } catch (error) {
    return { success: false, msg: 'Could not remove feed comment' };
  }
};


export const removePost = async (postId) => {
  try {
    const {error} = await supabase.from('posts').
    delete().
    eq('id', postId);
 
    if (error) {
      console.log('removePost error: ', error);
      return { success: false, msg: 'Could not remove Post' };
    }
    return { success: true, data: {postId}};
  } catch (error) {
    return { success: false, msg: 'Could not remove feed post' };
  }
};

// export const createReply = async (reply) => {
//   try {
//       const { data, error } = await supabase  // Destructure both data and error
//           .from('reply')
//           .insert(reply)
//           .select()
//           .single();
  
//       if (error) {
//           console.log('post comment reply!! error: ', error);
//           return { 
//               success: false, 
//               msg: 'Could not create post comment reply!!' 
//           };
//       }
      
//       return { 
//           success: true, 
//           data, 
//           action: 'post commented replied' 
//       };
  
//   } catch (error) {
//       console.log('post comment reply error: ', error);
//       return { 
//           success: false, 
//           msg: 'Could not process post comment reply action' 
//       };
//   }
// }



export const createReply = async (reply) => {
  try {
      const { data, error } = await supabase
          .from('reply')
          .insert({
            userId: reply.userId,
            text: reply.text,
            commentId: reply.parentCommentId  // Use parentCommentId as commentId
          })
          .select()
          .single();
  
      if (error) {
          console.log('post comment reply error: ', error);
          return { 
              success: false, 
              msg: 'Could not create post comment reply' 
          };
      }
      
      return { 
          success: true, 
          data, 
          action: 'post comment replied' 
      };
  
  } catch (error) {
      console.log('post comment reply error: ', error);
      return { 
          success: false, 
          msg: 'Could not process post comment reply action' 
      };
  }
}

// In postService.js
export const fetchCommentReplies = async (commentId) => {
  try {
    const { data, error } = await supabase
      .from('reply')
      .select(`
        *,
        user: users(id, name, image)
      `)
      .eq('commentId', commentId)
      .order('created_at', { ascending: true });

    if (error) {
      console.log('Fetch comment replies error: ', error);
      return { success: false, msg: 'Could not fetch replies' };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, msg: 'Could not fetch replies' };
  }
};
