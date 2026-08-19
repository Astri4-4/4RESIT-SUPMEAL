import client, {BASE_URL} from "./client.js";

export const recipeApi = {
    "getUserRecipes": () => client.get("/recipes/mine", {}),
    "getRecipe": (id) => client.get("/recipes/" + id, {}),
    "getShoppingList": () => client.get("/recipes/shopping-list", {}),
    "addIngredientsToShoppingList": (recipeId) => client.post(`/recipes/shopping-list?recipeId=${recipeId}`, {}),
    "createRecipe": (recipe) => client.post("/recipes", recipe),
    "importFromUrl": (url) => client.post("/recipes/import", {url}),
    "updateRecipe": (id, updates) => client.patch(`/recipes/${id}`, updates),
    "deleteRecipe": (id) => client.delete(`/recipes/${id}`),
    "uploadImage": async (id, file) => {
        const formData = new FormData();
        formData.append("image", file);

        const res = await fetch(`${BASE_URL}/recipes/${id}/image`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: formData,
        });

        if (!res.ok) {
            const data = await res.json().catch(() => null);
            throw new Error(data?.message || data?.error || "Erreur lors de l'upload de l'image");
        }

        return res.json();
    },
}

export default recipeApi;