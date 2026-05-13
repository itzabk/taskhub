import fs from 'node:fs';

import passport from 'passport';

import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';

import { Strategy as JwtStrategy } from 'passport-jwt';

import { serverConfigs } from '../configs/serverConfigs.js';

const { GOOGLE, LINKEDIN, JWT } = serverConfigs;

// ============= GOOGLE OAUTH2 ================

const googleOauth2Strategy = new GoogleStrategy(
  {
    clientID: GOOGLE.AUTH_KEY,
    clientSecret: GOOGLE.AUTH_CLIENT_SECRET,
    callbackURL: GOOGLE.AUTH_REDIRECT_URI,
    passReqToCallback: true,
  },
  async function verify(req, googleAccessToken, googleRefreshToken, profile, done) {}
);

passport.use('google', googleOauth2Strategy);

export const redirectGoogle = passport.authenticate('google', {
  scope: ['email', 'profile'],
  session: false,
  failWithError: true,
});

export const authenticateWithGoogle = passport.authenticate('google', {
  session: false,
  failWithError: true,
});

// ============= LINKEDIN =================

const linkedInOauth2Strategy = new LinkedInStrategy(
  {
    clientID: LINKEDIN.AUTH_KEY,
    clientSecret: LINKEDIN.AUTH_CLIENT_SECRET,
    callbackURL: LINKEDIN.AUTH_REDIRECT_URI,
    scope: ['r_emailaddress', 'r_liteprofile'],
    state: true,
    passReqToCallback: true,
  },
  async function verify(req, linkedInAccessToken, linkedInRefreshToken, profile, done) {}
);

passport.use('linkedIn', linkedInOauth2Strategy);

export const redirectLinkedIn = passport.authenticate('linkedIn', {
  session: false,
  failWithError: true,
});

export const authenticateWithLinkedIn = passport.authenticate('linkedIn', {
  successRedirect: '/',
  failureRedirect: '/login',
});

// ================ JWT ====================

const PUBLIC_KEY = fs.readFileSync(JWT.PUBLIC_KEY_PATH, { encoding: 'utf-8' });

const extractJwtFromRequest = req => {
  if (req.headers && req.headers.authorization) {
    const authParams = req.headers.authorization.split(' ');
    if (authParams[0] === 'Bearer') {
      return authParams[1];
    }
  }
  if (req.signedCookies && req.signedCookies['access-token']) {
    return req.signedCookies['access-token'];
  }
  return null;
};

const jwtStrategy = new JwtStrategy(
  {
    jwtFromRequest: extractJwtFromRequest,
    secretOrKey: PUBLIC_KEY,
    algorithms: [JWT.ALGORITHM],
    passReqToCallback: true,
  },
  async function verify(req, payload, done) {
    try {
      req.user = payload;
      return done(null, payload);
    } catch (err) {
      return done(err, false);
    }
  }
);

passport.use('jwt', jwtStrategy);

export const authenticateWithJwt = passport.authenticate('jwt', { session: false });
