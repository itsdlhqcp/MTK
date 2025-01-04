// import { Dimensions } from "react-native";

// const {width: deviceWidth, height: deviceHight} = Dimensions.get('window');

// export const hp = percentage=>{
//     return (percentage*deviceHight) / 100;
// }

//  const wp = percentage=>{
//     return (percentage*deviceWidth) / 100;
// }

// export default {wp, hp};



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

// Default export
export default { wp, hp };


  
