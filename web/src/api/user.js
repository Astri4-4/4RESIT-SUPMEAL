import api, {BASE_URL} from "./client.js";

export const userApi = {
    getMe: () => api.get("/users/me"),
    update: (updates) => api.put("/users", updates),
    remove: () => api.delete("/users"),
    getPreferences: () => api.get("/users/me/preferences"),
    getActivities: (limit = 10) => api.get(`/users/me/activities?limit=${limit}`),
    updatePreferences: (tagIds) => api.put("/users/me/preferences", {tagIds}),
    exportData: () => api.get("/users/me/export"),
    importData: (data) => api.post("/users/me/import", data),
    googleLinkUrl: () => `${BASE_URL}/auth/google/link?token=${localStorage.getItem("token")}`,
}

export default userApi;
