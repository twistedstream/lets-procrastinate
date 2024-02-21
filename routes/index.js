const router = require("express").Router();

const register = require("./register");
const login = require("./login");
const logout = require("./logout");
const commitments = require("./commitments");

// endpoints

router.get("/", (_req, res) => {
  res.render("index");
});

// other routes

router.use(register);
router.use(login);
router.use(logout);
router.use(commitments);

module.exports = router;
