if (!window["Module"]) {
  window["Module"] = {};
}

var elements = require("../gp2/elements.js");
elements.appendElementsFromJSON(document.body, require("./elms.js"));
var { loadFilesystem } = require("./load.js");
var { joinPaths, getFileName, getFileExtension } = require("./pathutil.js");
var fileSizeModule = require("filesize");
var dialog = require("../dialog.js");
if (window["Module"]) {
  var Module = window["Module"];
}
var jszip = require("jszip");
var loadingScreen = elements.getGPId("loadingScreen");
var didDisplayDataLossNotice = false;

var FS = null;
var filePathInput = elements.getGPId("filePathInput");
var fileListContainer = elements.getGPId("fileListContainer");
var clickDropdownMenu = elements.getGPId("clickDropdownMenu");
var currentPath = "/addons/userdata";
var multiSelectList = {};

var IMAGES = require("./images.js");

var FILE_ICON_TYPES = {
  wad: IMAGES.WAD,
  pk3: IMAGES.PK3,
  ssg: IMAGES.SAVE,
  dat: IMAGES.SAVE,
  lua: IMAGES.LUA,
  soc: IMAGES.SOC,
  txt: IMAGES.TXT,
  cfg: IMAGES.CONFIG,
};

clickDropdownMenu.hidden = true;
async function syncFs() {
  return new Promise((resolve, reject) => {
    FS.syncfs(false, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
function getPathIsDirectory(fullPath) {
  return FS.isDir(FS.stat(fullPath).mode);
}

var dragFile = null;
var dragFileTarget = null;

async function handleMoveDrag(dragFile, dragFileTarget) {
  var isMulti = Object.keys(multiSelectList).length > 0;
  var multiFiles = [];
  for (var file of Object.keys(multiSelectList)) {
    multiFiles.push(file);
  }
  if (!dragFile || !dragFileTarget) {
    return;
  }
  try{
    loadingScreen.hidden = false;
    if (isMulti) {
      for (var file of multiFiles) {
        loadingScreen.textContent = `Moving ${getFileName(file)} to ${getFileName(file)}...`;
        FS.rename(file, joinPaths(dragFileTarget.fullPath, getFileName(file)));
        await syncFs();
      }
    } else {
      loadingScreen.textContent = `Moving ${dragFile.fileName} to ${dragFileTarget.fileName}...`;
      FS.rename(dragFile.fullPath, joinPaths(dragFileTarget.fullPath, dragFile.fileName));
      await syncFs();
    }
    loadingScreen.hidden = true;
    refreshFileList();
  }catch(e){
    loadingScreen.hidden = true;
    dialog.alert(`Error with moving file: ${e}`);
    return;
  }
}

function getFileItemEventHandlers(fullPath,fileName,stat,isDir) {
  function ondragstart(event) {
    dragFile = {
      elm: this,
      fullPath,fileName,stat,isDir
    };
  }
  function ondragend() {
    handleMoveDrag(dragFile, dragFileTarget);
    dragFile = null;
    dragFileTarget = null;
  }
  if (!isDir) {
    return {
      ondragstart,
      ondragend
    };
  }

  return {
    ondragstart,
    ondragend,
    ondrop: function (event) {
      this.removeAttribute("dragover");
      event.preventDefault();
    },
    ondragover: function (event) {
      if (fullPath == dragFile.fullPath) {
        return;
      }
      if (multiSelectList[fullPath]) { //Prevent trying to move into self.
        return;
      }
      event.preventDefault();
      this.setAttribute("dragover", "");
      dragFileTarget = {
        elm: this,
        fullPath,fileName,stat,isDir
      };
    },
    ondragleave: function (event) {
      this.removeAttribute("dragover");
      dragFileTarget = null;
    }
  };
}

var filesCurrentlyDisplayed = [];

function refreshFileList(keepSelectList = false) {
  if (!keepSelectList) {
    multiSelectList = {};
  }
  filesCurrentlyDisplayed = [];
  clickDropdownMenu.hidden = true;
  currentPath = joinPaths("/",currentPath); //This just makes sure the path is properly formatted.
  //window.alert(`Current Path: ${currentPath}`);
  var files = FS.readdir(currentPath).slice(2);
  if (currentPath !== "/") {
    var fullPath = joinPaths(currentPath, "..");
    var fileName = getFileName(fullPath);
    //window.alert(`Current Path: ${currentPath} Full Path: ${fullPath} FileName: ${fileName}`);
    var stat = FS.stat(fullPath);
  }
  elements.setInnerJSON(
    fileListContainer,
    [
      {
        element: "div",
        className: "fileListItem",
        hidden: currentPath == "/",
        ...(currentPath !== "/" ? getFileItemEventHandlers(fullPath,fileName,stat,true) : {}),
        children: [
          {
            element: "img",
            src: IMAGES.UP,
            className: "fileManagerImage",
          },
          {
            element: "span",
            textContent: "UP...",
          },
        ],
        onclick: function (e) {
          e.stopPropagation();
          if (currentPath != "/") {
            currentPath = "/" + joinPaths(currentPath, "..");
            refreshFileList();
          }
        },
      },
    ]
      .concat(
        files
          .sort((fileName, fileName2) => (""+fileName2).charCodeAt(0) - (""+fileName).charCodeAt(0))
          .sort((fileName) => {
            return getPathIsDirectory(joinPaths(currentPath, fileName))
              ? -1
              : 1;
          })
          .map((fileName) => {
            var fullPath = joinPaths(currentPath, fileName);
            var isDir = getPathIsDirectory(fullPath);
            var stat = FS.stat(fullPath);
            filesCurrentlyDisplayed.push(fullPath);
            return {
              element: "div",
              className: "fileListItem",
              GPWhenCreated: function (elm) {
                elm.setAttribute("_path", fullPath);
              },
              ...getFileItemEventHandlers(fullPath,fileName,stat,isDir),
              draggable: true,
              children: [
                {
                  element: "div",
                  children: [
                    {
                        element: "img",
                        src: isDir ? IMAGES.FOLDER : (
                          FILE_ICON_TYPES[getFileExtension(fileName)] ||
                          "images/file.svg"
                        )
                    }
                  ],
                  className: "fileManagerImageContainer",
                  GPWhenCreated: function (elm) {
                    if (multiSelectList[fullPath]) {
                      elm.setAttribute("multiselected","");
                    }
                  },
                  onclick: function (event) {
                    if (multiSelectList[fullPath]) {
                      delete multiSelectList[fullPath];
                      refreshFileList(true);
                    } else {
                      multiSelectList[fullPath] = true;
                      refreshFileList(true);
                    }
                    event.stopPropagation();
                  }
                },
                {
                  element: "span",
                  textContent: isDir ? fileName + "/" : fileName,
                },
                {
                  element: "div",
                  style: {marginRight: "auto"}
                },
                {
                  element: "span",
                  className: "fileListItemSize",
                  textContent: fileSizeModule.filesize(+stat.size || 0),
                  hidden: isDir,
                }
              ],
              oncontextmenu: function (e) {
                e.preventDefault();
                clickDropdownMenu.style.opacity = 0;
                setTimeout(() => {
                  clickDropdownMenu.style.opacity = 1;
                  showFileDropdownMenu(e, fullPath, isDir, fileName);
                }, 1);
                return false;
              },
              onclick: function (e) {
                if (e.ctrlKey) {
                  if (multiSelectList[fullPath]) {
                    delete multiSelectList[fullPath];
                  } else {
                    multiSelectList[fullPath] = true;
                  }
                  refreshFileList(true);
                  e.stopPropagation();
                  return;
                }
                if (isDir) {
                  e.stopPropagation();
                  var previous = currentPath;
                  try {
                    currentPath = "/" + joinPaths(currentPath, fileName);
                    refreshFileList();
                  } catch (e) {
                    currentPath = previous;
                    refreshFileList();
                  }
                } else {
                  e.preventDefault();
                  e.stopPropagation();
                  setTimeout(() => {
                    showFileDropdownMenu(e, fullPath, isDir, fileName);
                  }, 1);
                  return false;
                }
              },
            };
          }),
      )
      .concat([
        {
          element: "div",
          className: "bottomFileMarker",
        },
      ]),
  );
  filePathInput.value = currentPath;
}

function selectAll(noUnselect) {
  var alreadySelectedCount = 0;
  for (var file of filesCurrentlyDisplayed) {
    if (multiSelectList[file]) {
      alreadySelectedCount += 1;
    }
    multiSelectList[file] = true;
  }
  if (alreadySelectedCount == filesCurrentlyDisplayed.length && !noUnselect) {
    for (var file of filesCurrentlyDisplayed) { //Unselect everything if everything is selected.
      delete multiSelectList[file];
    }
  }
  refreshFileList(true); //True means preserve multi select list.
}

function unselectAll() {
  for (var file of filesCurrentlyDisplayed) {
    delete multiSelectList[file];
  }
  refreshFileList(true);
}

document.addEventListener("keydown", function (e) {
  if (e.ctrlKey && e.key.toLowerCase() == "a" && !(document.activeElement && document.activeElement.tagName == "INPUT")) {
    e.preventDefault();
    selectAll();
  }
});
window.addEventListener("click", function () {
  clickDropdownMenu.hidden = true;
});
function showDropdownMenu(e) {
  clickDropdownMenu.style.top = e.clientY + "px";
  clickDropdownMenu.style.left = e.clientX + "px";
  clickDropdownMenu.hidden = false;
  elements.setInnerJSON(clickDropdownMenu, [
    {
      element: "div",
      className: "dropdownItem",
      children: [
          {
            element: "div",
            className: "fileManagerImageContainer2",
            children: [
              {
                element: "img",
                src: IMAGES.UP
              }
            ]
          },
          {
            element: "span",
            textContent: `Refresh`,
          }
        ],
      onclick: function () {
        FS.syncfs(false, (err) => {
          refreshFileList();
        });
      },
    },
    {
      element: "div",
      className: "dropdownItem",
      children: [
          {
            element: "div",
            className: "fileManagerImageContainer2",
            children: [
              {
                element: "img",
                src: IMAGES.FOLDER
              }
            ]
          },
          {
            element: "span",
            textContent: `New folder`,
          }
        ],
      onclick: function () {
        dialog
          .prompt("Enter a name for the new folder:", "New Folder")
          .then(async (folderName) => {
            if (folderName) {
              loadingScreen.hidden = false;
              loadingScreen.textContent =
                'Creating folder "' + folderName + '"...';
              try {
                var fullPath = joinPaths(currentPath, folderName);
                FS.mkdir(fullPath);
                refreshFileList();
                await syncFs();
              } catch (e) {
                dialog.alert("Failed to create folder: " + e);
              }
              loadingScreen.hidden = true;
            }
          });
      },
    },
    {
      element: "div",
      className: "dropdownItem",
      children: [
          {
            element: "div",
            className: "fileManagerImageContainer2",
            children: [
              {
                element: "img",
                src: "images/upload.svg"
              }
            ]
          },
          {
            element: "span",
            textContent: `Upload file(s)`,
          }
        ],
      onclick: function () {
        var fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.multiple = true;
        fileInput.onchange = function () {
            var files = fileInput.files;
            if (!files.length) {
                return;
            }

            loadingScreen.hidden = false;
            loadingScreen.textContent = "Preparing files...";

            // Show notice once
            if (!didDisplayDataLossNotice) {
                didDisplayDataLossNotice = true;
                dialog.alert(
                    "NOTICE!\n"+
                    "When adding lots of files (usually above 1.5GB) your save data and other files may become corrupt.\n"+
                    "This is a bug I can't fix myself due to restrictions on web browsers!\n"+
                    "If you have any important save data, you can zip files by right clicking a folder and clicking \"Download (Save to zip)\"."
                );
            }

            let currentIndex = 0;

            function processNextFile() {
                if (currentIndex >= files.length) {
                    // All files written to memory, now do ONE single syncfs call!
                    loadingScreen.textContent = "Saving changes to disk...";
                    
                    syncFs().then(() => {
                        loadingScreen.hidden = true;
                        refreshFileList();
                        console.log("All files uploaded and synced successfully.");
                    }).catch((err) => {
                        loadingScreen.hidden = true;
                        console.error("Sync error after batch upload:", err);
                        alert("Error saving files to persistent storage. Storage might be full.");
                    });
                    return;
                }

                var file = files[currentIndex];
                var fullPath = joinPaths(currentPath, file.name);
                loadingScreen.textContent = `Uploading "${file.name}" (${currentIndex + 1}/${files.length})...`;

                var reader = new FileReader();
                reader.onload = function () {
                    var arrayBuffer = reader.result;
                    if (!arrayBuffer || arrayBuffer.byteLength === 0) return;

                    var uint8Array = new Uint8Array(arrayBuffer.slice(0));

                    // Ensure parent folders exist so IDBFS metadata doesn't desync
                    var lastSlash = fullPath.lastIndexOf('/');
                    if (lastSlash !== -1) {
                        FS.mkdirTree(fullPath.substring(0, lastSlash));
                    }

                    FS.writeFile(fullPath, uint8Array);
                    currentIndex++;
                    processNextFile();
                };
                reader.readAsArrayBuffer(file);
            }

            processNextFile();
        };
        fileInput.click();
      },
    },
  ]);
}

function showFileDropdownMenu(e, fullPath, isDir, fileName) {
  var isMulti = Object.keys(multiSelectList).length > 0;
  var multiFiles = [];
  for (var file of Object.keys(multiSelectList)) {
    multiFiles.push(file);
  }
  clickDropdownMenu.style.top = e.clientY + "px";
  clickDropdownMenu.style.left = e.clientX + "px";
  clickDropdownMenu.hidden = false;

  ////////////////

  if (isMulti) {
    elements.setInnerJSON(clickDropdownMenu, [
      {
        element: "div",
        className: "dropdownItem",
        children: [
          {
            element: "div",
            className: "fileManagerImageContainer2",
            children: [
              {
                element: "img",
                src: IMAGES.X
              }
            ]
          },
          {
            element: "span",
            textContent: `Delete ${multiFiles.length} files`,
          }
        ],
        onclick: function () {
          dialog
            .confirm('Are you sure you want to delete the selected files?')
            .then(async (confirmed) => {
              if (confirmed) {
                loadingScreen.hidden = false;
                for (var file of multiFiles) {
                  var fileName = getFileName(file);
                  var stat = FS.stat(file);
                  var isDir = getPathIsDirectory(file);
                  loadingScreen.textContent = 'Deleting "' + fileName + '"...';
                  try {
                    if (isDir) {
                      function removeDirContents(path) {
                        var items = FS.readdir(path).slice(2);
                        for (var i = 0; i < items.length; i++) {
                          var itemPath = joinPaths(path, items[i]);
                          var stat = FS.stat(itemPath);
                          if (FS.isDir(stat.mode)) {
                            removeDirContents(itemPath);
                            FS.rmdir(itemPath);
                          } else {
                            FS.unlink(itemPath);
                          }
                        }
                      }
                      removeDirContents(fullPath);
                      FS.rmdir(fullPath);
                    } else {
                      FS.unlink(fullPath);
                    }
                    refreshFileList();
                    await syncFs();
                  } catch (e) {
                    dialog.alert("Failed to delete file/folder: " + e);
                  }
                }
                loadingScreen.hidden = true;
              }
              
            });
        },
      },
    ]);
    return;
  }

  /////////////////

  elements.setInnerJSON(clickDropdownMenu, [
    {
      element: "div",
      className: "dropdownItem",
      children: [
        {
          element: "div",
          className: "fileManagerImageContainer2",
          children: [
            {
              element: "img",
              src: IMAGES.X
            }
          ]
        },
        {
          element: "span",
          textContent: "Delete",
        }
      ],
      onclick: function () {
        dialog
          .confirm('Are you sure you want to delete "' + fileName + '"?')
          .then(async (confirmed) => {
            if (confirmed) {
              loadingScreen.hidden = false;
              loadingScreen.textContent = 'Deleting "' + fileName + '"...';
              try {
                if (isDir) {
                  function removeDirContents(path) {
                    var items = FS.readdir(path).slice(2);
                    for (var i = 0; i < items.length; i++) {
                      var itemPath = joinPaths(path, items[i]);
                      var stat = FS.stat(itemPath);
                      if (FS.isDir(stat.mode)) {
                        removeDirContents(itemPath);
                        FS.rmdir(itemPath);
                      } else {
                        FS.unlink(itemPath);
                      }
                    }
                  }
                  removeDirContents(fullPath);
                  FS.rmdir(fullPath);
                } else {
                  FS.unlink(fullPath);
                }
                refreshFileList();
                await syncFs();
              } catch (e) {
                dialog.alert("Failed to delete file/folder: " + e);
              }
              loadingScreen.hidden = true;
            }
          });
      },
    },
    {
      element: "div",
      className: "dropdownItem",
      children: [
        {
          element: "div",
          className: "fileManagerImageContainer2",
          children: [
            {
              element: "img",
              src: "images/upload.svg"
            }
          ]
        },
        {
          element: "span",
          textContent: "Replace file",
        }
      ],
      hidden: isDir,
      onclick: function () {
        var fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.onchange = function () {
          var file = fileInput.files[0];
          if (!file) {
            return;
          }
          loadingScreen.hidden = false;
          loadingScreen.textContent =
            'Uploading "' + fileName + '" and replacing file...';
          var reader = new FileReader();
          reader.onload = async function () {
            try {
              var arrayBuffer = reader.result;
              var uint8Array = new Uint8Array(arrayBuffer);
              FS.writeFile(fullPath, uint8Array);
              refreshFileList();
              await syncFs();
            } catch (e) {
              dialog.alert("Failed to replace file: " + e);
            }
            loadingScreen.hidden = true;
          };
          reader.readAsArrayBuffer(file);
        };
        fileInput.click();
      },
    },
    {
      element: "div",
      className: "dropdownItem",
      children: [
        {
          element: "div",
          className: "fileManagerImageContainer2",
          children: [
            {
              element: "img",
              src: "images/rename.svg"
            }
          ]
        },
        {
          element: "span",
          textContent: "Rename",
        }
      ],
      hidden: isDir,
      onclick: function () {
        dialog
          .prompt('Enter a new name for "' + fileName + '":', fileName)
          .then(async (newName) => {
            if (newName && newName != fileName) {
              loadingScreen.hidden = false;
              try {
                loadingScreen.textContent =
                  'Renaming "' + fileName + '" to "' + newName + '"...';
                var newFullPath = joinPaths(currentPath, newName);
                FS.rename(fullPath, newFullPath);
                refreshFileList();
                await syncFs();
              } catch (e) {
                dialog.alert("Failed to rename file: " + e);
              }
              loadingScreen.hidden = true;
            }
          });
      },
    },
    {
      element: "div",
      className: "dropdownItem",
      children: [
        {
          element: "div",
          className: "fileManagerImageContainer2",
          children: [
            {
              element: "img",
              src: "images/download.svg"
            }
          ]
        },
        {
          element: "span",
          textContent: "Download",
        }
      ],
      hidden: isDir,
      onclick: function () {
        loadingScreen.hidden = false;
        loadingScreen.textContent =
          'Preparing download for "' + fileName + '"...';
        try {
          var fileData = FS.readFile(fullPath);
          var blob = new Blob([fileData], { type: "application/octet-stream" });
          var a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = fileName;
          document.body.append(a);
          a.click();
          a.remove();
        } catch (e) {
          dialog.alert("Failed to download file: " + e);
        }
        loadingScreen.hidden = true;
      },
    },
    {
      element: "div",
      className: "dropdownItem",
      hidden: !isDir,
      children: [
        {
          element: "div",
          className: "fileManagerImageContainer2",
          children: [
            {
              element: "img",
              src: "images/zip.svg"
            }
          ]
        },
        {
          element: "span",
          textContent: "Download (Save to zip)",
        }
      ],
      onclick: function () {
        try {
          loadingScreen.hidden = false;
          loadingScreen.textContent =
            'Preparing download for "' + fileName + '"...';
          var zip = new jszip();
          function addFolderToZip(zipFolder, path) {
            var items = FS.readdir(path).slice(2);
            for (var i = 0; i < items.length; i++) {
              var itemPath = joinPaths(path, items[i]);
              var stat = FS.stat(itemPath);
              if (FS.isDir(stat.mode)) {
                var newZipFolder = zipFolder.folder(items[i]);
                addFolderToZip(newZipFolder, itemPath);
              } else {
                console.log(itemPath);
                var fileData = FS.readFile(itemPath);
                console.log(fileData);
                zipFolder.file(items[i], fileData);
              }
            }
          }
          addFolderToZip(zip.folder(fileName), fullPath);
          zip.generateAsync({ type: "blob" }).then(function (content) {
            var a = document.createElement("a");
            a.href = URL.createObjectURL(content);
            a.download = fileName + ".zip";
            document.body.append(a);
            a.click();
            a.remove();
            loadingScreen.hidden = true;
          });
        } catch (e) {
          dialog.alert("Failed to download folder: " + e);
          loadingScreen.hidden = true;
        }
      },
    },
  ]);
}

fileListContainer.addEventListener("contextmenu", function (e) {
  e.preventDefault();
  showDropdownMenu(e);
  return false;
});

fileListContainer.addEventListener("click", function (e) {
  if (clickDropdownMenu.hidden) {
    e.preventDefault();
    showDropdownMenu(e);
    e.stopPropagation();
  }
});

filePathInput.addEventListener("change", function () {
  var newPath = filePathInput.value;
  try {
    var stat = FS.stat(newPath);
    if (FS.isDir(stat.mode)) {
      currentPath = newPath;
      refreshFileList();
    } else {
      filePathInput.value = currentPath;
      dialog.alert("File path wasn't found or had an error");
    }
  } catch (e) {
    filePathInput.value = currentPath;
    dialog.alert("File path wasn't found or had an error");
  }
});

(async function () {
  try {
    // 1. Wait for everything to be created and synced
    await loadFilesystem();
    loadingScreen.hidden = true;

    // 2. Set the global FS reference from the Module
    FS = Module.FS;

    // 3. Set the starting path for your file manager
    // We use /addons/userdata because that's the symlink we created
    currentPath = "/addons/userdata";

    // 4. Small delay to ensure Emscripten's internal C structures are ready
    setTimeout(() => {
      try {
        refreshFileList();
        console.log("File list loaded successfully at " + currentPath);
        dialog.alert("Welcome to the file manager!\nRight click on empty space to create folders and upload files.\nRight click on files/folders for more options.\nHere is where you can add addons to your SRB2Kart Web experience, just like you would with a normal SRB2Kart installation!");
      } catch (e) {
        console.error("Refresh failed:", e);
        // Fallback to root if the symlink is being stubborn
        currentPath = "/";
        refreshFileList();
        dialog.alert("Navigation failed. Resetting to root directory.");
      }
    }, 100);
  } catch (e) {
    console.error("FS Load Error:", e);
    loadingScreen.hidden = true;
    // window.location.reload(); // Optional: only reload if it's a fatal error
  }
})();

const RUNNING_CHECK_NAME = "srb2web_running_check";
var previousRunCheck = localStorage.getItem(RUNNING_CHECK_NAME);

var checkInterval = setInterval(() => {
  var current = localStorage.getItem(RUNNING_CHECK_NAME);
  if (current !== previousRunCheck) {
    previousRunCheck = current;
    clearInterval(checkInterval);
    (async function () {
      await dialog.alert(
        "Another instance of SRB2Kart Web is running. \n" +
          "Please close other instances and press OK to reload.",
      );
      window.location.reload();
    })();
  }
}, 100);
