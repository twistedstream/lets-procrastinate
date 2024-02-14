require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const logger = require("morgan");
const http = require("http");
const https = require("https");
const { engine } = require("express-handlebars");

const package = require("./package.json");
const routes = require("./routes");

const app = express();

// global middlewares

app.use(logger("dev"));

app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "handlebars");
app.engine(
  "handlebars",
  engine({
    defaultLayout: "main",
  })
);

// routes
app.use(routes);

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
