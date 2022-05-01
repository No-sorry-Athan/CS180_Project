const readline = require("readline")
const fs = require('fs');

//CSV parser
function csv_parser(file) {
    const input = fs.createReadStream(file, { encoding: "utf-8"});
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
      console.log(result)
    });

  
      
  
  }

