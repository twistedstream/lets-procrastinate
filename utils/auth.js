const querystring = require("node:querystring");

const { now } = require("./time");
const { UnauthorizedError } = require("./error");

// auth helpers

function capturePreAuthState(req) {
  req.session = req.session || {};
  const { return_to } = req.query;

  req.session.return_to = return_to;
}

function signIn(req, user) {
  req.session = req.session || {};

  req.session.authentication = {
    user: {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
    },
    time: now().toISO(),
  };

  const returnTo = req.session.return_to || "/";
  return returnTo;
}

function signOut(req) {
  req.session = null;
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
  signIn,
  signOut,
  redirectToLogin,
  auth,
  requiresAuth,
};
