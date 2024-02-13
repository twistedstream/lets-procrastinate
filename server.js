require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const logger = require("morgan");
const http = require("http");
const https = require("https");

const package = require("./package.json");

const app = express();

app.use(logger("dev"));

app.get("/", (_req, res) => {
  res.send("ok");
});

const port = process.env.PORT || 3000;

const server =
  process.env.NODE_ENV === "production"
    ? http.createServer(app)
    : https.createServer(
        {
          key: fs.readFileSync(path.resolve("./cert/dev.key")),
          cert: fs.readFileSync(path.resolve("./cert/dev.crt")),
        },
        app
      );

server.listen(port, () => {
  console.log(
    `${package.description} (v${package.version}), listening on port ${port}`
  );
});
