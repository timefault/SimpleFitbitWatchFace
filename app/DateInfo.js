import { logDiagnosticToConsole } from "@fitbit/sdk/lib/diagnostics";

export function getDayNumber() {
    const LENGTH_OF_DAY = 1000 * 60 * 60 * 24;
    let firstDay = new Date('2022-01-01');
    let today = new Date();
    let dayNumber = Math.floor((today - firstDay) / LENGTH_OF_DAY)
    return dayNumber;
}

export function getFullDate() {
    let fullDate, today, month, day, year;
    let monthes = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    today = new Date();
    month = monthes[today.getMonth()];
    day = today.getDate();
    year = today.getFullYear();
    fullDate = `${month} ${day}, ${year}`;
    console.log(" ============ " + month);
    console.log(" ============ " + day);
    console.log(" ============ " + year);
    return fullDate;
}