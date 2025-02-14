// import * as React from "react"
// import Svg, { Defs, Style, G, Path } from "react-native-svg";

// const Close = (props) => (
//   <Svg 
//     xmlns="http://www.w3.org/2000/svg" 
//     viewBox="0 0 35.5 25.1" 
//     width={35.5} 
//     height={25.1} 
//     color="#02f4fb" 
//     fill="none" 
//     {...props}
//   >
//     <Defs>
//       <Style>{`
//         .cls-1, .cls-2 {
//           fill: none;
//           stroke: #02f4fb;
//           stroke-miterlimit: 10;
//         }
//         .cls-2 {
//           stroke-dasharray: 0.1;
//         }
//       `}</Style>
//     </Defs>
//     <G>
//       <G>
//         <G>
//           <Path 
//             d="M5.6,24.8C-1.2,18-1.2,7.1,5.6.4" 
//             stroke="currentColor" 
//             strokeWidth={props.strokeWidth || 1} 
//             strokeDasharray="0.1" 
//             className="cls-2"
//           />
//           <Path 
//             d="M30,.4c6.7,6.7,6.7,17.7,0,24.4" 
//             stroke="currentColor" 
//             strokeWidth={props.strokeWidth || 1} 
//             strokeDasharray="0.1" 
//             className="cls-2"
//           />
//           <Path 
//             d="M16.6,4.8 L18.8,4.8 L18.8,20.4 L16.6,20.4 Z" 
//             transform="rotate(45 17.7 12.6)"
//             stroke="currentColor" 
//             strokeWidth={props.strokeWidth || 1} 
//             className="cls-1"
//           />
//           <Path 
//             d="M16.6,4.8 L18.8,4.8 L18.8,20.4 L16.6,20.4 Z" 
//             transform="rotate(-45 17.7 12.6)"
//             stroke="currentColor" 
//             strokeWidth={props.strokeWidth || 1} 
//             className="cls-1"
//           />
//         </G>
//       </G>
//     </G>
//   </Svg>
// );

// export default Close;


import React from 'react';
import { Svg, Path } from 'react-native-svg';

const Close = () => {
  return (
    <Svg width="24" height="24" viewBox="0 0 24 24">
      <Path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
    </Svg>
  );
};

export default Close;