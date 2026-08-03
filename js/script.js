(function () {
  "use strict";

  /* ------------------------------------------------------------------
     Nav bar : fond au scroll
     ------------------------------------------------------------------ */
  var nav = document.getElementById("siteNav");
  function onScrollNav() {
    if (window.scrollY > 40) {
      nav.classList.add("is-scrolled");
    } else {
      nav.classList.remove("is-scrolled");
    }
  }
  window.addEventListener("scroll", onScrollNav, { passive: true });
  onScrollNav();

  /* ------------------------------------------------------------------
     Révélation au scroll
     ------------------------------------------------------------------ */
  var revealTargets = document.querySelectorAll(
    ".journal-grid, .contact-grid, .social-inner"
  );
  revealTargets.forEach(function (el) {
    el.classList.add("reveal");
  });

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealTargets.forEach(function (el) {
      io.observe(el);
    });
  } else {
    revealTargets.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ------------------------------------------------------------------
     Lightbox : agrandir la page de soutiens
     ------------------------------------------------------------------ */
  var lightbox = document.getElementById("lightbox");
  var lightboxImage = document.getElementById("lightboxImage");
  var lightboxClose = document.getElementById("lightboxClose");
  var lightboxTrigger = document.querySelector("[data-open-lightbox]");
  var lastFocusedEl = null;

  function openLightbox() {
    lastFocusedEl = document.activeElement;
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    lightboxImage.classList.remove("is-zoomed");
    lightboxClose.focus();
  }

  function closeLightbox() {
    lightbox.hidden = true;
    document.body.style.overflow = "";
    lightboxImage.classList.remove("is-zoomed");
    if (lastFocusedEl && typeof lastFocusedEl.focus === "function") {
      lastFocusedEl.focus();
    }
  }

  if (lightboxTrigger) {
    lightboxTrigger.addEventListener("click", openLightbox);
  }
  lightboxClose.addEventListener("click", closeLightbox);

  // Clic sur l'image : zoom / dézoom
  lightboxImage.addEventListener("click", function () {
    lightboxImage.classList.toggle("is-zoomed");
  });

  // Clic en dehors de l'image (fond) : fermer
  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox || e.target.classList.contains("lightbox-scroll")) {
      closeLightbox();
    }
  });

  // Échap : fermer
  document.addEventListener("keydown", function (e) {
    if (!lightbox.hidden && e.key === "Escape") {
      closeLightbox();
    }
  });
})();
