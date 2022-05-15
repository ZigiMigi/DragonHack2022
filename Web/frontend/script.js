// default location is FRI if geolocation does not work
var long = 14.469006330685156;
var lat = 46.05076627820738;

if (navigator.geolocation) {
	navigator.geolocation.getCurrentPosition(showPosition);
} else {
	console.log('Geolocation is not supported . . .');
}

var getJSON = function (url, callback) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	xhr.responseType = 'json';
	xhr.onload = function () {
		var status = xhr.status;
		if (status === 200) {
			callback(null, xhr.response);
		} else {
			callback(status, xhr.response);
		}
	};
	xhr.send();
};

async function showPosition(position) {
	console.log(
		'Latitude: ' +
			position.coords.latitude +
			'\nLongitude: ' +
			position.coords.longitude
	);
	long = position.coords.longitude;
	lat = position.coords.latitude;
	loadMap();
}

var markers = new Array();
var map;

function pantotracker(device_id) {
	let chosen_marker = markers.find((x) => {
		return x.getPopup().getContent() === device_id;
	});

	// clear all popups except chosen one
	markers.forEach((x) => {
		if (x.getPopup().getContent() !== chosen_marker) {
			x.closePopup();
		}
	});

	chosen_marker.openPopup();

	map.flyTo(chosen_marker.getLatLng(), 17);
}

pantotracker();

function loadMap() {
	// load map and set it to current location
	map = L.map('map').setView([lat, long], 15);
	L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution:
			'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
	}).addTo(map);

	// create a marker for FRI
	var markerFri = L.marker([46.05076627820738, 14.469006330685156], {
		riseOnHover: true
	}).addTo(map);
	markerFri
		.bindPopup('Fakulteta za računalništvo in informatiko')
		.openPopup();

	window.setInterval(function () {
		getJSON('http://localhost:3000/trackers', function (err, data) {
			let trackerDiv = '';
			if (err !== null) {
				alert('Something went wrong: ' + err);
			} else {
				if (markers.length >= 1) {
					for (let i = 0; i < data.length; i++) {
						// if(markers[i].isPopupOpen()) {
						// 	markers[i].getPopup().getContent();
						// }
						markers.shift().remove();
					}
				}
				for (let i = 0; i < data.length; i++) {
					console.log(
						data[i].longitude,
						data[i].latitude,
						data[i].device_id,
						data[i].altitude
					);
					var marker = L.marker(
						[data[i].latitude, data[i].longitude],
						{
							riseOnHover: true
						}
					).addTo(map);
					marker.bindPopup(data[i].device_id);
					markers.push(marker);

					trackerDiv +=
						'<div class="tracker" onclick="pantotracker(&quot;' +
						data[i].device_id +
						'&quot;)"><p id="tracker-header" class="disable-select">' +
						data[i].device_id +
						'</p><p class="disable-select">latitude: ' +
						data[i].longitude +
						'</br>longitude: ' +
						data[i].latitude +
						'</br>altitude: ' +
						data[i].altitude +
						'</p></div>';
				}

				document.getElementById('toolbar-items').innerHTML = trackerDiv;
			}
		});
	}, 5000);
}
