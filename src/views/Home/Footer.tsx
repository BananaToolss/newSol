import { GithubOutlined } from '@ant-design/icons';
import { DefaultFooter } from '@ant-design/pro-components';
import { BsTelegram, BsTencentQq } from "react-icons/bs";
import { TELEGRAMLINK } from "@/config"

const Footer = () => {
  return (
    <DefaultFooter
      copyright="有任何问题请加入交流群进行反馈"
      links={[
        {
          key: 'github',
          title: <BsTelegram />,
          href: TELEGRAMLINK,
          blankTarget: true,
        },
        {
          key: 'Telegram',
          title: '@BananaTools',
          href: TELEGRAMLINK,
          blankTarget: true,
        },
      ]}
    />)
}

export default Footer