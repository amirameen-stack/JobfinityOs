import './App.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import KabanBoardPage from './pages/components/ui/KanbanBoard.tsx'
import Layout from './components/Layout.tsx'
import { ProtectedRoute } from './components/ProtectedRoute.tsx'

// import AgentMonitorPage from './pages/components/ui/AgentMonitor.tsx';
import LoginPage from './pages/Login.tsx';
import RegisterPage from './pages/Register.tsx';
// import { DocumentsModal } from './pages/components/ui/DocumentsModal.tsx';

  const router = createBrowserRouter([
    {
      element: <ProtectedRoute />,
      children: [
        {
          path: "/",
          element: <Layout />,
          children: [
            {index: true, element: <KabanBoardPage /> },
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
