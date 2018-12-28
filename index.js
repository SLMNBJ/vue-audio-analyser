const express = require('express');
const app = express();
const http = require('http').Server(app);
const youtubeStream = require('youtube-audio-stream');

app.use(express.static('static'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/static/index.html');
});

app.get('/stream', function(req, res) {
  try {
    youtubeStream(decodeURIComponent(req.query.videoUrl)).pipe(res);
  } catch (exception) {
    res.status(500).send(exception);
  }
});

http.listen(3000, () => {
  console.log('http://localhost:3000 is running...');
});
