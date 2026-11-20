(() => {
  const loader = document.getElementById("pageLoader");
  if (!loader) return;

  const minimumDuration = 200;
  let startedAt = performance.now();
  let timer = null;
  let hiding = false;
  let documentLoaded = document.readyState === "complete";
  let pendingTasks = 0;

  function show() {
    window.clearTimeout(timer);
    hiding = false;
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
    if (hiding || !documentLoaded || pendingTasks > 0 || loader.hidden) return;
    hiding = true;

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
        hiding = false;
        return;
      }

      loader.classList.add("is-hiding");
      timer = window.setTimeout(() => {
        loader.hidden = true;
        loader.classList.remove("is-hiding");
        timer = null;
        hiding = false;
      }, fadeDuration);
    }, remaining);
  }

  // Page scripts register their initial data load here so the overlay stays
  // up until both the document and the page's data are ready.
  window.CatetinLoader = {
    hold() {
      pendingTasks += 1;
      show();
    },
    release() {
      pendingTasks = Math.max(0, pendingTasks - 1);
      hide();
    },
  };

  show();
  if (documentLoaded) {
    hide();
  } else {
    window.addEventListener(
      "load",
      () => {
        documentLoaded = true;
        hide();
      },
      { once: true },
    );
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
    hiding = false;
    pendingTasks = 0;
  });
})();
