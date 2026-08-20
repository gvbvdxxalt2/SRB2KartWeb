function makePathEasyToProcess(path) {
  var a = path.replaceAll("\\", "/");
  if (a[0] == "." && a[1] == "/") {
    var i = 2;
    var parsedPath = "";
    while (i < a.length) {
      parsedPath += a[i];
      i += 1;
    }
  } else {
    var i = 0;
    var parsedPath = "";
    while (i < a.length) {
      parsedPath += a[i];
      i += 1;
    }
  }
  return parsedPath;
}

function parsePathArray(path) {
  var text = makePathEasyToProcess(path);
  var array = text.split("/");
  var fixedArray = []; //Cuts out empty "parts" of the array.
  for (var part of array) {
    if (part.length > 0) {
      fixedArray.push(part);
    }
  }
  return fixedArray;
}

function parsePath(p) {
  return parsePathArray(p).join("/");
}

function joinPaths(...paths) {
  var outArray = [];
  for (var path of paths) {
    var array = parsePathArray(path);

    for (var part of array) {
      outArray.push(part);
      if (part == "..") {
        //Doing this twice because it pushed it to the end.
        outArray.pop();
        outArray.pop();
      }
      if (part == ".") {
        outArray.pop();
      }
    }
  }
  return parsePath(outArray.join("/"));
}

module.exports = {
  makePathEasyToProcess,
  parsePathArray,
  parsePath,
  joinPaths,
};
