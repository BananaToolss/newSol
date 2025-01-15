import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";

const VIP_CONFIG = [
  { account: 'Eujhs4tZic6USnos3UCZ5xh5B1iPDkVEVr2jRMHm4xho', time: '2030-01-14 22:00:00' },
  { account: 'AMNHwZjWyY2nZNEaWYGomEf5pQC4VQy7vHGLmy4HdfSa', time: '2030-01-14 22:00:00' },
  { account: '12EXKQHZybvEdnwpDYh3mMi2TAFtEHAo3CEUhPyDsgeK', time: '2030-01-14 22:00:00' },
  { account: '', time: '' },
  { account: '', time: '' },
]

const useIsVip = () => {
  const { publicKey } = useWallet();
  const [vipConfig, setVipConfig] = useState({
    isVip: false,
    vipTime: ''
  })

  useEffect(() => {
    if (publicKey) isVip(publicKey.toBase58())
  }, [publicKey])

  const isVip = (account: string) => {
    const config = VIP_CONFIG.find(item => item.account === account)
    if (config) {
      const newTime = new Date().getTime()
      const vipTime = new Date(config.time).getTime()
      if (vipTime > newTime) {
        let vipUser = {
          isVip: true,
          vipTime: config.time
        }
        setVipConfig(vipUser)
      }
    }
  }

  return vipConfig
}

export default useIsVip
