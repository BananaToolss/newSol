import { Button, message, notification, Input, Flex, Spin } from 'antd'
import { LoadingOutlined } from '@ant-design/icons';

interface PropsType {
  title: string
}

function LoadingOut(props: PropsType) {
  const { title } = props
  return (
    <div className='flex items-center mt-3 mb-3'>
      <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
      <div className='ml-3 text-sm'>{title}</div>
    </div>
  )
}

export default LoadingOut