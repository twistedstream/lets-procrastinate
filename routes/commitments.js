const router = require("express").Router();
const { urlencoded } = require("body-parser");

const { commitmentsTable } = require("../utils/data");
const { generateCsrfToken, validateCsrfToken } = require("../utils/csrf");
const { newEntityId } = require("../utils/identifier");
const { ago, formatted } = require("../utils/time");
const { BadRequestError } = require("../utils/error");
const { requiresAuth } = require("../utils/auth");

// endpoints

router.get("/commitments", requiresAuth(), async (req, res) => {
  const { rows } = await commitmentsTable.findRows(
    (r) => r.user_id === req.user.id,
    [{ asc: "started" }]
  );
  const commitments = rows.map((r) => ({
    ...r,
    started: formatted(r.started),
  }));

  const csrf_token = generateCsrfToken(req, res);
  res.render("commitments", { csrf_token, commitments });
});

router.post(
  "/commitments",
  requiresAuth(),
  urlencoded({ extended: false }),
  validateCsrfToken(),
  async (req, res) => {
    const { action } = req.body;

    switch (action) {
      case "add_commitment":
        const { description, started_ago } = req.body;
        if (!description) {
          throw BadRequestError("Missing: description");
        }
        if (!started_ago) {
          throw BadRequestError("Missing: started_ago");
        }

        const newCommitment = {
          id: newEntityId(),
          description,
          started: ago(started_ago).toISO(),
          user_id: req.user.id,
        };

        await commitmentsTable.insertRow(newCommitment);
        break;

      case "delete_commitment":
        const { commitment_id } = req.body;

        await commitmentsTable.deleteRow(
          (r) => r.id === commitment_id && r.user_id === req.user.id
        );
        break;

      default:
        throw BadRequestError(`Unsupported action: ${action}`);
    }

    res.redirect("/commitments");
  }
);

module.exports = router;
