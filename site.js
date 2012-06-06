var settings = require('./settings');
var models = require('./models');
var markdown = require('node-markdown').Markdown;

// Error handling
var NotFound = exports.NotFound = function(msg) {
  this.name = 'NotFound';
  Error.call(this, msg);
  Error.captureStackTrace(this, arguments.callee);
};

NotFound.prototype.__proto__ = Error.prototype;

exports.feed = function(req, res) {
  var q = models.Post.find({published: true}).sort('date', -1).limit(20);
  q.execFind(function(err, posts) {
    var post = posts[0];
    res.local('posts', posts);
    res.contentType('application/xml');
    res.render('feed', {layout: false});
  });
};

exports.resume = function(req, res) {
  res.render('resume');
};

exports.freelance = function(req, res) {
  res.render('freelance');
};

exports.index = function(req, res) {
  var q = models.Post.find({published: true}).sort('date', -1);
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
};

exports.post = function(req, res, next) {
  var q = models.Post.findOne({published: true, permalink: req.params[3]});
  q.execFind(function(err, posts) {
    if(posts.length == 0) {
      // 404
      next(new NotFound);
    } else {
      var content = markdown(posts[0].content);

      res.local('title', res.local('title')+' -  '+posts[0].title);
      res.local('post', posts[0]);
      res.local('content', content);
      
      if (/<pre/.exec(content)) {
        res.local('syntax_highlighting', true);
      }
      
      res.render('post');
    }
  });
};