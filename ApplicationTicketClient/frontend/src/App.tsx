// src/App.tsx (partial update to add future flag)
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ClientDashboard from './pages/ClientDashboard';
import TicketList from './pages/TicketList';
import TicketCreate from './pages/TicketCreate';
import TicketDetail from './pages/TicketDetail';
import TaskList from './pages/TaskList';
import TaskDetail from './pages/TaskDetail';
import TaskCreate from './pages/TaskCreate'; // Add this import
import UserManagement from './pages/UserManagement';
import CompanyManagement from './pages/CompanyManagement';
import CompanyDetail from './pages/CompanyDetail';
import TaskTestPage from './pages/TaskTestPage';
import TestTaskDetail from './pages/TestTaskDetail';
import TaskTestCreate from './pages/TaskTestCreate';
// import Settings from './pages/Settings';
import Profile from './pages/Profile';

// Import i18n
import './i18n';
import Notifications from './pages/Notifications';
import BlockTaskPage from './pages/BlockTaskPage'; 


function App() {
  return (
     <AuthProvider>
      <Router future={{ v7_relativeSplatPath: true }}>
        <div className="min-h-screen bg-gray-100">
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Dashboard routes with role-based redirection */}
            <Route path="/" element={
              <PrivateRoute element={
                <Layout>
                  <DashboardRouter />
                </Layout>
              } />
            } />

            {/* Ticket routes */}
            <Route path="/tickets" element={
              <PrivateRoute element={
                <Layout>
                  <TicketList />
                </Layout>
              } />
            } />
            <Route path="/tickets/create" element={
              <PrivateRoute element={
                <Layout>
                  <TicketCreate />
                </Layout>
              } roles={['client', 'admin', 'agentCommercial']} />
            } />
            <Route path="/tickets/:id" element={
              <PrivateRoute element={
                <Layout>
                  <TicketDetail />
                </Layout>
              } />
            } />

            {/* Task routes */}
            <Route path="/tasks" element={
              <PrivateRoute element={
                <Layout>
                  <TaskList />
                </Layout>
              } roles={['admin', 'projectManager', 'groupLeader', 'developer', 'responsibleTester', 'tester']} />
            } />
            <Route path="/tasks/create" element={
              <PrivateRoute element={
                <Layout>
                  <TaskCreate />
                </Layout>
              } roles={['admin', 'projectManager', 'groupLeader']} />
            } />
            <Route path="/tasks/:id" element={
              <PrivateRoute element={
                <Layout>
                  <TaskDetail />
                </Layout>
              } roles={['admin', 'projectManager', 'groupLeader', 'developer','responsibleTester']} />
            } />
            <Route path="/test-tasks/:id" element={
              <PrivateRoute element={
                <Layout>
                  <TestTaskDetail />
                </Layout>
              } roles={['admin', 'projectManager', 'agentCommercial', 'responsibleTester', 'tester']} />
            } />
            {/* User Management (Admin only) */}
            <Route path="/users" element={
              <PrivateRoute element={
                <Layout>
                  <UserManagement />
                </Layout>
              } roles={['admin', 'agentCommercial']} />
            } />

            {/* Company Management */}
            <Route path="/companies" element={
              <PrivateRoute element={
                <Layout>
                  <CompanyManagement />
                </Layout>
              } roles={['admin', 'agentCommercial']} />
            } />
            <Route path="/companies/:id" element={
              <PrivateRoute element={
                <Layout>
                  <CompanyDetail />
                </Layout>
              } roles={['admin', 'agentCommercial', 'client']} />
            } />

            {/* Settings (accessible to all) */}
            <Route path="/notifications" element={
              <PrivateRoute element={
                <Layout>
                  <Notifications />
                </Layout>
              } />
            } />

            <Route path="/tasks/:id/block" element={
              <PrivateRoute element={
                <Layout>
                  <BlockTaskPage />
                </Layout>
              } roles={['admin', 'projectManager', 'developer']} />
            } />

            <Route path="/testing/:id/block" element={
              <PrivateRoute element={
                <Layout>
                  <BlockTaskPage />
                </Layout>
              } roles={['admin', 'projectManager', 'tester']} />
            } />
            {/* Test Task Page */}
            <Route path="/task-tests" element={
                <PrivateRoute element={
                  <Layout>
                    <TaskTestPage />
                  </Layout>
                } roles={['admin', 'responsibleTester']} />
              } />
               <Route path="/task-test/create" element={
              <PrivateRoute element={
                <Layout>
                  <TaskTestCreate />
                </Layout>
              } roles={['admin', '', 'responsibleTester']} />
            } />

            <Route path="/testing/:id/block" element={
              <PrivateRoute element={
                <Layout>
                  <BlockTaskPage />
                </Layout>
              } roles={['admin', 'projectManager', 'tester']} />
            } />
            {/* Profilel (accessible to all) */}
            <Route path="/profile" element={
              <PrivateRoute element={
                <Layout>
                  <Profile />
                </Layout>
              } />
            } />
              
              {/* Test Task Page */}
              <Route path="/task-tests" element={
                <PrivateRoute element={
                  <Layout>
                    <TaskTestPage />
                  </Layout>
                } roles={['admin', 'responsibleTester']} />
              } />
          </Routes>
          <Toaster />
        </div>
      </Router>
    </AuthProvider>
   );
}

// Component to handle role-based dashboard routing
function DashboardRouter() {
  return (
    <Routes>
      <Route path="/" element={
        <PrivateRoute
          element={<Dashboard />}
          roles={['admin', 'projectManager', 'groupLeader', 'developer', 'agentCommercial', 'responsibleClient', 'responsibleTester', 'tester']}
          fallback={<ClientDashboard />}
        />
      } />
    </Routes>
  );
}

export default App;