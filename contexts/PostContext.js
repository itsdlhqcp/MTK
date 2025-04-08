import React, { createContext, useContext, useState } from 'react';

const PostContext = createContext();

export const usePost = () => useContext(PostContext);

export const PostProvider = ({ children }) => {
  const [activePosts, setActivePosts] = useState({});
  
  // Register a post to be tracked
  const registerPost = (postId, postData) => {
    setActivePosts(prev => ({
      ...prev,
      [postId]: postData
    }));
  };
  
  // Update a post's data
  const updatePost = (postId, updatedData) => {
    setActivePosts(prev => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        ...updatedData
      }
    }));
  };
  
  // Get the latest data for a post
  const getPostData = (postId) => {
    return activePosts[postId] || null;
  };
  
  return (
    <PostContext.Provider value={{ 
      activePosts, 
      registerPost, 
      updatePost, 
      getPostData 
    }}>
      {children}
    </PostContext.Provider>
  );
};