import React, { createContext, useContext, useState } from 'react';

const ReviewContext = createContext();

export const useReview = () => useContext(ReviewContext);

export const ReviewProvider = ({ children }) => {
  const [activeReview, setActiveReview] = useState({
    reviewText: '',
    reviewDate: '',
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
    });
  };
  
  return (
    <ReviewContext.Provider value={{ 
      activeReview, 
      updateReviewData, 
      getReviewData,
      clearReviewData
    }}>
      {children}
    </ReviewContext.Provider>
  );
};