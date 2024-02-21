const router = require("express").Router();
const { urlencoded } = require("body-parser");

const { usersTable } = require("../utils/data");
const { generateCsrfToken, validateCsrfToken } = require("../utils/csrf");
const { BadRequestError } = require("../utils/error");
const { capturePreAuthState, signIn } = require("../utils/auth");
const { compare } = require("../utils/password");

// endpoints

router.get("/login", async (req, res) => {
  capturePreAuthState(req);

  const csrf_token = generateCsrfToken(req, res);
  res.render("login", { csrf_token });
});

router.post(
  "/login",
  urlencoded({ extended: false }),
  validateCsrfToken(),
  async (req, res) => {
    const { username, password } = req.body;
    if (!username) {
      throw BadRequestError("Missing: username");
    }
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
    res.status(400).render("login", {
      csrf_token,
      username,
      error_message: "Bad username or password",
    });
  }
);

module.exports = router;
