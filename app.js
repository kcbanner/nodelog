/**
 * NodeLog
 */

var sys = require('sys');
var express = require('express');
var mongoose = require('mongoose');
var crypto = require('crypto');
var MongoStore = require('connect-session-mongo');

var settings = require('./settings');
var db = mongoose.connect('mongodb://localhost/'+settings.db);
var models = require('./models');
var date = require('datejs');

var app = module.exports = express.createServer();

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyDecoder());
  app.use(express.cookieDecoder());
  app.use(express.session({
    secret: settings.cookie_secret,
    store: new MongoStore({
      db: settings.db
    })
  }));
  app.use(express.methodOverride());
  app.use(express.compiler({ src: __dirname + '/public', enable: ['less'] }));
  app.use(express.staticProvider(__dirname + '/public'));
});

app.configure('development', function(){
  // Disable Google Analytics locally
  settings.ga_id = false;
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Request context
function context(req, res, next) {
  req.context = {};
  res._render = res.render;
  res.render = function(template, options) {
    for (var prop in options) req.context[prop] = options[prop];
    res._render(template, req.context);
  };
  next();
}

function locals(req, res, next) {
  var locals = req.context.locals = {};
  locals.ga_id = settings.ga_id;
  locals.ga_domain = settings.ga_domain;
  locals.title = settings.title;
  locals.tagline = settings.tagline;
  locals.about = settings.about;
  locals.links = settings.links;
  next();
}

var stack = [context, locals];

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

  req.context.locals.page = page;
  q.execFind(function(err, posts) {
    req.context.locals.posts = posts;
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
      req.context.locals.post = posts[0];
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
  req.context.locals.error = false;
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

  req.context.locals.error = true;
  res.render('admin_login');
});

app.get('/admin', stack, require_login, function(req, res) {
  var q = models.Post.find({}).sort('date', -1);
  q.execFind(function(err, posts) {
    req.context.locals.posts = posts;
    res.render('admin');
  });
});

/* Admin Editing */
app.get('/admin/edit/:id', stack, require_login, function(req, res, next) {
  var q = models.Post.find({_id: req.params.id});
  q.execFind(function(err, posts) {
    if(posts) {
      req.context.locals.post = posts[0];
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
