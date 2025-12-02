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

// const stripHtmlTags = (html) => {
//   if (!html) return "";
//   return html.replace(/<\/?[^>]+(>|$)/g, ""); // Removes HTML tags
// };

// Default export
export default { wp, hp };


  
