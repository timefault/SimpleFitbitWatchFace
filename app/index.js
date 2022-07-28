import document from "document";
import { display } from "display";
import { preferences } from "user-settings";
import clock, { TickEvent } from "clock";
import { HeartRateSensor } from "heart-rate";
import { me as appbit } from "appbit";
import { BodyPresenceSensor } from "body-presence";
import * as messaging from "messaging";
import { inbox } from "file-transfer";
import { me as device } from "device";

import { Graph } from "./DataGraph";

import * as utils from "../resources/utils";
import * as DateInfo from "./DateInfo";

let start, previousTimeStamp, currentRAF;
let done = false

var temperatureColor = {
    cold: 'blueviolet',
    cool: 'blue',
    pleasant: 'lightgreen',
    warm: 'darksalmon',
    hot: 'darkred'
};

class WatchApp {

    clockLabel;
    showOnlyClock;

    fullDateLabel;
    dayNameLabel;
    dayNumberLabel;

    weatherTemperatureLabel;
    weatherIcon;
    weatherMapSVG;
    weatherMapData;

    streetMapSVG;

    hrmLabel;
    hrm;
    hrmIcon;
    avgBPM;
    BPM;
    hrmGraph;

    body;

    screen;

    g;

    constructor() {




        // screen
        if (!device.screen) device.screen = { width: 348, height: 250 };
        this.g = document.getElementById("g") /

            // display 
            display.addEventListener("change", this.handleDisplayChange);



        // this.dataGraph = new Graph(device.screen.width * .1, device.screen.height * .1);
        this.dataGraph = new Graph(0, 0);
        this.hrmGraph = document.getElementById("hrm-graph");


        // heart rate monitor  ------------------------------------------------------
        // -- maybe set hrm to batch when display is off and non-batched when display is on
        this.hrmLabel = document.getElementById("hrm-label");
        this.hrmIcon = document.getElementById("hrm-icon");
        this.avgBPM = 0;
        if (HeartRateSensor && appbit.permissions.granted("access_heart_rate")) {
            console.log("hrm created");
            this.hrm = new HeartRateSensor({ frequency: 1/*, batch: 3*/ });
            this.hrm.addEventListener("reading", this.handleHRMReading)
            this.hrm.start();
        }
        this.hrmLabel.addEventListener("click", this.handleHRMLabelClick);

        // body  ------------------------------------------------------
        if (BodyPresenceSensor && appbit.permissions.granted("access_activity")) {
            this.body = new BodyPresenceSensor();
            this.body.addEventListener("reading", this.handleBodyPresenceReading);
            this.body.start();
        }

        // clock  ------------------------------------------------------
        this.showOnlyClock = false;
        this.clockLabel = document.getElementById("clock-label");
        clock.granularity = "minutes"; // seconds, minutes, hours
        clock.addEventListener("tick", this.handleClockTick);
        this.clockLabel.addEventListener("click", this.handleClockLabelClick);

        // day  ------------------------------------------------------
        this.fullDateLabel = document.getElementById("full-date-label");
        this.dayNumberLabel = document.getElementById("day-number-label");



        this.dayNameLabel = document.getElementById("day-name-label");
        this.dayNameLabel.addEventListener("click", this.handleDayNameLabelClick);

        // screen rect  ------------------------------------------------------
        this.screen = document.getElementById("screen-rect");
        // this.screen.addEventListener("click", this.handleScreenClick);
        this.g = document.getElementById("g");

        // weather  ------------------------------------------------------
        this.weatherTemperatureLabel = document.getElementById("weather-temperature-label");
        this.weatherIcon = document.getElementById("weather-icon");
        // utils.lookIn(this.weatherIcon);
        this.weatherTemperatureLabel.addEventListener("click", this.handleWeatherTemperatureLabelClick);
        setInterval(this.fetchWeather, 30 * 1000 * 60);   // update on significant event

        this.weatherMapSVG = document.getElementById("weather-map");
        this.weatherMapSVG.addEventListener("click", this.handleWeatherMapClick);

        this.streetMapSVG = document.getElementById("street-map");

        // messaging ------------------------------------------------------
        messaging.peerSocket.addEventListener("open", (evt) => {
            this.fetchWeather();
        });

        messaging.peerSocket.addEventListener("message", (evt) => {
            if (evt.data) {
                this.processWeatherData(evt.data);
            }
        });

        messaging.peerSocket.addEventListener("error", (err) => {
            console.error(`Connection error: ${err.code} - ${err.message}`);
        });


        inbox.onnewfile = () => {
            let weatherMap, streetMap, weatherIcon;
            console.log("Received file");
            // utils.lookIn(this.weatherMapSVG);
            let newFile = inbox.nextFile();
            console.log(newFile.split('_')[0]);
            if (newFile.split('_')[0] == 'weather')
                weatherMap = newFile;
            if (newFile.split('_')[0] == 'street')
                streetMap = newFile;
            if (newFile.split('_')[0] == 'weathericon')
                weatherIcon = newFile;
            // let weatherMap = inbox.nextFile();
            // let streetMap = inbox.nextFile();
            console.log(`/private/data/${newFile} is now available`);
            if (weatherMap)
                this.weatherMapSVG.image = `/private/data/${weatherMap}`;
            if (streetMap)
                this.streetMapSVG.image = `/private/data/${streetMap}`;
            if (weatherIcon)
                this.weatherIcon.image = `/private/data/${weatherIcon}`;
        };

    }   // constructor end <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    // zz
    handleWeatherMapClick = () => {
        console.log("Weather map clicked");
        this.weatherMapSVG.style.display = "none";
        this.streetMapSVG.style.display = "none";
    };

    handleHRMLabelClick = evt => {
        if (this.hrmLabel.style.opacity < 1) {
            console.log("HRM not visible");
            return;
        }
        console.log("HRM clicked");
    };

    handleDayNameLabelClick = () => {
        if (this.dayNameLabel.style.opacity < 1) {
            console.log("Day not visible");
            return;
        }
        console.log("Day clicked");
        console.log(`${this.fullDateLabel.style.display}`);
        this.fullDateLabel.style.display = this.fullDateLabel.style.display == 'inline' ? 'none' : 'inline';
        this.dayNumberLabel.style.display = this.dayNumberLabel.style.display == 'inline' ? 'none' : 'inline';
    };

    handleClockLabelClick = () => {
        console.log("Clock clicked");

        if (!this.showOnlyClock && this.weatherMapSVG.style.display === 'none') {
            this.fullDateLabel.animate("enable");
            this.dayNameLabel.animate("enable");
            this.dayNumberLabel.animate("enable");
            this.weatherTemperatureLabel.animate("enable");
            this.hrmLabel.animate("enable");
            this.hrmIcon.animate("enable");
            this.weatherIcon.animate("enable");
            // this.hrmGraph.animate("enable");
            this.dataGraph.lines.forEach(line => line.animate("enable"));
            currentRAF = requestAnimationFrame(this.translateClockLabel);
            this.showOnlyClock = true;  // needed ?
        }
        else {
            if (currentRAF) {
                cancelAnimationFrame(currentRAF);
                currentRAF = undefined;
                start = undefined;
            }
            this.fullDateLabel.animate("disable");
            this.fullDateLabel.style.opacity = 1;
            this.dayNameLabel.animate("disable");
            this.dayNameLabel.style.opacity = 1;
            this.dayNumberLabel.animate("disable");
            this.dayNumberLabel.style.opacity = 1;
            this.weatherTemperatureLabel.animate("disable");
            this.weatherTemperatureLabel.style.opacity = 1;
            this.hrmLabel.animate("disable");
            this.hrmLabel.style.opacity = 1;
            this.hrmIcon.animate("disable");
            this.hrmIcon.style.opacity = 1;
            this.weatherIcon.animate("disable");
            this.dataGraph.lines.forEach(line => line.animate("disable"));
            this.dataGraph.lines.forEach(line => line.style.opacity = 1);

            this.weatherIcon.style.opacity = .9;
            this.showOnlyClock = false;
            this.g.groupTransform.translate.x = 0;    // get screen-width   <================== not working
        }
    };

    handleWeatherTemperatureLabelClick = () => {
        if (this.weatherTemperatureLabel.style.opacity < 1) {
            console.log("Weather not visible");
            return;
        }

        console.log("weather clicked");
        this.weatherMapSVG.style.display = "inline";
        this.streetMapSVG.style.display = "inline";
    };

    handleScreenClick = () => {
        console.log("Clicked");
        this.dayNameLabel.animate("enable");
        this.weatherTemperatureLabel.animate("enable");
        this.hrmLabel.animate("enable");
        this.hrmIcon.animate("enable");
        requestAnimationFrame(translateClockLabel);

        // this.clockLabel.animateTranform("enable");
        // utils.lookIn(this.g);
        // this.g.groupTransform.translate.x = 50;
    };

    handleBodyPresenceReading = () => {
        console.log(`The device is ${this.body.present ? '' : 'not'} on the user's body.`);
        if (!this.body.present && !this.showOnlyClock) this.handleClockLabelClick()
        // this.body.present ? this.hrm.start() : this.hrm.stop(); // tries to constantly start??
    };

    handleDisplayChange = () => {
        display.on ? this.hrm.start() : this.hrm.stop();
    };

    handleClockTick = evt => {
        // utils.lookIn(evt.date);

        const today = evt.date;
        // const today = new Date();
        let hours = today.getHours();
        const minutes = today.getMinutes();
        const seconds = today.getSeconds();
        if (preferences.clockDisplay == "12h")
            hours = hours == 12 ? hours : hours %= 12;
        this.clockLabel.text = `${(hours)}:${utils.zeroPad(minutes)}`;

        this.dayNameLabel.text = today.toString().split(" ")[0];

        this.fullDateLabel.text = DateInfo.getFullDate();

        this.dayNumberLabel.text = DateInfo.getDayNumber();

    }

    handleHRMReading = evt => {
        // console.log("reading handler: " + this.avgBPM);
        this.hrmLabel.text = this.hrm.heartRate;
        this.dataGraph.pushData(this.hrm.heartRate);
        // this.calculateBatchedBPM();
        // this.hrmLabel.text = this.avgBPM;
        // for (let index = 0; index < this.hrm.readings.timestamp.length; index++) {
        // }
        this.dataGraph.pushData(this.hrm.heartRate);
    };
    calculateBatchedBPM = () => {
        this.avgBPM = Math.round(this.hrm.readings.heartRate.reduce((pre, cur) => pre + cur, this.avgBPM) / this.hrm.readings.heartRate.length);    // check if this ever zero
    };

    fetchWeather = () => {
        if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
            // Send a command to the companion
            messaging.peerSocket.send({
                command: "getCurrentWeather"
            });
        }
    }

    processWeatherData = data => {
        console.log("!!!!!!!!!!!!");
        // utils.lookIn(data);
        console.log(data);
        console.log(`The temperature is: ${data.temperature}`);
        switch (true) {
            case data.temperature < 45:
                this.weatherTemperatureLabel.style.fill = temperatureColor.cold;
                break;
            case data.temperature < 60:
                this.weatherTemperatureLabel.style.fill = temperatureColor.cool;
                break;
            case data.temperature < 75:
                this.weatherTemperatureLabel.style.fill = temperatureColor.pleasant;
                break;
            case data.temperature < 90:
                this.weatherTemperatureLabel.style.fill = temperatureColor.warm;
                break;
            default:
                this.weatherTemperatureLabel.style.fill = temperatureColor.hot;
                break;
        }
        this.weatherTemperatureLabel.text = `${Math.round(data.temperature)} \u00B0F`;  // fill color gradient by temperature value
    }


    translateClockLabel = timestamp => {
        if (start === undefined) {
            start = timestamp;
        }
        const elapsed = timestamp - start;

        if (previousTimeStamp !== timestamp) {
            // Math.min() is used here to make sure the element stops at exactly 200px
            const count = Math.min(.02 * elapsed, device.screen.width * .19);
            console.log(count);
            // console.log(elapsed);
            // element.style.transform = 'translateX(' + count + 'px)';
            this.g.groupTransform.translate.x = -count;
            if (count >= device.screen.width * .19) done = true;
        }
        // console.log(done);
        if (elapsed < 20000) { // Stop the animation after 2 seconds
            previousTimeStamp = timestamp;
            if (!done) {
                currentRAF = requestAnimationFrame(this.translateClockLabel);
            }
            else {
                done = false;
                start = undefined;
                currentRAF = undefined;
            }

        }
    }




}  // ===================== W A T C H   A P P ===========================



const app = new WatchApp(); // <========================||||

