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
     Journal de campagne — petit livre (feuilletage) + lecteur plein écran
     ------------------------------------------------------------------ */
  (function () {
    var book = document.querySelector('[data-fb-book]');
    if (!book) return;

    var pages = Array.prototype.slice.call(book.querySelectorAll('.fb-page'));
    var total = pages.length;
    var fbCurrent = 0;
    var animating = false;
    var TRANSITION_MS = 700;

    var btnPrev = document.querySelector('[data-fb-prev]');
    var btnNext = document.querySelector('[data-fb-next]');
    var counter = document.querySelector('[data-fb-count]');
    var btnZoom = document.querySelector('[data-fb-zoom]');
    var btnReadAlt = document.querySelector('[data-fb-zoom-alt]');

    pages.forEach(function (p, i) { p.style.zIndex = String(total - i); });

    function updateUI() {
      if (counter) counter.textContent = (fbCurrent + 1) + ' / ' + total;
      if (btnPrev) btnPrev.disabled = fbCurrent === 0;
      if (btnNext) btnNext.disabled = fbCurrent === total - 1;
      if (typeof syncReaderToCurrentPage === 'function') syncReaderToCurrentPage();
    }

    function fbGoNext() {
      if (animating || fbCurrent >= total - 1) return;
      animating = true;
      var page = pages[fbCurrent];
      page.classList.add('is-turning');
      void page.offsetWidth;
      page.classList.add('is-flipped');
      fbCurrent++;
      updateUI();
      setTimeout(function () {
        page.classList.remove('is-turning');
        animating = false;
      }, TRANSITION_MS);
    }

    function fbGoPrev() {
      if (animating || fbCurrent <= 0) return;
      animating = true;
      fbCurrent--;
      var page = pages[fbCurrent];
      page.classList.add('is-turning');
      void page.offsetWidth;
      page.classList.remove('is-flipped');
      updateUI();
      setTimeout(function () {
        page.classList.remove('is-turning');
        animating = false;
      }, TRANSITION_MS);
    }

    if (btnNext) btnNext.addEventListener('click', function (e) { e.stopPropagation(); fbGoNext(); });
    if (btnPrev) btnPrev.addEventListener('click', function (e) { e.stopPropagation(); fbGoPrev(); });

    book.addEventListener('click', function (e) {
      var rect = book.getBoundingClientRect();
      var clickX = e.clientX - rect.left;
      if (clickX > rect.width / 2) fbGoNext(); else fbGoPrev();
    });

    var touchStartX = 0;
    book.addEventListener('touchstart', function (e) { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
    book.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].screenX - touchStartX;
      if (Math.abs(dx) < 40) return;
      if (dx < 0) fbGoNext(); else fbGoPrev();
    }, { passive: true });

    /* --------------------------------------------------------------
       Lecteur plein écran : grosses flèches, zoom par paliers (+ / −),
       déplacement en cliquant-glissant (comme sur une carte), et
       défilement tactile natif sur mobile/tablette.
       -------------------------------------------------------------- */
    var reader = document.getElementById('reader');
    var readerImage = document.getElementById('readerImage');
    var readerViewport = document.getElementById('readerViewport');
    var readerClose = document.getElementById('readerClose');
    var readerPrev = document.getElementById('readerPrev');
    var readerNext = document.getElementById('readerNext');
    var readerZoomIn = document.getElementById('readerZoomIn');
    var readerZoomOut = document.getElementById('readerZoomOut');
    var readerPageCount = document.getElementById('readerPageCount');

    var ZOOM_STEPS = [100, 140, 180, 220, 260]; // % de la hauteur du lecteur
    var zoomIndex = 0;
    var lastFocusedEl = null;

    function updateReaderUI() {
      if (readerPageCount) readerPageCount.textContent = (fbCurrent + 1) + ' / ' + total;
      if (readerPrev) readerPrev.disabled = fbCurrent === 0;
      if (readerNext) readerNext.disabled = fbCurrent === total - 1;
      if (readerZoomIn) readerZoomIn.disabled = zoomIndex === ZOOM_STEPS.length - 1;
      if (readerZoomOut) readerZoomOut.disabled = zoomIndex === 0;
      if (readerImage) readerImage.style.height = ZOOM_STEPS[zoomIndex] + '%';
    }

    function syncReaderToCurrentPage() {
      if (!reader || reader.hidden || !readerImage) return;
      var img = pages[fbCurrent].querySelector('img');
      if (img) {
        readerImage.src = img.src;
        readerImage.alt = img.alt;
      }
      zoomIndex = 0;
      if (readerViewport) { readerViewport.scrollLeft = 0; readerViewport.scrollTop = 0; }
      updateReaderUI();
    }

    function openReader() {
      if (!reader) return;
      lastFocusedEl = document.activeElement;
      var img = pages[fbCurrent].querySelector('img');
      if (img && readerImage) {
        readerImage.src = img.src;
        readerImage.alt = img.alt;
      }
      zoomIndex = 0;
      reader.hidden = false;
      document.body.style.overflow = 'hidden';
      if (readerViewport) { readerViewport.scrollLeft = 0; readerViewport.scrollTop = 0; }
      updateReaderUI();
      if (readerClose) readerClose.focus();
    }

    function closeReader() {
      if (!reader) return;
      reader.hidden = true;
      document.body.style.overflow = '';
      if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') lastFocusedEl.focus();
    }

    if (btnZoom) btnZoom.addEventListener('click', function (e) { e.stopPropagation(); openReader(); });
    if (btnReadAlt) btnReadAlt.addEventListener('click', openReader);
    if (readerClose) readerClose.addEventListener('click', closeReader);

    if (readerNext) readerNext.addEventListener('click', function () { fbGoNext(); });
    if (readerPrev) readerPrev.addEventListener('click', function () { fbGoPrev(); });

    if (readerZoomIn) {
      readerZoomIn.addEventListener('click', function () {
        if (zoomIndex < ZOOM_STEPS.length - 1) { zoomIndex++; updateReaderUI(); }
      });
    }
    if (readerZoomOut) {
      readerZoomOut.addEventListener('click', function () {
        if (zoomIndex > 0) { zoomIndex--; updateReaderUI(); }
        if (zoomIndex === 0 && readerViewport) { readerViewport.scrollLeft = 0; readerViewport.scrollTop = 0; }
      });
    }

    // Cliquer-glisser à la souris pour se déplacer dans la page zoomée
    // (le défilement tactile natif fonctionne déjà seul sur mobile/tablette)
    if (readerViewport) {
      var isDragging = false;
      var dragStartX = 0, dragStartY = 0, startScrollLeft = 0, startScrollTop = 0;

      readerViewport.addEventListener('mousedown', function (e) {
        isDragging = true;
        readerViewport.classList.add('is-dragging');
        dragStartX = e.pageX;
        dragStartY = e.pageY;
        startScrollLeft = readerViewport.scrollLeft;
        startScrollTop = readerViewport.scrollTop;
      });
      window.addEventListener('mousemove', function (e) {
        if (!isDragging) return;
        e.preventDefault();
        readerViewport.scrollLeft = startScrollLeft - (e.pageX - dragStartX);
        readerViewport.scrollTop = startScrollTop - (e.pageY - dragStartY);
      });
      window.addEventListener('mouseup', function () {
        isDragging = false;
        readerViewport.classList.remove('is-dragging');
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') fbGoNext();
      if (e.key === 'ArrowLeft') fbGoPrev();
      if (reader && !reader.hidden && e.key === 'Escape') closeReader();
    });

    if (reader) {
      reader.addEventListener('click', function (e) {
        if (e.target === reader) closeReader();
      });
    }

    updateUI();
  })();
})();
