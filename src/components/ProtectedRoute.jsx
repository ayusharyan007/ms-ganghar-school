import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
export function ProtectedRoute({ children }) {
  const { admin, loading, session } = useAuth()
  if (loading) return <div className="admin-loading"><span className="spinner"/> Checking secure session…</div>
  if (!session || !admin) return <Navigate to="/admin/login" replace/>
  return children
}
