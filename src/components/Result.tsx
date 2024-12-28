import { BsCopy } from "react-icons/bs";
import copy from 'copy-to-clipboard';
import { message, Flex, Button, Input, Switch, notification } from 'antd';
import { getTxLink, addPriorityFees } from '@/utils'
import { useTranslation } from "react-i18next";
import { Text_Style1 } from '@/config'

interface PropsType {
  signature: string
  error: string
  tokenAddress?: string
}

function Result(props: PropsType) {
  const { signature, error, tokenAddress } = props

  const { t } = useTranslation()
  const [messageApi, contextHolder] = message.useMessage();
  const copyClick = () => {
    copy(tokenAddress)
    messageApi.success('copy success')
  }

  return (
    <div className="mt-5">
      {contextHolder}
      {signature &&
        <>
          {signature.includes('bundle') ?
            <div className="text-start">
              <div style={{ wordBreak: 'break-all' }}>{signature}</div>
              <a target="_blank" href={getTxLink(signature)} rel="noreferrer">
                <strong className="underline">{t('点击查看捆绑结果')}</strong>
              </a>
            </div>
            :
            <div className="text-start">
              ✅ {t('successfully!')}
              <a target="_blank" href={getTxLink(signature)} rel="noreferrer">
                <strong className="underline">{t('Click to view')}</strong>
              </a>
            </div>
          }
        </>
      }
      {tokenAddress &&
        <div className='flex'>
          <div className={Text_Style1}>{tokenAddress} </div>
          <BsCopy onClick={copyClick} style={{ marginLeft: '6px' }} className='pointer' />
        </div>
      }
      {error != '' && <div className="mt-2">❌ Ohoh.. {error}</div>}
    </div>
  )
}

export default Result