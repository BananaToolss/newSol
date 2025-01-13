import type { MenuProps } from 'antd';
import { Dropdown, Space, Flex } from 'antd';
import styled from 'styled-components';
import { useTranslation } from "react-i18next";
import { isMobile } from 'react-device-detect'
import { getImage } from '@/utils';

const Lang = styled.div`
  display: flex;
  align-items: center;
  margin-right: 10px;
  background: #fcf0da;
  height: 48px;
  padding: 0 10px;
  border-radius: 6px;
  color: #656059;
  cursor: pointer;

  img {
    width: 30px;
    height: 30px;
    margin: 0 3px;
  }
  .lang_title {
     font-weight: 600;
     color: #000;
  }
`

const App = () => {
  const { i18n } = useTranslation()

  const items: MenuProps['items'] = [
    {
      key: '1',
      label: (<div> 中文 - ZH</div>),
      icon: <img src={getImage('lang.svg')} alt='lang' />,
      onClick: () => {
        console.log('first')
        i18n.changeLanguage('ZH')
      }
    },
    {
      key: '2',
      label: (<div>English - EN</div>),
      icon: <img src={getImage('lang.svg')} alt='lang' />,
      onClick: () => i18n.changeLanguage('EN')
    },
  ];

  return (
    <Dropdown menu={{ items }} placement="bottomRight">
      <Lang>
        {!isMobile && <div>Language/语言</div>}
        <img src={getImage('lang.svg')} alt='lang' />
        <div className='lang_title'>{i18n.language}</div>
      </Lang>
    </Dropdown>
  )
}

export default App;