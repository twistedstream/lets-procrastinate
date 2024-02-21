const ShortUniqueId = require("short-unique-id");

const { randomUUID: newEntityId } = new ShortUniqueId({ length: 15 });
const { randomUUID: newStateId } = new ShortUniqueId({ length: 50 });

module.exports = { newEntityId, newStateId };
