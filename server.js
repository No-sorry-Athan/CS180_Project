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

app.get('/', (req, res) => {
  res.render('home', { title: "YT Analysis", searchResultsClient: searchResultsServer, searchResultsChannelClient: searchResultsChannelServer, csvCacheClient: JSON.stringify(csvCacheServer) });
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
        searchResultsServer += '<button type="submit" class="editBtn" name="' + i + '" value="Edit" onClick="updateVideoEditor(' + i + ')">Edit</button>';
        searchResultsServer += '</div></div></div>\n';
        i++;
      }
      if(toLower(row.channel_title).includes(toLower(query))) {
        searchResultsChannelServer += ('<div>' + row.channel_title + ' / ' + row.trending_date + ' / ' + row.likes + '</div>');
      }
    })
    .on('end', () => {
      res.redirect('back');
    });
});

app.post('/editVideo', (req, res) => {
  // update video through csv
  let index = req.body.editIndex;

  let newCSV = "video_id,trending_date,title,channel_title,category_id,publish_time,tags,views,likes,dislikes,comment_count,thumbnail_link,comments_disabled,ratings_disabled,video_error_or_removed,description\n";
  fs.createReadStream('./archive/USVideos.csv')
    .pipe(csv())
    .on('data', (row) => {
      if (row.trending_date == csvCacheServer[index].trending_date && row.title == csvCacheServer[index].title){ //if this is the vid we want to delete, don't add it to the string
          //do nothing
          console.log(row);
          console.log(typeof(row));
      } else { //store all other row like a normal CSV
        newCSV += row.video_id + ',' + row.trending_date + ',' + '"' + row.title + '"' + ',' + '"' + row.channel_title + '"' + ',' + row.category_id + ',' + row.publish_time + ',' + '"' + row.tags + '"' + ',' + row.views + ',' + row.likes + ',' + row.dislikes + ',' + row.comment_count + ',' + row.thumbnail_link + ',' + row.comments_disabled + ',' + row.ratings_disabled + ',' + row.video_error_or_removed + ',' + '"' + row.description + '"' + '\r\n';
      }
    })
    .on('end', () => {
      fs.writeFileSync('./archive/USVideos.csv', newCSV);
    });
  
  let appendString = req.body.video_id + ',' + req.body.trending_date + ',' + '"' + req.body.title + '"' + ',' + '"' + req.body.channel_title + '"' + ',' + req.body.category_id + ',' + req.body.publish_time + ',' + '"' + req.body.tags + '"' + ',' + req.body.views + ',' + req.body.likes + ',' + req.body.dislikes + ',' + req.body.comment_count + ',' + req.body.thumbnail_link + ',' + req.body.comments_disabled + ',' + req.body.ratings_disabled + ',' + req.body.video_error_or_removed + ',' + '"' + req.body.description + '"' + '\r\n';;

  fs.writeFile('./archive/USVideos.csv', appendString, { flag: 'a+' }, (err) => {
    if (err) throw err;
  })
  
  res.redirect('back');
});

app.listen(port, () => console.log('Test listening on port ${' + port + '}!'));