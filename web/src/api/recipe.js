import client from "./client.js";

export const recipeApi = {
    "getUserRecipes": () => client.get("/recipes/mine", {}),
    "getRecipe": (id) => client.get("/recipes/" + id, {}),
    "getShoppingList": () => client.get("/recipes/shopping-list", {}),
    "addIngredientsToShoppingList": (recipeId) => client.post(`/recipes/shopping-list?recipeId=${recipeId}`, {})
}

export default recipeApi;