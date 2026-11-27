// pwa.js - rende il sito installabile: manifest, colori della barra e service worker.
// Viene caricato da auth.js, quindi vale per tutte le pagine.
(function () {
  const head = document.head;
  const add = (tag, attrs) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    head.append(el);
  };

  if (!head.querySelector('link[rel="manifest"]')) add("link", { rel: "manifest", href: "manifest.webmanifest" });
  if (!head.querySelector('meta[name="theme-color"]')) add("meta", { name: "theme-color", content: "#7a2e1d" });
  add("meta", { name: "mobile-web-app-capable", content: "yes" });
  add("meta", { name: "apple-mobile-web-app-capable", content: "yes" });
  add("meta", { name: "apple-mobile-web-app-title", content: "Cronache" });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }
})();
