/* eslint-disable semi */
var express = require('express');
var exphbs = require('express-handlebars');
var path = require('path');
var app = express();
var arrTemp = [];
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
  //console.log(searchResultsServer);
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

app.post('/deleteVid', (req, res) => { //Occurs when user presses the delete button on a searched video
  //Get the video-id and trending-date of the video I want to delete
  //test
  var i = 0;
  var newCSV = ""; //new string to make the new CSV without the entry we delete
  // console.log("Hello world ", req.body);
  deleteIndex = req.body.Delete;
  // console.log(deleteIndex);

  currentThing = arrTemp[deleteIndex]
  console.log(currentThing)

  titleIndex = currentThing.search('<p class=\'videoTitle\'>') + ('<p class=\'videoTitle\'>').length
  trendIndex = currentThing.search('<p class=\'videoTrending\'>') + ('<p class=\'videoTrending\'>').length

  delTitle = '';
  for (titleIndex; titleIndex < currentThing.length; titleIndex++){
    if (currentThing[titleIndex] == '<'){
      substrP = currentThing.substring(titleIndex, titleIndex + 4);
      if (substrP == '</p>')
        break;
      break;
    }
    delTitle += currentThing[titleIndex]
  }

  trendDate = '';
  for (trendIndex; trendIndex < currentThing.length; trendIndex++){
    if (currentThing[trendIndex] == '<'){
      substrP = currentThing.substring(trendIndex, trendIndex + 4);
      if (substrP == '</p>')
        break;
    }
    trendDate += currentThing[trendIndex]
  }

  console.log(delTitle);
  console.log(trendDate);
  console.log(typeof(currentThing))

  fs.createReadStream('./archive/USVideos.csv')
    .pipe(csv())
    .on('data', (row) => {
      if (row.trending_date == trendDate && row.title == delTitle){ //if this is the vid we want to delete, don't add it to the string
          //do nothing
          console.log(row);
          console.log(typeof(row));
      } else { //store all other row like a normal CSV
        newCSV += row.video_id + ',' + row.trending_date + ',' + row.title + ',' + row.channel_title + ',' + row.category_id + ',' + row.publish_time + ',' + row.tags + ',' + row.views + ',' + row.likes + ',' + row.dislikes + ',' + row.comment_count + ',' + row.thumbnail_link + ',' + row.comments_disabled + ',' + row.ratings_disabled + ',' + row.video_error_or_removed + ',' + row.description + '\n';
        // console.log('hi ', i);
      }
      i++;
    })
    .on('end', () => {
      console.log("Hellooooooooooo end of parsing");
      fs.writeFileSync('./archive/USVideos.csv', newCSV);
      res.redirect('back');
    })
});

app.post('/search', (req, res) => {
  var query = req.body.YTSearchBar;
  searchResultsServer = "";
  arrTemp = [];
  i = 0
  if(query == null || query == "") { res.redirect('back'); return; }

  fs.createReadStream('./archive/USVideos.csv')
    .pipe(csv())
    .on('data', (row) => {
      if(toLower(row.title).includes(toLower(query))) {
        
        StringTemp = "";
        StringTemp += '<div class=\'video\'>'; 
        StringTemp += '<form action=\"/deleteVid\" method=\"POST\">';
        StringTemp += '<img src=\'' + row.thumbnail_link + '\' alt=\'Video Thumbnail\'>'; 
        StringTemp += '<div class=\'videoContent\'>';
        StringTemp += '<p class=\'videoTitle\'>' + row.title + '</p>'; 
        StringTemp += '<p class=\'videoAuthor\'>' + row.channel_title +'</p>'
        StringTemp += '<p class=\'videoTrending\'>' + row.trending_date + '</p>'; 
        StringTemp += '<button type=\"delete\" class=\"deleteBtn' +'\"name=\"Delete' + '\" value=\"'+ i+ '\"> Delete</button> \n';
        StringTemp += '</form>';
        StringTemp += '</div></div>\n';
        

        arrTemp.push(StringTemp);

        searchResultsServer += '<div class=\'video\'>'; 
        searchResultsServer += '<form action=\"/deleteVid\" method=\"POST\">';
        searchResultsServer += '<img src=\'' + row.thumbnail_link + '\' alt=\'Video Thumbnail\'>'; 
        searchResultsServer += '<div class=\'videoContent\'>';
        searchResultsServer += '<p class=\'videoTitle\'>' + row.title + '</p>'; 
        searchResultsServer += '<p class=\'videoAuthor\'>' + row.channel_title +'</p>'
        searchResultsServer += '<p class=\'videoTrending\'>' + row.trending_date + '</p>'; 
        searchResultsServer += '<button type=\"delete\" class=\"deleteBtn' +'\"name=\"Delete' + '\" value=\"'+ i+ '\"> Delete</button> \n';
        searchResultsServer += '</form>';
        searchResultsServer += '</div></div>\n';

        i+=1;
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