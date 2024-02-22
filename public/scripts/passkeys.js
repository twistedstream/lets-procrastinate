const {
  browserSupportsWebAuthn,
  browserSupportsWebAuthnAutofill,
  startRegistration,
  startAuthentication,
} = SimpleWebAuthnBrowser;

function arePasskeysSupported() {
  const supported =
    getQueryParam("no_passkeys") === null && browserSupportsWebAuthn();

  console.log("Passkeys supported:", supported);
  return supported;
}

async function isPasskeyAutofillSupported() {
  const supported =
    getQueryParam("no_autofill") === null &&
    arePasskeysSupported() &&
    (await browserSupportsWebAuthnAutofill());

  console.log("Passkey autofill supported:", supported);
  return supported;
}

async function registerUser(username, displayName) {
  // build options request
  const attestationOptionsRequest = {
    username,
    displayName,
    authenticatorSelection: {
      requireResidentKey: true,
      residentKey: "required",
      authenticatorAttachment: "platform",
      userVerification: "required",
    },
    attestation: "direct",
  };
  console.log("attestationOptionsRequest:", attestationOptionsRequest);

  // obtain registration challenge from rp
  const attestationOptionsFetchResponse = await fetch(
    "/fido2/attestation/options",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(attestationOptionsRequest),
    }
  );
  const attestationOptionsResponse =
    await attestationOptionsFetchResponse.json();
  console.log("attestationOptionsResponse:", attestationOptionsResponse);
  if (
    !attestationOptionsResponse ||
    attestationOptionsResponse.status !== "ok"
  ) {
    throw attestationOptionsResponse;
  }

  let attestationResultRequest;
  try {
    attestationResultRequest = await startRegistration(
      attestationOptionsResponse
    );
  } catch (err) {
    if (err.name === "NotAllowedError") {
      return console.warn("User cancelled:", err);
    }
    if (err.name === "InvalidStateError") {
      console.warn("Already registered this credential:", err);
      throw new Error(
        "Hmm, looks like you already registered with this credential"
      );
    }
    console.error("Credential creation error:", err);
    throw err;
  }

  // validate registration with rp
  const attestationResultFetchResponse = await fetch(
    "/fido2/attestation/result",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(attestationResultRequest),
    }
  );
  const attestationResultResponse = await attestationResultFetchResponse.json();
  console.log("attestationResultResponse:", attestationResultResponse);
  if (!attestationResultResponse || attestationResultResponse.status !== "ok") {
    throw attestationResultResponse;
  }

  return attestationResultResponse.return_to;
}

async function authenticateUser(username) {
  // build options request
  const assertionOptionsRequest = {
    username: username || "",
    userVerification: "preferred",
  };
  console.log("assertionOptionsRequest:", assertionOptionsRequest);

  // obtain assertion challenge from rp
  const assertionOptionsFetchResponse = await fetch(
    "/fido2/assertion/options",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(assertionOptionsRequest),
    }
  );
  const assertionOptionsResponse = await assertionOptionsFetchResponse.json();
  console.log("assertionOptionsResponse:", assertionOptionsResponse);
  if (!assertionOptionsResponse || assertionOptionsResponse.status !== "ok") {
    throw assertionOptionsResponse;
  }

  const useBrowserAutofill = username === undefined;
  let assertionResultRequest;
  try {
    assertionResultRequest = await startAuthentication(
      assertionOptionsResponse,
      useBrowserAutofill
    );
  } catch (err) {
    if (err.name === "NotAllowedError") {
      return console.warn("User cancelled:", err);
    }
    if (err.name === "AbortError") {
      return console.warn("Autofill sign-in aborted:", err);
    }

    console.error("Credential get error:", err);
    throw err;
  }

  // validate authentication with rp
  const assertionResultFetchResponse = await fetch("/fido2/assertion/result", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(assertionResultRequest),
  });
  const assertionResultResponse = await assertionResultFetchResponse.json();
  console.log("assertionResultResponse:", assertionResultResponse);
  if (!assertionResultResponse || assertionResultResponse.status !== "ok") {
    throw assertionResultResponse;
  }

  return assertionResultResponse.return_to;
}
