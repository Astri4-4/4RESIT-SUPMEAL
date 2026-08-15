import {query} from "../database/db.js";

export async function getShoppingList(userId) {
    const result = await query(
        `SELECT shopping_list_items.id, shopping_list_items.quantity, ingredients.name, ingredients.unit, ingredients.type
         FROM shopping_list_items
         JOIN ingredients ON ingredients.id = shopping_list_items.ingredient_id
         WHERE shopping_list_items.user_id = $1
         ORDER BY shopping_list_items.id`,
        [userId]
    );
    return result.rows;
}

export async function addRecipeIngredientsToShoppingList(userId, recipeId) {
    const result = await query(
        `INSERT INTO shopping_list_items (user_id, ingredient_id, quantity)
         SELECT $1, ingredient_id, quantity FROM recipe_ingredients WHERE recipe_id = $2
         RETURNING *`,
        [userId, recipeId]
    );
    return result.rows;
}

export async function getShoppingListItemById(id) {
    const result = await query(
        `SELECT * FROM shopping_list_items WHERE id = $1`, [id]
    );
    return result.rows[0];
}

export async function deleteShoppingListItem(userId, itemId) {
    const result = await query(
        `DELETE FROM shopping_list_items WHERE user_id = $1 AND id = $2 RETURNING *`,
        [userId, itemId]
    );
    return result.rows[0];
}
