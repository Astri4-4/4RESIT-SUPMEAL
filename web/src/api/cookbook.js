import client, {BASE_URL} from "./client.js";

const cookbookApi = {
    "getUserCookbook": (limit = 10, offset = 0) => client.get(`/cookbooks/?limit=${limit}&offset=${offset}`, {}),
    "getMemberCookbook": (id) => client.get("/cookbooks/" + id + "/users/", {}),
    "getCookbook": (id) => client.get(`/cookbooks/${id}`, {}),
    "getCookbookRecipes": (id) => client.get(`/cookbooks/${id}/recipes`, {}),
    "addMember": (cookbookId, userId, role) => client.post(`/cookbooks/${cookbookId}/members`, {userId, role}),
    "changeRole": (cookbookId, userId, role) => client.patch(`/cookbooks/${cookbookId}/members/${userId}`, {role}),
    "addRecipe": (cookbookId, recipeId) => client.post(`/cookbooks/${cookbookId}/recipes/`, {recipeId}),
    "removeRecipe": (cookbookId, recipeId) => client.delete(`/cookbooks/${cookbookId}/recipes/${recipeId}`),
    "removeMember": (cookbookId, userId) => client.delete(`/cookbooks/${cookbookId}/members/${userId}`),
    "remove": (id) => client.delete(`/cookbooks/${id}`),
    "getComments": (cookbookId, recipeId) => client.get(`/cookbooks/${cookbookId}/recipes/${recipeId}/comments`, {}),
    "getMessages": (cookbookId) => client.get(`/cookbooks/${cookbookId}/messages`, {}),
    "addComment": (cookbookId, recipeId, comment) => client.post(`/cookbooks/${cookbookId}/recipes/${recipeId}/comments`, {comment}),
    "updateComment": (cookbookId, recipeId, commentId, comment) => client.patch(`/cookbooks/${cookbookId}/recipes/${recipeId}/comments/${commentId}`, {comment}),
    "deleteComment": (cookbookId, recipeId, commentId) => client.delete(`/cookbooks/${cookbookId}/recipes/${recipeId}/comments/${commentId}`),
    "update": async (id, {title, description, imageFile}) => {
        const formData = new FormData();
        if (title !== undefined) formData.append("title", title);
        if (description !== undefined) formData.append("description", description);
        if (imageFile) formData.append("image", imageFile);

        const res = await fetch(`${BASE_URL}/cookbooks/${id}`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: formData,
        });

        if (!res.ok) {
            const data = await res.json().catch(() => null);
            throw new Error(data?.message || data?.error || "Erreur lors de la modification du cookbook");
        }

        return res.json();
    },
    "create": async ({title, description, imageFile}) => {
        const formData = new FormData();
        formData.append("title", title);
        if (description) formData.append("description", description);
        if (imageFile) formData.append("image", imageFile);

        const res = await fetch(`${BASE_URL}/cookbooks/create`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: formData,
        });

        if (!res.ok) {
            const data = await res.json().catch(() => null);
            throw new Error(data?.message || data?.error || "Erreur lors de la création du cookbook");
        }

        return res.json();
    },
}

export default cookbookApi;