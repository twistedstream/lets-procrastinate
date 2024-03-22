const router = require("express").Router();
const { json } = require("body-parser");
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} = require("@simplewebauthn/server");
const { isoBase64URL } = require("@simplewebauthn/server/helpers");

const { BadRequestError, UnauthorizedError } = require("../../utils/error");
const { usersTable, credentialsTable } = require("../../utils/data");
const { beginSignup, getRegistration } = require("../../utils/auth");
const { now } = require("../../utils/time");

const { RP_ID: rpID, RP_NAME: rpName, BASE_URL: baseUrl } = process.env;

// endpoints

router.post("/options", json(), async (req, res) => {
  if (!req.user) {
    throw UnauthorizedError("User session required");
  }

  const { attestation } = req.body;

  // registering user is an existing user
  const { row: registeringUser } = await usersTable.findRow(
    (r) => r.id === req.user.id
  );
  if (!registeringUser) {
    throw BadRequestError(`User with ID ${req.user.id} no longer exists`);
  }

  // going to exclude existing credentials
  const { rows: excludeCredentials } = await credentialsTable.findRows(
    (r) => r.user_id === req.user.id
  );

  // generate options
  const attestationOptions = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: registeringUser.id,
    userName: registeringUser.username,
    userDisplayName: registeringUser.display_name,
    attestationType: attestation,
    excludeCredentials: excludeCredentials.map((c) => ({
      id: isoBase64URL.toBuffer(c.id),
      type: "public-key",
      transports: c.transports.split(","),
    })),
  });

  // build response
  const optionsResponse = {
    ...attestationOptions,
    status: "ok",
    errorMessage: "",
  };
  console.log(
    "DEBUG [/fido2/attestation/options] Registration challenge response:",
    optionsResponse
  );

  // store registration state in session
  beginSignup(req, registeringUser.username, optionsResponse.challenge);

  res.json(optionsResponse);
});

router.post("/result", json(), async (req, res) => {
  if (!req.user) {
    throw UnauthorizedError("User session required");
  }

  const { body } = req;
  const { id, response } = req.body;
  if (!id) {
    throw BadRequestError("Missing: credential ID");
  }
  if (!response) {
    throw BadRequestError("Missing: authentication response");
  }

  // retrieve registration state from session
  const registration = getRegistration(req);
  console.log(
    "DEBUG [/fido2/attestation/result] Registration state retrieved from session:",
    registration
  );

  //verify registration
  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: registration.challenge,
      expectedOrigin: baseUrl,
      expectedRPID: rpID,
    });
  } catch (err) {
    console.log(
      `WARN [/fido2/attestation/result] Registration error with username ${registration.username} and credential ${id}:`,
      err
    );

    throw BadRequestError(`Registration failed: ${err.message}`);
  }
  console.log("DEBUG [/fido2/attestation/result] verification:", verification);

  // build credential row
  const {
    aaguid,
    credentialPublicKey,
    credentialID,
    counter,
    credentialDeviceType,
    credentialBackedUp,
  } = verification.registrationInfo;
  const validatedCredential = {
    id: isoBase64URL.fromBuffer(credentialID),
    created: now().toISO(),
    public_key: isoBase64URL.fromBuffer(credentialPublicKey),
    counter,
    aaguid,
    device_type: credentialDeviceType,
    is_backed_up: credentialBackedUp,
    transports: response.transports.join(","),
    user_id: req.user.id,
  };
  console.log(
    "DEBUG [/fido2/attestation/result] Validated credential:",
    validatedCredential
  );

  // insert new credential row
  await credentialsTable.insertRow(validatedCredential);

  // build response
  const resultResponse = {
    status: "ok",
    errorMessage: "",
    return_to: "/",
  };

  res.json(resultResponse);
});

module.exports = router;
