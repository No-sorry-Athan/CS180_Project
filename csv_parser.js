const readline = require("readline")
const fs = require('fs');

//CSV parser
function csv_parser(file) {
    const input = fs.createReadStream('./archive/' + file, { encoding: "utf-8"});
    const rl = readline.createInterface({input});
    var d = Array();
    var result = Array();
    var flag = 0;
  
    //$4,800 ====> $4800
    function change(match){
        return match.replace(/,/g, '');
    }
    rl.on("line", (row) =>{
      row = row.replace(/\$[0-9]*,*[0-9]*,*[0-9]+/g, change)
      d = row.split(',')
      //if else
      if(d[0][0] == '\\' && d[0][1] == 'n'){
        flag = result.length
        for(var j = 0; j < d.length; j++){
          result[flag - 1].push(d[j])
        }
      }
      else{
        result.push(d); 
        flag++;
      }
    });
    rl.on("close", () => {
      //merge "description", eg. a[15] = "James Lebron" , a[16] = "plays", ====> description: James Lebron, plays
      for(var l = 0; l < result.length; l++){
        var s = '';
        s = result[l][15]
        for(var m = 16; m < result[l].length; m++){
          if(result[l][m][0] != '\\' && result[l][m][1] != 'n'){
            s = s + ',' + result[l][m]
          }
          else{
            s = s + result[l][m]
          }
          
  
        }
        result[l][15] = s;
        result[l] = result[l].slice(0, 16)
      }
      if(result[54][0] == '069D0NmW39o') console.log(result[54][15])
      var r = convert(result);
      console.log(result);
      //console.log(r)
      // return result;
    });


  }

  function parse(file) {
    const input = fs.readFileSync('./archive/' + file, { encoding: "utf-8" });
    var rowsArr = input.split('"\r\n');
    console.log(rowsArr.length)
  
    var quote = [];
    var arr = Array();
    var entry = "";
    for (var r = 0; r < rowsArr.length; r++) {
      let tempArr = Array();
      let row = rowsArr[r];
      for (var letter = 0; letter < row.length; letter++) {
        if (row[letter] == ',') {
          if (quote.length == 0) {
            tempArr.push(entry);
            entry = "";
          }
          else { entry += row[letter]; }
        }
        else {
          if (row[letter] == '"') {
            if (quote.length == 0) { quote.push('"'); }
            else { quote.pop(); }
          }
          entry += row[letter];
        }
      }
      if (entry != "") { tempArr.push(entry); entry = ""; }
      arr.push(tempArr);
      quote = [];
      //if(r == 52) console.log(tempArr);
    }
  
    return convert(arr);
  }

function convert(arr){ 
  // console.log(arr);
    if(!arr.length) return null; 
    var i = 0; 
    len = arr.length, 
    array = []; 
    for(;i<len;i++){ 
      array.push({"video_id":arr[i][0],"trending_date":arr[i][1],"title":arr[i][2],"channel_title":arr[i][3],"category_id":arr[i][4],"publish_time":arr[i][5],"tags":arr[i][6],"views":arr[i][7],"likes":arr[i][8],"dislikes":arr[i][9],"comment_count":arr[i][10],"thumbnail_link":arr[i][11],"comments_disabled":arr[i][12],"ratings_disabled":arr[i][13],"video_error_or_removed":arr[i][14],"description":arr[i][15]}); 
    }
     console.log(array[array.length-1]);
    return array; 
  }

  // console.log(csv_parser('USVideos.csv'))
  parse('USVideos.csv');
