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
  console.log(query)
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
        searchResultsServer += '<p class=\'videoInfo\'>' + row.channel_title + ' / ' + row.trending_date + ' / ' + row.video_id + '<\p>';
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

app.post('/update', (req, res) => {
    var query = req.body.YT_VideoIDUpdateBar;
    var counter = 1;
    var temp = new Array(16);
    //console.log(query)
    //create temporary mini csv containing the to-update video
    //update the temporary mini csv
    //delete the video from the list
    //add back the video with the new information

    fs.createReadStream('./archive/USVideos.csv')
    .pipe(csv())
        .on('data', (row) => {
        if ((row.video_id).includes(query)) {
            console.log("hit");
            temp[0] = row.video_id;
            temp[1] = row.trending_date;
            temp[2] = row.title;
            temp[3] = row.channel_title;
            temp[4] = row.category_id;
            temp[5] = row.publish_time;
            temp[6] = row.tags;
            temp[7] = row.views;
            temp[8] = row.likes;
            temp[9] = row.dislikes;
            temp[10] = row.comment_count;
            temp[11] = row.thumbnail_link;
            temp[12] = row.comments_disabled;
            temp[13] = row.ratings_disabled;
            temp[14] = row.video_error_or_removed;
            temp[15] = row.description;

            for (i = 0; i < 16; ++i) {
                console.log(temp[i])
            }
            }

    })


    .on('end', () => {
        res.redirect('back');
    })
})

app.listen(port, () => console.log('Test listening on port ${' + port + '}!'));