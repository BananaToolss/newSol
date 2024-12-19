import { useRoutes, Navigate } from "react-router-dom"
import Home from '@/views/Home'
import CreateToken from '@/views/Token/CreateToken'
import Update from '@/views/Token/Update'
import RevokeAuthority from '@/views/Token/RevokeAuthority'

const Routers = () => {
  const router = useRoutes([
    { path: '/', element: <Home />, },
    {
      path: '/token',
      element: <Home />,
      children: [
        { index: true, element: <Navigate to='create' /> },
        { path: "create", element: <CreateToken /> },
        { path: "clone", element: <CreateToken /> },
        { path: "update", element: <Update /> },
        { path: "revokeAuthority", element: <RevokeAuthority /> },
      ]
    },
  ])

  return router
}

export default Routers