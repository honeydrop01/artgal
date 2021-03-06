var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var session = require("express-session");
var logger = require("morgan");
var flash = require("connect-flash");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var artRouter = require("./routes/art");
const { DatabaseError } = require("pg");
var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
// app.engine('html', require('ejs').renderFile);
app.set("view engine", "ejs");
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(flash());
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
  })
);
var database = require("./routes/database");

// apply this middleware only on routes that need user
async function check(req, res, next) {
  if (!req.session.user && req.cookies.user) {
    req.session.user = req.cookies.user;
  }
  if (req.session.user) {
    var user = req.session.user;
    var userQuery = `SELECT id, name, profile_pic FROM users WHERE id = ${user.id}`;
    try {
      var { rows, rowCount } = await database.query(userQuery);
    } catch (error) {
      console.log(error);
    }
    if (rowCount > 0) {
      res.locals = {
        user: rows[0],
      };
      console.log("user in check", res.locals.user);
      return next();
    }
  }
  res.redirect("/login");
}
app.use("/", indexRouter);
app.use("/users", check, usersRouter);
app.use("/art", artRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
