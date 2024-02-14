const ShortUniqueId = require("short-unique-id");

const { randomUUID } = new ShortUniqueId({ length: 15 });

function unique() {
  return randomUUID();
}

module.exports = { unique };
