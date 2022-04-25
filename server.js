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
        searchResultsServer += '<img src=\'' + row.thumbnail_link + '\' alt=\'Video Thumbnail\' width="120" height="90">'; 
        searchResultsServer += '<div class=\'videoContent\'>';
        searchResultsServer += '<p class=\'videoTitle\'>' + row.title + '</p>'; 
        searchResultsServer += '<div style="display: flex"><p class=\'videoInfo\'>' + row.channel_title + ' / ' + row.trending_date + '</p>'; 
        searchResultsServer += '<button type="button" class="editBtn">Edit</button></div>';
        searchResultsServer += '</div></div>\n';
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