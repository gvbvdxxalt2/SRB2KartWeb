var rootDot = ".";
var upDirDot = "..";
var pathSplit = "/";

function _getPathArray(_p) {
  var p = ""+_p;

  var split = p.split(pathSplit);
  split = split.filter((part) => !!part);
  split = split.filter((part) => part.trim() !== rootDot);

  return split;
}

function _makePath(array) {
  var path = array.join(pathSplit);
  if (array.length < 1) {
    return pathSplit;
  } else {
    return pathSplit + path;
  }
}

function joinPaths(...paths) {
  var result = [];
  for (var path of paths) {
    var parts = _getPathArray(path);
    for (var part of parts) {
      if (part == upDirDot) {
        if (result.length > 0) {
          result.length = result.length - 1;
        }
      } else {
        result.push(part);
      }
    }
  }

  var totalPath = _makePath(result);

  return totalPath;
}

function getFileName(path) {
  return _getPathArray(joinPaths(path)).pop() || "";
}

function getFileExtension(path) {
  var name = getFileName(path);

  if (name.indexOf(".") == -1) {
    return null;
  }

  var extension = name.split(".").pop();
  extension = extension.toLowerCase();
  extension = extension.trim();

  return extension;
}

module.exports = {
  joinPaths,
  getFileName,
  getFileExtension
};
