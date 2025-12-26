import { Dimensions } from "react-native";

// Get device dimensions
const { width: deviceWidth, height: deviceHeight } = Dimensions.get('window');

// Calculate height percentage
export const hp = percentage => {
  if (typeof percentage !== 'number' || percentage < 0) return 0;
  return (percentage * deviceHeight) / 100;
};

// Calculate width percentage
export const wp = percentage => {
  if (typeof percentage !== 'number' || percentage < 0) return 0;
  return (percentage * deviceWidth) / 100;
};
export const stripHtmlTags = (html) => {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, '');
}

// Truncate email to maximum 18 characters with ellipsis
export const truncateEmail = (email) => {
  if (!email) return "";
  if (email.length <= 18) return email;
  return email.substring(0, 18) + '..';
}

// Truncate username/name to maximum 8 characters with ellipsis
export const truncateUsername = (username) => {
  if (!username) return "";
  if (username.length <= 8) return username;
  return username.substring(0, 8) + '..';
}

// const stripHtmlTags = (html) => {
//   if (!html) return "";
//   return html.replace(/<\/?[^>]+(>|$)/g, ""); // Removes HTML tags
// };

// Default export
export default { wp, hp };


  
