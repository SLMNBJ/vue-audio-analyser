const express = require('express');
const app = express();
const http = require('http').Server(app);
const youtubeStream = require('youtube-audio-stream');
const port = process.env.PORT || 3000;

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

http.listen(port, () => {
  console.log(`http://localhost:${port} is running...`);
});
