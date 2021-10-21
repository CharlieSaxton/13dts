//requring modules
var createError = require('http-errors');
var express = require('express');
var session = require('express-session');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

//requring routers
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');


//creating express app
var app = express();

//initialising template system
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

//using express engine
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//creating session (for log in)
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//setting routers 
app.use('/', indexRouter);
app.use('/users', usersRouter);

//catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

//error handler
app.use(function(err, req, res, next) {
  //set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  //render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
