const router = require("express").Router();
const { urlencoded } = require("body-parser");

const { usersTable } = require("../utils/data");
const { generateCsrfToken, validateCsrfToken } = require("../utils/csrf");
const { unique } = require("../utils/identifier");
const { now } = require("../utils/time");
const { BadRequestError } = require("../utils/error");
const { capturePreAuthState, signIn } = require("../utils/auth");
const { hash } = require("../utils/password");

// endpoints

router.get("/register", async (req, res) => {
  capturePreAuthState(req);

  const csrf_token = generateCsrfToken(req, res);
  res.render("register", { csrf_token });
});

router.post(
  "/register",
  urlencoded({ extended: false }),
  validateCsrfToken(),
  async (req, res) => {
    const { username, password, display_name } = req.body;
    if (!username) {
      throw BadRequestError("Missing: username");
    }
    if (!password) {
      throw BadRequestError("Missing: password");
    }
    if (!display_name) {
      throw BadRequestError("Missing: display_name");
    }

    const password_hash = await hash(password);

    const newUser = {
      id: unique(),
      created: now().toISO(),
      username,
      display_name,
      password_hash,
    };

    try {
      const { insertedRow: user } = await usersTable.insertRow(newUser);

      const returnTo = signIn(req, user);
      res.redirect(returnTo);
    } catch (err) {
      if (err.message.includes("A row already exists with username")) {
        const csrf_token = generateCsrfToken(req, res);
        return res.status(400).render("register", {
          csrf_token,
          username,
          display_name,
          error_message: "User already exists",
        });
      }

      throw err;
    }
  }
);

module.exports = router;
