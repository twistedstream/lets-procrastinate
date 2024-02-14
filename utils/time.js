const { DateTime, Duration } = require("luxon");

function ago(duration) {
  return DateTime.now().minus(Duration.fromISO(duration)).toUTC().toISO();
}

function formatted(isoDate) {
  return DateTime.fromISO(isoDate).toLocaleString(DateTime.DATE_FULL);
}

module.exports = { ago, formatted };
