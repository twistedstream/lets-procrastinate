const bcrypt = require("bcrypt");

async function hash(password) {
  return bcrypt.hash(password, 10);
}

async function compare(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = {
  hash,
  compare,
};
