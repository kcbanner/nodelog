/**
 * NodeLog
 */

var sys = require('sys');
var express = require('express');
var mongoose = require('mongoose');
var crypto = require('crypto');
var MongoStore = require('connect-mongo');

var settings = require('./settings');
var util = require('./util');
var db = mongoose.connect('mongodb://localhost/'+settings.db);
var models = require('./models');

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
  res.local('tagline', settings.tagline);
  res.local('about', settings.about);
  res.local('links', settings.links);
  
  if (settings.google_site_verification) {
    res.local('google_site_verification', settings.google_site_verification);
  } else {
    res.local('google_site_verification', false);
  }
  
  next();
}

var stack = [locals];

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
app.get(/^\/(?:page\/(\d+))?$/, stack, function(req, res) {
  var q = models.Post.find({published: true}).sort('date', -1).limit(settings.front_page_posts);
  var page = 0;
  if (req.params[0] !== undefined) {
    page = new Number(req.params[0]);
    q.skip(settings.front_page_posts*page);
  }

  res.local('page', page);
  q.execFind(function(err, posts) {
    res.local('posts', posts);
    res.render('index');
  });
});

app.get(/^\/(\d{4})\/(\d{2})\/(\d{2})\/([a-zA-Z-0-9]+)\/?/, stack, function(req, res, next){
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
function require_login(req, res, next) {
  if(req.session.user) {
    next();
  } else {
    res.redirect('/admin/login');
  };
};

app.all('/admin/logout', function(req, res) {
  req.session.regenerate(function(err, destroyedBoolean) {
    res.redirect('/admin/login');
  });
});

app.get('/admin/login', stack, function(req, res) {
  res.local('error', false);
  res.render('admin_login');
});

app.post('/admin/login', stack, function(req, res) {
  var username = req.param('username');
  var password = req.param('password');
  if(username !== undefined && password !== undefined) {
    var hashed_passwd = crypto.createHash('sha1').update(settings.secret+req.param('password')).digest('hex');
    if(username == settings.admin.username && hashed_passwd == settings.admin.password) {
      req.session.user = true;
      res.redirect('/admin');
      return;
    }
  };

  res.local('error', true);
  res.render('admin_login');
});

app.get('/admin', stack, require_login, function(req, res) {
  var q = models.Post.find({}).sort('date', -1);
  q.execFind(function(err, posts) {
    res.local('posts', posts);
    res.render('admin');
  });
});

/* Admin Editing */
app.get('/admin/new', stack, require_login, function(req, res, next) {
  res.local('post', {});
  return res.render('admin_edit');
});

app.post('/admin/new', stack, require_login, function(req, res, next) {
  var post = new models.Post();
  post.author = settings.admin.username;
  post.title = req.param('title');
  post.permalink = req.param('permalink');
  post.content = req.param('content');
  post.date = new Date();
  post.published = true;

  if (post.title && post.permalink && post.content) {
    post.save(function(err) {
      res.redirect('/admin/edit/'+post.id);
    });
  } else {
    res.local('post', post);
    return res.render('admin_edit');
  }
});

app.get('/admin/edit/:id', stack, require_login, function(req, res, next) {
  var q = models.Post.find({_id: req.params.id});
  q.execFind(function(err, posts) {
    if(posts) {
      res.local('post', posts[0]);
    } else {
      return next(new NotFound);
    }

    return res.render('admin_edit');
  });
});

app.post('/admin/edit/:id', stack, require_login, function(req, res) {
  var q = models.Post.find({_id: req.params.id});
  q.execFind(function(err, posts) {
    if(posts.length == 1) {
      var post = posts[0];
      post.title = req.param('title');
      post.permalink = req.param('permalink');
      post.content = req.param('content');
      
      post.save(function(err) {
        res.redirect('/admin/edit/'+post.id);
      });
    } else {
      return next(new NotFound);
    }
  });
});

app.get('/admin/delete/:id', stack, require_login, function(req, res) {
  var q = models.Post.find({_id: req.params.id});
  q.execFind(function(err, posts) {
    if(posts.length == 1) {
      posts[0].remove(function(err) {
        res.redirect('/admin');
      });
    } else {
      return next(new NotFound);
    }
  });
});

// 404
app.all('*', stack, function(req, res) {
  throw new NotFound;
});

// Only listen on $ node app.js
if (!module.parent) {
  app.listen(settings.port);
  console.log("Express server listening on port %d", app.address().port);
}
