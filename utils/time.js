const { DateTime, Duration } = require("luxon");

function now() {
  return DateTime.now().toUTC();
}

function ago(duration) {
  return now().minus(Duration.fromISO(duration));
}

function formatted(isoDate) {
  return DateTime.fromISO(isoDate).toLocaleString(DateTime.DATE_FULL);
}

module.exports = { now, ago, formatted };
