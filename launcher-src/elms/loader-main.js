module.exports = [
  {
    element: "div",
    className: "loaderMain",
    gid: "loaderMain",
    children: [
      ////////////////////////////////////////

      ...require("./loading-logo.js"),

      ////////////////////////////////////////

      {
        element: "div",
        className: "dontSellText",
        textContent: "THIS GAME SHOULD NOT BE SOLD!",
      },

      ////////////////////////////////////////

      {
        element: "div",
        gid: "loaderContent",
        textContent: "Loading...",
        style: {
          textAlign: "center",
          fontWeight: "bold",
          color: "#ffffff",
        },
      },

      ////////////////////////////////////////
    ],
  },
];
