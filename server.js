const express = require("express");
const open = require("open");
const app = express();
const port = 5500;

app.use(express.static(__dirname));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/live2dbot/index.html');
});

app.listen(port, () => console.log("Live2DBot is now working, please keep this window open until you don't need Live2DBot anymore. If your browser hasn't opened, please open a browser window and navigate to http://localhost:" + port));
open('http://localhost:' + port);
