//global variables declaration
var uploadedJsonFile;
var jsonPosition = 0;
var marker;
var theGeojson = { 'type': 'FeatureCollection', 'features': [] };
var geojsonAproximatLocations = { 'type': 'FeatureCollection', 'features': [] };
var statusOfAllCities = [];
var georeferencedCities = [];

//Mapbox magic
mapboxgl.accessToken = 'pk.eyJ1IjoibWVkaXZhbHRyYWRlcm91dGVzIiwiYSI6ImNqdWphMm1xZjBtOWYzem5ianp2NHZ0dTgifQ.T7Q5YDRR4SC7bB8pIcCZhQ';
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/medivaltraderoutes/cjujafmnr4jn81flairsl8pbe',
    center: [0, 0],
    zoom: 2.5
});

var nav = new mapboxgl.NavigationControl();
map.addControl(nav, 'top-left');
map.addControl(new mapboxgl.FullscreenControl({ container: document.querySelector('body') }), 'top-left');
// map.getCanvas().style.cursor = 'crosshair'; 
// var popupOffsets = { 'top': [0, 0], 'top-left': [0, 0], 'top-right': [0, 0], 'bottom': [0, -5], 'bottom-left': [0, 0], 'bottom-right': [0, 0], 'left': [0, 0], 'right': [0, 0] };
// var popupHover = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: popupOffsets });
// var popupClick = new mapboxgl.Popup({ offset: popupOffsets });

map.on('load', function () {
    console.log("Map is loaded, run data.")
    test();
});

function test() {
    var nullIsland = {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [0, 0]
        },
        properties: {
            name: 'Null Island'
        }
    };
    var nullIsland2 = {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [2, 0]
        },
        properties: {
            name: 'Null Island'
        }
    };

    var geojsonSource = turf.buffer(nullIsland, 200);
    var geojsonSource2 = turf.buffer(nullIsland2, 300);



    console.log(geojsonSource);

    map.addSource("sourceName", {
        type: 'geojson',
        data: geojsonSource
    });

    // map.getSource("sourceName").setData(geojsonSource);


    map.addLayer({
        'id': 'layerName',
        'type': 'fill',
        'source': "sourceName",
        'layout': {},
        'paint': {
            'fill-color': '#088',
            'fill-opacity': 0.8
        }
    });


    // newGeojsonFeature("", geojsonSource)
    // newGeojsonFeature("", geojsonSource2)
    newGeojsonFeature("", turf.union(geojsonSource, geojsonSource2))
    // var union = turf.union(poly1, poly2);

}


function newGeojsonFeature(featureCollection, featureGeojson, propertiesObject) {
    theGeojson['features'].push(featureGeojson);
    map.getSource("sourceName").setData(theGeojson);
}

map.on('mousedown', function (e) {
    // Prevent the default map drag behavior.
    e.preventDefault();
    // canvas.style.cursor = 'grab';

    map.on('mousemove', addMouseCoordToDrawing);
    map.once('mouseup', function () {
        map.off('mousemove', addMouseCoordToDrawing);
    });
});

map.on('touchstart', function (e) {
    // Prevent the default map drag behavior.
    e.preventDefault();
    // canvas.style.cursor = 'grab';

    map.on('touchmove', addMouseCoordToDrawing);
    map.once('touchend', function () {
        map.off('touchmove', addMouseCoordToDrawing);
    });
});



function addMouseCoordToDrawing(e) {
    var clickCoor = {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [e.lngLat.lng, e.lngLat.lat]
        },
        properties: {
            name: 'Null Island'
        }
    };
    var geojsonFeature = turf.buffer(clickCoor, 200);
    theGeojson['features'][0] = turf.union(theGeojson['features'][0], geojsonFeature);
    map.getSource("sourceName").setData(theGeojson);
    // console.log("Add new mouse location to polygone");
}