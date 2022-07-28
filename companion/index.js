import * as messaging from "messaging";
import { outbox } from "file-transfer";
import { Image } from "image";
import * as utils from "../resources/utils"

import { geolocation } from "geolocation";


var lat, lon;
var tileX, tileY;


var API_KEY = "bf4d44fa559cfb3b741788bdce242c8d";
// var ENDPOINT = "https://tile.openweathermap.org/map/precipitation_new/1/0/0.png";  // weather map
var CURRENT_WEATHER_ENDPOINT = `https://api.openweathermap.org/data/2.5/weather`;
var WEATHER_MAP_ENDPOINT = `https://tile.openweathermap.org/map/precipitation_new`;      ///1/1/1.png;
var STREET_MAP_ENDPOINT = "https://tile.openstreetmap.org";      // /12/1116/1642.png
var ZOOM = 4;
var TILE_SIZE = 256

// -----------------------------------------------------
async function queryOpenWeatherCurrentConditions() {  // later use 1-call api to also get icon

    fetch(`${CURRENT_WEATHER_ENDPOINT}?lat=${lat}&lon=${lon}&units=imperial&appid=${API_KEY}`)
        .then(function (response) { // check response code
            response.json()
                .then(function (data) {
                    // We just want the current temperature
                    var weather = {
                        temperature: data["main"]["temp"],
                        icon: data["weather"][0]["icon"]
                    }
                    // get ready icon png
                    getReadyWeatherIcon(weather.icon);
                    // Send the weather data to the device
                    returnWeatherData(weather);
                });
        })
        .catch(function (err) {
            console.error(`Error fetching weather: ${err}`);
        });
}
// -----------------------------------------------------
async function queryOpenWeatherMap() {
    console.log(`${WEATHER_MAP_ENDPOINT}/${ZOOM}/${tileX}/${tileY}.png?&appid=${API_KEY}`)
    fetch(`${WEATHER_MAP_ENDPOINT}/${ZOOM}/${tileX}/${tileY}.png?&appid=${API_KEY}`)
        .then((response) =>  // check response code
            response.arrayBuffer())
        .then((buffer) =>
            Image.from(buffer, "image/png")
        )
        .then((image) =>
            image.export("image/vnd.fitbit.txi"
            )
        )
        .then((buffer) =>
            outbox.enqueue(`weather_${Date.now()}.txi`, buffer)
        )
        .then(
            (fileTransfer) =>
                console.log(`Enqueued ${fileTransfer.name}`)
        )

        .catch(function (err) {
            console.error(`Error fetching weather: ${err}`);
        });
}
// -----------------------------------------------------
async function queryOpenStreetMap() {
    console.log(`${STREET_MAP_ENDPOINT}/${ZOOM}/${tileX}/${tileY}.png`);
    fetch(`${STREET_MAP_ENDPOINT}/${ZOOM}/${tileX}/${tileY}.png`)
        .then((response) =>  // check response code
            response.arrayBuffer())
        .then((buffer) =>
            Image.from(buffer, "image/png")
        )
        .then((image) =>
            image.export("image/vnd.fitbit.txi"
            )
        )
        .then((buffer) =>
            outbox.enqueue(`street_${Date.now()}.txi`, buffer)
        )
        .then(
            (fileTransfer) =>
                console.log(`Enqueued ${fileTransfer.name}`)
        )

        .catch(function (err) {
            console.error(`Error fetching street map: ${err}`);
        });
}
// -----------------------------------------------------
function returnWeatherData(data) {
    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
        messaging.peerSocket.send(data);
    } else {
        console.error("Error: Connection is not open");
    }
}
async function getCurrentPosition() {

    geolocation.getCurrentPosition(function (position) {
        console.log(position.coords.latitude + ", " + position.coords.longitude);
        lat = position.coords.latitude;
        lon = position.coords.longitude;
    })
}
function getReadyWeatherIcon(icon) {
    fetch(`https://openweathermap.org/img/wn/${icon}@2x.png`)
        .then((response) =>  // check response code
            response.arrayBuffer())
        .then((buffer) =>
            Image.from(buffer, "image/png")
        )
        .then((image) =>
            image.export("image/vnd.fitbit.txi"
            )
        )
        .then((buffer) =>
            outbox.enqueue(`weathericon_${Date.now()}.txi`, buffer)
        )
        .then(
            (fileTransfer) =>
                console.log(`Enqueued ${fileTransfer.name}`)
        )

        .catch(function (err) {
            console.error(`Error fetching weather: ${err}`);
        });
}


messaging.peerSocket.addEventListener("message", async (evt) => {
    if (evt.data && evt.data.command === "getCurrentWeather") {


        await getCurrentPosition();
        let tiles = utils.getTiles(lat, lon, TILE_SIZE, ZOOM);
        tileX = tiles.tileX;
        tileY = tiles.tileY;
        console.log(utils.getTiles(lat, lon, TILE_SIZE, ZOOM));
        await queryOpenWeatherCurrentConditions();
        await queryOpenWeatherMap();
        await queryOpenStreetMap();
    }
});
// -----------------------------------------------------
messaging.peerSocket.addEventListener("error", (err) => {
    console.error(`Connection error: ${err.code} - ${err.message}`);
});

