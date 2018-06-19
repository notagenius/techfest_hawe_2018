/**
 * Module dependencies.
 */
const express = require('express');
const compression = require('compression');
const session = require('express-session');
const bodyParser = require('body-parser');
const logger = require('morgan');
const chalk = require('chalk');
const errorHandler = require('errorhandler');
const lusca = require('lusca');
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo')(session);
const flash = require('express-flash');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const expressValidator = require('express-validator');
const sass = require('node-sass-middleware');
const multer = require('multer');
const mongoClient = require("mongodb").MongoClient;
const url = "mongodb://safetyaid:hibKenkjGdswKUrrqpqHbMuj6bsFV51PJ0Xfd7y7bYmBe1y2uGwwYXG9zsVPuIwgEnsfnUS4LQGVOGWFOmpDSg%3D%3D@safetyaid.documents.azure.com:10255/?ssl=true";

const upload = multer({ dest: path.join(__dirname, 'uploads') });

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.load({ path: '.env.example' });

/**
 * Controllers (route handlers).
 */
const homeController = require('./controllers/home');
const userController = require('./controllers/user');
const apiController = require('./controllers/api');
const contactController = require('./controllers/contact');

/**
 * API keys and Passport configuration.
 */
const passportConfig = require('./config/passport');

/**
 * Create Express server.
 */
const app = express();
/**
 * Connect to MongoDB.
 */
mongoose.connect(url);
mongoose.connection.on('error', (err) => {
  console.error(err);
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
  process.exit();
});

/**
 * Express configuration.
 */
app.set('host', process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0');
app.set('port', process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(compression());
app.use(sass({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public')
}));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET,
  cookie: { maxAge: 1209600000 }, // two weeks in milliseconds
  store: new MongoStore({
    url: "mongodb://safetyaid:hibKenkjGdswKUrrqpqHbMuj6bsFV51PJ0Xfd7y7bYmBe1y2uGwwYXG9zsVPuIwgEnsfnUS4LQGVOGWFOmpDSg%3D%3D@safetyaid.documents.azure.com:10255/?ssl=true",
    autoReconnect: true,
  })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use((req, res, next) => {
  if (req.path === '/api/upload') {
    next();
  } else {
    lusca.csrf()(req, res, next);
  }
});
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});
app.use((req, res, next) => {
  // After successful login, redirect back to the intended page
  if (!req.user &&
    req.path !== '/login' &&
    req.path !== '/signup' &&
    !req.path.match(/^\/auth/) &&
    !req.path.match(/\./)) {
    req.session.returnTo = req.originalUrl;
  } else if (req.user &&
    (req.path === '/account' || req.path.match(/^\/api/))) {
    req.session.returnTo = req.originalUrl;
  }
  next();
});
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));

/**
 * Primary app routes.
 */
app.get('/', homeController.index);
app.get('/login', userController.getLogin);
app.post('/login', userController.postLogin);
app.get('/logout', userController.logout);
app.get('/forgot', userController.getForgot);
app.post('/forgot', userController.postForgot);
app.get('/reset/:token', userController.getReset);
app.post('/reset/:token', userController.postReset);
app.get('/signup', userController.getSignup);
app.post('/signup', userController.postSignup);
app.get('/contact', contactController.getContact);
app.post('/contact', contactController.postContact);
app.get('/account', passportConfig.isAuthenticated, userController.getAccount);
app.post('/account/profile', passportConfig.isAuthenticated, userController.postUpdateProfile);
app.post('/account/password', passportConfig.isAuthenticated, userController.postUpdatePassword);
app.post('/account/delete', passportConfig.isAuthenticated, userController.postDeleteAccount);
app.get('/account/unlink/:provider', passportConfig.isAuthenticated, userController.getOauthUnlink);

app.get('/visualisation', (req, res) => {
  res.render('vis', {title: "Visualisation"});
});

app.get('/live', (req, res) => {
  res.render('live', {title: "Live Data"});
});

app.get('/acceleration', (req, res) => {
  mongoClient.connect(url, function (err, db) {
      if (err) throw err;
      var dbo = db.db("safetyaid");
      dbo.collection("acceleration_data").find({}).toArray(function (err, result) {
          if (err) throw err;
          db.close();
          res.render('acceleration', { data: JSON.stringify(result) });
      });
  });
});

app.get('/gyroscope', (req, res) => {
  mongoClient.connect(url, function (err, db) {
      if (err) throw err;
      var dbo = db.db("safetyaid");
      dbo.collection("gyroscope_data").find({}).toArray(function (err, result) {
          if (err) throw err;
          db.close();
          res.render('gyroscope', { data: result });
      });
  });
});

app.get('/magnitude', (req, res) => {
  mongoClient.connect(url, function (err, db) {
      if (err) throw err;
      var dbo = db.db("safetyaid");
      dbo.collection("gyroscope_data").find({}).toArray(function (err, result) {
          if (err) throw err;
          db.close();
          res.render('magnitude', { data: result });
      });
  });
});

app.get('/ultrasonic', (req, res) => {
  mongoClient.connect(url, function (err, db) {
      if (err) throw err;
      var dbo = db.db("safetyaid");
      dbo.collection("ultrasonic_data").find({}).toArray(function (err, result) {
          if (err) throw err;
          db.close();
          res.render('ultrasonic', { data: result });
      });
  });
});

app.get('/acceleration_data', (req, res) => {
  mongoClient.connect(url, function (err, db) {
      if (err) throw err;
      var dbo = db.db("safetyaid");
      dbo.collection("acceleration_data").find({}).toArray(function (err, json_data) {
          if (err) throw err;
          db.close();
          var result = [];
          for(var i in json_data)
              result.push([i, json_data [i]]);
          res.send(result);
      });
  });
});

app.get('/gyroscope_data', (req, res) => {
  mongoClient.connect(url, function (err, db) {
      if (err) throw err;
      var dbo = db.db("safetyaid");
      dbo.collection("gyroscope_data").find({}).toArray(function (err, json_data) {
          if (err) throw err;
          db.close();
          var result = [];
          for(var i in json_data)
              result.push([i, json_data [i]]);
          res.send(result);
      });
  });
});

app.get('/magnitude_data', (req, res) => {
  mongoClient.connect(url, function (err, db) {
      if (err) throw err;
      var dbo = db.db("safetyaid");
      dbo.collection("magnitude_data").find({}).toArray(function (err, json_data) {
          if (err) throw err;
          db.close();
          var result = [];
          for(var i in json_data)
              result.push([i, json_data [i]]);
          res.send(result);
      });
  });
});

app.get('/ultrasonic_data', (req, res) => {
  mongoClient.connect(url, function (err, db) {
      if (err) throw err;
      var dbo = db.db("safetyaid");
      dbo.collection("ultrasonic_data").find({}).toArray(function (err, json_data) {
          if (err) throw err;
          db.close();
          var result = [];
          for(var i in json_data)
              result.push([i, json_data [i]]);
          res.send(result);
      });
  });
});

/**
 * API examples routes.
 */
app.get('/api', apiController.getApi);
app.get('/api/lastfm', apiController.getLastfm);
app.get('/api/nyt', apiController.getNewYorkTimes);
app.get('/api/aviary', apiController.getAviary);
app.get('/api/steam', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getSteam);
app.get('/api/stripe', apiController.getStripe);
app.post('/api/stripe', apiController.postStripe);
app.get('/api/scraping', apiController.getScraping);
app.get('/api/twilio', apiController.getTwilio);
app.post('/api/twilio', apiController.postTwilio);
app.get('/api/clockwork', apiController.getClockwork);
app.post('/api/clockwork', apiController.postClockwork);
app.get('/api/foursquare', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getFoursquare);
app.get('/api/tumblr', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getTumblr);
app.get('/api/facebook', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getFacebook);
app.get('/api/github', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getGithub);
app.get('/api/twitter', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getTwitter);
app.post('/api/twitter', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.postTwitter);
app.get('/api/linkedin', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getLinkedin);
app.get('/api/instagram', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getInstagram);
app.get('/api/paypal', apiController.getPayPal);
app.get('/api/paypal/success', apiController.getPayPalSuccess);
app.get('/api/paypal/cancel', apiController.getPayPalCancel);
app.get('/api/lob', apiController.getLob);
app.get('/api/upload', apiController.getFileUpload);
app.post('/api/upload', upload.single('myFile'), apiController.postFileUpload);
app.get('/api/pinterest', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getPinterest);
app.post('/api/pinterest', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.postPinterest);
app.get('/api/google-maps', apiController.getGoogleMaps);

/**
 * OAuth authentication routes. (Sign in)
 */
app.get('/auth/instagram', passport.authenticate('instagram'));
app.get('/auth/instagram/callback', passport.authenticate('instagram', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'public_profile'] }));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/github', passport.authenticate('github'));
app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/google', passport.authenticate('google', { scope: 'profile email' }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/linkedin', passport.authenticate('linkedin', { state: 'SOME STATE' }));
app.get('/auth/linkedin/callback', passport.authenticate('linkedin', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});

/**
 * OAuth authorization routes. (API examples)
 */
app.get('/auth/foursquare', passport.authorize('foursquare'));
app.get('/auth/foursquare/callback', passport.authorize('foursquare', { failureRedirect: '/api' }), (req, res) => {
  res.redirect('/api/foursquare');
});
app.get('/auth/tumblr', passport.authorize('tumblr'));
app.get('/auth/tumblr/callback', passport.authorize('tumblr', { failureRedirect: '/api' }), (req, res) => {
  res.redirect('/api/tumblr');
});
app.get('/auth/steam', passport.authorize('openid', { state: 'SOME STATE' }));
app.get('/auth/steam/callback', passport.authorize('openid', { failureRedirect: '/api' }), (req, res) => {
  res.redirect(req.session.returnTo);
});
app.get('/auth/pinterest', passport.authorize('pinterest', { scope: 'read_public write_public' }));
app.get('/auth/pinterest/callback', passport.authorize('pinterest', { failureRedirect: '/login' }), (req, res) => {
  res.redirect('/api/pinterest');
});

/**
 * Error Handler.
 */
if (process.env.NODE_ENV === 'development') {
  // only use in development
  app.use(errorHandler());
}

/**
 * Start Express server.
 */
var server = app.listen(app.get('port'), () => {
  console.log('%s App is running at http://localhost:%d in %s mode', chalk.green('✓'), app.get('port'), app.get('env'));
  console.log('  Press CTRL-C to stop\n');
});

var io = require('socket.io').listen(server);

io.on('connection', function(socket){
  console.log('client connected');
  socket.on('acceleration_sample', function(msg){
    io.emit('acceleration_sample', msg);
  });
  socket.on('magnitude_sample', function(msg){
    io.emit('magnitude_sample', msg);
  });
  socket.on('gyroscope_sample', function(msg){
    io.emit('gyroscope_sample', msg);
  });
  socket.on('distance_sample', function(msg){
    console.log('message: ' + msg);
    io.emit('distance_sample', msg);
  });
});


module.exports = app;
