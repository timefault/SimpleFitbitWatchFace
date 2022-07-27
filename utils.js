export function zeroPad(num) {
  return num < 10 ? "0" + num : num.toString();
}

export function lookIn(element) {
  console.log(`===== ${element} =====`)
  try {
    for (let test in element) {
      console.log(`${test}: ${element[test]}`);
    }
  } catch (e) {
    console.log("=========");
    console.log(lookIn(e));
    console.log("=========");
  }
}

export function getTiles(latitude, longitude, tileSize, zoom) {
  var sinLatitude = Math.sin(latitude * Math.PI / 180);
  var pixelX = ((longitude + 180) / 360) * tileSize * Math.pow(2, zoom);
  var pixelY = (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)) * tileSize * Math.pow(2, zoom);
  var tileX = Math.floor(pixelX / tileSize);
  var tileY = Math.floor(pixelY / tileSize);
  return { tileX, tileY };
}