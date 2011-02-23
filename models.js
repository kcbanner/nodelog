var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var Post = new Schema({
  author: String,
  title: String,
  permalink: String,
  content: String,
  date: Date,
  published: {type: Boolean, default: false}
});

mongoose.model('Post', Post);

exports.Post = mongoose.model('Post');