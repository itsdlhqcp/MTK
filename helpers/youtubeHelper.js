// Enhanced youtubeHelper.js
import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Move API key to environment variables or config
// This is a placeholder - replace with your secure storage method
const YOUTUBE_API_KEY = Constants.manifest?.extra?.youtubeApiKey || 'AIzaSyBi-sVDGO9oYYJ_F91IG6wwriftma8VunM';

// Improved YouTube ID extractor with better regex pattern
export const extractYouTubeID = (url) => {
  if (!url) return null;
  
  // Handle multiple YouTube URL formats including shorts
  const patterns = [
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
    /youtube\.com\/shorts\/([^"&?\/\s]{11})/i,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  
  return null;
};

// Get best available thumbnail
export const getYouTubeThumbnail = (videoId, quality = 'high') => {
  if (!videoId) return null;
  
  const qualityMap = {
    max: 'maxresdefault.jpg',
    high: 'hqdefault.jpg',
    medium: 'mqdefault.jpg',
    standard: 'sddefault.jpg',
    default: 'default.jpg'
  };
  
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality] || qualityMap.high}`;
};

// Improved metadata fetching with better error handling and caching
const metadataCache = {};

export const fetchYouTubeMetadata = async (videoId) => {
  if (!videoId) return null;
  
  // Check cache first
  if (metadataCache[videoId]) {
    return metadataCache[videoId];
  }
  
  try {
    // Use YouTube API to fetch video details
    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/videos`,
      {
        params: {
          id: videoId,
          part: 'snippet,contentDetails,statistics',
          key: YOUTUBE_API_KEY
        },
        timeout: 5000 // Set timeout to avoid hanging
      }
    );
    
    if (response.data?.items?.length > 0) {
      const videoData = response.data.items[0];
      const metadata = {
        title: videoData.snippet.title,
        channelTitle: videoData.snippet.channelTitle,
        description: videoData.snippet.description,
        publishedAt: videoData.snippet.publishedAt,
        duration: videoData.contentDetails?.duration,
        viewCount: videoData.statistics?.viewCount,
        // Add more fields as needed
      };
      
      // Cache the result
      metadataCache[videoId] = metadata;
      return metadata;
    }
    
    throw new Error('Video data not found');
  } catch (error) {
    console.error(`Error fetching YouTube metadata for ${videoId}:`, error.message);
    
    // Fall back to alternative method
    return fetchYouTubeMetadataWithoutAPI(`https://www.youtube.com/watch?v=${videoId}`);
  }
};

// Improved alternative method using OG tags
export const fetchYouTubeMetadataWithoutAPI = async (url) => {
  if (!url) return null;
  
  try {
    // Use a CORS proxy if on web platform
    const requestUrl = Platform.OS === 'web' 
      ? `https://cors-anywhere.herokuapp.com/${url}` 
      : url;
    
    // Fetch the HTML content of the YouTube page
    const response = await axios.get(requestUrl, {
      timeout: 5000,
      headers: {
        'Accept': 'text/html',
        'User-Agent': 'Mozilla/5.0 (compatible; RNApp/1.0)'
      }
    });
    
    const html = response.data;
    
    // Extract metadata from Open Graph tags with better regex
    const titleMatch = html.match(/<meta\s+(?:property|name)="(?:og:title|twitter:title)"\s+content="([^"]+)"/i);
    const descMatch = html.match(/<meta\s+(?:property|name)="(?:og:description|twitter:description)"\s+content="([^"]+)"/i);
    const channelMatch = html.match(/<link\s+(?:rel="canonical"|itemprop="name")\s+content="([^"]+)"/i) || 
                        html.match(/<meta\s+(?:property|name)="(?:og:site_name)"\s+content="([^"]+)"/i);
    
    const metadata = {
      title: titleMatch ? titleMatch[1] : 'YouTube Video',
      description: descMatch ? descMatch[1] : '',
      channelTitle: channelMatch ? channelMatch[1] : 'YouTube',
      // No other data available without API
    };
    
    // Cache the result
    if (metadata.title !== 'YouTube Video') {
      const extractedId = extractYouTubeID(url);
      if (extractedId) metadataCache[extractedId] = metadata;
    }
    
    return metadata;
  } catch (error) {
    console.error('Error fetching YouTube metadata without API:', error.message);
    return {
      title: 'YouTube Video',
      channelTitle: 'YouTube',
      description: '',
    };
  }
};

// New function to clear cache if needed
export const clearYouTubeCache = () => {
  Object.keys(metadataCache).forEach(key => delete metadataCache[key]);
};