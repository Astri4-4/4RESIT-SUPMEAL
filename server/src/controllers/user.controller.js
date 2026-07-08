import * as userService from '../services/user.service.js';

export async function getMyself(user) {
    const id = user.id;

    try {
        return await userService.getUserById(id);
    } catch (error) {
        throw new Error('Error retrieving user information');
    }

}