const { BadRequestError } = require("./error");
const { newEntityId } = require("./identifier");
const { now } = require("./time");

function createUser(username, display_name, password_hash) {
  if (!username) {
    throw BadRequestError("Missing: username");
  }
  if (!display_name) {
    throw BadRequestError("Missing: display_name");
  }

  return {
    id: newEntityId(),
    created: now().toISO(),
    username,
    display_name,
    // empty for passkey-only users
    password_hash,
  };
}

module.exports = {
  createUser,
};
