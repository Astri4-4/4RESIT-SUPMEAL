import api from "./client.js";


export const authApi = {
    login: (username, password) => api.post('/auth/login', { username, password }),
    register: ({ username, email, password, rgpd }) => api.post('/auth/register', { username, email, password, rgpd }),
    me: () => api.get('/users/me'),
}
export default authApi;