import { useRoutes, Navigate } from "react-router-dom"
import Home from '@/views/Home'
import CreateToken from '@/views/Token/CreateToken'


const Routers = () => {
  const router = useRoutes([
    { path: '/', element: <Home />, },
    {
      path: '/token',
      element: <Home />,
      children: [
        { index: true, element: <Navigate to='create' /> },
        { path: "create", element: <CreateToken /> },

      ]
    },
  ])

  return router
}

export default Routers