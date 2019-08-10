//global variables declaration
var uploadedJsonFile;
var jsonPosition = 0;
var marker;
var newGeojson = { 'type': 'FeatureCollection', 'features': [] };
var geojsonAproximatLocations = { 'type': 'FeatureCollection', 'features': [] };
var statusOfAllCities = [];
var georeferencedCities = [];

//Mapbox magic
mapboxgl.accessToken = 'pk.eyJ1IjoibWVkaXZhbHRyYWRlcm91dGVzIiwiYSI6ImNqdWphMm1xZjBtOWYzem5ianp2NHZ0dTgifQ.T7Q5YDRR4SC7bB8pIcCZhQ';
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/medivaltraderoutes/cjujafmnr4jn81flairsl8pbe',
    center: [65.75109845004542, 34.35312346019293],
    zoom: 2.5
});
var nav = new mapboxgl.NavigationControl();
map.addControl(nav, 'top-left');
map.addControl(new mapboxgl.FullscreenControl({ container: document.querySelector('body') }), 'top-left');
// map.getCanvas().style.cursor = 'crosshair'; 
var popupOffsets = { 'top': [0, 0], 'top-left': [0, 0], 'top-right': [0, 0], 'bottom': [0, -5], 'bottom-left': [0, 0], 'bottom-right': [0, 0], 'left': [0, 0], 'right': [0, 0] };
var popupHover = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: popupOffsets });
var popupClick = new mapboxgl.Popup({ offset: popupOffsets });




//event lissners
// $("#uploadedFileButton").change(function (e) { turnNewFileIntoObject(e) }); //event lissener. When a file is uploaded, it acts.


function turnNewFileIntoObject(e) {
    if (e.target.files != undefined) { //if there is at least 1 file 
        var SelectedFileFromComputer = new FileReader(); // create specail var that does FileReading 
        SelectedFileFromComputer.onload = function (e) { // function of what happens on load
            uploadedJsonFile = JSON.parse(e.target.result); //put newlly uploaded data in var
        };
        SelectedFileFromComputer.readAsText(e.target.files.item(0));// this is somhow nessesary to initiate the onload function of this variable. I think it is the thing that sais "go ahead, you can use it as text"
    }
    setTimeout("positionInJson(false, false, 0), initiationCitiesStatuses(), generateAproximateLocationsGeojson()", 300);
}

function positionInJson(next, previous, jump) {
    if (!next && !previous && jump == undefined) {
        jsonPosition = 0;
        updateUI();
    }
    if (next) {
        if (jsonPosition == undefined) { jsonPosition = 0; }
        jsonPosition++;
        updateUI();
    }
    if (previous) {
        jsonPosition--;
        updateUI();
    }
    if (jump != undefined) {
        jsonPosition = jump;
        updateUI();
    }
}

function newGeojsonFeature(geojsonObject, lng, lat, propertiesObject) {
    var newFeature = {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [lng, lat]
        },
        "properties": propertiesObject
    }
    geojsonObject['features'].push(newFeature);
}

function thisCityIsReferenced(cityName) {
    var indexvalue = statusOfAllCities.findIndex(x => x.name === cityName);
    statusOfAllCities[indexvalue].georeferenced = true;
    georeferencedCities = statusOfAllCities.filter(x => x.georeferenced === true);
}

function updateUI() {
    if (jsonPosition == 0) {
        $("#previous").attr('disabled', true);
    }
    else {
        $("#previous").attr('disabled', false);
    }
    if (jsonPosition < (Object.keys(uploadedJsonFile).length - 1)) {
        $("#next").attr('disabled', false);
    }
    else {
        $("#next").attr('disabled', true);
    }
    $("#toBeEnrichedDataDisplayText").text(JSON.stringify(uploadedJsonFile[jsonPosition].name));
    $("#geojsonCounter").text("Number of added locations: " + Object.keys(newGeojson['features']).length + " of " + Object.keys(uploadedJsonFile).length);
    $("#uploadButtonContainer").hide();
    setAproximatPossitionMapRings("aproximatedLocation", uploadedJsonFile[jsonPosition].positionLatRelCoordinates, uploadedJsonFile[jsonPosition].positionLongRelCoordinates);
    addCityPlacementMarker(uploadedJsonFile[jsonPosition].positionLatRelCoordinates, uploadedJsonFile[jsonPosition].positionLongRelCoordinates)
    map.flyTo({ center: [uploadedJsonFile[jsonPosition].positionLatRelCoordinates, uploadedJsonFile[jsonPosition].positionLongRelCoordinates] });
    updateGenerateGeojson("unsavedData", newGeojson);

    if (Object.keys(newGeojson['features']).length >= 1) {
        $('#download').attr('href', "data:text/geojson;charset=utf-8," + encodeURIComponent(JSON.stringify(newGeojson, null, 2)) + "");
        $("#downloadButtonContainer").show();
    }
}

function setAproximatPossitionMapRings(id, lng, lat) {
    if (map.getSource(id) == undefined) {
        map.addSource(id, {
            type: 'geojson',
            data: {
                "type": "FeatureCollection",
                "features": [{
                    "type": "Feature",
                    "properties": {},
                    "geometry": {
                        "type": "Point",
                        "coordinates": [
                            lng,
                            lat
                        ]
                    }
                }]
            }
        });
    } else {
        map.getSource(id).setData({
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {},
                "geometry": {
                    "type": "Point",
                    "coordinates": [
                        lng,
                        lat
                    ]
                }
            }]
        });
    }

    if (map.getLayer(id) == undefined) {
        map.addLayer({
            "id": id,
            "source": id,
            "type": "circle",
            "paint": {
                "circle-radius": 80,
                "circle-opacity": 0,
                "circle-stroke-width": 1,
                "circle-stroke-color": "#00bf7c",
                "circle-stroke-opacity": 1,
            }
        });

    }

    if (id == "newGeojson") {

    }
}

function generateAproximateLocationsGeojson() {
    for (i in uploadedJsonFile) {
        newGeojsonFeature(geojsonAproximatLocations, uploadedJsonFile[i].positionLatRelCoordinates, uploadedJsonFile[i].positionLongRelCoordinates, uploadedJsonFile[i]);
    }
    updateGenerateGeojson("aproximatLocations", geojsonAproximatLocations);
}

function updateGenerateGeojson(id, geojsonSource) {
    if (map.getSource(id) == undefined) {
        map.addSource(id, {
            type: 'geojson',
            data: geojsonSource
        });
        startHover(id);
        initiateClickPopup(id)
    } else {
        map.getSource(id).setData(geojsonSource);
    }

    if (map.getLayer(id) == undefined) {
        if (id == "aproximatLocations") {
            map.addLayer({
                "id": id,
                "source": id,
                "type": "circle",
                "paint": {
                    "circle-radius": 2.5,
                    "circle-color": "#ff7f00",
                    "circle-opacity": 1
                }
            });
        } else {
            map.addLayer({
                "id": id,
                "source": id,
                "type": "circle",
                "paint": {
                    "circle-radius": 4,
                    "circle-color": "#00d100",
                    "circle-opacity": 1
                }
            });
        }
    }
}

function addCityPlacementMarker(lng, lat) {
    if (marker != undefined) {
        marker.remove();
    }
    saveButtonDisplay(false);
    marker = new mapboxgl.Marker({ draggable: true }).setLngLat([lng, lat]).addTo(map);
    marker.on('dragstart', saveButtonDisplay);
}

function saveButtonDisplay(display) {
    if (display == undefined) {
        display == true
    }
    if (display) {
        $("#saveMarker").show();
    } else {
        $("#saveMarker").hide();
    }
}

function saveMarkerPositionAsCurrentCityPosition() {
    newGeojsonFeature(newGeojson, marker.getLngLat().lng, marker.getLngLat().lat, uploadedJsonFile[jsonPosition]);
    thisCityIsReferenced(uploadedJsonFile[jsonPosition].name);
    marker.remove();
    saveButtonDisplay(false);
    positionInJson(next);
}

function startHover(id) {
    map.on('mouseenter', id, function (e) {
        var coordinates = e.features[0].geometry.coordinates.slice();
        var description;
        if (id == "aproximatLocations") {
            description = "Aproximat location of:<br> <b>";
            description += e.features[0].properties.name;
            description += "</b>";
        } else if (id == "unsavedData") {
            description = "New location of:<br> <b>";
            description += e.features[0].properties.name;
            description += "</b>";
        }
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {  // Ensure that if the map is zoomed out such that multiple copies of the feature are visible, the popup appears over the copy being pointed to.
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }
        popupHover.setLngLat(coordinates)
            .setHTML(description)
            .addTo(map);
    });
    map.on('mouseleave', id, function () {
        map.getCanvas().style.cursor = '';
        popupHover.remove();
    });
}

function initiationCitiesStatuses() {
    for (i in uploadedJsonFile) {
        var cityStatus = {
            "name": uploadedJsonFile[i].name,
            "georeferenced": false
        };
        statusOfAllCities.push(cityStatus)
    }
}

function initiateClickPopup(id) {
    map.on('click', id, function (e) {
        popupHover.remove();
        var description;
        var coordinates = e.features[0].geometry.coordinates.slice();
        if (id == "aproximatLocations") {
            description = "Aproximat location of:<br> <b>";
            description += e.features[0].properties.name;
            description += "</b><br>";
            description += "<button id='editLocation' onclick=\"editLocation(geojsonAproximatLocations,\'" + e.features[0].properties.name + "\')\">Edit location</button>";
        } else if (id == "unsavedData") {
            description = "New location of:<br> <b>";
            description += e.features[0].properties.name;
            description += "</b>";
        } else {
            description = "no content";
        }
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) { //Mapbox magic to avoid bugs when comlpleetly zoomed out
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }
        popupClick.setLngLat(coordinates).setHTML(description).addTo(map);
    });
}

function editLocation(arrayOfObjects, locationName) {
    popupClick.remove();
    var indexvalue = arrayOfObjects.features.findIndex(x => x.properties.name === locationName);
    positionInJson(false, false, indexvalue)
}


