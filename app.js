/**
 * NodeLog
 */

// Libs
var sys = require('sys');
var express = require('express');
var mongoose = require('mongoose');
var crypto = require('crypto');
var MongoStore = require('connect-mongo');

var settings = require('./settings');
var db = mongoose.connect('mongodb://localhost/'+settings.db);
var util = require('./util');
var models = require('./models');
var admin = require('./admin');

var app = module.exports = express.createServer();

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({
    secret: settings.cookie_secret,
    store: new MongoStore({
      db: settings.db
    })
  }));
  
  app.use(express.methodOverride());
  app.use(express.compiler({ src: __dirname + '/public', enable: ['less'] }));
});

app.configure('development', function(){
  // Disable Google Analytics locally
  settings.ga_id = false;
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
  app.use(express.static(__dirname + '/public'));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

function locals(req, res, next) {
  res.local('ga_id', settings.ga_id);
  res.local('ga_domain', settings.ga_domain);
  res.local('title', settings.title);
  res.local('blog_title', settings.title);
  res.local('tagline', settings.tagline);
  res.local('about', settings.about);
  res.local('links', settings.links);
  res.local('url', settings.url);

  if (settings.intensedebate_acct) {
    res.local('intensedebate_acct', settings.intensedebate_acct);
  } else {
    res.local('intensedebate_acct', false);
  }

  if (settings.external_feed) {
    res.local('feed_url', settings.external_feed);
  } else {
    res.local('feed_url', '/feed.rss');
  }
  
  if (settings.google_site_verification) {
    res.local('google_site_verification', settings.google_site_verification);
  } else {
    res.local('google_site_verification', false);
  }
  
  next();
}

function get_ad(req, res, next) {
  var q = models.Ad.find({active: true}).limit(1);
  q.execFind(function(err, ads) {
    res.local('ad', ads[0]);
    next();
  });
}

app.use(locals);

// Error handling
function NotFound(msg){
  this.name = 'NotFound';
  Error.call(this, msg);
  Error.captureStackTrace(this, arguments.callee);
}

sys.inherits(NotFound, Error);

app.error(function(err, req, res, next) {
  if (err instanceof NotFound) {
    res.render('404', { status: 404});
  } else {
    next(err);
  }
});

// Routes
app.get('/feed.rss', function(req, res) {
  var q = models.Post.find({published: true}).sort('date', -1).limit(20);
  q.execFind(function(err, posts) {
    var post = posts[0];
    res.local('posts', posts);
    res.contentType('application/xml');
    res.render('feed', {layout: false});
  });
});

app.get(/^\/(?:page\/(\d+))?$/, get_ad, function(req, res) {
  var q = models.Post.find({published: true}).sort('date', -1).limit(settings.front_page_posts);
  var page = 0;
  if (req.params[0] !== undefined) {
    page = new Number(req.params[0]);
    q.skip(settings.front_page_posts*page);
  }

  res.local('page', page);
  q.execFind(function(err, posts) {
    res.local('ad', req.ad);
    res.local('posts', posts);
    res.render('index');
  });
});

app.get(/^\/(\d{4})\/(\d{2})\/(\d{2})\/([a-zA-Z-0-9]+)\/?/, get_ad, function(req, res, next){
  var q = models.Post.findOne({published: true, permalink: req.params[3]});
  q.execFind(function(err, posts) {
    if(posts.length == 0) {
      // 404
      return next(new NotFound);
    } else {
      res.local('title', res.local('title')+' -  '+posts[0].title);
      res.local('post', posts[0]);
      res.render('post');
    }
  });
});

/* Admin */
app.all('/admin/logout', admin.logout);
app.get('/admin/login', admin.login);
app.post('/admin/login', admin.login_post);
app.get('/admin', admin.require_login, admin.index);
app.get('/admin/ad', admin.require_login, get_ad, admin.ad);
app.post('/admin/ad', admin.require_login, admin.ad_post);
app.get('/admin/post', admin.require_login, admin.post_index);
app.get('/admin/post/new', admin.require_login, admin.post_new);
app.post('/admin/post/new', admin.require_login, admin.post_new_save);
app.get('/admin/post/edit/:id', admin.require_login, admin.post_edit);
app.post('/admin/post/edit/:id', admin.require_login, admin.post_edit_save);
app.get('/admin/post/delete/:id', admin.require_login, admin.post_delete);

// 404
app.all('*', function(req, res) {
  throw new NotFound;
});

// Only listen on $ node app.js
if (!module.parent) {
  app.listen(settings.port);
  console.log("Express server listening on port %d", app.address().port);
}
