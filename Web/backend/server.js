const express = require('express');
const app = express();
const port = 3000;

const hardcoded_trackers = [{ latitude: 46.04975, longitude: 14.46907 }];

app.get('/', (req, res) => {
	res.send('Hello World!');
});

app.get('/trackers', (req, res) => {
	res.json(hardcoded_trackers);
});

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
});
