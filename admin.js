var crypto = require('crypto');

var settings = require('./settings');
var models = require('./models');

exports.require_login = function (req, res, next) {
  if(req.session.user) {
    next();
  } else {
    res.redirect('/admin/login');
  };
};

exports.logout = function(req, res) {
  req.session.regenerate(function(err, destroyedBoolean) {
    res.redirect('/admin/login');
  });
};

exports.login = function(req, res) {
  res.local('error', false);
  res.render('admin_login');
};

exports.login_post = function(req, res) {
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
};

exports.index = function(req, res) {
  res.render('admin');
};

exports.ad = function(req, res) {
  res.local('ad', res.local('ad') || {});
  res.render('admin_ad');
};

exports.ad_post = function(req, res) {
  var ad;

  var save_ad = function() {
    ad.title = req.param('title');
    ad.code = req.param('code');
    ad.save(function(err) {
      res.redirect('/admin/ad');    
    });    
  };

  if (req.param('id')) {
    var q = models.Ad.find({_id: req.param('id')}).limit(1);
    q.execFind(function(err, ads) {
      if (ads.length == 1) {
        ad = ads[0];
        save_ad();
      } else {
        throw new Error('Ad not found.');
      }
    });
  } else {
    ad = new models.Ad();
    ad.active = true;
    save_ad();
  }
};

exports.post_index = function(req, res) {
  var q = models.Post.find({}).sort('date', -1);
  q.execFind(function(err, posts) {
    res.local('posts', posts);
    res.render('admin_posts');
  });
};

exports.post_new = function(req, res, next) {
  res.local('post', {});
  return res.render('admin_edit');
};

exports.post_new_save = function(req, res, next) {
  var post = new models.Post();
  post.author = settings.admin.username;
  post.title = req.param('title');
  post.permalink = req.param('permalink');
  post.content = req.param('content');
  post.date = new Date();
  post.published = true;

  if (post.title && post.permalink && post.content) {
    post.save(function(err) {
      res.redirect('/admin/post/edit/'+post.id);
    });
  } else {
    res.local('post', post);
    return res.render('admin_edit');
  }
};

exports.post_edit = function(req, res, next) {
  var q = models.Post.find({_id: req.params.id});
  q.execFind(function(err, posts) {
    if(posts) {
      res.local('post', posts[0]);
    } else {
      return next(new NotFound);
    }

    return res.render('admin_edit');
  });
};

exports.post_edit_save = function(req, res) {
  var q = models.Post.find({_id: req.params.id});
  q.execFind(function(err, posts) {
    if(posts.length == 1) {
      var post = posts[0];
      post.title = req.param('title');
      post.permalink = req.param('permalink');
      post.content = req.param('content');
      
      post.save(function(err) {
        res.redirect('/admin/post/edit/'+post.id);
      });
    } else {
      return next(new NotFound);
    }
  });
};

exports.post_delete = function(req, res) {
  var q = models.Post.find({_id: req.params.id});
  q.execFind(function(err, posts) {
    if(posts.length == 1) {
      posts[0].remove(function(err) {
        res.redirect('/admin/post');
      });
    } else {
      return next(new NotFound);
    }
  });
};