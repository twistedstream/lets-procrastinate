const DATA_URL =
  "https://raw.githubusercontent.com/passkeydeveloper/passkey-authenticator-aaguids/main/combined_aaguid.json";

let metadata;

async function fetchMetadata() {
  if (!metadata) {
    const fetchResponse = await fetch(DATA_URL, {
      method: "GET",
    });
    const data = await fetchResponse.json();

    const aaguids = Object.keys(data);

    metadata = aaguids.reduce((p, c) => {
      const statement = data[c];
      p[c] = {
        description: statement.name,
        icon: statement.icon_light,
      };

      return p;
    }, {});
  }

  return metadata;
}

module.exports = {
  fetchMetadata,
};
