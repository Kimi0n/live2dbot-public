const express = require("express");
const open = require("open");
const app = express();

const port = 5500;

app.use(express.static(__dirname));

app.get(`/`, function(req, res){
  res.sendFile(`${__dirname}/live2dbot/index.html`);
});

app.listen(port, () => {
  console.log(`=== Live2DBot ===`);
  console.log(`Web-Address: http://localhost:${port}/`);
  console.log(`=================`);
  console.log(`This window is needed for Live2DBot to run!`);
});

open(`http://localhost:${port}/`);
