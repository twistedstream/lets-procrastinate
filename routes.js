const router = require("express").Router();

router.get("/", (_req, res) => {
  res.render("index");
});

router.get("/commitments", (_req, res) => {
  res.render("commitments");
});

module.exports = router;
