const router = require("express").Router();
const { urlencoded } = require("body-parser");
const querystring = require("node:querystring");

const { usersTable } = require("../utils/data");
const { generateCsrfToken, validateCsrfToken } = require("../utils/csrf");
const { BadRequestError } = require("../utils/error");
const {
  capturePreAuthState,
  beginSignIn,
  signIn,
  getAuthentication,
} = require("../utils/auth");
const { compare } = require("../utils/password");

// endpoints

router.get("/login", async (req, res) => {
  capturePreAuthState(req);

  const { login_hint } = req.query;

  const csrf_token = generateCsrfToken(req, res);
  res.render("login_username", { csrf_token, username: login_hint });
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

    res.redirect(`/login/password?${querystring.stringify({ state })}`);
  }
);

router.get("/login/password", (req, res) => {
  const authentication = getAuthentication(req);
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
    const authentication = getAuthentication(req);
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

    if (user && (await compare(password, user.password_hash))) {
      const returnTo = signIn(req, user);
      return res.redirect(returnTo);
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
