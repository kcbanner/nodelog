var settings = require('./settings');
var models = require('./models');

exports.locals = function(req, res, next) {
  res.local('clicky_id', settings.clicky_id);
  res.local('ga_id', settings.ga_id);
  res.local('ga_domain', settings.ga_domain);
  res.local('title', settings.title);
  res.local('blog_title', settings.title);
  res.local('tagline', settings.tagline);
  res.local('about', settings.about);
  res.local('links', settings.links);
  res.local('url', settings.url);
  res.local('syntax_highlighting', false);
  
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
};

exports.get_ad = function(req, res, next) {
  var q = models.Ad.find({active: true}).limit(1);
  q.execFind(function(err, ads) {
    res.local('ad', ads[0]);
    next();
  });
};