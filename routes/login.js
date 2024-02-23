const router = require("express").Router();
const { urlencoded } = require("body-parser");
const querystring = require("node:querystring");

const { usersTable, credentialsTable } = require("../utils/data");
const { generateCsrfToken, validateCsrfToken } = require("../utils/csrf");
const { BadRequestError } = require("../utils/error");
const {
  capturePreAuthState,
  beginSignIn,
  completeSignIn,
  getAuthentication,
} = require("../utils/auth");
const { compare } = require("../utils/password");

const { PASSKEY_AUTOFILL_ENABLED } = process.env;
const passkey_autofill_enabled = PASSKEY_AUTOFILL_ENABLED === "true";

// endpoints

router.get("/login", async (req, res) => {
  capturePreAuthState(req);

  const { login_hint } = req.query;

  const csrf_token = generateCsrfToken(req, res);
  res.render("login_username", {
    csrf_token,
    username: login_hint,
    passkey_autofill_enabled,
  });
});

router.post(
  "/login",
  urlencoded({ extended: false }),
  validateCsrfToken(),
  async (req, res) => {
    const { username } = req.body;
    if (!username) {
      throw BadRequestError("Missing: username");
    }

    const state = beginSignIn(req, username);

    // check for a passkey
    let passkeyCount = 0;
    const { row: user } = await usersTable.findRow(
      (r) => r.username === username
    );
    if (user) {
      const { rows: credentials } = await credentialsTable.findRows(
        (r) => r.user_id === user.id
      );

      passkeyCount = credentials.length;
    }
    if (passkeyCount > 0) {
      res.redirect(`/login/passkey?${querystring.stringify({ state })}`);
    } else {
      res.redirect(`/login/password?${querystring.stringify({ state })}`);
    }
  }
);

router.get("/login/passkey", (req, res) => {
  const authentication = getAuthentication(req, true);
  const { username } = authentication;
  if (!username) {
    throw BadRequestError("Missing: username");
  }

  const { state } = req.query;
  const use_password_link = `/login/password?${querystring.stringify({
    state,
  })}`;

  res.render("login_passkey", { username, use_password_link });
});

router.get("/login/password", (req, res) => {
  const authentication = getAuthentication(req, true);
  const { username } = authentication;
  if (!username) {
    throw BadRequestError("Missing: username");
  }

  const csrf_token = generateCsrfToken(req, res);
  res.render("login_password", { csrf_token, username });
});

router.post(
  "/login/password",
  urlencoded({ extended: false }),
  validateCsrfToken(),
  async (req, res) => {
    const authentication = getAuthentication(req, true);
    const { username } = authentication;
    if (!username) {
      throw BadRequestError("Missing: username");
    }
    const { password } = req.body;
    if (!password) {
      throw BadRequestError("Missing: password");
    }

    const { row: user } = await usersTable.findRow(
      (r) => r.username === username
    );

    if (user?.password_hash && (await compare(password, user.password_hash))) {
      const return_to = completeSignIn(req, user);

      // prompt to go passwordless if user has no passkeys yet
      const { rows: credentials } = await credentialsTable.findRows(
        (r) => r.user_id === user.id
      );
      if (credentials.length === 0) {
        return res.redirect(
          `/go_passwordless?${querystring.stringify({ return_to })}`
        );
      }

      return res.redirect(return_to);
    }

    const csrf_token = generateCsrfToken(req, res);
    res.status(400).render("login_password", {
      csrf_token,
      username,
      error_message: "Bad username or password",
    });
  }
);

module.exports = router;
