var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var Ad = new Schema({
  title: String,
  active: {type: Boolean, default: false},
  code: String
});

var Post = new Schema({
  author: String,
  title: String,
  permalink: String,
  content: String,
  date: Date,
  published: {type: Boolean, default: false}
});

Post.index({date: 1, permalink: 1}, {unique: true});

mongoose.model('Post', Post);
mongoose.model('Ad', Ad);

exports.Post = mongoose.model('Post');
exports.Ad = mongoose.model('Ad');