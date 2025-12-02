import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop, ClipPath, Rect } from 'react-native-svg';

const StarIcon = ({ fillPercentage = 0 }) => {
  const starPath = "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";
  
  // Create a gradient fill based on the exact percentage (0.0 to 1.0)
  const getFillColor = () => {
    if (fillPercentage <= 0) return "none";
    if (fillPercentage >= 1) return "#00FF66"; // Changed to match the green color in Code Y
    return "url(#partialGradient)";
  };

  return (
    <Svg width={46} height={46} viewBox="0 0 24 24">
      <Defs>
        <LinearGradient id="partialGradient" x1="0" x2="1" y1="0" y2="0">
          <Stop offset="0" stopColor="#00FF66" stopOpacity="1" /> {/* Changed to match the green color in Code Y */}
          <Stop offset={fillPercentage} stopColor="#00FF66" stopOpacity="1" /> {/* Changed to match the green color in Code Y */}
          <Stop offset={fillPercentage} stopColor="transparent" stopOpacity="0" />
          <Stop offset="1" stopColor="transparent" stopOpacity="0" />
        </LinearGradient>
        <ClipPath id="starClip">
          <Path d={starPath} />
        </ClipPath>
      </Defs>
      <Path
        d={starPath}
        fill="#2C4150" // Changed to match the empty star color in Code Y
        stroke="#2C4150" // Changed to match the empty star color in Code Y
        strokeWidth={1}
      />
      <Rect
        x="0"
        y="0"
        width="24"
        height="24"
        fill={getFillColor()}
        clipPath="url(#starClip)"
      />
    </Svg>
  );
};

export default StarIcon;