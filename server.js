const express = require('express');
const app = express();
const port = 3000;

const fs = require('fs');
const csv = require('csv-parser');

fs.createReadStream('../archive/USVideos.csv')
  .pipe(csv())
  .on('data', (row) => {
    app.get('/', (req, res) => res.send(row));
    // console.log(row);
  })
  .on('end', () => {
    console.log('CSV file successfully processed');
  });

// app.get('/', (req, res) => res.send('Hello World!'));

app.listen(port, () => console.log("Test listening on port ${" + port +"}!"));
