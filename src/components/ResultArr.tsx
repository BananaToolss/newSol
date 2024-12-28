import { BsCopy } from "react-icons/bs";
import copy from 'copy-to-clipboard';
import { message, Flex, Button, Input, Switch, notification } from 'antd';
import { getTxLink, addPriorityFees } from '@/utils'
import { useTranslation } from "react-i18next";
import { Text_Style1 } from '@/config'

interface PropsType {
  signature: string[]
  error: string
}

function Result(props: PropsType) {
  const { signature, error } = props

  const { t } = useTranslation()
  const [messageApi, contextHolder] = message.useMessage();

  return (
    <div className="mt-5">
      {contextHolder}

      {signature.map((item, index) => (
        <div className="text-start" key={item}>
          ✅ {t('successfully!')}
          <a target="_blank" href={getTxLink(item)} rel="noreferrer">
            <strong className="underline">{t('Click to view')}</strong>
          </a>
        </div>
      ))}
      {error != '' && <div className="mt-2">❌ Ohoh.. {error}</div>}
    </div>
  )
}

export default Result