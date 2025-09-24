const passport = require("passport");
const petOwnerModel = require("../models/petOwnerModel");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await petOwnerModel.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});


// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/oauth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await petOwnerModel.findOne({
          $or: [
            { email: profile.emails[0].value },
            { oauthId: profile.id, oauthProvider: "google" },
          ],
        });

        if (user) {
          // Update existing user if needed
          if (!user.oauthProvider) {
            user.oauthProvider = "google";
            user.oauthId = profile.id;
            user.isVerified = true;
            await user.save();
          }
          return done(null, user);
        }

        // Create new user
        user = await petOwnerModel.create({
          name: profile.displayName,
          email: profile.emails[0].value,
          oauthProvider: "google",
          oauthId: profile.id,
          isVerified: true,
          avatar: profile.photos[0].value,
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

module.exports = passport;
