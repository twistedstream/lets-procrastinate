require("dotenv").config();
require("express-async-errors");
const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const logger = require("morgan");
const http = require("http");
const https = require("https");
const { engine } = require("express-handlebars");
const cookieSession = require("cookie-session");
const cookieParser = require("cookie-parser");

const package = require("./package.json");
const routes = require("./routes");

const { COOKIE_SECRET } = process.env;

const app = express();

// global middlewares

app.use(
  cookieSession({
    secret: COOKIE_SECRET,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  })
);

app.use(cookieParser(COOKIE_SECRET));

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

// catch 404 and forward to error handler
app.use(function (_req, _res, next) {
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// error handlers
app.use(function (err, _req, res, _next) {
  // TODO: remove
  console.log(">>> HANDLE");

  const status = err.status || 500;
  if (status >= 500) {
    console.error("ERROR:", err);
  }

  res.status(status);
  res.json({
    message: err.message,
    error: process.env.NODE_ENV !== "production" ? err : {},
  });
});

// start the server
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

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(
    `${package.description} (v${package.version}), listening on port ${port}`
  );
});
