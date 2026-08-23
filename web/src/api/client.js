// src/api/client.js
const BASE_URL = import.meta.env.VITE_API_URL || 'http://192.168.10.43:3000'

class ApiError extends Error {
    constructor(message, status, data) {
        super(message)
        this.status = status
        this.data = data
    }
}

async function request(endpoint, options = {}) {
    const token = localStorage.getItem('token')

    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        },
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, config)

    // Gestion centralisée du 401
    if (res.status === 401) {
        localStorage.removeItem('token')
        if (window.location.pathname !== '/login') {
            window.location.href = '/login'
        }
        throw new ApiError('Non authentifié', 401)
    }

    // Pas de contenu (204) ou réponse vide
    if (res.status === 204) return null

    const data = await res.json().catch(() => null)

    if (!res.ok) {
        const validationMessage = data?.errors?.[0]?.message
        throw new ApiError(data?.message || data?.error || validationMessage || 'Une erreur est survenue.', res.status, data)
    }

    return data
}

const api = {
    get: (endpoint) => request(endpoint),
    post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    patch: (endpoint, body) => request(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
    put: (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
}

export default api
export { ApiError, BASE_URL }