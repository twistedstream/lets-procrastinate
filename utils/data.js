const { GoogleSheetsTable } = require("google-sheets-table");

const {
  GOOGLE_AUTH_CLIENT_EMAIL: client_email,
  GOOGLE_AUTH_PRIVATE_KEY_BASE64,
  GOOGLE_SPREADSHEET_ID: spreadsheetId,
} = process.env;

const private_key = Buffer.from(
  GOOGLE_AUTH_PRIVATE_KEY_BASE64,
  "base64"
).toString("utf-8");
const credentials = { client_email, private_key };

const commitmentsTable = new GoogleSheetsTable({
  credentials,
  spreadsheetId,
  sheetName: "commitments",
  columnConstraints: { uniques: ["id"] },
});

const usersTable = new GoogleSheetsTable({
  credentials,
  spreadsheetId,
  sheetName: "users",
  columnConstraints: { uniques: ["id", "username"] },
});

const credentialsTable = new GoogleSheetsTable({
  credentials,
  spreadsheetId,
  sheetName: "credentials",
  columnConstraints: { uniques: ["id"] },
});

module.exports = {
  commitmentsTable,
  usersTable,
  credentialsTable,
};
