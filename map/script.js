// default location is FRI if geolocation does not work
var long = 14.469006330685156;
var lat = 46.05076627820738;

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition);
  } 
else {
    console.log("Geolocation is not supported . . .");
}


function showPosition(position) {
    console.log("Latitude: " + position.coords.latitude +
    "\nLongitude: " + position.coords.longitude);
    long = position.coords.longitude;
    lat = position.coords.latitude;
    loadMap();
}

function loadMap() {
    // load map and set it to current location
    var map = L.map('map').setView([lat, long], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // create a marker for FRI
    var markerFri = L.marker([46.05076627820738, 14.469006330685156]).addTo(map);
    markerFri.bindPopup("Fakulteta za računalništvo in informatiko").openPopup();
}