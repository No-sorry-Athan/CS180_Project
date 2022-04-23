/* eslint-disable semi */
var express = require('express');
var exphbs = require('express-handlebars');
var path = require('path');
var app = express();
const port = 3000;

const fs = require('fs');
const csv = require('csv-parser');

const { toLower } = require('lodash');

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public') , options ));

app.engine('handlebars', exphbs.engine({defaultLayout: 'layout'}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'handlebars');

var options = { dotfiles: 'ignore', etag: false, extensions: ['htm', 'html'], index: false };

var searchResultsServer = "";
var searchResultsChannelServer = "";

app.get('/', (req, res) => {
  console.log(searchResultsServer);
  res.render('home', { title: "YT Analysis", searchResultsClient: searchResultsServer, searchResultsChannelClient: searchResultsChannelServer });
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
  searchResultsServer = "";
  if(query == null || query == "") { res.redirect('back'); return; }

  fs.createReadStream('./archive/USVideos.csv')
    .pipe(csv())
    .on('data', (row) => {
      if(toLower(row.title).includes(toLower(query))) {
        searchResultsServer += '<div class=\'video\'>'; 
        searchResultsServer += '<img src=\'' + row.thumbnail_link + '\' alt=\'Video Thumbnail\'>'; 
        searchResultsServer += '<div class=\'videoContent\'>';
        searchResultsServer += '<p class=\'videoTitle\'>' + row.title + '</p>'; 
        searchResultsServer += '<p class=\'videoInfo\'>' + row.channel_title + ' / ' + row.trending_date + '</p>'; 
        searchResultsServer += '<p class=\'description\'>' + row.description + '</p>';
        searchResultsServer += '</div></div>\n';
        //'<p class=\'videoId\'>' + row.category_id + '</p>'; 
        //'<p class=\'publish_time\'>' + row.publish_time + '</p>';
        //'<p class=\'videoTags\'>' + row.tags + '</p>';   
        //'<p class=\'views\'>' + row.views + '</p>';
        //'<p class=\'likes\'>' + row.likes + '</p>';
        //'<p class=\'dislikes\'>' + row.dislikes + '</p>';   
        //'<p class=\'comment_count\'>' + row.comment_count + '</p>';   
        //'<p class=\'description\'>' + row.description + '</p>';
      }
      if(toLower(row.channel_title).includes(toLower(query))) {
        searchResultsChannelServer += ('<div>' + row.channel_title + ' / ' + row.trending_date + ' / ' + row.likes + '</div>');
      }
    })
    .on('end', () => {
      res.redirect('back');
    });
});

app.listen(port, () => console.log('Test listening on port ${' + port + '}!'));