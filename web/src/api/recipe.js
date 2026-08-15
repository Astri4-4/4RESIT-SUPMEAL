import client from "./client.js";

export const recipeApi = {
    "getUserRecipes": () => client.get("/recipes/mine", {}),
    "getShoppingList": () => client.get("/recipes/shopping-list", {})
}

export default recipeApi;