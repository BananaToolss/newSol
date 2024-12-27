import React, { useState } from 'react';
import { Button, Modal, Input, Flex, message } from 'antd';
import { useTranslation } from "react-i18next";

interface PropsType {
  updata: (_value: string) => void
}

const App = (props: PropsType) => {
  const { updata } = props
  const { t } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage()

  const [inputValue, setInputValue] = useState('')


  const inputValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    updata(inputValue)
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {contextHolder}
      <div onClick={showModal} className='auto_color'>{t('Automatically add quantity')}</div>

      <Modal title={t('Automatically add quantity after each address')} open={isModalOpen} footer={null} onCancel={handleCancel}>
        <p>{t('Automatically add quantity')}:</p>
        <Input onChange={inputValueChange} value={inputValue} placeholder={t('Please enter the amount')} />
        <Flex style={{ margin: '30px 0 10px' }}>
          <Button onClick={handleCancel} style={{ marginRight: '10px' }}>{t('Cancel')}</Button>
          <Button onClick={handleOk} type="primary">{t('Confirm')}</Button>
        </Flex>

      </Modal>
    </>
  );
};

export default App;