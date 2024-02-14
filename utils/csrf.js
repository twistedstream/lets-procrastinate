const { doubleCsrf } = require("csrf-csrf");

const { CSRF_SECRET } = process.env;

if (CSRF_SECRET) {
  console.log("CSRF enabled");

  const doubleCsrfOptions = {
    getSecret: () => CSRF_SECRET,
    getTokenFromRequest: (req) => req.body.csrf_token,
    cookieOptions: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  };

  const {
    generateToken, // Use this in your routes to provide a CSRF hash + token cookie and token.
    doubleCsrfProtection, // This is the default CSRF protection middleware.
  } = doubleCsrf(doubleCsrfOptions);

  module.exports = {
    generateCsrfToken: generateToken,
    validateCsrfToken: () => doubleCsrfProtection,
  };
} else {
  console.log("CSRF disabled");

  module.exports = {
    generateCsrfToken: () => "UNUSED",
    validateCsrfToken: () => (_req, _res, next) => next(),
  };
}
