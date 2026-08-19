import client, {BASE_URL} from "./client.js";

const cookbookApi = {
    "getUserCookbook": () => client.get("/cookbooks/", {}),
    "getMemberCookbook": (id) => client.get("/cookbooks/" + id + "/users/", {}),
    "addMember": (cookbookId, userId, role) => client.post(`/cookbooks/${cookbookId}/members`, {userId, role}),
    "addRecipe": (cookbookId, recipeId) => client.post(`/cookbooks/${cookbookId}/recipes/`, {recipeId}),
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
            throw new Error(data?.message || "Erreur lors de la création du cookbook");
        }

        return res.json();
    },
}

export default cookbookApi;