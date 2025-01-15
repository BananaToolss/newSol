
import {
  BsWallet,
  BsCoin,
  BsHouseFill,
  BsDatabaseFill,
  BsRobot,
  BsEyeSlash,
  BsUnlock,
  BsSend,
  BsPersonLock,
  BsGraphUp,
  BsArrowUpCircle,
  BsEvStation
} from "react-icons/bs";
import {
  BiSolidBot,
  BiMailSend,
  BiSolidSend,
  BiCollection,
  BiDuplicate, BiLockAlt
} from "react-icons/bi";
import {
  AiOutlineFire,
  AiOutlinePlusCircle
} from "react-icons/ai";
import { getImage } from "@/utils";

const COLOR = '#924ef9'

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
        icon: <BsCoin color={COLOR} />,
        routes: [
          {
            path: 'create',
            name: '创建代币',
            icon: <AiOutlinePlusCircle color={COLOR} style={{ marginRight: '6px' }} />,
          },
          {
            path: 'clone',
            name: '克隆代币',
            icon: <BiDuplicate color={COLOR} style={{ marginRight: '6px' }} />,
          },
          {
            path: 'update',
            name: '代币更新',
            icon: <BsArrowUpCircle color={COLOR} style={{ marginRight: '6px' }} />,
          },
          {
            path: 'revokeAuthority',
            name: '放弃权限',
            icon: <BiLockAlt color={COLOR} style={{ marginRight: '6px' }} />,
          },
          {
            path: 'burn',
            name: '燃烧代币',
            icon: <AiOutlineFire color={COLOR} style={{ marginRight: '6px' }} />,
          },
          {
            path: 'freezeAccount',
            name: '冻结账户',
            icon: <BsPersonLock color={COLOR} style={{ marginRight: '6px' }} />,
          },
          {
            path: 'unfreezeAccount',
            name: '解冻账户',
            icon: <BsUnlock color={COLOR} style={{ marginRight: '6px' }} />,
          },
          {
            path: 'mint',
            name: '代币增发',
            icon: <BsGraphUp color={COLOR} style={{ marginRight: '6px' }} />,
          },
        ]
      },
      {
        path: 'close',
        name: '租金回收',
        icon: <img src={getImage('close.svg')} width={16} height={16} />,
        routes: [
          {
            path: 'account',
            name: '租金回收',
            icon: <img src={getImage('close.svg')} width={16} height={16} />,
          },
          {
            path: 'batch',
            name: '批量回收租金',
            icon: <img src={getImage('close.svg')} width={16} height={16} />,
          },
        ],
      },
      {
        path: '/raydium',
        name: 'Raydium工具',
        icon: <img src={getImage('raydium.png')} width={16} height={16} />,
        routes: [
          {
            path: 'createId',
            name: '创建市值ID',
            icon: <AiOutlinePlusCircle color={COLOR} style={{ marginRight: '6px' }} />,
          },
          {
            path: 'createLiquidity',
            name: '创建流动性',
            icon: <BsEvStation color={COLOR} style={{ marginRight: '6px' }} />,
          },
          {
            path: 'removeLiquidity',
            name: '移除流动性',
            icon: <AiOutlinePlusCircle color={COLOR} style={{ marginRight: '6px' }} />,
          },
          // {
          //   path: 'createLiquidityandbuy',
          //   name: '创建流动性并买入',
          //   icon: <AiOutlinePlusCircle color={COLOR} style={{ marginRight: '6px' }} />,
          // },
        ]
      },
      {
        path: '/pump',
        name: 'Pump专区',
        icon: <img src={getImage('pump.svg')} width={16} height={16} />,
        routes: [
          {
            path: 'create',
            name: 'Pump开盘并买入',
            icon: <img src={getImage('pumpcreate.svg')} width={16} height={16} />,
          },
          {
            path: 'swapbot',
            name: 'Pump防夹刷量',
            icon: <img src={getImage('pumpcreate.svg')} width={16} height={16} />,
          },
          // {
          //   path: 'clone',
          //   name: '卖出并捆绑买入',
          //   icon: <BsHouseFill color={COLOR} style={{ marginRight: '6px' }} />,
          // },
        ]
      },
      {
        path: 'swapbot',
        name: '市值管理',
        icon: <img src={getImage('close.svg')} width={16} height={16} />,
      },
      {
        path: '/tool',
        name: '批量工具',
        icon: <BsSend color={COLOR} />,
        routes: [
          {
            path: 'multisend',
            name: '批量发送',
            icon: <BsSend color={COLOR} />,
          },
          {
            path: 'collector',
            name: '批量归集',
            icon: <BiCollection color={COLOR} />,
          },
          {
            path: 'createwallet',
            name: '批量创建钱包',
            icon: <BsWallet color={COLOR} style={{ marginRight: '6px' }} />,
          },
        ]
      },

    ],
  },
  location: {
    pathname: '/',
  },
};
