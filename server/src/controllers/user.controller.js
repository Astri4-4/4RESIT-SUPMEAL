import * as userService from '../services/user.service.js';
import bcrypt from 'bcrypt';

const UPDATABLE_FIELDS = ['username', 'email', 'password', 'image_url'];

export async function getUserById(user) {
    const id = user.id;

    try {
        return await userService.getUserById(id);
    } catch (error) {
        throw new Error('Error retrieving user information');
    }

}

export async function updateUser(user, updates) {
    const fieldsToUpdate = {};

    for (const field of UPDATABLE_FIELDS) {
        if (updates[field] !== undefined) {
            fieldsToUpdate[field] = updates[field];
        }
    }

    if (fieldsToUpdate.password !== undefined) {
        fieldsToUpdate.password_hash = await bcrypt.hash(fieldsToUpdate.password, 10);
        delete fieldsToUpdate.password;
    }

    try {
        return await userService.updateUser(user.id, fieldsToUpdate);
    } catch (error) {
        console.log(error)
        throw new Error('Error updating user information');
    }
}

export async function deleteUser(user) {
    try {
        return await userService.deleteUserById(user.id);
    } catch (error) {
        throw new Error('Error deleting user');
    }
}