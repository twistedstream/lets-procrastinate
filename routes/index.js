const router = require("express").Router();

const commitments = require("./commitments");

// endpoints

router.get("/", (_req, res) => {
  res.render("index");
});

// other routes

router.use(commitments);

module.exports = router;
