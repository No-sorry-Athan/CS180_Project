/* eslint-disable semi */
var express = require('express');
var exphbs = require('express-handlebars');
var path = require('path');
var app = express();
var arrTemp = [];
const port = 3000;

const fs = require('fs');
const csv = require('csv-parser');

const { toLower, rest } = require('lodash');

const axios = require('axios');
const { sort } = import('d3-array');

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
  //searchResultsChannelClient: searchResultsChannelServer
  res.render('home', { title: "YT Analysis", searchResultsClient: searchResultsServer, csvCacheClient: JSON.stringify(csvCacheServer) });
});

//making a new page for reliable videos
app.get('/reliableVids', (req, res) => {
  res.render('reliableVids', {searchResultsClient: searchResultsServer, csvCacheClient: JSON.stringify(csvCacheServer) });
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
  var newCSV = ""; //new string to make the new CSV without the entry we delete
  // console.log("Hello world ", req.body);
  deleteIndex = req.body.Delete;
  // console.log(deleteIndex);

  newCSV += "video_id,trending_date,title,channel_title,category_id,publish_time,tags,views,likes,dislikes,comment_count,thumbnail_link,comments_disabled,ratings_disabled,video_error_or_removed,description\n";
  fs.createReadStream('./archive/USVideos.csv')
    .pipe(csv())
    .on('data', (row) => {
      if (row.trending_date == csvCacheServer[deleteIndex].trending_date && row.title == csvCacheServer[deleteIndex].title){ //if this is the vid we want to delete, don't add it to the string
          //do nothing
          console.log(row);
          console.log(typeof(row));
      } else { //store all other row like a normal CSV
        newCSV += row.video_id + ',' + row.trending_date + ',' + '"' + row.title + '"' + ',' + '"' + row.channel_title + '"' + ',' + row.category_id + ',' + row.publish_time + ',' + '"' + row.tags + '"' + ',' + row.views + ',' + row.likes + ',' + row.dislikes + ',' + row.comment_count + ',' + row.thumbnail_link + ',' + row.comments_disabled + ',' + row.ratings_disabled + ',' + row.video_error_or_removed + ',' + '\"' + row.description + '\"' + '\r\n';
        // console.log('hi ', i);
      }
    })
    .on('end', () => {
      
      fs.writeFileSync('./archive/USVideos.csv', newCSV);
      res.redirect('back');
    })
});

app.post('/search', (req, res) => {
  var query = req.body.YTSearchBar;

  var i = 0;
  searchResultsServer = "";
  searchResultsChannelServer = "";
  csvCacheServer = [];
  arrTemp = [];
  i = 0
  if(query == null || query == "") { res.redirect('back'); return; } 

  fs.createReadStream('./archive/USVideos.csv')
    .pipe(csv())
    .on('data', (row) => {
      if(toLower(row.title).includes(toLower(query))) {
        csvCacheServer.push(row);
        console.log(row);

        searchResultsServer += '<div class=\'video\'>'; 
        searchResultsServer += '<img src=\'' + row.thumbnail_link + '\' alt=\'Video Thumbnail\'>'; 
        searchResultsServer += '<div class=\'videoContent\'>';
        searchResultsServer += '<form action=\"/deleteVid\" method=\"POST\">';
        searchResultsServer += '<p class=\'videoTitle\'>' + row.title + '</p>'; 
        searchResultsServer += '<p class=\'videoInfo\'>' + row.channel_title + ' / ' + row.trending_date + '</p>'; 
        searchResultsServer += '<button type=\"delete\" class=\"deleteBtn' +'\"name=\"Delete' + '\" value=\"'+ i+ '\"> Delete</button> \n';
        searchResultsServer += '</form>';
        searchResultsServer += '<button class="editBtn" name="' + i + '" value="Edit" onClick="updateVideoEditor(' + i + ')">Edit</button>';
        searchResultsServer += '</div>'
        searchResultsServer += '</div>\n';

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

app.post('/searchReliable', (req, res) => {
  var query = req.body.YTSearchBar;
  var i = 0;
  var titleTemp = ""; //used to look for entries with the same title 
  searchResultsServer = "";
  searchResultsChannelServer = "";
  csvCacheServer = [];
  arrTemp = []; //main arr holding all entries
  var arrTemp2 = []; //sub arr holding entries of the same title to find one with best ratio
  var titlesExplored = []; //will check if we saw the current "titleTemp" already
  var highestRatioArr = []; //array for the most reliable videos
  var flag = false; //used to see if we run the search process to filter out the top vids of each title
  var ratio = 0;
  var ind; //for inserting video from arrTemp2 to topTenArr

  i = 0
  if(query == null || query == "") { res.redirect('back'); return; } //if searching nothing, dont show anything
  fs.createReadStream('./archive/USVideos.csv') //parse through the CSV, gather vids with the keyWords,
    .pipe(csv())                                //calculate like to dislike ratio for each video and sort it from most to least 1-10
    .on('data', (row) => {
      if(toLower(row.title).includes(toLower(query))) {
        csvCacheServer.push(row);
        console.log(row);
        arrTemp.push(row); //first store all rows quiried into the array

        // searchResultsServer += '<div class=\'video\'>'; 
        // searchResultsServer += '<img src=\'' + row.thumbnail_link + '\' alt=\'Video Thumbnail\'>'; 
        // searchResultsServer += '<div class=\'videoContent\'>';
        // searchResultsServer += '<form action=\"/deleteVid\" method=\"POST\">';
        // searchResultsServer += '<p class=\'videoTitle\'>' + row.title + '</p>'; 
        // searchResultsServer += '<p class=\'videoInfo\'>' + row.channel_title + ' / ' + row.trending_date + '</p>'; 
        // searchResultsServer += '<button type=\"delete\" class=\"deleteBtn' +'\"name=\"Delete' + '\" value=\"'+ i+ '\"> Delete</button> \n';
        // searchResultsServer += '</form>';
        // searchResultsServer += '<button class="editBtn" name="' + i + '" value="Edit" onClick="updateVideoEditor(' + i + ')">Edit</button>';
        // searchResultsServer += '</div>'
        // searchResultsServer += '</div>\n';

        // i+=1;
      }
      if(toLower(row.channel_title).includes(toLower(query))) {
        searchResultsChannelServer += ('<div>' + row.channel_title + ' / ' + row.trending_date + ' / ' + row.likes + '</div>');
      }
    })
    .on('end', () => { //all videos are in arrTemp at this point, now look for the most reliable ones (best ratios)
      for (let a = 0; a < arrTemp.length - 1; a++){ //find the top ratiod videos of each title with the keyword
        arrTemp2 = []; //reset arrTemp2
        flag = false; //reset flag
        ratio = 0; //reset ratio for next cycle
        ind = 0; //reset

        if (a == 0){ 
          titleTemp = arrTemp[0].title; //set up for the initial vid
          arrTemp2.push(arrTemp[0]);
          titlesExplored.push(arrTemp[0].title); //stores the initial title
          flag = true; 
        } else if (a > 0) {
          if (titlesExplored.includes(arrTemp[a].title)){ //sees if current video has already been searched through & its top vid was found
            flag = false; 
          } else {
            titleTemp = arrTemp[a].title;
            arrTemp2.push(arrTemp[a]);
            titlesExplored.push(arrTemp[a].title);
            flag = true;
          }
        }

        if (flag){ //flag to search through arrTemp and find all videos with the same title, also meaning we have a new video title to use
          for (let b = a+1; b < arrTemp.length; b++){ 
            if (titleTemp == arrTemp[b].title){ //if same title, add it to arrTemp2, else do nothing
              arrTemp2.push(arrTemp[b]);
            }
          }
          //now go through the compiled arrTemp2 with all video instances of same title and find highest ratio
          for (let c = 0; c < arrTemp2.length; c++){
            if (ratio < (arrTemp2[c].likes / arrTemp2[c].dislikes)){
              ratio = (arrTemp2[c].likes / arrTemp2[c].dislikes);//new highest ratio
              ind = c;
            } 
          }
          highestRatioArr.push(arrTemp2[ind]); //store the highest ratio vid
        }
      } //finding the top ratiod videos of each title with the keyword
      console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
      console.log(highestRatioArr)

      //sort the videos by ratio (like/dislike) descending order
      highestRatioArr.sort((a,b) => {
        return (b.likes/b.dislikes) - (a.likes/a.dislikes);
      });
      console.log("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb")
      console.log(highestRatioArr)

      for (let d = 0; d < 10; d++){ //now display the top 10 videos 
        if (highestRatioArr[d] != undefined){
          searchResultsServer += '<div class=\'video\'>'; 
          searchResultsServer += '<img src=\'' + highestRatioArr[d].thumbnail_link + '\' alt=\'Video Thumbnail\'>'; 
          searchResultsServer += '<div class=\'videoContent\'>';
          searchResultsServer += '<form action=\"/deleteVid\" method=\"POST\">';
          searchResultsServer += '<p class=\'videoTitle\'>' + highestRatioArr[d].title + '</p>'; 
          searchResultsServer += '<p class=\'videoInfo\'>' + highestRatioArr[d].channel_title + ' / ' + highestRatioArr[d].trending_date + ' / ' + highestRatioArr[d].likes + ' / ' + highestRatioArr[d].dislikes +'</p>'; 
          searchResultsServer += '<button type=\"delete\" class=\"deleteBtn' +'\"name=\"Delete' + '\" value=\"'+ i+ '\"> Delete</button> \n';
          searchResultsServer += '</form>';
          searchResultsServer += '<button class="editBtn" name="' + i + '" value="Edit" onClick="updateVideoEditor(' + i + ')">Edit</button>';
          searchResultsServer += '</div>'
          searchResultsServer += '</div>\n';
        }
      }

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

api_key = 'AIzaSyAUxYRuyvyKROxYDBnOye1DlBL0evOufTE'

app.post('/addVideo', (req, res) => {
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
    var mm = String(today.getMonth() + 1).padStart(2, '0'); 
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

    axios.get('https://youtube.googleapis.com/youtube/v3/videos?part=snippet,statistics' +
    '&id=' + videoId + '&key=' + api_key)
    .then(res => {
      videoInfoJson = res.data.items[0];
      // console.log(videoInfoJson)
      insertCsv[4] = videoInfoJson.snippet.categoryId;

      insertCsv[6] = videoInfoJson.snippet.tags;
      insertCsv[7] = videoInfoJson.statistics.viewCount;
      insertCsv[8] = videoInfoJson.statistics.likeCount;
      insertCsv[9] = -1;
      insertCsv[10]= videoInfoJson.statistics.commentCount;

      insertCsv[15] = videoInfoJson.snippet.description;

      csvString = '';
        for ( i = 0; i < insertCsv.length; i++){
          currentVal = insertCsv[i]
          if (currentVal == undefined)
            break;
          type = typeof(currentVal)

          if (type == typeof("")){
            csvString += "\"" + currentVal.replaceAll('\n', '\\n') + "\"";
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
        
        
        fs.writeFile('./archive/USVideos.csv', csvString, { flag: 'a+' }, (err) => {
          if (err) throw err;
        })
        console.log(insertCsv);
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
