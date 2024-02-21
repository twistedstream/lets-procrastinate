const router = require("express").Router();

const { signOut } = require("../utils/auth");

// endpoints

router.get("/logout", async (req, res) => {
  signOut(req);

  res.redirect("/");
});

module.exports = router;
