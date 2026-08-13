import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth()
    const location = useLocation()

    if (loading) return <div>Chargement...</div>
    if (!user) {
        // Redirige vers login en gardant l'URL d'origine pour y revenir après connexion
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    return children
}