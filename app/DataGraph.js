import { logDiagnosticToConsole } from "@fitbit/sdk/lib/diagnostics";
import document from "document";
import * as utils from "../resources/utils";

export class Graph {

    lines;
    xOffset;
    yOffset;
    data;
    // len;
    xAxixInt;
    dataMin;
    dataMax;

    dataBuffer;

    constructor(xOffset, yOffset) {

        this.lines = [];
        this.xOffset = xOffset;
        this.yOffset = yOffset;

        // /*
        this.data = [
            84, 104.2, 94.5, 85.3, 75.4,
            81, 112, 91.45, 72.3, 79.56,
            84, 104.2, 94.5, 85.3, 75.4,
            85.3, 64.9, 73.4, 83.1, 92.9];
        // */

        // this.data = [75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75];

        // this.len = this.data.length;
        this.xAxisInt = (245 - this.xOffset * 2) / this.data.length;
        this.dataMin = this.min(this.data);
        this.dataMax = this.max(this.data);

        this.dataBuffer = [];

        this.setup();

    }

    pushData = data => {
        if (this.dataBuffer.length === 20) {
            let avgData;
            avgData = this.dataBuffer.reduce((cur, cum) => cur + cum, 0) / this.dataBuffer.length;
            this.dataBuffer = [];
            this.data.shift();
            this.data.push(avgData);

            this.redraw();
            return;
        }
        this.dataBuffer.push(data)
    }

    redraw = () => {
        for (let i = 0; i < 19; i++) {
            this.lines[i].x1 = this.xOffset + i * this.xAxisInt;
            this.lines[i].x2 = this.xOffset + (i + 1) * this.xAxisInt;
            this.lines[i].y1 = this.mapY(this.data[i], this.dataMin, this.dataMax, 280, 20);
            this.lines[i].y2 = this.mapY(this.data[i + 1], this.dataMin, this.dataMax, 280, 20);
        }
    }

    setup = () => {
        console.log("           " + this.data)
        // if len > number of lines, make to length by average


        if (this.data.length <= 20) {
            for (let i = 0; i < this.data.length; i++) {
                let index = (i + 1).toString();
                this.lines.push(document.getElementById(index));
                this.lines[i].style.display = "none";
                this.lines[i].fill = "red";
            }
            for (let i = 0; i < this.data.length - 1; i++) {
                this.lines[i].style.display = "inline";
                this.lines[i + 1].style.display = "inline";
                this.lines[i].x1 = this.xOffset + i * this.xAxisInt;
                this.lines[i].x2 = this.xOffset + (i + 1) * this.xAxisInt;
                this.lines[i].y1 = this.mapY(this.data[i]);
                this.lines[i].y2 = this.mapY(this.data[i + 1]);
            }
        }
    }

    max = array => {
        let max = -Infinity;
        for (let i = 0; i < array.length; i++) {
            if (array[i] > max) {
                max = array[i]
            }
        }
        return max
    }

    min = array => {
        let min = Infinity;
        for (let i = 0; i < array.length; i++) {
            if (array[i] < min) {
                min = array[i]
            }
        }
        return min
    }

    mapY = y => {
        return 305 - .25 * y
    }
}