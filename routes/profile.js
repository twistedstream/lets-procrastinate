const router = require("express").Router();
const { urlencoded } = require("body-parser");
const querystring = require("node:querystring");

const { usersTable, credentialsTable } = require("../utils/data");
const { generateCsrfToken, validateCsrfToken } = require("../utils/csrf");
const { BadRequestError } = require("../utils/error");
const { requiresAuth } = require("../utils/auth");
const { hash, compare } = require("../utils/password");
const { formatted } = require("../utils/time");
const { fetchMetadata } = require("../utils/metadata");

// endpoints

router.get("/profile", requiresAuth(), async (req, res) => {
  const { row: profile } = await usersTable.findRow(
    (r) => r.id === req.user.id
  );

  const hasPassword = profile.password_hash && profile.password_hash.length > 0;
  delete profile.password_hash;

  const { updated = [] } = req.query;
  const profile_updated = updated.includes("profile");
  const password_updated = updated.includes("password");
  const passkey_added = updated.includes("passkey_added");
  const passkey_removed = updated.includes("passkey_removed");

  const { rows: credentials } = await credentialsTable.findRows(
    (r) => r.user_id === req.user.id
  );

  const metadata = await fetchMetadata();

  const passkeys = credentials.map((c) => ({
    id: c.id,
    icon: metadata[c.aaguid].icon,
    description: metadata[c.aaguid].description,
    created: formatted(c.created),
    is_synced: c.is_backed_up,
    can_delete: credentials.length > 1 || hasPassword,
  }));

  const csrf_token = generateCsrfToken(req, res);
  res.render("profile", {
    csrf_token,
    profile,
    passkeys,
    show_password_fields: hasPassword,
    profile_updated,
    password_updated,
    passkey_added,
    passkey_removed,
  });
});

router.post(
  "/profile",
  requiresAuth(),
  urlencoded({ extended: false }),
  validateCsrfToken(),
  async (req, res) => {
    const { action } = req.body;

    const updated = [];

    switch (action) {
      case "update_profile":
        const { display_name, old_password, new_password } = req.body;
        if (!display_name) {
          throw BadRequestError("Missing: display_name");
        }

        const { row: profile } = await usersTable.findRow(
          (r) => r.id === req.user.id
        );

        // update profile
        if (profile.display_name !== display_name) {
          profile.display_name = display_name;
          updated.push("profile");
        }

        // update password
        if (new_password) {
          if (!old_password) {
            const csrf_token = generateCsrfToken(req, res);
            return res.status(400).render("profile", {
              csrf_token,
              profile,
              error_message: "Provide your existing password to set a new one",
            });
          }

          if (await compare(old_password, profile.password_hash)) {
            profile.password_hash = await hash(new_password);
            updated.push("password");
          } else {
            const csrf_token = generateCsrfToken(req, res);
            return res.status(400).render("profile", {
              csrf_token,
              profile,
              error_message: "Incorrect existing password",
            });
          }
        }

        await usersTable.updateRow((r) => r.id === profile.id, profile);
        break;

      case "delete_passkey":
        const { credential_id } = req.body;
        if (!credential_id) {
          throw BadRequestError("Missing: credential_id");
        }

        // remove credential
        await credentialsTable.deleteRow(
          (r) => r.id === credential_id && r.user_id === req.user.id
        );
        updated.push("passkey_removed");
        break;

      default:
        throw BadRequestError(`Unsupported action: ${action}`);
    }

    res.redirect(`/profile?${querystring.stringify({ updated })}`);
  }
);

module.exports = router;
