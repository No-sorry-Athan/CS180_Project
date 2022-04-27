var express = require('express');
var path = require('path');
const readline = require("readline")
const fs = require('fs');

//CSV parser
function csv_parser() {
    const input = fs.createReadStream('./archive/RUvideos.csv', { encoding: "utf-8"});
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
    // readable.on("data", (chunk) => {
    // // var temp2 = chunk.replace(/, /g, ";")
    //   // console.log(s);
    //     // readable.pause()
    //   //use regex to split by multi symbol
    //   s = s + chunk;
    //   // var b = "";
    //   // var c = "dfsf,";
    //   // b = b + c;
    //   // b = b + c;
    //   // console.log(chunk)
    //    console.log(1)
    // })
    // .on("error", (error) => {
    //   console.log(error);
    // })
    // .on('end', () => {
    //   function change(match){
    //     return match.replace(/,/g, '');
    //   }
  
    //   // var regex2 = /, |,\\n/g
    //   var temp2 = s.replace(/, |,\\n/g, ";")
    //   // var temp2 = temp2.replace(/,\n/g,)
    //   var temp3 = temp2.replace(/\$[0-9]*,*[0-9]*,*[0-9]+/g, change)
    //   // console.log(s);
    //   var regex = /\r\n/g
    //   var temp1 = temp3.split(regex)
    //   temp1.pop();
    //   //delete commas in money
  
    //   // var t = "ddfjkdjfdk,dfjdkfjdifjei,$4,300,191,dfjkerer";
  
    //   // console.log(g);
    //   // var h = g.split(',')
    //   // console.log(h);
    //  //create array
    //  var a = new Array();
    //  var b = new Array();
    //  var n = 1;
    //  var m = 1;
    //  //get size of data(how many groups)
    // //  console.log(temp1.length)
    //  var size = temp1.length
    //  var i = 1;
    // //  for (;n < size;){
    // //    for (m = 1;m <= 16;m++){
    // //      // console.log(m);
    // //      a[m - 1] = temp1[16 * n + m - 1];
    // //     //  console.log(temp1[16 * n + m - 1])
    // //      // console.log(16 * n + m - 1)
    // //      // console.log(temp1.length)
    // //    }
    // //    ++n;
    // //    // console.log(":");
    // //    // console.log(n);
    // //    ++i;
    // //    b.push(a);
    // //    // if (i==2){
    // //    //   break;
    // //    // }
    // //  }
    //  for (var j = 0; j < 200; j++){
    //   //  console.log(1)
    //   console.log(temp1[16 * j])  
    //   // console.log(temp3)
    //  }
    // //  console.log(temp1[260]); 
    // console.log(temp1)
    // console.log(temp1.length)
    // });
    //   // var result = b;
    //   // console.log(s);
  
      
  
  }