import * as cookbookService from '../services/cookbook.service.js';
import {deleteCookbookImage} from '../middlewares/asset.middleware.js';
import {createComment} from "../services/cookbook.service.js";
import * as planService from "../services/plan.service.js";
import {createActivity} from "../services/activity.service.js";

export async function createCookbook(user, cookbook) {
    cookbook.ownerId = user.id;
    try {
        const storedCookbook = await cookbookService.create(cookbook);
        const cookbookId = storedCookbook.id;
        await cookbookService.addUserToCookbook(cookbookId, user.id, "owner");
        await planService.createPlan(null, cookbookId);
        return storedCookbook;
    } catch (error) {
        throw new Error('Error creating cookbook: ' + error.message, { cause: error });
    }
}

export async function getCookbooksByUserId(userId, offset, limit) {
    try {
        const cookbooks = await cookbookService.getCookbooksByUserId(userId, offset, limit);
        for (const cookbook of cookbooks) {
            cookbook.members = await cookbookService.getCookbookMembers(cookbook.id);
            cookbook.role = await cookbookService.getUserRoleInCookbook(cookbook.id, userId);
        }
        return cookbooks;
    } catch (error) {
        throw new Error('Error retrieving cookbooks: ' + error.message, { cause: error });
    }
}

export async function getCookbookById(cookbookId) {
    try {
        const cookbook = await cookbookService.getCookbookById(cookbookId);
        cookbook.members = await cookbookService.getCookbookMembers(cookbookId);
        return cookbook;
    } catch (error) {
        console.error(error);
        throw new Error('Error retrieving cookbook: ' + error.message, { cause: error });
    }
}

export async function getCookbookMembers(cookbookId) {
    try {
        return await cookbookService.getCookbookMembers(cookbookId);
    } catch (error) {
        throw new Error('Error retrieving cookbook members: ' + error.message, { cause: error });
    }
}

const UPDATABLE_COOKBOOK_FIELDS = ['title', 'description', 'image_url'];

export async function updateCookbook(cookbookId, updatedCookbook) {
    const fieldsToUpdate = {};

    for (const field of UPDATABLE_COOKBOOK_FIELDS) {
        if (updatedCookbook[field] !== undefined) {
            fieldsToUpdate[field] = updatedCookbook[field];
        }
    }

    try {
        return await cookbookService.updateCookbook(cookbookId, fieldsToUpdate);
    } catch (error) {
        throw new Error('Error updating cookbook: ' + error.message, { cause: error });
    }
}

export async function addUserToCookbook(cookbookId, userId, role) {
    try {
        const membership = await cookbookService.addUserToCookbook(cookbookId, userId, role);
        await createActivity({cookbookId, userId, type: 'join'});
        return membership;
    } catch (error) {
        throw new Error('Error adding user to cookbook: ' + error.message, { cause: error });
    }
}

export async function changeRoleInCookbook(cookbookId, userId, newRole) {
    try {
        return await cookbookService.changeRoleInCookbook(cookbookId, userId, newRole);
    } catch (error) {
        throw new Error('Error changing user role in cookbook: ' + error.message, { cause: error });
    }
}

export async function deleteCookbook(cookbookId) {
    try {
        const deleted = await cookbookService.deleteCookbook(cookbookId);
        if (deleted && deleted.image_url) {
            await deleteCookbookImage(deleted.image_url);
        }
        return deleted;
    } catch (error) {
        throw new Error('Error deleting cookbook: ' + error.message, { cause: error });
    }
}

export async function quitOrKickMember(cookbookId, userId) {
    try {
        return await cookbookService.removeMember(cookbookId, userId);
    } catch (error) {
        throw new Error('Error quitting or kicking member from cookbook: ' + error.message, { cause: error });
    }
}

export async function addRecipeToCookbook(cookbookId, recipeId, userId) {
    try {
        const result = await cookbookService.addRecipeToCookbook(cookbookId, recipeId);
        await createActivity({cookbookId, userId, type: 'recipe_added', recipeId});
        return result;
    } catch (error) {
        throw new Error('Error adding recipe to cookbook: ' + error.message, { cause: error });
    }
}

export async function deleteRecipeFromCookbook(cookbookId, recipeId) {
    try {
        return await cookbookService.deleteRecipeFromCookbook(cookbookId, recipeId);
    } catch (error) {
        throw new Error('Error deleting recipe from cookbook: ' + error.message, { cause: error });
    }
}

export async function postComment(cookbookId, recipeId, userId, comment) {
    try {
        const cookbookRecipeId = await cookbookService.getCookbookRecipeId(cookbookId, recipeId);
        const created = await createComment(cookbookRecipeId, userId, comment);
        await createActivity({cookbookId, userId, type: 'comment', recipeId, commentId: created.id, excerpt: comment});
        return created;
    } catch (error) {
        throw new Error('Error creating comment: ' + error.message, { cause: error });
    }
}

export async function getCommentsByRecipeId(cookbookId, recipeId) {
    try {
        const cookbookRecipeId = await cookbookService.getCookbookRecipeId(cookbookId, recipeId);
        const results = await cookbookService.getCommentsByRecipeId(cookbookRecipeId);
        return results.rows;
    } catch (error) {
        throw new Error('Error retrieving comment: ' + error.message, { cause: error });
    }
}

export async function updateComment(commentId, comment) {
    try {
        return await cookbookService.updateComment(commentId, comment);
    } catch (e) {
        throw new Error('Error updating comment: ' + e.message, { cause: e });
    }
}

export async function deleteComment(commentId) {
    try {
        return await cookbookService.deleteComment(commentId);
    } catch (e) {
        throw new Error('Error deleting comment: ' + e.message, { cause: e });
    }
}