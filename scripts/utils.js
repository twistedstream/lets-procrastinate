require('dotenv').config({ path: __dirname + '/../.env' })
const { GoogleAuth } = require('google-auth-library')
const { sheets } = require('@googleapis/sheets')
const util = require('util')

const {
  GOOGLE_AUTH_CLIENT_EMAIL: client_email,
  GOOGLE_AUTH_PRIVATE_KEY_BASE64
} = process.env
const private_key = Buffer.from(
  GOOGLE_AUTH_PRIVATE_KEY_BASE64,
  'base64'
).toString('utf-8')

const auth = new GoogleAuth({
  credentials: {
    client_email,
    private_key
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
})
const client = sheets({ version: 'v4', auth })

// helpers

async function getSpreadsheet (spreadsheetId) {
  return client.spreadsheets.get({ spreadsheetId })
}

async function batchUpdateSpreadsheet (spreadsheetId, requests) {
  return client.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests }
  })
}

async function getSpreadsheetValues (spreadsheetId, range) {
  return client.spreadsheets.values.get({
    spreadsheetId,
    range,
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'SERIAL_NUMBER'
  })
}

function nextSheetId (existingSheets) {
  const existingSheetsArray = Array.from(existingSheets)
  const existingIds = existingSheetsArray.map(s => s.properties.sheetId)

  let id = 0
  while (existingIds.includes(id)) {
    id++
  }
  return id
}

async function fetchSpreadsheet (spreadsheetId) {
  console.log()
  console.log(`Fetching spreadsheet...`)
  console.log(`- id:     ${spreadsheetId}`)

  const spreadsheet = await getSpreadsheet(spreadsheetId)
  const {
    data: {
      sheets: existingSheets,
      properties: { title: spreadsheetTitle }
    }
  } = spreadsheet
  console.log(`- title:  ${spreadsheetTitle}`)
  console.log(`- sheets: ${existingSheets.length}`)

  const sheetsByName = new Map(existingSheets.map(s => [s.properties.title, s]))

  return {
    existingSheets,
    sheetsByName
  }
}

async function applySpreadsheetChanges (spreadsheetId, requests, dryRun) {
  if (requests.length === 0) {
    console.log('Congrats! Spreadsheet setup is complete and correct.')
  } else {
    if (dryRun) {
      console.log('Changes that would have been applied to the spreadsheet:')
      requests.forEach((request, index) => {
        console.log(
          `${index}: `,
          util.inspect(request, {
            showHidden: false,
            depth: null,
            colors: true
          })
        )
      })
    } else {
      console.log('Applying changes to the spreadsheet...')
      await batchUpdateSpreadsheet(spreadsheetId, requests)
      console.log('  Done 🐿️')
    }
  }
}

module.exports = {
  getSpreadsheet,
  batchUpdateSpreadsheet,
  getSpreadsheetValues,
  nextSheetId,
  fetchSpreadsheet,
  applySpreadsheetChanges
}
