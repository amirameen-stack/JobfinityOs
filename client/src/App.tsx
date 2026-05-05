import './App.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import KanbanBoardPage from '@/features/kanban/KanbanBoard'
import Layout from '@/layouts/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import LoginPage from '@/pages/Login'
import RegisterPage from '@/pages/Register'

  const router = createBrowserRouter([
    {
      element: <ProtectedRoute />,
      children: [
        {
          path: "/",
          element: <Layout />,
          children: [
            {index: true, element: <KanbanBoardPage /> },
            // { path: "documents", element: <DocumentsModal /> },
            // { path: "agent", element: <AgentMonitorPage /> },
          ],
        },
      ],
    },
    {
      path: "/login",
      element: <LoginPage />,
    },
    {
      path: "/register",
      element: <RegisterPage />,
    },
  ]);

  function App() {
    return <RouterProvider router={router} />
  }

export default App
