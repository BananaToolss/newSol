import { useRoutes, Navigate } from "react-router-dom"
import Home from '@/views/Home'
import CreateToken from '@/views/Token/CreateToken'
import Update from '@/views/Token/Update'
import RevokeAuthority from '@/views/Token/RevokeAuthority'
import BurnToken from '@/views/Token/Burn'
import FreezeAccount from '@/views/Token/FreezeAccount'
import MintToken from '@/views/Token/MintToken'

import CloseAccount from '@/views/CloseAccount'

import CreateBuy from '@/views/Pump/CreateBuy'

const Routers = () => {
  const router = useRoutes([
    {
      path: '/', element: <Home />,
      children: [
        { path: '/', element: <Home /> },
        { path: "closeAccount", element: <CloseAccount /> },

      ]
    },
    {
      path: '/token',
      element: <Home />,
      children: [
        { index: true, element: <Navigate to='create' /> },
        { path: "create", element: <CreateToken /> },
        { path: "clone", element: <CreateToken /> },
        { path: "update", element: <Update /> },
        { path: "revokeAuthority", element: <RevokeAuthority /> },
        { path: "burn", element: <BurnToken /> },
        { path: "freezeAccount", element: <FreezeAccount /> },
        { path: "mint", element: <MintToken /> },

      ]
    },
    {
      path: '/pump',
      element: <Home />,
      children: [
        { index: true, element: <Navigate to='create' /> },
        { path: "create", element: <CreateBuy /> },
        { path: "clone", element: <CreateToken /> },
        { path: "update", element: <Update /> },
        { path: "revokeAuthority", element: <RevokeAuthority /> },
        { path: "burn", element: <BurnToken /> },
        { path: "freezeAccount", element: <FreezeAccount /> },
        { path: "mint", element: <MintToken /> },

      ]
    },
  ])

  return router
}

export default Routers