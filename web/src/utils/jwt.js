// src/utils/jwt.js
import { jwtDecode } from 'jwt-decode'

export function getUserFromToken(token) {
    try {
        const payload = jwtDecode(token)
        // Vérifie l'expiration
        if (payload.exp * 1000 < Date.now()) return null
        return payload
    } catch {
        return null
    }
}