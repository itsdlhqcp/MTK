import React from 'react'
import Home from './Home';
import Mail from './Mail';
import Lock from './Lock';
import User from './User';
import Heart from './Heart';
import Plus from './Plus';
import Search from './Search';
import Location from './Location';
import Call from './Call';
import theme  from '../../constants/theme';
import Camera from './Camera';
import Edit from './Edit';
import ArrowLeft from './ArrowLeft';
import ThreeDotsCircle from './ThreeDotsCircle';
import ThreeDotsHorizontal from './ThreeDotsHorizontal';
import Comment from './Comment';
import Share from './Share';
import Send from './Send';
import Delete from './Delete';
import Logout from './logout';
import Image from './Image';
import Video from './Video';
import Close from './Close';
import Comment01 from './Comment01';
import BubbleChatAdd from './BubbleReply';
import Netflix from './Netflix';
import Prime from './Prime';
import Disney from './Disney';
import Hbo from './Hbo';
import PloTwist from './PloTwist';
import Hulu from './Hulu';
import Amc from './Amc';
import Zee5 from './Zee5';
import SonyLiv from './SonyLiv';
import Paramountlus from './Paramountplus';
import AppleTv from './AppleTv';
import Hotstar from './Hotstar';
import Voot from './Voot';
import Aha from './Aha';
import SunNxt from './Sunnxt';
import Menu from './Menu';
import Dm from "./Dm";
import Back from './back';
import More from './more';
import Bookmark from "./bookmark";
import ThumbsUp from "./thumbsup";
import ThumbsDown from "./thumbsDown";
import YouTube from "./youTube";
import MessageCircle from "./message-circle";
import PapperClip from "./PappeClip";
import Cup from "./CupOfTea";
import Popcorn from "./Popcorn";
import UpVote from "./UpVote";
import Rocket from "./Rocket";
import Up from "./Up";
import Down from "./Down";
import ReplyMsg from "./ReplyMsg";
import UpVo from "./UpVo";
import DownVo from "./DownVo";
import CommentLike from "./CommentLike";
import CommentUnlike from "./CommentUnlike";
import Reload from "./Reload";
import SpotLight from "./SpotLight";
import Calender from "./Calender";
import Grid from "./Grid";
import List from "./List";
import Add from "./Add";
import Crop from "./Crop";
import ReviewPlus from "./Review";
import Pencil from "./Pencil";
import Pen from "./Pen";
import Check from "./Check";
import Eye from "./Eye";
import Spoiler from "./Spoiler";
import Library from "./Library";
import Save from "./Save";
import Chevronup from "./Chevronup"; 
import Chevrondown from "./Chevrondown";
import Tv from "./Tv";
import Plot from "./Plot";
import Repeat from "./Repeat";

const icons = {
    home: Home,
    mail: Mail,
    lock: Lock,
    user: User,
    heart: Heart,
    close: Close,
    plus: Plus,
    search: Search,
    location: Location,
    call: Call,
    camera: Camera,
    edit: Edit,
    arrowLeft: ArrowLeft,
    threeDotsCircle: ThreeDotsCircle,
    threeDotsHorizontal: ThreeDotsHorizontal,
    comment: Comment,
    share: Share,
    send: Send,
    delete: Delete,
    logout: Logout,
    image: Image,
    video: Video,
    comment01: Comment01,
    bubbleChatReply: BubbleChatAdd,
    netflix: Netflix,
    prime: Prime, 
    disney: Disney, 
    hbo: Hbo,
    plotwist: PloTwist, 
    hulu: Hulu, 
    amc: Amc,
    zee5: Zee5,
    sonyliv: SonyLiv,
    paramountplus: Paramountlus,
    appletvplus: AppleTv,
    hotstar: Hotstar,
    voot: Voot, 
    aha: Aha,
    sunnxt: SunNxt,
    menu: Menu,
    dm: Dm,
    back: Back,
    more: More,
    bookmark: Bookmark,
    thumbsup: ThumbsUp,
    thumbsdown: ThumbsDown,
    youtube: YouTube,
    messageCircle: MessageCircle,
    paperclip: PapperClip,
    cup: Cup,
    popcorn: Popcorn,
    upvote: UpVote,
    rocket: Rocket,
    up: Up,
    down: Down,
    replycmt: ReplyMsg,
    upvo: UpVo,
    downvo: DownVo,
    commentlike: CommentLike,
    commentunlike: CommentUnlike,
    reload: Reload,
    spotlight: SpotLight,
    calender: Calender,
    grid: Grid,
    list: List,
    add: Add,
    crop: Crop,
    reviewplus: ReviewPlus,
    pencil: Pencil,
    pen: Pen,
    check: Check,
    eye: Eye,
    spoiler: Spoiler,
    library: Library,
    save: Save,
    chevrondown: Chevrondown,
    chevronup: Chevronup,
    tv: Tv,
    plot: Plot,
    repeat: Repeat
}

const Icon = ({name, ...props}) => {
    const IconComponent = icons[name];
  return (
    <IconComponent
        height={props.size || 24}
        width={props.size || 24}
        strokeWidth={props.strokeWidth || 1.9}
        color={theme.colors.textLight || props.color}
        {...props}
    />
  )
}

export default Icon;
