import * as cookbookService from '../services/cookbook.service.js';

export async function createCookbook(user, cookbook) {
    cookbook.ownerId = user.id;
    try {
        const storedCookbook = await cookbookService.create(cookbook);
        console.log(storedCookbook);
        const cookbookId = storedCookbook.id;
        await cookbookService.addUserToCookbook(cookbookId, user.id, "owner");
        return storedCookbook;
    } catch (error) {
        throw new Error('Error creating cookbook: ' + error.message);
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
        throw new Error('Error retrieving cookbooks: ' + error.message);
    }
}

export async function getCookbookById(cookbookId) {
    try {
        const cookbook = await cookbookService.getCookbookById(cookbookId);
        cookbook.members = await cookbookService.getCookbookMembers(cookbookId);
        return cookbook;
    } catch (error) {
        console.error(error);
        throw new Error('Error retrieving cookbook: ' + error.message);
    }
}

export async function getCookbookMembers(cookbookId) {
    try {
        return await cookbookService.getCookbookMembers(cookbookId);
    } catch (error) {
        throw new Error('Error retrieving cookbook members: ' + error.message);
    }
}

export async function updateCookbook(cookbookId, updatedCookbook) {
    try {
        return await cookbookService.updateCookbook(cookbookId, updatedCookbook);
    } catch (error) {
        throw new Error('Error updating cookbook: ' + error.message);
    }
}

export async function addUserToCookbook(cookbookId, userId, role) {
    try {
        return await cookbookService.addUserToCookbook(cookbookId, userId, role);
    } catch (error) {
        throw new Error('Error adding user to cookbook: ' + error.message);
    }
}