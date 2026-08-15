import client from "./client.js";

export const favoriteApi = {
    "add": (recipeId) => client.post("/favorites", {recipeId}),
    "remove": (favoriteId) => client.delete(`/favorites/${favoriteId}`)
}

export default favoriteApi;
