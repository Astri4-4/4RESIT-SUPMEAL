import * as userService from "../services/user.service.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';


export async function register(user) {
    try {
        user.password = await bcrypt.hash(user.password, 10);
        return await userService.createUser(user);
    } catch (error) {
        console.error('Error registering user:', error);
        throw error;
    }
}

export async function login(userCreds) {
    try {
        const user = await userService.getUserByUsername(userCreds, true);
        if (!user) {
            throw new Error('Invalid credentials');
        }
        if (bcrypt.compareSync(userCreds.password, user.password_hash)) {
            user.token = generateToken(user);
            return user;
        } else {
            throw new Error('Invalid credentials');
        }
    } catch (error) {
        console.error('Error logging in user:', error);
        throw error;
    }
}

function generateToken(user) {
    return jwt.sign(
        {id: user.id, username: user.username},
        process.env.JWT_SECRET,
        {expiresIn: '7d'}
    );
}