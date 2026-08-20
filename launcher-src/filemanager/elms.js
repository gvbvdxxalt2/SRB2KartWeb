module.exports = [
  {
    element: "style",
    textContent: require("./styles.css"),
  },
  {
    element: "style",
    textContent: "[hidden] { display: none; }",
  },
  {
    element: "div",
    className: "loadingScreen",
    gid: "loadingScreen",
    textContent: "File system is loading...",
  },
  {
    element: "div",
    className: "fileManagerMenuBar",
    children: [
      {
        element: "input",
        type: "text",
        gid: "filePathInput",
        className: "fileManagerPathBar",
      },
    ],
  },
  {
    element: "div",
    className: "fileList",
    gid: "fileListContainer",
  },
  {
    element: "div",
    className: "clickDropdownMenu",
    gid: "clickDropdownMenu",
  },
];
