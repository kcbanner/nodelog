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
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Error handling
function NotFound(msg){
  this.name = 'NotFound';
  Error.call(this, msg);
  Error.captureStackTrace(this, arguments.callee);
}

sys.inherits(NotFound, Error);

app.error(function(err, req, res, next){
  if (err instanceof NotFound) {
    res.render('404', {
      status: 404,
      locals: {
        title: settings.title,
        tagline: settings.tagline,
        about: settings.about,
        links: settings.links
      }
    });
  } else {
    next(err);
  }
});

// Routes
app.get(/^\/(?:page\/(\d+))?$/, function(req, res) {
  var q = models.Post.find({published: true}).sort('date', -1).limit(settings.front_page_posts);
  var page = 0;
  if (req.params[0] !== undefined) {
    page = new Number(req.params[0]);
    q.skip(settings.front_page_posts*page);
  }
  
  q.execFind(function(err, posts) {
    res.render('index', {
      locals: {
        title: settings.title,
        tagline: settings.tagline,
        about: settings.about,
        links: settings.links,
        page: page,
        posts: posts
      }
    });
  });
});

app.get(/^\/(\d{4})\/(\d{2})\/(\d{2})\/([a-zA-Z-0-9]+)\/?/, function(req, res, next){
  var q = models.Post.findOne({published: true, permalink: req.params[3]});
  q.execFind(function(err, posts) {
    if(posts.length == 0) {
      // 404
      return next(new NotFound);
    } else {
      res.render('post', {
        locals: {
          title: settings.title,
          tagline: settings.tagline,
          about: settings.about,
          links: settings.links,
          post: posts[0]
        }
      });
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

app.get('/admin/login', function(req, res) {
  res.render('admin_login', {
    locals: {
      title: settings.title,
      tagline: settings.tagline,
      about: settings.about,
      links: settings.links,
      error: false
    }
  });
});

app.post('/admin/login', function(req, res) {
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
         
  res.render('admin_login', {
    locals: {
      title: settings.title,
      tagline: settings.tagline,
      about: settings.about,
      links: settings.links,
      error: true
    }
  });
});

app.get('/admin', require_login, function(req, res) {
  var q = models.Post.find({}).sort('date', -1);
  q.execFind(function(err, posts) {
    res.render('admin', {
      locals: {
        title: settings.title,
        tagline: settings.tagline,
        about: settings.about,
        links: settings.links,
        recent_posts: [],
        posts: posts
      }
    });
  });
});

/* Admin Editing */
app.get('/admin/edit/:id', require_login, function(req, res, next) {
  var q = models.Post.find({_id: req.params.id});
  q.execFind(function(err, posts) {
    var locals = {
      title: settings.title,
      tagline: settings.tagline,
      about: settings.about,
      links: settings.links,
      recent_posts: []
    };
    
    if(posts) {
      locals['post'] = posts[0];
    } else {
      return next(new NotFound);
    }

    return res.render('admin_edit', { locals: locals });
  });
});

app.post('/admin/edit/:id', require_login, function(req, res) {
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

// 404
app.all('*', function(req, res) {
  throw new NotFound;
});

// Only listen on $ node app.js
if (!module.parent) {
  app.listen(settings.port);
  console.log("Express server listening on port %d", app.address().port);
}
