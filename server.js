/* eslint-disable semi */
var express = require('express');
var exphbs = require('express-handlebars');
var path = require('path');
var app = express();
const port = 3000;

const fs = require('fs');
const csv = require('csv-parser');

const { toLower, rest } = require('lodash');

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public') , options ));

app.engine('handlebars', exphbs.engine({defaultLayout: 'layout'}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'handlebars');

var options = { dotfiles: 'ignore', etag: false, extensions: ['htm', 'html'], index: false };

var searchResultsServer = "";
var searchResultsChannelServer = "";
var csvCacheServer = [];
var editVideo;

app.get('/', (req, res) => {
  res.render('home', { title: "YT Analysis", searchResultsClient: searchResultsServer, searchResultsChannelClient: searchResultsChannelServer, csvCacheClient: csvCacheServer, video: editVideo });
});

app.get('/public/:file', (req, res) => {
  fs.readFile('./public/' + req.params.file, (error, content) => {
    if(error) {
      console.log("Error receiving static file " + req.params.file);
      throw error;
    }
    res.writeHead(200, { 'Content-Type': 'text/css' });
    res.end(content, 'utf-8');
  });
});

app.post('/search', (req, res) => {
  var query = req.body.YTSearchBar;
  var i = 0;
  searchResultsServer = "";
  csvCacheServer = [];
  if(query == null || query == "") { res.redirect('back'); return; }

  fs.createReadStream('./archive/USVideos.csv')
    .pipe(csv())
    .on('data', (row) => {
      if(toLower(row.title).includes(toLower(query))) {
        csvCacheServer.push(row);
        searchResultsServer += '<div class=\'video\'>'; 
        searchResultsServer += '<img src=\'' + row.thumbnail_link + '\' alt=\'Video Thumbnail\' width="120" height="90">'; 
        searchResultsServer += '<div class=\'videoContent\'>';
        searchResultsServer += '<p class=\'videoTitle\'>' + row.title + '</p>'; 
        searchResultsServer += '<div style="display: flex"><p class=\'videoInfo\'>' + row.channel_title + ' / ' + row.trending_date + '</p>'; 
        searchResultsServer += '<form action="/populateVideoEditor" method="GET">';
        searchResultsServer += '<input type="input" name="index" value="' + i + '" style="display: none">';
        searchResultsServer += '<input type="submit" class="editBtn" name="' + i + '" value="Edit">';
        searchResultsServer += '</form></div>';
        searchResultsServer += '</div></div>\n';
        i++;
      }
      if(toLower(row.channel_title).includes(toLower(query))) {
        searchResultsChannelServer += ('<div>' + row.channel_title + ' / ' + row.trending_date + ' / ' + row.likes + '</div>');
      }
    })
    .on('end', () => {
      //console.log(csvCacheServer);
      res.redirect('back');
    });
});

app.get('/populateVideoEditor', (req, res) => {
  editVideo = csvCacheServer[req.query.index];
  res.redirect('back');
});

app.post('/editVideo', (req, res) => {
  // update video through csv
  
  res.redirect('back');
});

app.listen(port, () => console.log('Test listening on port ${' + port + '}!'));