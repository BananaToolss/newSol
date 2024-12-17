
import {
  BsHouseFill,
} from "react-icons/bs";


const COLOR = '#bf39f1'

export default {
  route: {
    path: '/',
    routes: [
      {
        path: '/',
        name: '首页',
        icon: <BsHouseFill color={COLOR} />,
      },
    ],
  },
  location: {
    pathname: '/',
  },
};
