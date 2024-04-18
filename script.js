// Sample locations in Doha:
//const origin = { lat: 25.31644, lng: 51.48708 };
//const destination = { lat: 25.26743, lng: 51.52502 };

const apiKey = 'MCakrvXlXFvGDz8cSbkPQwmgMl96xGlZEZ5zlumeYyQ'; // Replace with your actual HERE API key
import { decode } from "./datos/flexible_polyline.js";

const buttonAd = document.getElementById("getRoute");

let routeLayer;
let arrow;
let startMarker;
let endMarker;
let polygonMarker;
let polygonMarker2;
let polygonMarker3;
let polygonMarker4;
let polygonMarker5;
let polygonMarker6;

function formatDuration(durationSeconds) {
    const days = Math.floor(durationSeconds / (3600 * 24));
    const hours = Math.floor((durationSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    const seconds = Math.round(durationSeconds % 60);

    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    } else {
        return `${seconds}s`;
    }
}


function calculateDistance(polyline) {
    let distance = 0;

    for (let i = 1; i < polyline.length; i++) {
        const lat1 = polyline[i - 1][0];
        const lon1 = polyline[i - 1][1];
        const lat2 = polyline[i][0];
        const lon2 = polyline[i][1];

        const R = 6371e3; // Earth radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        distance += R * c;
    }

    return distance;
}


function formatDistance(distanceMeters) {
    const kilometers = distanceMeters / 1000;
    return `${kilometers.toFixed(2)} km`;
}

async function getRouteDetails(originLat, originLng, destLat, destLng, transport, polygonCoordinates, polygonCoordinates2,polygonCoordinates3, polygonCoordinates4, polygonCoordinates5,polygonCoordinates6) {

    // Construct the URL for routing API with the provided coordinates and API key
    const routingURL = `https://router.hereapi.com/v8/routes?transportMode=${transport}&origin=${originLat},${originLng}&destination=${destLat},${destLng}&avoid[areas]=polygon:${polygonCoordinates}|polygon:${polygonCoordinates2}|polygon:${polygonCoordinates3}|polygon:${polygonCoordinates4}|polygon:${polygonCoordinates5}|polygon:${polygonCoordinates6}&return=polyline&apiKey=${apiKey}`;
    // Fetch route information using the constructed URL
    
    const response = await fetch(routingURL);

    // Parse the response data as JSON
    const data = await response.json();

    // Check if there is at least one route in the response
    const route = data.routes?.[0];
    if (!route) {
        throw new Error('No routes found');
    }

    if (routeLayer) {
        mymap.removeLayer(routeLayer);
        mymap.removeLayer(arrow);
        mymap.removeLayer(startMarker);
        mymap.removeLayer(endMarker);
        mymap.removeLayer(polygonMarker);
        mymap.removeLayer(polygonMarker2);
        mymap.removeLayer(polygonMarker3);
        mymap.removeLayer(polygonMarker4);
        mymap.removeLayer(polygonMarker5);
        mymap.removeLayer(polygonMarker6);
    }

    // Extract departure, arrival, and polyline details from the first route's section
    const section = route.sections[0];
    departure = section.departure.place.location;
    arrival = section.arrival.place.location;
    polyline = section.polyline;
    
    // Parse route geometry

    const decodedRoute = decode(polyline);

    // Calculate duration based on start and end times
    const startTime = new Date(section.departure.time);
    const endTime = new Date(section.arrival.time);
    const durationSeconds = (endTime - startTime) / 1000; // Convert milliseconds to seconds
    const formattedDuration = formatDuration(durationSeconds);

    // Calculate distance
    const distanceMeters = calculateDistance(decodedRoute.polyline);
    const formattedDistance = formatDistance(distanceMeters);

    // Extracting coordinates from the decoded route
    const coordinates = decodedRoute.polyline.map(point => [point[0], point[1]]);

    // Creating a Leaflet polyline from the coordinates
    routeLayer = L.polyline(coordinates, { color: 'blue' }).addTo(mymap);

    // Add directional arrows along the polyline
    arrow = L.polylineDecorator(routeLayer, {
        patterns: [
            { offset: '20%', repeat: 0, symbol: L.Symbol.arrowHead({ pixelSize: 15, polygon: true, pathOptions: { color: 'blue', fillOpacity: 1, weight: 2 } }) },
            { offset: '40%', repeat: 0, symbol: L.Symbol.arrowHead({ pixelSize: 15, polygon: true, pathOptions: { color: 'blue', fillOpacity: 1, weight: 2 } }) },
            { offset: '60%', repeat: 0, symbol: L.Symbol.arrowHead({ pixelSize: 15, polygon: true, pathOptions: { color: 'blue', fillOpacity: 1, weight: 2 } }) },
            { offset: '80%', repeat: 0, symbol: L.Symbol.arrowHead({ pixelSize: 15, polygon: true, pathOptions: { color: 'blue', fillOpacity: 1, weight: 2 } }) }
    ]
    }).addTo(mymap);

    startMarker  = L.marker([departure.lat, departure.lng], {
        icon: L.icon({
            iconUrl: './datos/icons/start.png',
            iconSize: [32, 32], // Adjust the size as needed
            zIndexOffset: 1000
        })
    }).addTo(mymap);

    endMarker  = L.marker([arrival.lat, arrival.lng], {
        icon: L.icon({
            iconUrl: './datos/icons/finish.png',
            iconSize: [32, 32], // Adjust the size as needed
            zIndexOffset: 1000
        })
    }).addTo(mymap);
    const polygonLatLngs = polygonCoordinates.split(';').map(coord => {
        const [lat, lng] = coord.split(',').map(parseFloat);
        return [lat, lng];
    });

    polygonMarker = L.polygon(polygonLatLngs, { color: 'red' }).addTo(mymap);

    const polygonLatLngs2 = polygonCoordinates2.split(';').map(coord => {
        const [lat2, lng2] = coord.split(',').map(parseFloat);
        return [lat2, lng2];
    });

    polygonMarker2 = L.polygon(polygonLatLngs2, { color: 'green' }).addTo(mymap);

    const polygonLatLngs3 = polygonCoordinates3.split(';').map(coord => {
        const [lat3, lng3] = coord.split(',').map(parseFloat);
        return [lat3, lng3];
    });

    polygonMarker3 = L.polygon(polygonLatLngs3, { color: 'blue' }).addTo(mymap);

    
    const polygonLatLngs4 = polygonCoordinates4.split(';').map(coord => {
        const [lat4, lng4] = coord.split(',').map(parseFloat);
        return [lat4, lng4];
    });

    polygonMarker4 = L.polygon(polygonLatLngs4, { color: 'pink' }).addTo(mymap);

    
    const polygonLatLngs5 = polygonCoordinates5.split(';').map(coord => {
        const [lat5, lng5] = coord.split(',').map(parseFloat);
        return [lat5, lng5];
    });

    polygonMarker5 = L.polygon(polygonLatLngs5, { color: 'yellow' }).addTo(mymap);

    
    const polygonLatLngs6 = polygonCoordinates6.split(';').map(coord => {
        const [lat6, lng6] = coord.split(',').map(parseFloat);
        return [lat6, lng6];
    });

    polygonMarker6 = L.polygon(polygonLatLngs6, { color: 'black' }).addTo(mymap);

    mymap.fitBounds(routeLayer.getBounds());

    
    return { duration: formattedDuration, distance: formattedDistance  };

}

let departure; 
let arrival;
let polyline;



buttonAd.addEventListener("click", async () => {
    const originLat = parseFloat(document.getElementById("lat_input").value);
    const originLng = parseFloat(document.getElementById("lng_input").value);
    const destLat = parseFloat(document.getElementById("lat_input_dest").value);
    const destLng = parseFloat(document.getElementById("lng_input_dest").value);
    const transport = document.getElementById("select").value;
    const polygonCoordinates = "25.32375512,51.34815478;25.323635775,51.3485334595;25.32341901,51.3485145194;25.3235213879,51.3481124479"
    const polygonCoordinates2 = "25.32057793,51.46934069;25.32038767,51.4693718653;25.32034127,51.4691660074;25.3205369300,51.4690834000"
    const polygonCoordinates3 = "25.313312438953524,51.470854761098273;25.313175311658455,51.470884869931652;25.313143977396418,51.470567998198334;25.313285333946641,51.470550755934745"
    const polygonCoordinates4 = "25.289184160416376,51.516117746619443;25.288903584749519,51.516141604076758;25.288912428260534,51.515972151271448;25.289174940053393,51.515948248898376"
    const polygonCoordinates5 = "25.376653965593622,51.227860840561632;25.376959979889183,51.228078421506609;25.376420114938526,51.228915840895922;25.376175736048044,51.228658496024899"
    const polygonCoordinates6 = "25.354301700502791,51.278022894485957;25.353719429474729,51.27793372771086;25.353872980433277,51.276614690056675;25.354442506493804,51.276689810773981"
    
    try {
        // Call getRouteDetails to fetch route information
        const { duration, distance } = await getRouteDetails(originLat, originLng, destLat, destLng, transport, polygonCoordinates, polygonCoordinates2,polygonCoordinates3, polygonCoordinates4, polygonCoordinates5, polygonCoordinates6);

        // Display duration and distance on the HTML page
        document.getElementById("duration").textContent = `Duration: ${duration}`;
        document.getElementById("distance").textContent = `Distance: ${distance}`;
    } catch (error) {
        console.error("Error fetching route:", error);
        document.getElementById("duration").textContent = "Route not found";
        document.getElementById("distance").textContent = "";
    }
});


// Leaflet map initialization
var mymap = L.map('mapid').setView([25.276987, 51.520067], 13);

var satelite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

var topo = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles © Esri — Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
});

const style = 'normal.day';

/*
normal.day
normal.day.grey
normal.day.transit
reduced.day
normal.night
reduced.night
pedestrian.day
*/

var HEREmap = L.tileLayer(`https://2.base.maps.ls.hereapi.com/maptile/2.1/maptile/newest/${style}/{z}/{x}/{y}/512/png8?apiKey=${apiKey}&ppi=320`,{
    attribution: '&copy; HERE 2019'}).addTo(mymap);

var baseMaps = {
    "HERE": HEREmap,
    "Satelite": satelite,
    "Topo": topo
};

L.control.layers(baseMaps).addTo(mymap);

L.control.scale({
    position: 'bottomleft',
    imperial: false
}).addTo(mymap);

mymap.addControl(new L.Control.LinearMeasurement({
    unitSystem: 'metric',
    color: '#FF0080',
    type: 'line'
}));

L.control.fullscreen({
    position: 'topleft',
    title: 'Fullscreen',
    titleCancel: 'Exit fullscreen mode',
    content: null,
    forceSeparateButton: true,
    forcePseudoFullscreen: false,
    fullscreenElement: false
}).addTo(mymap);

L.geolet({ position: 'topright' }).addTo(mymap);

var carto_light = new L.TileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}.png', {
    attribution: '©OpenStreetMap, ©CartoDB',
    subdomains: 'abcd',
    maxZoom: 24
});
var minimap = new L.Control.MiniMap(carto_light, {
    toggleDisplay: true,
    minimized: false,
    position: "bottomleft"
}).addTo(mymap);

let selectingInitialCoordinates = true; // Flag to indicate whether initial coordinates are being selected

// Add a click listener to the map
mymap.on('click', function(e) {
    // Check if selecting initial coordinates
    if (selectingInitialCoordinates) {
        // Update the initial coordinates input fields
        document.getElementById("lat_input").value = e.latlng.lat;
        document.getElementById("lng_input").value = e.latlng.lng;
    // Update the flag to indicate end coordinates will be selected next
    selectingInitialCoordinates = false;
    } else {
        // Update the end coordinates input fields
        document.getElementById("lat_input_dest").value = e.latlng.lat;
        document.getElementById("lng_input_dest").value = e.latlng.lng;

        // Reset the flag to indicate initial coordinates will be selected next
        selectingInitialCoordinates = true;
    }
});


function searchAddress(address) {
    // Encode the address for the API request
    var encodedAddress = encodeURIComponent(address);

    // Make a GET request to the HERE Geocoding API
    $.get(`https://geocode.search.hereapi.com/v1/geocode?q=${encodedAddress}&apiKey=${apiKey}`)
        .done(function (data) {
            // Clear existing markers and popups from the map
            mymap.eachLayer(function (layer) {
                if (layer instanceof L.Marker) {
                    mymap.removeLayer(layer);
                }
            });

            // Check if results are returned
            if (data.items.length > 0) {
                // Extract the coordinates of the first result
                var location = data.items[0].position;

                // Center the map on the searched location
                mymap.setView([location.lat, location.lng], 13);

                // Add a marker at the searched location
                L.marker([location.lat, location.lng]).addTo(mymap)
                    .bindPopup(`<b>${address}</b>`).openPopup();
            } else {
                // No results found
                alert('No results found for the entered address.');
            }
        })
        .fail(function () {
            // Error handling
            alert('Error fetching address data. Please try again later.');
        });
}

// Create a search control
var searchControl = L.Control.extend({
    onAdd: function(map) {
        var container = L.DomUtil.create('div', 'leaflet-search-container leaflet-bar');
        container.innerHTML = '<input id="search-input" type="text" placeholder="Search address">' +
                              '<button id="search-button" type="button">Search</button>';

        // Prevent propagation of mouse events within the container
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);

        // Event listener for the search button click
        container.querySelector('#search-button').addEventListener('click', function (event) {
            // Prevent propagation of mouse events from the button
            L.DomEvent.stopPropagation(event);

            // Get the value from the search input
            var address = container.querySelector('#search-input').value.trim();

            // Check if the address input is empty
            if (address === '') {
                // Clear existing markers and popups from the map
                mymap.eachLayer(function (layer) {
                    if (layer instanceof L.Marker) {
                        mymap.removeLayer(layer);
                    }
                });
                return;
            }

            // Call the searchAddress function with the entered address
            searchAddress(address);
        });

        // Event listener for the Enter key press in the input field
        container.querySelector('#search-input').addEventListener('keypress', function (event) {
            if (event.key === 'Enter') {
                // Prevent the default action of form submission
                event.preventDefault();

                // Get the value from the search input
                var address = container.querySelector('#search-input').value.trim();

                // Check if the address input is empty
                if (address === '') {
                    // Clear existing markers and popups from the map
                    mymap.eachLayer(function (layer) {
                        if (layer instanceof L.Marker) {
                            mymap.removeLayer(layer);
                        }
                    });
                    return;
                }

                // Call the searchAddress function with the entered address
                searchAddress(address);
            }
        });

        return container;
    }
});

// Add the search control to the map
new searchControl().addTo(mymap);

let geoJSONLayer;
let legend = document.getElementById("legend");

// Function to handle file selection
function handleFileSelect(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const content = e.target.result;
        const geojsonData = JSON.parse(content);
        addGeoJSONLayer(geojsonData);
        addToLegend(geojsonData);
    };

    reader.readAsText(file);
}

// Function to add GeoJSON layer to the map
function addGeoJSONLayer(geojsonData) {
    // Clear existing GeoJSON layer if present
    if (geoJSONLayer) {
        mymap.removeLayer(geoJSONLayer);
    }

    // Add new GeoJSON layer to the map
    geoJSONLayer = L.geoJSON(geojsonData).addTo(mymap);
}

// Function to clear GeoJSON layer from the map
function clearGeoJSONLayer() {
    if (geoJSONLayer) {
        mymap.removeLayer(geoJSONLayer);
    }

    // Clear file input field
    document.getElementById("geojsonFileInput").value = "";
    removeFromLegend();
}

// Function to add GeoJSON layer name to the legend
function addToLegend(geojsonData) {
    const name = geojsonData.name || "Unnamed Layer"; // Use name property from GeoJSON if available, otherwise default to "Unnamed Layer"
    const legendItem = document.createElement("div");
    legendItem.textContent = name;
    legend.appendChild(legendItem);
}

// Function to remove GeoJSON layer name from the legend
function removeFromLegend() {
    legend.innerHTML = ""; // Remove all child elements (i.e., clear the legend)
}

// Add event listener to the file input element
document.getElementById("geojsonFileInput").addEventListener("change", handleFileSelect);

// Add event listener to the "Clear GeoJSON Layer" button
document.getElementById("clearGeoJSONButton").addEventListener("click", clearGeoJSONLayer);
