import * as React from "react"
import Svg, { Path } from "react-native-svg";

const Plot = (props) => (
    <Svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" color="#ffffff" fill="none" {...props}>
    <Path d="M21 21H10C6.70017 21 5.05025 21 4.02513 19.9749C3 18.9497 3 17.2998 3 14V3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
    <Path d="M4.5 19.5001L21 3.00012" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    <Path d="M15 4H15.009" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    <Path d="M8 3H8.00898" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    <Path d="M8 9H8.00898" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    <Path d="M20 11H20.009" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    <Path d="M13 17H13.009" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
</Svg>
);

export default Plot;




