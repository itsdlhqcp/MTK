import * as React from "react"
import Svg, { Circle, Path } from "react-native-svg";

const Crop = (props) => (
    <Svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" color="#ffffff" fill="none" {...props}>
    <Path d="M22 20H10C7.17157 20 5.75736 20 4.87868 19.1213C4 18.2426 4 16.8284 4 14V2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
    <Path d="M6 20C9.68373 16.4365 13.8235 11.7106 20 15.2551" stroke="currentColor" stroke-width="1.5" />
    <Path d="M2 4L14 4C16.8284 4 18.2426 4 19.1213 4.87868C20 5.75736 20 7.17157 20 10L20 22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
    <Circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
</Svg>
);

export default Crop;















