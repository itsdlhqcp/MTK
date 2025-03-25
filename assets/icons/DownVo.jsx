import React from 'react'
import Svg, { Path } from "react-native-svg";

const  DownVo = (props) => (
  <Svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color="#000000" fill="none" {...props}>
    <Path 
      d="M12 20L4 9H8V4H16V9H20L12 20Z" 
      stroke="currentColor" 
      strokeWidth={props.strokeWidth} 
      fill={props.fill} 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </Svg>
);

export default  DownVo;