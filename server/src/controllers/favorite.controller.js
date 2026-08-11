import * as favoriteService from "../services/favorite.service.js";


export async function addFavorite(userId, recipeId) {
    return await favoriteService.addFavorite(userId, recipeId);
}

export async function getFavorites(userId) {
    const favorites = await favoriteService.getFavorites(userId);
    return favorites.rows;
}

export async function deleteFavorite(userId, favoriteId) {
    return await favoriteService.deleteFavorite(userId, favoriteId);
}