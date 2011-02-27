/**
 * NodeLog
 */

var sys = require('sys');
var express = require('express');
var mongoose = require('mongoose');

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
    load_recent_posts(req, res, function() {
      res.render('404', {
        status: 404,
        locals: {
          title: settings.title,
          tagline: settings.tagline,
          about: settings.about,
          links: settings.links,
          recent_posts: req.recent_posts
        }
      });
    });
  } else {
    next(err);
  }
});

// Middleware
function load_recent_posts(req, res, next) {
  var q = models.Post.find({published: true}).sort('date', -1).limit(settings.recent_posts);
  q.execFind(function(err, posts) {
    req.recent_posts = posts;
    next();
  });
}

// Routes
app.get('/', load_recent_posts, function(req, res){
  res.render('index', {
    locals: {
      title: settings.title,
      tagline: settings.tagline,
      about: settings.about,
      links: settings.links,
      recent_posts: req.recent_posts,
      posts: req.recent_posts.slice(0, settings.front_page_posts)
    }
  });
});

app.get(/^\/(\d{4})\/(\d{2})\/(\d{2})\/([a-zA-Z-0-9]+)\/?/, load_recent_posts, function(req, res, next){
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
          recent_posts: req.recent_posts,
          post: posts[0]
        }
      });
    }
  });
});

app.get('/admin', function(req, res) {
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
      },
    });
  });
});

/* Admin Editing */
app.get('/admin/edit/:id', function(req, res, next) {
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

app.post('/admin/edit/:id', function(req, res) {
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
