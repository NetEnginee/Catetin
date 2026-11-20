(() => {
  const loader = document.getElementById("pageLoader");
  if (!loader) return;

  const minimumDuration = 200;
  let startedAt = performance.now();
  let timer = null;

  function show() {
    window.clearTimeout(timer);
    const shouldRestartAnimation =
      loader.hidden || loader.classList.contains("is-hiding");
    startedAt = performance.now();
    loader.hidden = false;
    if (shouldRestartAnimation) {
      loader.classList.remove("is-hiding");
      void loader.offsetWidth;
      loader.classList.add("is-showing");
    }
  }

  function hide() {
    const remaining = Math.max(
      0,
      minimumDuration - (performance.now() - startedAt),
    );
    timer = window.setTimeout(() => {
      loader.classList.remove("is-showing");
      const fadeDuration = window.matchMedia("(prefers-reduced-motion: reduce)")
        .matches
        ? 0
        : 120;
      if (fadeDuration === 0) {
        loader.hidden = true;
        loader.classList.remove("is-hiding");
        timer = null;
        return;
      }

      loader.classList.add("is-hiding");
      timer = window.setTimeout(() => {
        loader.hidden = true;
        loader.classList.remove("is-hiding");
        timer = null;
      }, fadeDuration);
    }, remaining);
  }

  show();
  if (document.readyState === "complete") {
    hide();
  } else {
    window.addEventListener("load", hide, { once: true });
  }

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest("a[href]");
    if (
      !link ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      link.hasAttribute("download") ||
      (link.target && link.target !== "_self")
    ) {
      return;
    }

    const destination = new URL(link.href, window.location.href);
    if (destination.origin !== window.location.origin) return;
    if (
      destination.pathname === window.location.pathname &&
      destination.search === window.location.search
    ) {
      return;
    }
    show();
  });

  document.addEventListener("submit", (event) => {
    if (event.defaultPrevented) return;
    const form = event.target;
    if (
      form instanceof HTMLFormElement &&
      (!form.target || form.target === "_self")
    ) {
      show();
    }
  });

  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    window.clearTimeout(timer);
    loader.hidden = true;
    loader.classList.remove("is-showing", "is-hiding");
    timer = null;
  });
})();
