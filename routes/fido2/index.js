const router = require("express").Router();

const { buildErrorHandlerData } = require("../../utils/error");
const attestation = require("./attestation");
const assertion = require("./assertion");

// child routes

router.use("/fido2/attestation", attestation);
router.use("/fido2/assertion", assertion);

// catch unhandled requests and convert to 404
router.use("/fido2", (_req, _res, next) => {
  const err = new Error("Not Found");
  err.status = 404;

  next(err);
});

// error handling
router.use("/fido2", (err, _req, res, _next) => {
  const { status, description, details } = buildErrorHandlerData(err);

  res.status(status);

  if (status >= 500) {
    console.error("ERROR:", err);
  }

  return res.json({
    status: "failed",
    errorMessage: description,
    errorDetails: details,
  });
});

module.exports = router;
