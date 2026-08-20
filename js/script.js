(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
     Carrousel hero (deux photos)
     ------------------------------------------------------------------ */
  var carousel = document.getElementById("heroCarousel");
  if (carousel) {
    var slides = carousel.querySelectorAll(".hero-slide");
    var dots = carousel.querySelectorAll(".hero-dot");
    var current = 0;
    var timer = null;
    var DELAY = 3000;

    function goToSlide(index) {
      slides[current].classList.remove("is-active");
      dots[current].classList.remove("is-active");
      dots[current].setAttribute("aria-selected", "false");
      current = index;
      slides[current].classList.add("is-active");
      dots[current].classList.add("is-active");
      dots[current].setAttribute("aria-selected", "true");
    }

    function nextSlide() {
      goToSlide((current + 1) % slides.length);
    }

    function startAutoplay() {
      if (reduceMotion || slides.length < 2) return;
      stopAutoplay();
      timer = setInterval(nextSlide, DELAY);
    }

    function stopAutoplay() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        var idx = parseInt(dot.getAttribute("data-go-to"), 10);
        if (idx !== current) goToSlide(idx);
        startAutoplay();
      });
    });

    carousel.addEventListener("mouseenter", stopAutoplay);
    carousel.addEventListener("mouseleave", startAutoplay);
    carousel.addEventListener("focusin", stopAutoplay);
    carousel.addEventListener("focusout", startAutoplay);

    startAutoplay();
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
