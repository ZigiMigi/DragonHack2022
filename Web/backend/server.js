const express = require('express');
const app = express();
const port = 3000;
let cors = require("cors");
app.use(cors());

//const hardcoded_trackers = [{ latitude: 46.04975, longitude: 14.46907 }];
const lat = 46.04975;
const long = 14.46907;


app.get('/', (req, res) => {
	res.send('Hello World!');
});

app.get('/trackers', (req, res) => {
	let x = lat + Math.random() * (Math.round(Math.random()) ? 1 : -1) * 0.001;
	let y = long + Math.random() * (Math.round(Math.random()) ? 1 : -1) * 0.001;
	let coordinates = [{ latitude: x, longitude: y }];
	res.json(coordinates);
	//res.json(hardcoded_trackers);
});

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
});
