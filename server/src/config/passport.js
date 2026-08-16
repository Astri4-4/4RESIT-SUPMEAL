import passport from "passport";
import jwt from "jsonwebtoken";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import * as userService from "../services/user.service.js";
import * as planService from "../services/plan.service.js";

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        passReqToCallback: true,
    }, async (req, accessToken, refreshToken, profile, done) => {
        try {
            // A `state` present here means an already-logged-in user initiated
            // /auth/google/link, carrying their JWT through the OAuth round trip
            // so we know which account to attach this Google id to.
            const state = req.query.state;
            if (state) {
                let payload;
                try {
                    payload = jwt.verify(state, process.env.JWT_SECRET);
                } catch (error) {
                    return done(null, false, { message: "Lien Google invalide ou expiré." });
                }

                const existing = await userService.getUserByGoogleId(profile.id);
                if (existing && existing.id !== payload.id) {
                    return done(null, false, { message: "Ce compte Google est déjà lié à un autre utilisateur." });
                }

                const updated = await userService.updateUser(payload.id, { google_id: profile.id });
                return done(null, updated);
            }

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
