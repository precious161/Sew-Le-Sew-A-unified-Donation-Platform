import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from './db.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { config } from './env.js';
import logger from '../utils/logger.js';

// Only log in development
if (process.env.NODE_ENV !== 'production') {
  logger.info('🔑 Loading Google OAuth...');
  logger.info(`   Client ID: ${config.googleClientId ? '✅ Present' : '❌ Missing'}`);
  logger.info(`   Client Secret: ${config.googleClientSecret ? '✅ Present' : '❌ Missing'}`);
}

if (!config.googleClientId || !config.googleClientSecret) {
  logger.error('❌ Google OAuth credentials missing in .env');
}

passport.use(new GoogleStrategy({
    clientID: config.googleClientId,
    clientSecret: config.googleClientSecret,
    callbackURL: `${config.apiUrl}/api/auth/google/callback`,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      const firstName = profile.name.givenName;
      const lastName = profile.name.familyName;

      let user = await prisma.user.findUnique({
        where: { EmailAddress: email }
      });

      if (!user) {
        const randomPassword = crypto.randomBytes(32).toString('hex');
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        user = await prisma.user.create({
          data: {
            EmailAddress: email,
            FirstName: firstName,
            LastName: lastName,
            Password: hashedPassword,
            Role: 'Donor',
            identityStatus: 'Unverified',
            status: 'Active',
          }
        });

        logger.info(`✅ New user created via Google`, { email });
      } else {
        logger.info(`✅ Existing user logged in via Google`, { email });
      }

      return done(null, user);
    } catch (error) {
      logger.error('Google OAuth Error:', error);
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, FirstName: true, EmailAddress: true, Role: true, status: true }
    });
    done(null, user);
  } catch (error) {
    logger.error('Deserialize user error:', error);
    done(error, null);
  }
});

export default passport;