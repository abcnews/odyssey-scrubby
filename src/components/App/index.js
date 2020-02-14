import linearScale from "simple-linear-scale";
import lottie from "lottie-web";
import styles from "./styles.css";

const SECONDS_PER_FLICK = 1.5;
const MAX_FLICK_DISTANCE = 750;

export default function App({ dataURL, startVH, endVH } = {}) {
  startVH = Math.max(
    0,
    Math.min(100, typeof startVH === "number" ? startVH : 100)
  );
  endVH = Math.max(0, Math.min(100, typeof endVH === "number" ? endVH : 100));

  const rootEl = (this.el = document.createElement("div"));

  this.el.className = styles.root;

  const animation = lottie.loadAnimation({
    autoplay: false,
    container: rootEl,
    loop: false,
    path: dataURL,
    renderer: "canvas",
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice"
    }
  });

  let parentBlockEl;
  let frameScale;
  let progressScale;
  let unclampedProgressScale;

  const updateFactors = () => {
    const viewportHeight = window.innerHeight;
    const { height } = parentBlockEl.getBoundingClientRect();
    const domain = [
      (startVH / 100) * viewportHeight,
      -height - (endVH / 100) * viewportHeight + viewportHeight
    ];

    frameScale = linearScale(domain, [0, animation.totalFrames - 1], true);
    progressScale = linearScale(domain, [0, 1], true);
    unclampedProgressScale = linearScale(domain, [0, 1]);

    animation.resize();
  };

  const updateProgress = () => {
    const { top } = parentBlockEl.getBoundingClientRect();
    const progress = progressScale(top);
    const frame = Math.round(progress * (animation.totalFrames - 1));

    animation.goToAndStop(frame, true);
  };

  const updateAll = () => {
    updateFactors();
    updateProgress();
  };

  const rootElMounted = new Promise(resolve => {
    (function check() {
      const _parentBlockEl = rootEl.closest(".Block");

      if (!_parentBlockEl) {
        return setTimeout(check, 100);
      }

      parentBlockEl = _parentBlockEl;
      resolve();
    })();
  });

  const animationDataReady = new Promise(resolve => {
    animation.addEventListener("data_ready", resolve);
  });

  Promise.all([rootElMounted, animationDataReady]).then(() => {
    const schedulerBasedUpdate = client =>
      (client.hasChanged ? updateAll : updateProgress)();

    window.__ODYSSEY__.scheduler.enqueue(updateAll);
    window.__ODYSSEY__.scheduler.subscribe(schedulerBasedUpdate);

    if (module.hot) {
      module.hot.dispose(() => {
        window.__ODYSSEY__.scheduler.unsubscribe(schedulerBasedUpdate);
      });
    }
  });
}
