
/**
 * Module dependencies.
 */

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
  app.use(app.router);
  app.use(express.staticProvider(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes
app.get('/', function(req, res){
  var q = models.Post.find({published: true}).sort('date', -1).limit(settings.front_page_posts);
  q.execFind(function(err, posts) {
    res.render('index', {
      locals: {
        title: settings.title,
        tagline: settings.tagline,
        about: settings.about,
        links: settings.links,
        posts: posts
      }
    });
  });
});

app.get(/^\/(\d{4})\/(\d{2})\/(\d{2})\/([a-zA-Z-0-9]+)\/?/, function(req, res){
  var q = models.Post.findOne({published: true, permalink: req.params[3]});
  q.execFind(function(err, posts) {
    if(posts.length == 0) {
      // 404
      res.send('404', 404);
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


// Only listen on $ node app.js
if (!module.parent) {
  app.listen(settings.port);
  console.log("Express server listening on port %d", app.address().port);
}
