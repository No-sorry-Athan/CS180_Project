const express = require('express');
const app = express();
const port = 3000;

//loads the handlebars module
const handlebars = require('express-handlebars');

//Sets our app to use the handlebars engine
//app.set('view engine', 'handlebars');
app.set('view engine', 'hbs');


//Sets handlebars configurations
/*app.engine('handlebars', handlebars ({
  layoutsDir: __dirname + '/views/layouts',
})); */
app.engine('hbs', handlebars({
  layoutsDir: __dirname + '/views/layouts',
  extname: 'hbs',
  defaultLayout: 'planB',
  //new configuration parameter
  partialsDir: __dirname + '/views/partials/'
  }));

//For checking if we have a connection to the server
// const fs = require('fs');
// const csv = require('csv-parser');

// fs.createReadStream('../Downloads/USVideos.csv')
//   .pipe(csv())
//   .on('data', (row) => {
//     app.get('/', (req, res) => res.send(row));
//     // console.log(row);
//   })
//   .on('end', () => {
//     console.log('CSV file successfully processed');
//   });

// // app.get('/', (req, res) => res.send('Hello World!'));

// app.listen(port, () => console.log("Test listening on port ${" + port +"}!"));

app.use(express.static('public'));

app.get('/', (req, res) => {
  //Using the index.hbs file instead of planB
  res.render('main', {layout: 'index'});});

app.listen(port, () => console.log('App listening to port ${port}'));