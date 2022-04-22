/* eslint-disable semi */
var express = require('express');
var exphbs = require('express-handlebars');
var path = require('path');
var app = express();
const port = 3000;

const fs = require('fs');
const csv = require('csv-parser');

const { toLower } = require('lodash');

const axios = require('axios');

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
  res.render('home', { title: "YT Analysis", searchResultsClient: searchResultsServer, searchResultsChannelClient: searchResultsChannelServer});
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

api_key = 'AIzaSyAUxYRuyvyKROxYDBnOye1DlBL0evOufTE'

app.post('/temp', (req, res) => {
  // console.log("temp");
  var videoLink = req.body.YTAddLink;
  var insertCsv = []
  var videoId = ''
  axios.get('https://youtube.googleapis.com/youtube/v3/search?part=snippet' +
  '&q=' + videoLink + '&key=' + api_key)
  .then(res => {
    // console.log(res)
    // console.log(res.data.items)
    videoInfoJson = res.data.items[0];
    // console.log(videoInfoJson)
    videoId = videoInfoJson.id.videoId;

    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear().toString().substring(2,4)

    today = yyyy + '.' + dd + '.' + mm;

    insertCsv[0] = videoId;
    insertCsv[1] = today;
    insertCsv[2] = videoInfoJson.snippet.title;
    insertCsv[3] = videoInfoJson.snippet.channelTitle;
    insertCsv[5] = videoInfoJson.snippet.publishedAt;
    insertCsv[11] = videoInfoJson.snippet.thumbnails.default.url
    // placeholder
    insertCsv[12]= "FALSE"
    insertCsv[13]= "FALSE"
    insertCsv[14]= "FALSE"

    axios.get('https://youtube.googleapis.com/youtube/v3/videos?part=snippet' +
    '&id=' + videoId + '&key=' + api_key)
    .then(res => {
      videoInfoJson = res.data.items[0];
      // console.log(videoInfoJson)
      insertCsv[4] = videoInfoJson.snippet.categoryId;
      insertCsv[6] = videoInfoJson.snippet.tags;
      insertCsv[15] = videoInfoJson.snippet.description;

      axios.get('https://www.googleapis.com/youtube/v3/videos?part=statistics' +
      '&id=' + videoId + '&key=' + api_key)
      .then(res => {
        videoInfoJson = res.data.items[0].statistics;
        // console.log(videoInfoJson)
        insertCsv[7] = videoInfoJson.viewCount;
        insertCsv[8] = videoInfoJson.likeCount;
        // in a recent update, YouTube got rid of dislike counters
        // making this field irrelevant
        insertCsv[9] = -1;
        insertCsv[10]= videoInfoJson.commentCount;
      

        // insert into csv here
        csvString = '';
        for ( i = 0; i < insertCsv.length; i++){
          currentVal = insertCsv[i]
          if (currentVal == undefined)
            break;
          type = typeof(currentVal)

          if (type == typeof("")){
              csvString += currentVal;
          }
          else if (type == typeof(1)){
              csvString += currentVal.toString();
          }
          else if(type == typeof([])){
              for (j = 0; j < currentVal.length; j++){
                currentTag = currentVal[j];
                if (currentTag == undefined)
                  break;
                csvString += "\"" + currentTag +  "\"" + "|"
              }
              csvString = csvString.substring(0, csvString.length - 1);
              
          }
          csvString += ",";
        }
        csvString = csvString.substring(0, csvString.length - 1);
        csvString += "\r\n";

        console.log(csvString);
        
        
        console.log(insertCsv);
      })
      .catch(error => {
        console.error(error)
      })
    })
    .catch(error => {
      console.error(error)
    })
  })
  .catch(error => {
    console.error(error)
  })
  res.redirect('back');

})

app.listen(port, () => console.log('Test listening on port ${' + port + '}!'));