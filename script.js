"use strict";

/* ========================================
   KONFIGURASI INFORMASI KYO

   Isi hanya dengan informasi yang benar.
   Kolom kosong otomatis disembunyikan.
======================================== */

const KYO_CONFIG = Object.freeze({
  address: "",
  hours: "",
  whatsapp: "",
  maps: "",

  instagram: "https://www.instagram.com/kyocoffee.id",
  tiktok: "https://www.tiktok.com/@arfvnnn1"
});

/* ========================================
   WEBSITE INITIALIZATION
======================================== */

(() => {
  const root = document.documentElement;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  const header = document.querySelector(".site-header");
  const menuButton = document.querySelector(".menu-toggle");
  const navDialog = document.querySelector("#navigation-dialog");
  const lightbox = document.querySelector("#lightbox");

  const supportsDialog =
    navDialog &&
    lightbox &&
    typeof navDialog.showModal === "function" &&
    typeof lightbox.showModal === "function";

  let menuClosingTimer;
  let menuDestination = null;

  let lightboxOpener = null;
  let activePhotos = [];
  let activePhotoIndex = 0;

  let touchStart = null;

  /* ========================================
     COFFEE LOADING
  ======================================== */

  function initializeLoader() {
    const started =
      window.KYO_LOADING_STARTED || performance.now();

    const minimumDuration = reduceMotion.matches
      ? 180
      : 1650;

    function finishLoading() {
      if (
        typeof window.KYO_RELEASE_LOADER === "function"
      ) {
        window.KYO_RELEASE_LOADER();
      } else {
        root.classList.remove("is-loading");
        root.classList.add("loader-complete");
      }
    }

    function releaseWhenReady() {
      const elapsed = performance.now() - started;

      const remaining = Math.max(
        0,
        minimumDuration - elapsed
      );

      window.setTimeout(
        finishLoading,
        remaining
      );
    }

    const heroImage = document.querySelector(
      "#hero-image"
    );

    /*
      Pengaman: halaman tetap dibuka walaupun
      gambar hero gagal atau terlalu lama dimuat.
    */
    window.setTimeout(
      finishLoading,
      reduceMotion.matches ? 500 : 2800
    );

    if (!heroImage || heroImage.complete) {
      releaseWhenReady();
      return;
    }

    heroImage.addEventListener(
      "load",
      releaseWhenReady,
      { once: true }
    );

    heroImage.addEventListener(
      "error",
      releaseWhenReady,
      { once: true }
    );
  }

  initializeLoader();

  /* ========================================
     SCROLL LOCK
  ======================================== */

  function syncScrollLock() {
    const hasOpenDialog = Boolean(
      document.querySelector("dialog[open]")
    );

    root.classList.toggle(
      "modal-open",
      hasOpenDialog
    );
  }

  function focusDestination(target) {
    if (!target) return;

    if (!target.hasAttribute("tabindex")) {
      target.setAttribute("tabindex", "-1");
    }

    target.focus({
      preventScroll: true
    });
  }

  /* ========================================
     MOBILE NAVIGATION
  ======================================== */

  function openNavigation() {
    if (!supportsDialog || navDialog.open) {
      return;
    }

    window.clearTimeout(menuClosingTimer);

    menuDestination = null;

    navDialog.classList.remove("is-closing");

    menuButton.setAttribute(
      "aria-expanded",
      "true"
    );

    navDialog.showModal();

    syncScrollLock();

    const closeButton = navDialog.querySelector(
      "[data-menu-close]"
    );

    if (closeButton) {
      closeButton.focus();
    }
  }

  function closeNavigation(
    destination = null,
    immediate = false
  ) {
    if (!navDialog || !navDialog.open) {
      return;
    }

    menuDestination = destination;

    window.clearTimeout(menuClosingTimer);

    navDialog.classList.add("is-closing");

    menuButton.setAttribute(
      "aria-expanded",
      "false"
    );

    function finishClosing() {
      if (navDialog.open) {
        navDialog.close();
      }

      navDialog.classList.remove("is-closing");
    }

    if (immediate || reduceMotion.matches) {
      finishClosing();
    } else {
      menuClosingTimer = window.setTimeout(
        finishClosing,
        220
      );
    }
  }

  if (supportsDialog && menuButton) {
    menuButton.addEventListener(
      "click",
      openNavigation
    );

    const closeMenuButton = navDialog.querySelector(
      "[data-menu-close]"
    );

    if (closeMenuButton) {
      closeMenuButton.addEventListener(
        "click",
        () => closeNavigation()
      );
    }

    /*
      Escape menutup navigasi dengan animasi.
    */
    navDialog.addEventListener(
      "cancel",
      (event) => {
        event.preventDefault();
        closeNavigation();
      }
    );

    navDialog.addEventListener(
      "close",
      () => {
        menuButton.setAttribute(
          "aria-expanded",
          "false"
        );

        syncScrollLock();

        if (menuDestination) {
          const destination = menuDestination;

          menuDestination = null;

          destination.scrollIntoView({
            behavior: reduceMotion.matches
              ? "auto"
              : "smooth",

            block: "start"
          });

          focusDestination(destination);
        } else {
          menuButton.focus({
            preventScroll: true
          });
        }
      }
    );

    const mobileLinks = navDialog.querySelectorAll(
      'a[href^="#"]'
    );

    mobileLinks.forEach((link) => {
      link.addEventListener(
        "click",
        (event) => {
          const href = link.getAttribute("href");

          if (!href) return;

          const id = href.slice(1);

          const destination =
            document.getElementById(id);

          if (!destination) return;

          event.preventDefault();

          try {
            history.replaceState(
              null,
              "",
              `#${id}`
            );
          } catch {
            /*
              Preview lokal tertentu membatasi
              perubahan URL. Navigasi tetap berjalan.
            */
          }

          closeNavigation(destination);
        }
      );
    });

    /*
      Tutup panel ketika ukuran layar
      kembali ke tampilan desktop.
    */
    const desktopBreakpoint = window.matchMedia(
      "(min-width: 1101px)"
    );

    function handleDesktopBreakpoint(event) {
      if (event.matches) {
        closeNavigation(null, true);
      }
    }

    if (desktopBreakpoint.addEventListener) {
      desktopBreakpoint.addEventListener(
        "change",
        handleDesktopBreakpoint
      );
    } else if (desktopBreakpoint.addListener) {
      desktopBreakpoint.addListener(
        handleDesktopBreakpoint
      );
    }
  } else {
    /*
      Browser tanpa dukungan dialog memakai
      navigasi HTML biasa yang tetap terlihat.
    */
    root.classList.remove("has-js");
  }

  /* ========================================
     HEADER SCROLL STATE
  ======================================== */

  let scrollScheduled = false;

  function updateHeader() {
    if (header) {
      header.classList.toggle(
        "is-scrolled",
        window.scrollY > 36
      );
    }

    scrollScheduled = false;
  }

  updateHeader();

  window.addEventListener(
    "scroll",
    () => {
      if (scrollScheduled) return;

      scrollScheduled = true;

      requestAnimationFrame(updateHeader);
    },
    { passive: true }
  );

  /* ========================================
     MENU SELECTION
  ======================================== */

  const selection = document.querySelector(
    "#selection"
  );

  function openSelection() {
    if (selection) {
      selection.open = true;
    }
  }

  document
    .querySelectorAll('a[href="#selection"]')
    .forEach((link) => {
      link.addEventListener(
        "click",
        openSelection
      );
    });

  if (window.location.hash === "#selection") {
    openSelection();
  }

  window.addEventListener(
    "hashchange",
    () => {
      if (
        window.location.hash === "#selection"
      ) {
        openSelection();
      }
    }
  );

  /* ========================================
     PHOTO LIGHTBOX
  ======================================== */

  const photos = Array.from(
    document.querySelectorAll(
      "a[data-lightbox]"
    )
  );

  const largeImage = lightbox
    ? lightbox.querySelector(".lightbox-image")
    : null;

  const caption = lightbox
    ? lightbox.querySelector(".lightbox-caption")
    : null;

  const count = lightbox
    ? lightbox.querySelector(".lightbox-count")
    : null;

  const imageError = lightbox
    ? lightbox.querySelector(".lightbox-error")
    : null;

  const previousButton = lightbox
    ? lightbox.querySelector(
        "[data-lightbox-prev]"
      )
    : null;

  const nextButton = lightbox
    ? lightbox.querySelector(
        "[data-lightbox-next]"
      )
    : null;

  const closeLightboxButton = lightbox
    ? lightbox.querySelector(
        "[data-lightbox-close]"
      )
    : null;

  function renderPhoto() {
    const photo = activePhotos[
      activePhotoIndex
    ];

    if (
      !photo ||
      !largeImage ||
      !caption ||
      !count
    ) {
      return;
    }

    const thumbnail = photo.querySelector("img");

    const title =
      photo.dataset.caption ||
      (thumbnail ? thumbnail.alt : "") ||
      "KYO Coffee Shop";

    const imageSource = photo.getAttribute(
      "href"
    );

    if (imageError) {
      imageError.hidden = true;

      const originalLink =
        imageError.querySelector("a");

      if (originalLink) {
        originalLink.href = imageSource;
      }
    }

    largeImage.hidden = false;

    largeImage.alt = thumbnail
      ? thumbnail.alt
      : title;

    largeImage.src = imageSource;

    caption.textContent = title;

    const currentNumber = String(
      activePhotoIndex + 1
    ).padStart(2, "0");

    const totalNumber = String(
      activePhotos.length
    ).padStart(2, "0");

    count.textContent =
      `${currentNumber} / ${totalNumber}`;

    const hasMultiplePhotos =
      activePhotos.length > 1;

    if (previousButton) {
      previousButton.disabled =
        !hasMultiplePhotos;
    }

    if (nextButton) {
      nextButton.disabled =
        !hasMultiplePhotos;
    }
  }

  function stepPhoto(direction) {
    if (activePhotos.length < 2) {
      return;
    }

    activePhotoIndex =
      (
        activePhotoIndex +
        direction +
        activePhotos.length
      ) % activePhotos.length;

    renderPhoto();
  }

  if (
    supportsDialog &&
    largeImage &&
    closeLightboxButton
  ) {
    photos.forEach((photo) => {
      photo.addEventListener(
        "click",
        (event) => {
          /*
            Pertahankan perilaku bawaan browser
            untuk membuka link di tab baru.
          */
          if (
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
          ) {
            return;
          }

          event.preventDefault();

          lightboxOpener = photo;

          activePhotos = photos.filter(
            (candidate) => {
              return (
                candidate.dataset.group ===
                photo.dataset.group
              );
            }
          );

          activePhotoIndex =
            activePhotos.indexOf(photo);

          renderPhoto();

          lightbox.showModal();

          syncScrollLock();

          closeLightboxButton.focus();
        }
      );
    });

    closeLightboxButton.addEventListener(
      "click",
      () => {
        lightbox.close();
      }
    );

    if (previousButton) {
      previousButton.addEventListener(
        "click",
        () => stepPhoto(-1)
      );
    }

    if (nextButton) {
      nextButton.addEventListener(
        "click",
        () => stepPhoto(1)
      );
    }

    lightbox.addEventListener(
      "close",
      () => {
        syncScrollLock();

        if (lightboxOpener) {
          lightboxOpener.focus({
            preventScroll: true
          });
        }

        touchStart = null;
      }
    );

    /*
      Navigasi keyboard.
      Escape ditangani oleh dialog native.
    */
    lightbox.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          stepPhoto(-1);
        }

        if (event.key === "ArrowRight") {
          event.preventDefault();
          stepPhoto(1);
        }
      }
    );

    /*
      Klik area kosong untuk menutup lightbox.
    */
    lightbox.addEventListener(
      "click",
      (event) => {
        const clickedEmptyArea =
          event.target === lightbox ||
          event.target.classList.contains(
            "lightbox-figure"
          );

        if (clickedEmptyArea) {
          lightbox.close();
        }
      }
    );

    /*
      Pesan apabila gambar gagal dimuat.
    */
    largeImage.addEventListener(
      "error",
      () => {
        largeImage.hidden = true;

        if (imageError) {
          imageError.hidden = false;
        }
      }
    );

    largeImage.addEventListener(
      "load",
      () => {
        largeImage.hidden = false;

        if (imageError) {
          imageError.hidden = true;
        }
      }
    );

    /* Swipe untuk smartphone */
    lightbox.addEventListener(
      "touchstart",
      (event) => {
        if (event.touches.length !== 1) {
          touchStart = null;
          return;
        }

        touchStart = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY
        };
      },
      { passive: true }
    );

    lightbox.addEventListener(
      "touchend",
      (event) => {
        if (
          !touchStart ||
          !event.changedTouches.length
        ) {
          return;
        }

        const touch = event.changedTouches[0];

        const differenceX =
          touch.clientX - touchStart.x;

        const differenceY =
          touch.clientY - touchStart.y;

        const isHorizontalSwipe =
          Math.abs(differenceX) > 55 &&
          Math.abs(differenceX) >
            Math.abs(differenceY) * 1.4;

        if (isHorizontalSwipe) {
          stepPhoto(
            differenceX > 0 ? -1 : 1
          );
        }

        touchStart = null;
      },
      { passive: true }
    );

    lightbox.addEventListener(
      "touchcancel",
      () => {
        touchStart = null;
      },
      { passive: true }
    );
  }

  /* ========================================
     SCROLL REVEAL
  ======================================== */

  function initializeReveal() {
    const items = document.querySelectorAll(
      ".reveal"
    );

    if (
      reduceMotion.matches ||
      !("IntersectionObserver" in window)
    ) {
      return;
    }

    try {
      const observer =
        new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) {
                return;
              }

              entry.target.classList.add(
                "is-visible"
              );

              observer.unobserve(
                entry.target
              );
            });
          },
          {
            threshold: 0.08,
            rootMargin:
              "0px 0px -25px 0px"
          }
        );

      root.classList.add("reveal-ready");

      items.forEach((item) => {
        observer.observe(item);
      });

      function handleMotionPreference(event) {
        if (!event.matches) return;

        root.classList.remove(
          "reveal-ready"
        );

        observer.disconnect();
      }

      if (reduceMotion.addEventListener) {
        reduceMotion.addEventListener(
          "change",
          handleMotionPreference
        );
      }
    } catch {
      /*
        Konten tetap terlihat bila observer
        tidak dapat diinisialisasi.
      */
      root.classList.remove(
        "reveal-ready"
      );
    }
  }

  initializeReveal();

  /* ========================================
     ACTIVE NAVIGATION
  ======================================== */

  if ("IntersectionObserver" in window) {
    const navigationLinks =
      document.querySelectorAll(
        ".desktop-nav a"
      );

    const sectionObserver =
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }

            const activeTarget =
              `#${entry.target.id}`;

            navigationLinks.forEach(
              (link) => {
                const isActive =
                  link.getAttribute("href") ===
                  activeTarget;

                if (isActive) {
                  link.setAttribute(
                    "aria-current",
                    "location"
                  );
                } else {
                  link.removeAttribute(
                    "aria-current"
                  );
                }
              }
            );
          });
        },
        {
          rootMargin:
            "-15% 0px -60% 0px",
          threshold: 0
        }
      );

    document
      .querySelectorAll(
        "main > section[id]"
      )
      .forEach((section) => {
        sectionObserver.observe(section);
      });
  }

  /* ========================================
     BUSINESS INFORMATION
  ======================================== */

  function initializeBusinessInfo() {
    const container =
      document.querySelector(
        "#business-info"
      );

    function addText(label, value) {
      if (
        !container ||
        typeof value !== "string" ||
        !value.trim()
      ) {
        return;
      }

      const paragraph =
        document.createElement("p");

      const title =
        document.createElement("strong");

      title.textContent = label;

      paragraph.append(
        title,
        document.createTextNode(
          value.trim()
        )
      );

      container.append(paragraph);
    }

    function addLink(label, url) {
      if (!container) return;

      const link =
        document.createElement("a");

      link.textContent = label;
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      container.append(link);
    }

    addText(
      "Find us",
      KYO_CONFIG.address
    );

    addText(
      "Opening hours",
      KYO_CONFIG.hours
    );

    /*
      Nomor WhatsApp:
      angka internasional tanpa tanda +,
      spasi, atau tanda hubung.
    */
    const validWhatsApp =
      /^[1-9]\d{7,14}$/.test(
        KYO_CONFIG.whatsapp
      );

    if (validWhatsApp) {
      addLink(
        "Chat on WhatsApp ↗",
        `https://wa.me/${KYO_CONFIG.whatsapp}`
      );
    }

    /*
      Tampilkan Maps hanya jika URL HTTPS
      memakai domain Google yang dikenali.
    */
    if (KYO_CONFIG.maps) {
      try {
        const mapsUrl = new URL(
          KYO_CONFIG.maps
        );

        const allowedDomains = [
          "maps.google.com",
          "www.google.com",
          "google.com",
          "maps.app.goo.gl",
          "goo.gl"
        ];

        const isValidMapsUrl =
          mapsUrl.protocol === "https:" &&
          allowedDomains.includes(
            mapsUrl.hostname
          );

        if (isValidMapsUrl) {
          addLink(
            "Open Google Maps ↗",
            mapsUrl.href
          );
        }
      } catch {
        /*
          URL tidak valid tetap
          disembunyikan.
        */
      }
    }

    if (container) {
      container.hidden =
        container.children.length === 0;
    }

    /*
      Samakan seluruh tautan sosial
      dengan konfigurasi utama.
    */
    document
      .querySelectorAll(
        '[data-social="instagram"]'
      )
      .forEach((link) => {
        link.href =
          KYO_CONFIG.instagram;
      });

    document
      .querySelectorAll(
        '[data-social="tiktok"]'
      )
      .forEach((link) => {
        link.href =
          KYO_CONFIG.tiktok;
      });
  }

  initializeBusinessInfo();

  /* ========================================
     AUTOMATIC COPYRIGHT YEAR
  ======================================== */

  const currentYear =
    String(new Date().getFullYear());

  document
    .querySelectorAll("[data-year]")
    .forEach((element) => {
      element.textContent =
        currentYear;
    });

  /* ========================================
     BACK / FORWARD CACHE
  ======================================== */

  window.addEventListener(
    "pageshow",
    (event) => {
      if (!event.persisted) {
        return;
      }

      /*
        Kembali melalui tombol browser
        bukan pemuatan penuh halaman.
      */
      if (
        typeof window.KYO_RELEASE_LOADER ===
        "function"
      ) {
        window.KYO_RELEASE_LOADER();
      }

      if (
        supportsDialog &&
        navDialog.open
      ) {
        closeNavigation(null, true);
      }

      if (
        supportsDialog &&
        lightbox.open
      ) {
        lightbox.close();
      }

      syncScrollLock();
      updateHeader();
    }
  );
})();