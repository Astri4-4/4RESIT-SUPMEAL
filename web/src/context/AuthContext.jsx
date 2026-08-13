// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../api/auth'
import {getUserFromToken} from '../utils/jwt.js'
import { ApiError } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    // Au montage : vérifie si un token existant est encore valide et restaure
    // l'utilisateur complet (le payload du JWT ne contient que id/username)
    useEffect(() => {
        const token = localStorage.getItem('token')
        const storedUser = localStorage.getItem('user')
        if (!token || !storedUser) {
            setLoading(false)
            return
        }
        if (getUserFromToken(token)) {
            setUser(JSON.parse(storedUser))
        } else {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
        }
        setLoading(false)
    }, [])

    const login = async (username, password) => {
        const data = await authApi.login(username, password)
        localStorage.setItem('token', data.user.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        setUser(data.user)
        return data.user
    }

    // Le JWT est stateless côté serveur (pas d'endpoint /auth/logout) :
    // on se contente de nettoyer la session côté client
    const logout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
    }

    // Utilisé après le callback Google OAuth (voir plus bas)
    const setSession = (token, userData) => {
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(userData))
        setUser(userData)
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, setSession }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider')
    return ctx
}