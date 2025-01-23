import { useState, useEffect, useRef } from 'react'
import type { MenuProps } from 'antd';
import { Dropdown, Segmented, Flex } from 'antd';
import { SettingOutlined } from '@ant-design/icons'
import styled from 'styled-components';
import SetPage from './SetPage'


const SettingSwapper = styled.div`
  margin-right: 10px;
  background-color: #fcf0da;
  height: 48px;
  padding: 0 10px;
  border-radius: 6px;
  color: #656059;
  position: relative;
  svg {
    width: 20px;
    height: 100%;
  }
`
const App = () => {
  const [show, setShow] = useState(true)
  const settingRef = useRef(null)
  const marginRef = useRef<HTMLDivElement | null>(null);

  const showChange = () => {
    setShow(!show)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingRef.current && !settingRef.current.contains(event.target as Node) &&
        marginRef.current && !marginRef.current.contains(event.target as Node)
      ) {
        setShow(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <SettingSwapper>
      <SettingOutlined onClick={showChange} ref={marginRef} />
      {show &&
        <div ref={settingRef}>
          <SetPage />
        </div>
      }
    </SettingSwapper>
  )
}
export default App;

