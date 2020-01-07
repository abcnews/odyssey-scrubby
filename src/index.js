import "./polyfills";
import * as acto from "@abcnews/alternating-case-to-object";
import App from "./components/App";

const configs = [];

function render() {
  configs.forEach(({ rootEl, props }) => {
    rootEl.removeChild(rootEl.firstChild);
    rootEl.appendChild(new App(props).el);
  });
}

function init() {
  [...document.querySelectorAll(`a[name^="scrubby"]`)].forEach(markerEl => {
    const blockEl = markerEl.closest(".Block");

    if (!blockEl) {
      return;
    }

    const rootEl = blockEl.querySelector(".Block-media");

    if (!rootEl) {
      return;
    }

    const { id, start, end } = acto(markerEl.getAttribute("name").slice(7));

    if (!id) {
      return;
    }

    const dataAttr = `data-odyssey-scrubby-${id}`;

    const dataEl = document.querySelector(`[${dataAttr}]`);

    if (!dataEl) {
      return;
    }

    const dataURL = dataEl.getAttribute(dataAttr);

    if (!dataURL) {
      return;
    }

    markerEl.parentElement.parentElement.removeChild(markerEl.parentElement);

    configs.push({
      rootEl,
      props: {
        dataURL,
        startVH: start || 0,
        endVH: end || 0
      }
    });
  });

  render();
}

if (window.__ODYSSEY__) {
  init();
} else {
  window.addEventListener("odyssey:api", init);
}

if (module.hot) {
  module.hot.accept("./components/App", () => {
    try {
      render();
    } catch (err) {
      import("./components/ErrorBox").then(exports => {
        const ErrorBox = exports.default;
        root.appendChild(new ErrorBox({ error: err }).el);
      });
    }
  });
}

if (process.env.NODE_ENV === "development") {
  console.debug(`Public path: ${__webpack_public_path__}`);
}
