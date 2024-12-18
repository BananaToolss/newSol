
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
      {
        path: '/token',
        name: '代币管理',
        icon: <BsHouseFill color={COLOR} />,
        routes: [
          {
            path: 'create',
            name: '创建代币',
            icon: <BsHouseFill color={COLOR} style={{ marginRight: '6px' }} />,
          },
          {
            path: 'update',
            name: '代币更新',
            icon: <BsHouseFill color={COLOR} style={{ marginRight: '6px' }} />,
          },
        ]
      },
    ],
  },
  location: {
    pathname: '/',
  },
};
