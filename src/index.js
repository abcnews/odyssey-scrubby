import "./polyfills";
import * as acto from "@abcnews/alternating-case-to-object";
import App from "./components/App";

const configs = [];

const MARKER_NAME = "scrubby";

function render() {
  configs.forEach(({ rootEl, props }) => {
    rootEl.removeChild(rootEl.firstChild);
    rootEl.appendChild(new App(props).el);
  });
}

function init() {
  [...document.querySelectorAll(`a[name^="${MARKER_NAME}"]`)].forEach(
    markerEl => {
      const blockEl = markerEl.closest(".Block");

      if (!blockEl) {
        return;
      }

      const rootEl = blockEl.querySelector(".Block-media");

      if (!rootEl) {
        return;
      }

      const { id, start, end } = acto(
        markerEl.getAttribute("name").slice(MARKER_NAME.length)
      );

      if (!id) {
        return;
      }

      const dataAttr = `data-odyssey-scrubby-${id}`;

      const dataEl = document.querySelector(`[${dataAttr}]`);

      if (!dataEl) {
        return;
      }

      let dataURL = dataEl.getAttribute(dataAttr);

      if (!dataURL) {
        return;
      }

      const portraitDataURL = dataEl.getAttribute(`${dataAttr}-portrait`);

      if (portraitDataURL && window.innerWidth / window.innerHeight <= 0.75) {
        dataURL = portraitDataURL;
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
    }
  );

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
