/* eslint-disable semi */
var express = require('express');
var exphbs = require('express-handlebars');
var path = require('path');
var app = express();
var arrTemp = [];
const port = 3000;

const fs = require('fs');
const csv = require('csv-parser');
const { csv_parser, csv_parser2, parse, async_parse } = require('./csv_parser');

const { toLower, split } = require('lodash');

const axios = require('axios');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'), options));

app.engine('handlebars', exphbs.engine({ defaultLayout: 'layout' }));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'handlebars');

var options = { dotfiles: 'ignore', etag: false, extensions: ['htm', 'html'], index: false };

var searchResultsServer = "";
var reliableSearchResultsServer = "";
var csvCacheServer = [];
var videoLink = "";
var mostLiked;


var globalMostLikedVidServer = ""; // Setting up the initial mostLiked video
var mostLikedInt = 0;
var mostLikedVidLink = "";


function getMostLiked() {
  var i = 0;

  csvArr = parse('USVideos.csv');

  for (let iterator = 1; iterator < csvArr.length; iterator++) {
    if (parseInt(csvArr[iterator].likes) > mostLikedInt) {
      //console.log("found more liked video");

      //store the like counter into the int value
      mostLikedInt = parseInt(csvArr[iterator].likes);
      mostLikedVidLink = '"https://www.youtube.com/embed/' + csvArr[iterator].video_id + '"';
      //store the most liked video into the global variable
      globalMostLikedVidServer = "";
      globalMostLikedVidServer += '<div class=\'video\'>';
      globalMostLikedVidServer += '<img src=\'' + csvArr[iterator].thumbnail_link + '\' alt=\'video thumbnail\'>';
      globalMostLikedVidServer += '<div class=\'videocontent\'>';
      globalMostLikedVidServer += '<p class=\'videotitle\'>' + csvArr[iterator].title + '</p>';
      globalMostLikedVidServer += '<p class=\'videoinfo\'>' + csvArr[iterator].channel_title + ' / ' + csvArr[iterator].trending_date + '</p>';
      globalMostLikedVidServer += '<p class=\'vidStuff\'>' + csvArr[iterator].views + ' views / ' + csvArr[iterator].likes + ' likes</p>';
      globalMostLikedVidServer += '</div>'
      globalMostLikedVidServer += '</div>\n';
    }
  }
};

app.get('/', (req, res) => {
  //getMostLiked();
  res.render('home', { title: "YT Analysis", searchResultsClient: searchResultsServer, csvCacheClient: JSON.stringify(csvCacheServer), embedVid: videoLink });
});

//making a new page for reliable videos
app.get('/reliableVids', (req, res) => {
  res.render('reliableVids', { searchResultsClient: reliableSearchResultsServer, csvCacheClient: JSON.stringify(csvCacheServer) });
});

app.get('/public/:file', (req, res) => {
  fs.readFile('./public/' + req.params.file, (error, content) => {
    if (error) {
      console.log("Error receiving static file " + req.params.file);
      throw error;
    }
    res.writeHead(200, { 'Content-Type': 'text/css' });
    res.end(content, 'utf-8');
  });
});

app.post('/deleteVid', (req, res) => {
  var newCSV = ""; 
  deleteIndex = req.body.Delete;
  mostLikedInt = 0;

  newCSV += "video_id,trending_date,title,channel_title,category_id,publish_time,tags,views,likes,dislikes,comment_count,thumbnail_link,comments_disabled,ratings_disabled,video_error_or_removed,description\"\r\n";
  csvArr = parse('USVideos.csv');

  for (let iterator = 1; iterator < csvArr.length; iterator++) {
    if (csvArr[iterator].trending_date == csvCacheServer[deleteIndex].trending_date && csvArr[iterator].title == csvCacheServer[deleteIndex].title) { //if this is the vid we want to delete, don't add it to the string
    } else {
      newCSV += csvArr[iterator].video_id + ',' + csvArr[iterator].trending_date + ',' + '"' + csvArr[iterator].title + '"' + ',' + '"' + csvArr[iterator].channel_title + '"' + ',' + csvArr[iterator].category_id + ',' + csvArr[iterator].publish_time + ',' + '"' + csvArr[iterator].tags + '"' + ',' + csvArr[iterator].views + ',' + csvArr[iterator].likes + ',' + csvArr[iterator].dislikes + ',' + csvArr[iterator].comment_count + ',' + csvArr[iterator].thumbnail_link + ',' + csvArr[iterator].comments_disabled + ',' + csvArr[iterator].ratings_disabled + ',' + csvArr[iterator].video_error_or_removed + ',' + '"' + csvArr[iterator].description + '"' + '\r\n';
      if (parseInt(csvArr[iterator].likes) > mostLikedInt) {
        mostLikedInt = parseInt(csvArr[iterator].likes);
        mostLikedVidLink = '"https://www.youtube.com/embed/' + csvArr[iterator].video_id + '"';
        globalMostLikedVidServer = "";
        globalMostLikedVidServer += '<div class=\'video\'>';
        globalMostLikedVidServer += '<img src=\'' + csvArr[iterator].thumbnail_link + '\' alt=\'video thumbnail\'>';
        globalMostLikedVidServer += '<div class=\'videocontent\'>';
        globalMostLikedVidServer += '<p class=\'videotitle\'>' + csvArr[iterator].title + '</p>';
        globalMostLikedVidServer += '<p class=\'videoinfo\'>' + csvArr[iterator].channel_title + ' / ' + csvArr[iterator].trending_date + '</p>';
        globalMostLikedVidServer += '<p class=\'vidStuff\'>' + csvArr[iterator].views + ' views / ' + csvArr[iterator].likes + ' likes</p>';
        globalMostLikedVidServer += '</form>';
        globalMostLikedVidServer += '</div>'
        globalMostLikedVidServer += '</div>\n';
      }
    }
  }
  fs.writeFileSync('./archive/USVideos.csv', newCSV);
  res.redirect('back')

});

app.post('/search', (req, res) => {
  var query = req.body.YTSearchBar;
  var i = 0;
  searchResultsServer = "";
  csvCacheServer = [];
  videoLink = "";
  if (query == null || query == "") { res.redirect('back'); return; }

  csvArr = parse('USVideos.csv');

  for (let iterator = 1; iterator < csvArr.length; iterator++) {
    if (toLower(csvArr[iterator].title).includes(toLower(query))) {
      csvCacheServer.push(csvArr[iterator]);

      searchResultsServer += '<div class=\'video\'>';
      searchResultsServer += '<img src=\'' + csvArr[iterator].thumbnail_link + '\' alt=\'Video Thumbnail\'>';
      searchResultsServer += '<div class=\'videoContent\'>';
      searchResultsServer += '<form action=\"/deleteVid\" method=\"POST\">';
      searchResultsServer += '<p class=\'videoTitle\'>' + csvArr[iterator].title + '</p>';
      searchResultsServer += '<p class=\'videoInfo\'>' + csvArr[iterator].channel_title + ' / ' + csvArr[iterator].trending_date + '</p>';
      searchResultsServer += '<button class="editBtn" type="button" name="' + i + '" value="Edit" onClick="updateVideoEditor(' + i + ')">Edit</button>';
      searchResultsServer += '<button type="submit" class=\"deleteBtn' + '\"name=\"Delete' + '\" value=\"' + i + '\"> Delete</button>';
      searchResultsServer += '</form>';
      searchResultsServer += '<form action=\"/previewVideo\" method=\"POST\">';
      searchResultsServer += '<button type="submit" class="prevBtn" name="previewVideo" value=' + i + '> Preview Video</button>';
      searchResultsServer += '</form>';
      searchResultsServer += '</div>'
      searchResultsServer += '</div>\n';

      i += 1;
    }
    
  }

  res.redirect('back');
});

app.post('/previewVideo', (req, res) => {
  videoIndex = req.body.previewVideo;
  videoLink = '"https://www.youtube.com/embed/' + csvCacheServer[videoIndex].video_id + '?autoplay=1&mute=1"';
  res.redirect('back');
})

app.post('/searchReliable', (req, res) => {
  var query = req.body.YTSearchBar;
  var i = 0;
  var titleTemp = ""; //used to look for entries with the same title 
  reliableSearchResultsServer = "";
  csvCacheServer = [];
  arrTemp = []; //main arr holding all entries
  var arrTemp2 = []; //sub arr holding entries of the same title to find one with best ratio
  var titlesExplored = []; //will check if we saw the current "titleTemp" already
  var highestRatioArr = []; //array for the most reliable videos
  var flag = false; //used to see if we run the search process to filter out the top vids of each title
  var ratio = 0;
  var ind; //for inserting video from arrTemp2 to topTenArr

  i = 0
  if (query == null || query == "") { res.redirect('back'); return; } //if searching nothing, dont show anything

  csvArr = parse('USVideos.csv');

  for(let iterator = 1; iterator < csvArr.length; iterator++) {
    if (toLower(csvArr[iterator].title).includes(toLower(query))){
      csvCacheServer.push(csvArr[iterator]);
      arrTemp.push(csvArr[iterator]); //store quiried rows into array
    }
  }

  for (let a = 0; a < arrTemp.length - 1; a++) { //find the top ratiod videos of each title with the keyword
    arrTemp2 = []; //reset arrTemp2
    flag = false; //reset flag
    ratio = 0; //reset ratio for next cycle
    ind = 0; //reset

    if (a == 0) {
      titleTemp = arrTemp[0].title; //set up for the initial vid
      arrTemp2.push(arrTemp[0]);
      titlesExplored.push(arrTemp[0].title); //stores the initial title
      flag = true;
    } else if (a > 0) {
      if (titlesExplored.includes(arrTemp[a].title)) { //sees if current video has already been searched through & its top vid was found
        flag = false;
      } else {
        titleTemp = arrTemp[a].title;
        arrTemp2.push(arrTemp[a]);
        titlesExplored.push(arrTemp[a].title);
        flag = true;
      }
    }

    if (flag) { //flag to search through arrTemp and find all videos with the same title, also meaning we have a new video title to use
      for (let b = a + 1; b < arrTemp.length; b++) {
        if (titleTemp == arrTemp[b].title) { //if same title, add it to arrTemp2, else do nothing
          arrTemp2.push(arrTemp[b]);
        }
      }
      //now go through the compiled arrTemp2 with all video instances of same title and find highest ratio
      for (let c = 0; c < arrTemp2.length; c++) {
        if (ratio < (arrTemp2[c].likes / arrTemp2[c].dislikes)) {
          ratio = (arrTemp2[c].likes / arrTemp2[c].dislikes);//new highest ratio
          ind = c;
        }
      }
      highestRatioArr.push(arrTemp2[ind]); //store the highest ratio vid
    }
  } //finding the top ratiod videos of each title with the keyword

  //sort the videos by ratio (like/dislike) descending order
  highestRatioArr.sort((a, b) => {
    return (b.likes / b.dislikes) - (a.likes / a.dislikes);
  });

  for (let d = 0; d < 10; d++) { //now display the top 10 videos 
    if (highestRatioArr[d] != undefined) {
      reliableSearchResultsServer += '<div class=\'video\'>';
      reliableSearchResultsServer += '<img src=\'' + highestRatioArr[d].thumbnail_link + '\' alt=\'Video Thumbnail\'>';
      reliableSearchResultsServer += '<div class=\'videoContent\'>';
      reliableSearchResultsServer += '<form action=\"/deleteVid\" method=\"POST\">';
      reliableSearchResultsServer += '<p class=\'videoTitle\'>' + highestRatioArr[d].title + '</p>';
      reliableSearchResultsServer += '<p class=\'videoInfo\'>' + highestRatioArr[d].channel_title + ' / ' + highestRatioArr[d].trending_date + ' / ' + highestRatioArr[d].likes + ' / ' + highestRatioArr[d].dislikes + '</p>';
      reliableSearchResultsServer += '<button type=\"delete\" class=\"deleteBtn' + '\"name=\"Delete' + '\" value=\"' + i + '\"> Delete</button> \n';
      reliableSearchResultsServer += '</form>';

      reliableSearchResultsServer += '<button class="editBtn" name="' + i + '" value="Edit" onClick="updateVideoEditor(' + i + ')">Edit</button>';
      reliableSearchResultsServer += '</div>'
      reliableSearchResultsServer += '</div>\n';
      i+=1;
    }
  }
  res.redirect('back');
});

app.post('/editVideo', (req, res) => {
  let index = req.body.editIndex;
  mostLikedInt = 0;
  let newCSV = "video_id,trending_date,title,channel_title,category_id,publish_time,tags,views,likes,dislikes,comment_count,thumbnail_link,comments_disabled,ratings_disabled,video_error_or_removed,description\"\r\n";
  console.log(csvCacheServer)

  csvArr = parse('USVideos.csv');

  for (let iterator = 1; iterator < csvArr.length; iterator++) {
    if (csvArr[iterator].trending_date == csvCacheServer[index].trending_date && csvArr[iterator].title == csvCacheServer[index].title) { //if this is the vid we want to delete, don't add it to the string
      // console.log(csvArr[iterator]);
      // console.log(typeof (csvArr[iterator]));
    } else {
      newCSV += csvArr[iterator].video_id + ',' + csvArr[iterator].trending_date + ',' + '"' + csvArr[iterator].title + '"' + ',' + '"' + csvArr[iterator].channel_title + '"' + ',' + csvArr[iterator].category_id + ',' + csvArr[iterator].publish_time + ',' + '"' + csvArr[iterator].tags + '"' + ',' + csvArr[iterator].views + ',' + csvArr[iterator].likes + ',' + csvArr[iterator].dislikes + ',' + csvArr[iterator].comment_count + ',' + csvArr[iterator].thumbnail_link + ',' + csvArr[iterator].comments_disabled + ',' + csvArr[iterator].ratings_disabled + ',' + csvArr[iterator].video_error_or_removed + ',' + '"' + csvArr[iterator].description + '"' + '\r\n';
      if (parseInt(csvArr[iterator].likes) > mostLikedInt) {
        mostLikedInt = parseInt(csvArr[iterator].likes);
        mostLikedVidLink = '"https://www.youtube.com/embed/' + csvArr[iterator].video_id + '"';
        globalMostLikedVidServer = "";
        globalMostLikedVidServer += '<div class=\'video\'>';
        globalMostLikedVidServer += '<img src=\'' + csvArr[iterator].thumbnail_link + '\' alt=\'video thumbnail\'>';
        globalMostLikedVidServer += '<div class=\'videocontent\'>';
        globalMostLikedVidServer += '<p class=\'videotitle\'>' + csvArr[iterator].title + '</p>';
        globalMostLikedVidServer += '<p class=\'videoinfo\'>' + csvArr[iterator].channel_title + ' / ' + csvArr[iterator].trending_date + '</p>';
        globalMostLikedVidServer += '<p class=\'vidStuff\'>' + csvArr[iterator].views + ' views / ' + csvArr[iterator].likes + ' likes</p>';
        globalMostLikedVidServer += '</form>';
        globalMostLikedVidServer += '</div>'
        globalMostLikedVidServer += '</div>\n';
      }
    }
  }

  let appendString = req.body.video_id + ',' + req.body.trending_date + ',' + '"' + req.body.title + '"' + ',' + '"' + req.body.channel_title + '"' + ',' + req.body.category_id + ',' + req.body.publish_time + ',' + '"' + req.body.tags + '"' + ',' + req.body.views + ',' + req.body.likes + ',' + req.body.dislikes + ',' + req.body.comment_count + ',' + req.body.thumbnail_link + ',' + req.body.comments_disabled + ',' + req.body.ratings_disabled + ',' + req.body.video_error_or_removed + ',' + '"' + req.body.description + '"' + '\r\n';
  fs.writeFileSync('./archive/USVideos.csv', newCSV);
  fs.writeFileSync('./archive/USVideos.csv', appendString, { flag: 'a+' }, (err) => {
    if (err) throw err;
  });

  if (parseInt(req.body.likes) > mostLikedInt) {
    mostLikedInt = parseInt(req.body.likes);
    mostLikedVidLink = '"https://www.youtube.com/embed/' + req.body.video_id + '"';
    globalMostLikedVidServer = "";
    globalMostLikedVidServer += '<div class=\'video\'>';
    globalMostLikedVidServer += '<img src=\'' + req.body.thumbnail_link + '\' alt=\'video thumbnail\'>';
    globalMostLikedVidServer += '<div class=\'videocontent\'>';
    globalMostLikedVidServer += '<p class=\'videotitle\'>' + req.body.title + '</p>';
    globalMostLikedVidServer += '<p class=\'videoinfo\'>' + req.body.channel_title + ' / ' + req.body.trending_date + '</p>';
    globalMostLikedVidServer += '<p class=\'vidStuff\'>' + req.body.views + ' views / ' + req.body.likes + ' likes</p>';
    globalMostLikedVidServer += '</form>';
    globalMostLikedVidServer += '</div>'
    globalMostLikedVidServer += '</div>\n';
  }

  res.redirect('back');
});

api_key = 'AIzaSyAUxYRuyvyKROxYDBnOye1DlBL0evOufTE'

app.post('/addVideo', (req, res) => {
  var videoLink = req.body.YTAddLink;
  var insertCsv = []
  var videoId = ''
  axios.get('https://youtube.googleapis.com/youtube/v3/search?part=snippet' +
    '&q=' + videoLink + '&key=' + api_key)
    .then(res => {
      videoInfoJson = res.data.items[0];
      videoId = videoInfoJson.id.videoId;

      var today = new Date();
      var dd = String(today.getDate()).padStart(2, '0');
      var mm = String(today.getMonth() + 1).padStart(2, '0');
      var yyyy = today.getFullYear().toString().substring(2, 4)

      today = yyyy + '.' + dd + '.' + mm;

      insertCsv[0] = videoId;
      insertCsv[1] = today;
      insertCsv[2] = videoInfoJson.snippet.title;
      insertCsv[3] = videoInfoJson.snippet.channelTitle;
      insertCsv[5] = videoInfoJson.snippet.publishedAt;
      insertCsv[11] = videoInfoJson.snippet.thumbnails.default.url
      // placeholder
      insertCsv[12] = "FALSE"
      insertCsv[13] = "FALSE"
      insertCsv[14] = "FALSE"

      axios.get('https://youtube.googleapis.com/youtube/v3/videos?part=snippet,statistics' +
        '&id=' + videoId + '&key=' + api_key)
        .then(res => {
          videoInfoJson = res.data.items[0];
          insertCsv[4] = videoInfoJson.snippet.categoryId;

          insertCsv[6] = videoInfoJson.snippet.tags;
          insertCsv[7] = videoInfoJson.statistics.viewCount;
          insertCsv[8] = videoInfoJson.statistics.likeCount;
          insertCsv[9] = -1;
          insertCsv[10] = videoInfoJson.statistics.commentCount;

          insertCsv[15] = videoInfoJson.snippet.description;

          csvString = '';
          for (i = 0; i < insertCsv.length; i++) {
            currentVal = insertCsv[i]
            if (currentVal == undefined)
              break;
            type = typeof (currentVal)

            if (i == 2 || i == 3 || i == 15) {
              // console.log(currentVal)
              csvString += "\"" + currentVal.replaceAll('\n', '\\n') + "\"";
            }
            else if (type == typeof (1)) {
              csvString += currentVal.toString();
            }
            else if (type == typeof ([])) {
              for (j = 0; j < currentVal.length; j++) {
                currentTag = currentVal[j];
                if (currentTag == undefined)
                  break;
                if (j == 0){
                  csvString += "\"" + currentTag + "|"
                }
                else if (j == currentVal.length - 1){
                  csvString += "\"" + currentTag + "\"\"" + "|"
                }
                else{
                  csvString += "\"" + currentTag + "\"" + "|"
                }
              }
              csvString = csvString.substring(0, csvString.length - 1);
            }
            else{
              csvString += currentVal.replaceAll('\n', '\\n');
            }
            csvString += ",";
          }
          csvString = csvString.substring(0, csvString.length - 1);
          csvString += "\r\n";

          // console.log(csvString);


          fs.writeFile('./archive/USVideos.csv', csvString, { flag: 'a+' }, (err) => {
            if (err) throw err;
          })

          if (parseInt(insertCsv[8]) > mostLikedInt) {
            mostLikedInt = insertCsv[8];
            mostLikedVidLink = '"https://www.youtube.com/embed/' + insertCsv[0] + '"';
            globalMostLikedVidServer = "";
            globalMostLikedVidServer += '<div class=\'video\'>';
            globalMostLikedVidServer += '<img src=\'' + insertCsv[11] + '\' alt=\'video thumbnail\'>';
            globalMostLikedVidServer += '<div class=\'videocontent\'>';
            globalMostLikedVidServer += '<p class=\'videotitle\'>' + insertCsv[2] + '</p>';
            globalMostLikedVidServer += '<p class=\'videoinfo\'>' + insertCsv[3] + ' / ' + insertCsv[1] + '</p>';
            globalMostLikedVidServer += '<p class=\'vidViews/Likes\'>' + insertCsv[7] + ' views / ' + insertCsv[8] + ' likes</p>';
            globalMostLikedVidServer += '</form>';

            globalMostLikedVidServer += '</div>'
            globalMostLikedVidServer += '</div>\n';
          }
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

app.post('/analytics', (req, res) => {
  res.redirect('/analytics')
})

var passUpString = "";
var vidName = "";
var region = "";

app.get('/analytics', (req, res) => {
  res.render('analytics', { graphInfo: passUpString, graphTitle: vidName, graphCountry: region });
})

app.get('/analytics/trendline', (req, res) => {
  var csvCacheAnalytics = [];
  searchVideoTrend = req.query.videoID;
  region = req.query.countries;
  vidName = '';
  if (searchVideoTrend == "" || searchVideoTrend == undefined) return;
  var paff = './archive/' + region + 'Videos.csv';

  csvArr = parse(region + 'Videos.csv');

  for (let iterator = 1; iterator < csvArr.length; iterator++) {
    if (toLower(csvArr[iterator].video_id).includes(toLower(searchVideoTrend))) {
      vidName = csvArr[iterator].title;
      csvCacheAnalytics.push(csvArr[iterator]);
      console.log(csvCacheAnalytics)
    }
  }

  csvString = ''
  console.log(csvCacheAnalytics)
  csvString += "{name: 'Likes', points:[\n"
  for (i = 0; i < csvCacheAnalytics.length; i++) {
    currentRow = csvCacheAnalytics[i];
    csvString += "[" + "'" + currentRow.trending_date + "', " + currentRow.likes + "],"
  }
  csvString = csvString.substring(0, csvString.length - 1)
  csvString += "]},\n"
  csvString += "{name: 'Dislikes', points:[\n"
  for (i = 0; i < csvCacheAnalytics.length; i++) {
    currentRow = csvCacheAnalytics[i]
    csvString += "[" + "'" + currentRow.trending_date + "', " + currentRow.dislikes + "],"
  }
  csvString = csvString.substring(0, csvString.length - 1)
  csvString += "]}\n"

  console.log(csvString);
  passUpString = csvString;
  res.redirect('back');
});

app.post('/mostLiked', (req, res) => {
  res.redirect('/mostLiked') 
})

app.get('/mostLiked', (req, res) => {
  res.render('mostLiked', { globalMostLikedVidClient: globalMostLikedVidServer, mostLikedVid: mostLikedVidLink }); // Shows the most Liked video of all time
})

getMostLiked();


app.listen(port, () => console.log('Test listening on port ${' + port + '}!'));
