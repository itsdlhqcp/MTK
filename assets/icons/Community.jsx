import * as React from "react"
import Svg, { Path, Circle } from "react-native-svg";

const Community = (props) => (
    <Svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="#ffffff" fill="none" {...props}>
        {/* First Person (Left) */}
        <Circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth={props.strokeWidth || 1.5} />
        <Path d="M2 21C2 17.5 4.239 14.5 7 14.5C9.761 14.5 12 17.5 12 21" stroke="currentColor" strokeWidth={props.strokeWidth || 1.5} strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Second Person (Right) */}
        <Circle cx="17" cy="7" r="3" stroke="currentColor" strokeWidth={props.strokeWidth || 1.5} />
        <Path d="M12 21C12 17.5 14.239 14.5 17 14.5C19.761 14.5 22 17.5 22 21" stroke="currentColor" strokeWidth={props.strokeWidth || 1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export default Community;
