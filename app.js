
/**
 * Module dependencies.
 */

var express = require('express');
var settings = require('./settings');
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
  var posts = [{title: 'This is the test title',
               permalink: 'test-link-1',
               content: 'This is a really long post, not much here just a bunch of words bla bla bla.',
               date: new Date().toString('MMMM dS')},
               {title: 'This is the test title #2',
               permalink: 'test-link-2',
               content: 'This is a really long post, not much here just a bunch of words bla bla bla.',
               date: new Date().toString('MMMM dS')}];
  
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



// Only listen on $ node app.js
if (!module.parent) {
  app.listen(settings.port);
  console.log("Express server listening on port %d", app.address().port);
}
