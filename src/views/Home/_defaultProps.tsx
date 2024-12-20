
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
            path: 'clone',
            name: '克隆代币',
            icon: <BsHouseFill color={COLOR} style={{ marginRight: '6px' }} />,
          },
          {
            path: 'update',
            name: '代币更新',
            icon: <BsHouseFill color={COLOR} style={{ marginRight: '6px' }} />,
          },
          {
            path: 'revokeAuthority',
            name: '放弃权限',
            icon: <BsHouseFill color={COLOR} style={{ marginRight: '6px' }} />,
          },
          {
            path: 'burn',
            name: '燃烧代币',
            icon: <BsHouseFill color={COLOR} style={{ marginRight: '6px' }} />,
          },   {
            path: 'freezeAccount',
            name: '冻结账户',
            icon: <BsHouseFill color={COLOR} style={{ marginRight: '6px' }} />,
          },   {
            path: 'mint',
            name: '代币蒸发',
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
