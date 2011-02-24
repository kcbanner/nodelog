var mongoose = require('mongoose');
var db = mongoose.connect('mongodb://localhost/nodelog');
var models = require('../models');
var csv = require('csv');

var filename = process.argv[2];
if(filename) {
  console.log('Importing posts from '+filename);

  var count = 0;
  csv().fromPath(filename, {columns: true}).on('data', function(data, index) {
    var permalink_sections = data['Permalink'].match(/(\d{4})\/(\d{2})\/(\d{2})\/([a-zzA-Z-0-9]*)/);
    var date = new Date(permalink_sections[1], permalink_sections[2], permalink_sections[3]);

    var post = new models.Post({
      author: data['Author Email'],
      title: data['Title'],
      permalink: permalink_sections[4],
      content: data['Content'],
      date: date,
      published: true
    });

    post.save(function(err) {
      if(err) {
        console.log('Error saving "'+post.title+'": '+err);
      } else {
        count++;
      }
    });
  }).on('end', function() {
    console.log('Done, '+count+' posts inserted');
    process.exit(0);
  });
} else {
  console.log('Usage: node wordpress_import.js <filename>');
  process.exit(1);
}


