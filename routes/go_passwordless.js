const router = require("express").Router();

// endpoints

router.get("/go_passwordless", (req, res) => {
  const { username, display_name } = req.user;
  const { return_to = "/" } = req.query;

  res.render("go_passwordless", { username, display_name, return_to });
});

module.exports = router;
