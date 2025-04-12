import React, { createContext, useContext, useState } from 'react';

const ReviewContext = createContext();

export const useReview = () => useContext(ReviewContext);

export const ReviewProvider = ({ children }) => {
  const [activeReview, setActiveReview] = useState({
    reviewText: '',
    reviewDate: '',
    isFavorite: false,
  });
  
  // Update review data
  const updateReviewData = (data) => {
    setActiveReview(prev => ({
      ...prev,
      ...data
    }));
  };
  
  // Get the current review data
  const getReviewData = () => {
    return activeReview;
  };
  
  // Clear review data
  const clearReviewData = () => {
    setActiveReview({
      reviewText: '',
      reviewDate: '',
      isFavorite: false,
    });
  };

    // Add a dedicated function to update the favorite status
    const updateFavoriteStatus = (status) => {
      setActiveReview(prev => ({
        ...prev,
        isFavorite: status
      }));
    };
  
  return (
    <ReviewContext.Provider value={{ 
      activeReview, 
      updateReviewData, 
      getReviewData,
      clearReviewData,
      updateFavoriteStatus
    }}>
      {children}
    </ReviewContext.Provider>
  );
};