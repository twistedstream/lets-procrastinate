const {
  getSpreadsheetValues,
  nextSheetId,
  fetchSpreadsheet,
  applySpreadsheetChanges,
} = require("./utils");
require("dotenv").config({ path: __dirname + "/../.env" });

const schema = require("./db-schema.json");

// provider helper functions

async function applyGoogleSheetsSchema(spreadsheetId, { dryRun }) {
  const { existingSheets, sheetsByName } = await fetchSpreadsheet(
    spreadsheetId
  );

  const requests = [];

  console.log();
  console.log("Discovering missing sheets (tables):");
  for (const table of schema.tables) {
    const message = `- ${table.name}: `;
    const sheet = sheetsByName.get(table.name);

    if (sheet) {
      console.log(`${message}✅ Exists`);
    } else {
      console.log(`${message}⛔️ Missing`);

      const newSheet = {
        properties: {
          sheetId: nextSheetId(sheetsByName.values()),
          title: table.name,
          gridProperties: {
            rowCount: 1,
            columnCount: table.columns.length,
          },
        },
      };

      requests.push({ addSheet: newSheet });
      sheetsByName.set(table.name, newSheet);
    }
  }

  console.log();
  console.log("Discovering missing columns:");
  for (const table of schema.tables) {
    let data = [[]];
    if (existingSheets.some((s) => s.properties.title === table.name)) {
      // get existing data
      const getResult = await getSpreadsheetValues(
        spreadsheetId,
        `${table.name}!1:1`
      );
      data = getResult.data.values ?? data;
    }
    const columns = data[0];
    const missingColumns = table.columns.filter(
      (c) => !columns.includes(c.name)
    );

    const message = `- ${table.name}: `;

    if (missingColumns.length === 0) {
      console.log(`${message}✅ No missing columns`);
    } else {
      console.log(
        `${message}⛔️ Missing columns: ${missingColumns
          .map((c) => c.name)
          .join(", ")}`
      );

      const sheet = sheetsByName.get(table.name);
      const {
        properties: {
          sheetId,
          gridProperties: { columnCount },
        },
      } = sheet;

      const emptyEndColumns = columnCount - columns.length;

      // insert necessary empty columns at end
      const columnsToInsertCount = missingColumns.length - emptyEndColumns;
      if (columnsToInsertCount > 0) {
        requests.push({
          insertDimension: {
            range: {
              sheetId,
              dimension: "COLUMNS",
              startIndex: columnCount,
              endIndex: columnCount + columnsToInsertCount,
            },
            inheritFromBefore: true,
          },
        });

        console.log(`  > Will append ${columnsToInsertCount} empty column(s)`);
      }

      // update cells with column headers
      requests.push({
        updateCells: {
          rows: [
            {
              values: missingColumns.map((c) => ({
                userEnteredValue: { stringValue: c.name },
              })),
            },
          ],
          fields: "userEnteredValue",
          start: {
            sheetId,
            rowIndex: 0,
            columnIndex: columnCount - emptyEndColumns,
          },
        },
      });

      // reset basic filter
      requests.push({
        clearBasicFilter: {
          sheetId,
        },
      });
      requests.push({
        setBasicFilter: {
          filter: {
            range: {
              sheetId,
              startRowIndex: 0,
              startColumnIndex: 0,
            },
          },
        },
      });
    }
  }

  console.log();
  await applySpreadsheetChanges(spreadsheetId, requests, dryRun);
}

(async () => {
  console.log("Apply Schema script");
  const args = process.argv.slice(2);
  const dryRun = args.some((a) => ["-d", "--dry-run"].includes(a));
  console.log("- dry run:", dryRun);

  const { GOOGLE_SPREADSHEET_ID: spreadsheetId } = process.env;

  await applyGoogleSheetsSchema(spreadsheetId, { dryRun });
})();
