// import * as React from "react"
// import Svg, { Path } from "react-native-svg";

// const UpVo = (props) => (
//     <Svg fill="#000000" width="800px" height="800px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
//         <Path d="M12.781 2.375c-.381-.475-1.181-.475-1.562 0l-8 10A1.001 1.001 0 0 0 4 14h4v7a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-7h4a1.001 1.001 0 0 0 .781-1.625l-8-10zM15 12h-1v8h-4v-8H6.081L12 4.601 17.919 12H15z"/>
//     </Svg>
// );

// export default UpVo;
import React from 'react'
import Svg, { Path } from "react-native-svg";

const UpVote = (props) => (
  <Svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color="#000000" fill="none" {...props}>
    <Path 
      d="M12 4L4 15H8V20H16V15H20L12 4Z" 
      stroke="currentColor" 
      strokeWidth={props.strokeWidth} 
      fill={props.fill} 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </Svg>
);

export default UpVote;