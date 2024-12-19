import { useRoutes, Navigate } from "react-router-dom"
import Home from '@/views/Home'
import CreateToken from '@/views/Token/CreateToken'
import Update from '@/views/Token/Update'


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
      ]
    },
  ])

  return router
}

export default Routers