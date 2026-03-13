import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import DocumentCreate from './pages/DocumentCreate'
import DocumentDetail from './pages/DocumentDetail'
import DocumentList from './pages/DocumentList'
import UserManagement from './pages/admin/UserManagement'
import ApprovalLineManagement from './pages/admin/ApprovalLineManagement'
import AllDocuments from './pages/admin/AllDocuments'
import MyProfile from './pages/MyProfile'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
  return user ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return children
}

function PublicRoute({ children }) {
  const { user } = useAuth()
  return user ? <Navigate to="/" replace /> : children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="documents/create" element={<DocumentCreate />} />
            <Route path="documents/:id" element={<DocumentDetail />} />
            <Route path="documents" element={<DocumentList />} />
            <Route path="profile" element={<MyProfile />} />
            <Route path="admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
            <Route path="admin/approval-lines" element={<AdminRoute><ApprovalLineManagement /></AdminRoute>} />
            <Route path="admin/documents" element={<AdminRoute><AllDocuments /></AdminRoute>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
