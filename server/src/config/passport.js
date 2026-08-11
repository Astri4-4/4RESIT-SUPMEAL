import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import * as userService from "../services/user.service.js";
import * as planService from "../services/plan.service.js";

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await userService.getUserByGoogleId(profile.id);
            if (user) {
                return done(null, user);
            }

            const email = profile.emails?.[0]?.value;
            user = email ? await userService.getUserByEmail(email) : null;

            if (user) {
                user = await userService.updateUser(user.id, { google_id: profile.id });
                return done(null, user);
            }

            const username = await userService.generateUniqueUsername(profile.displayName || email || `user${profile.id}`);
            user = await userService.createGoogleUser({ username, email, googleId: profile.id });
            await planService.createPlan(user.id);

            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }));
}

export default passport;
