import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Language } from '@/components'
import Setting from './Setting'

function Header() {
  return (
    <div className="flex items-center">
      <Setting />
      <Language />
      <WalletMultiButton />
    </div>
  )
}

export default Header