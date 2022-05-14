const { json } = require('express');
const express = require('express');
const https = require('node:https');
const app = express();
const querystring = require('querystring');
require('dotenv').config();
const port = 3000;
let cors = require('cors');
app.use(cors());

const lat = 46.04975;
const long = 14.46907;

const API_KEY = process.env.API_KEY;

const hardcoded_trackers = [{ latitude: 46.04975, longitude: 14.46907 }];

app.get('/', (req, res) => {
	res.send('Hello World!');
});

app.get('/trackers', (req, res) => {
	let x = lat + Math.random() * (Math.round(Math.random()) ? 1 : -1) * 0.001;
	let y = long + Math.random() * (Math.round(Math.random()) ? 1 : -1) * 0.001;
	let coordinates = [{ latitude: x, longitude: y }];

	const request = https.get(
		'https://eu1.cloud.thethings.network/api/v3/applications/test-medo-application/devices?field_mask=locations',
		{
			headers: {
				Authorization: `Bearer ${API_KEY}`,
				Accept: 'application/json',
				'User-Agent': 'nodeApp'
			}
		},
		(response) => {
			let data = '';

			response.on('data', (chunk) => {
				data += chunk;
			});

			response.on('end', () => {
				console.log(data);
				let obj = JSON.parse(data);
				let locs = obj.end_devices.map((x) => {
					return {
						device_id: x.ids.device_id,
						latitude: x.locations['frm-payload'].latitude,
						longitude: x.locations['frm-payload'].longitude
					};
				});
				res.json(locs);
			});
		}
	);
	request.on('error', (error) => {
		console.log(error);
		res.status(400);
		res.end;
	});
});

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
});
