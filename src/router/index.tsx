import { useRoutes, Navigate } from "react-router-dom"
import Home from '@/views/Home'
import About from '@/views/About'


const Routers = () => {
  const router = useRoutes([
    { path: '/', element: <Home />, },
    { path: "about", element: <About /> },
  ])

  return router
}

export default Routers