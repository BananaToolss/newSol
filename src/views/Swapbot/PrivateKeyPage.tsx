import React, { useState, useEffect } from 'react';
import { Button, Modal, Input } from 'antd';
import { useTranslation } from "react-i18next";
import { Button_Style1 } from '@/config'

const { TextArea } = Input

interface PropsType {
  privateKeys: string[]
  callBack: (keys: string) => void
  title?: string
}

const App = (props: PropsType) => {
  const { privateKeys, callBack, title } = props

  const { t } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [value, setValue] = useState('')

  useEffect(() => {
    if (privateKeys.length > 0) {
      const _value = privateKeys.join('\n')
      setValue(_value)
    } else {
      setValue('')
    }
  }, [privateKeys])

  const valueChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValue(e.target.value)
  }

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    callBack(value)
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Button className={Button_Style1} onClick={showModal}>
        {title ? title : t('Import brush wallet')}
      </Button>
      <Modal title={title ? title : t('Import brush wallet')} open={isModalOpen}
        footer={null} onCancel={handleCancel}
        width={1000}>

        <div style={{ marginTop: '30px' }}>{t('Private key format: one per line')}</div>
        <TextArea rows={20} value={value} onChange={valueChange}
          placeholder={`${t('Example')}：2stX4YUXA5Yep2u73uag3EiNMRWyR4Y5Q2iCV5nL9t23iUJp4ZVNLckTxrxtxqW5PXQjRTmeyKMN5v1fFKctpqQF
4JZEwmKxbmgoVsDbLpKBovA4vLVUG98idJy7J9ri19B6eCuKJZLXtJ1Er5YtH7pKUKyA2aoqBrDGDEzHx42rgHmX
4YkA4YVUqvaSyFfFjkfTPQ1KjdXUgSGM6eW6H9pVTQXLdhDxtR9qz69saywLBienePg3VmUbQw6c1zjxzMX44M5T
        `}
        />
        <div className='buttonSwapper text-center'>
          <Button className={Button_Style1} onClick={handleOk} style={{ background: '#63e2bd' }}>{t('Import')}</Button>
        </div>

      </Modal>
    </>
  );
};

export default App;