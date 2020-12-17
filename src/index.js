import './polyfills';
import * as acto from '@abcnews/alternating-case-to-object';
import { decode } from '@abcnews/base-36-props';
import { getMountValue, selectMounts } from '@abcnews/mount-utils';
import App from './components/App';

const configs = [];

function render() {
  configs.forEach(({ rootEl, props }) => {
    rootEl.removeChild(rootEl.firstChild);
    rootEl.appendChild(new App(props).el);
  });
}

function init() {
  selectMounts('scrubby').forEach(mountEl => {
    const blockEl = mountEl.closest('.Block');

    if (!blockEl) {
      return;
    }

    const rootEl = blockEl.querySelector('.Block-media');

    if (!rootEl) {
      return;
    }

    /*
      dataURL (and optional portraitDataURL) can be defined in the page in one
      of two ways:

      1) An element with `data-odyssey-scrubby-{id}` and
        `data-odyssey-scrubby-{id}-portrait` attributes, where {id} is the ID
        prop on the #scrubby mount, e.g.:

          <div data-mount id="scrubbyIDxyz"></div>
          ...
          <div
            data-odyssey-scrubby-xyz="{...}/landscape/data.json"
            data-odyssey-scrubby-xyz-portrait="{...}/portrait/data.json"
          ></div>

      2) A Base36 encoded object with dataURL & portraitDataURL props as the
        ENCODED prop on the #scrubby mount, e.g.:

          <div data-mount id="scrubbyENCODEDhfjghfds79ygfh3rgfhjgufds0g..."></div>

    */

    const { id, encoded, start, end } = acto(getMountValue(mountEl));

    if (!id && !encoded) {
      return;
    }

    let dataURL;
    let portraitDataURL;

    if (encoded) {
      try {
        ({ dataURL, portraitDataURL } = decode(encoded));
      } catch (err) {
        return console.error(err);
      }
    } else {
      const dataAttr = `data-odyssey-scrubby-${id}`;
      const dataEl = document.querySelector(`[${dataAttr}]`);

      if (!dataEl) {
        return;
      }

      dataURL = dataEl.getAttribute(dataAttr);
      portraitDataURL = dataEl.getAttribute(`${dataAttr}-portrait`);
    }

    if (!dataURL) {
      return;
    }

    if (portraitDataURL && window.innerWidth / window.innerHeight <= 0.75) {
      dataURL = portraitDataURL;
    }

    mountEl.parentElement.parentElement.removeChild(mountEl.parentElement);

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

function initAfterOtherOdysseyPlugins() {
  if (
    Array.from(document.querySelectorAll('script[src],.init-interactive')).filter(el =>
      el.getAttribute(el.tagName === 'SCRIPT' ? 'src' : 'data-scripts').match(/odyssey-/)
    ).length
  ) {
    // Give other Odyssey plugins a couple of seconds to initialise,
    // because [odyssey-scrubby] has the potential to massively delay
    // their asset loading, due to the sheer number of images we request
    return setTimeout(init, 2000);
  }

  init();
}

if (window.__ODYSSEY__) {
  initAfterOtherOdysseyPlugins();
} else {
  window.addEventListener('odyssey:api', initAfterOtherOdysseyPlugins);
}

if (module.hot) {
  module.hot.accept('./components/App', () => {
    try {
      render();
    } catch (err) {
      import('./components/ErrorBox').then(exports => {
        const ErrorBox = exports.default;
        root.appendChild(new ErrorBox({ error: err }).el);
      });
    }
  });
}

if (process.env.NODE_ENV === 'development') {
  console.debug(`Public path: ${__webpack_public_path__}`);
}
