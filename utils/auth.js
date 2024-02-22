const querystring = require("node:querystring");

const { now } = require("./time");
const { BadRequestError, UnauthorizedError } = require("./error");
const { newStateId } = require("./identifier");

// auth helpers

function capturePreAuthState(req) {
  req.session = req.session || {};
  const { return_to } = req.query;

  req.session.return_to = return_to;
}

function beginSignup(req, username, challenge) {
  req.session = req.session || {};

  req.session.registration = {
    username,
    challenge,
  };
}

function beginSignIn(req, username) {
  req.session = req.session || {};

  const state = newStateId();

  req.session.authentication = {
    username,
    state,
  };

  return state;
}

function continueSignInWithPasskey(
  req,
  existingUser,
  challenge,
  userVerification
) {
  req.session = req.session || {};
  const { authentication = {} } = req.session;
  const { state } = authentication;

  req.session.authentication = {
    // will be empty when passkey autofill is happening
    userId: existingUser?.id,
    username: existingUser?.username,
    // support refresh of /login/passkey page
    state,
    challenge,
    userVerification,
  };
}

function completeSignIn(req, user, credentialId) {
  req.session = req.session || {};

  req.session.authentication = {
    user: {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
    },
    // missing if user authenticated with password
    credentialId,
    time: now().toISO(),
  };

  const returnTo = req.session.return_to || "/";

  // clear session state that's no longer needed
  delete req.session.registration;
  delete req.session.return_to;

  return returnTo;
}

function signOut(req) {
  req.session = null;
}

function getAuthentication(req, enforceState) {
  req.session = req.session || {};

  const { authentication } = req.session;
  if (!authentication) {
    throw BadRequestError("Authentication not started");
  }

  if (enforceState) {
    const { state } = req.query;
    if (!state) {
      throw BadRequestError("Missing authentication state");
    }
    if (authentication.state !== state) {
      throw BadRequestError("Bad authentication state");
    }
  }

  return authentication;
}

function getRegistration(req) {
  req.session = req.session || {};

  const { registration } = req.session;
  if (!registration) {
    throw BadRequestError("No active registration");
  }

  return registration;
}

function redirectToLogin(req, res) {
  const return_to = req.originalUrl;

  res.redirect(`/login?${querystring.stringify({ return_to })}`);
}

// middlewares

function auth() {
  return (req, _res, next) => {
    // authenticated user:
    // - has session with authentication state with a set time field
    if (req.session?.authentication?.time) {
      const { authentication } = req.session;

      req.user = authentication.user;
    }

    return next();
  };
}

function requiresAuth() {
  return (req, _res, next) => {
    if (!req.user) {
      return next(UnauthorizedError());
    }

    return next();
  };
}

module.exports = {
  capturePreAuthState,
  beginSignup,
  beginSignIn,
  continueSignInWithPasskey,
  completeSignIn,
  signOut,
  getAuthentication,
  getRegistration,
  redirectToLogin,
  auth,
  requiresAuth,
};
