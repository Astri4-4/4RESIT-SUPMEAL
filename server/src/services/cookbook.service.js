import {query} from '../database/db.js';

export async function create(cookbook) {
    try {
        const result = await query(
            'INSERT INTO cookbooks (owner_id, title, description, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
            [cookbook.ownerId, cookbook.title, cookbook.description, cookbook.imageUrl ?? null]
        );
        return result.rows[0];
    } catch (error) {
        throw new Error('Erreur lors de la création du cookbook : ' + error.message, { cause: error });
    }
}

export async function addUserToCookbook(cookbookId, userId, role) {
    try {
        const result = await query(
            'INSERT INTO cookbook_users (cookbook_id, user_id, role) VALUES ($1, $2, $3) RETURNING *',
            [cookbookId, userId, role]
        );
        return result.rows[0];
    } catch (error) {
        throw new Error('Erreur lors de l\'ajout du membre au cookbook : ' + error.message, { cause: error });
    }
}

export async function getCookbookById(cookbookId) {
    try {
        const result = await query(
            'SELECT * FROM cookbooks WHERE id = $1',
            [cookbookId]
        );
        return result.rows[0];
    } catch (error) {
        throw new Error('Erreur lors de la récupération du cookbook : ' + error.message, { cause: error });
    }
}

export async function isInCookbook(cookbookId, userId) {
    try {
        const result = await query(
            'SELECT * FROM cookbook_users WHERE cookbook_id = $1 AND user_id = $2',
            [cookbookId, userId]
        );
        return result.rows.length > 0;
    } catch (error) {
        throw new Error('Erreur lors de la vérification de l\'appartenance au cookbook : ' + error.message, { cause: error });
    }
}

export async function getCookbookMembers(cookbookId) {
    try {
        const result = await query(
            'SELECT u.id, u.username, cu.role, u2.email FROM users u JOIN cookbook_users cu ON u.id = cu.user_id JOIN public.users u2 on u2.id = cu.user_id WHERE cu.cookbook_id = $1',
            [cookbookId]
        );
        return result.rows;
    } catch (error) {
        throw new Error('Erreur lors de la récupération des membres du cookbook : ' + error.message, { cause: error });
    }
}

export async function getCookbooksByUserId(userId, offset, limit) {
    try {
        const result = await query(
            'SELECT c.* FROM cookbooks c JOIN cookbook_users cu ON c.id = cu.cookbook_id WHERE cu.user_id = $1 ORDER BY c.id LIMIT $2 OFFSET $3',
            [userId, limit, offset]
        )
        return result.rows;
    } catch (error) {
        throw new Error('Erreur lors de la récupération des cookbooks de l\'utilisateur : ' + error.message, { cause: error });
    }
}

export async function getUserRoleInCookbook(cookbookId, userId) {
    try {
        const result = await query(
            'SELECT role FROM cookbook_users WHERE cookbook_id = $1 AND user_id = $2',
            [cookbookId, userId]
        );
        return result.rows[0] ? result.rows[0].role : null;
    } catch (error) {
        throw new Error('Erreur lors de la récupération du rôle de l\'utilisateur : ' + error.message, { cause: error });
    }
}

export async function updateCookbook(cookbookId, updatedCookbook) {
    const fields = [];
    const values = [];
    let index = 1;

    for (const [key, value] of Object.entries(updatedCookbook)) {
        fields.push(`${key} = $${index}`);
        values.push(value);
        index++;
    }

    if (fields.length === 0) {
        return getCookbookById(cookbookId);
    }

    values.push(cookbookId);

    try {
        const result = await query(
            `UPDATE cookbooks SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`,
            values
        );
        return result.rows[0];
    } catch (error) {
        throw new Error('Erreur lors de la modification du cookbook : ' + error.message, { cause: error });
    }
}

export async function changeRoleInCookbook(cookbookId, userId, newRole) {
    try {
        const result = await query(
            'UPDATE cookbook_users SET role = $1 WHERE cookbook_id = $2 AND user_id = $3 RETURNING *',
            [newRole, cookbookId, userId]
        );
        return result.rows[0];
    } catch (error) {
        throw new Error('Erreur lors du changement de rôle : ' + error.message, { cause: error });
    }
}

export async function deleteCookbook(cookbookId) {
    try {
        const result = await query(
            'DELETE FROM cookbooks WHERE id = $1 RETURNING *',
            [cookbookId]
        );
        return result.rows[0];
    } catch (error) {
        throw new Error('Erreur lors de la suppression du cookbook : ' + error.message, { cause: error });
    }
}

export async function removeMember(cookbookId, userId) {
    try {
        const result = await query(
            'DELETE FROM cookbook_users WHERE cookbook_id = $1 AND user_id = $2 RETURNING *',
            [cookbookId, userId]
        );
        return result.rows[0];
    } catch (error) {
        throw new Error('Erreur lors du retrait du membre : ' + error.message, { cause: error });
    }
}

export async function addRecipeToCookbook(cookbookId, recipeId) {
    try {
        const result = await query(
            `INSERT INTO cookbook_recipes (cookbook_id, recipe_id) VALUES ($1, $2) RETURNING *`,
            [cookbookId, recipeId]
        );
        return result.rows[0];
    } catch (error) {
        throw new Error('Erreur lors de l\'ajout de la recette au cookbook : ' + error.message, { cause: error });
    }
}

export async function isRecipeInCookbook(cookbookId, recipeId) {
    try {
        const result = await query(
            'SELECT * FROM cookbook_recipes WHERE cookbook_id = $1 AND recipe_id = $2',
            [cookbookId, recipeId]
        );
        return result.rows.length > 0;
    } catch (error) {
        throw new Error('Erreur lors de la vérification de la présence de la recette dans le cookbook : ' + error.message, { cause: error });
    }
}

export async function getCookbooksByRecipeId(recipeId) {
    try {
        const result = await query(
            'SELECT cookbook_id FROM cookbook_recipes WHERE recipe_id = $1',
            [recipeId]
        );
        return result.rows.map((row) => row.cookbook_id);
    } catch (error) {
        throw new Error('Erreur lors de la récupération des cookbooks de la recette : ' + error.message, { cause: error });
    }
}

export async function getCookbookRecipeId(cookbookId, recipeId) {
    try {
        const result = await query(
            'SELECT id FROM cookbook_recipes WHERE cookbook_id = $1 AND recipe_id = $2',
            [cookbookId, recipeId]
        );
        return result.rows[0] ? result.rows[0].id : null;
    } catch (error) {
        throw new Error('Erreur lors de la récupération du lien cookbook/recette : ' + error.message, { cause: error });
    }
}

export async function deleteRecipeFromCookbook(cookbookId, recipeId) {
    try {
        const result = await query(
            `DELETE FROM cookbook_recipes WHERE cookbook_id = $1 AND recipe_id = $2 RETURNING *`,
            [cookbookId, recipeId]
        );
        return result.rows[0];
    } catch (error) {
        throw new Error('Erreur lors de la suppression de la recette du cookbook : ' + error.message, { cause: error });
    }
}

export async function createComment(recipeId, userId, content) {

    try {
        const result = await query(
            `INSERT INTO cookbook_recipe_comments (cookbook_recipe_id, user_id, comment) VALUES ($1, $2, $3) RETURNING *`,
            [recipeId, userId, content]
        );
        return result.rows[0];
    } catch (error) {
        throw new Error('Erreur lors de la création du commentaire : ' + error.message, { cause: error });
    }

}

export async function getCommentsByRecipeId(recipeId) {
    try {
        return await query(
            `SELECT * FROM cookbook_recipe_comments WHERE cookbook_recipe_id = $1`,
            [recipeId]
        );
    } catch (e) {
        throw new Error("Erreur lors de la récupération des commentaires de la recette : " + e.message, { cause: e });
    }
}

export async function getCommentById(commentId) {
    try {
        const result = await query(
            `SELECT * FROM cookbook_recipe_comments WHERE id = $1`,
            [commentId]
        )
        return result.rows[0];
    } catch (e) {
        throw new Error("Erreur lors de la récupération des commentaires : " + e.message, { cause: e });
    }
}

export async function updateComment(commentId, comment) {
    try {
        const result = await query(
            `UPDATE cookbook_recipe_comments SET comment = $1 WHERE id = $2 RETURNING *`,
            [comment, commentId]
        );
        return result.rows[0];
    } catch (e) {
        throw new Error("Erreur lors de la modification du commentaire : " + e.message, { cause: e });
    }
}

export async function deleteComment(commentId) {
    try {
        await query(
            `DELETE FROM cookbook_recipe_comments WHERE id = $1`,
            [commentId]
        );
    } catch (e) {
        throw new Error("Erreur lors de la suppression du commentaire : " + e.message, { cause: e });
    }
}
