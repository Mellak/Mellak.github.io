// Pill buttons (BibTeX toggle + copy), project popups, animated publication icons and toasts.
(function () {
  "use strict";

  // --- BibTeX toggle -------------------------------------------------------
  function syncExpanded(button) {
    var target = document.getElementById(button.getAttribute("data-bibtex-toggle"));
    if (target) button.setAttribute("aria-expanded", target.hidden ? "false" : "true");
  }

  document.querySelectorAll("[data-bibtex-toggle]").forEach(function (button) {
    syncExpanded(button);
    button.addEventListener("click", function (event) {
      event.stopPropagation();
      var target = document.getElementById(button.getAttribute("data-bibtex-toggle"));
      if (!target) return;
      target.hidden = !target.hidden;
      syncExpanded(button);
      if (!target.hidden && target.closest(".project-dialog")) {
        target.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    });
  });

  // --- BibTeX copy ----------------------------------------------------------
  document.querySelectorAll(".bibtex-copy").forEach(function (button) {
    button.addEventListener("click", function (event) {
      event.stopPropagation();
      var code = button.parentElement.querySelector("pre code") || button.parentElement.querySelector("pre");
      if (!code || !navigator.clipboard) return;
      navigator.clipboard.writeText(code.innerText.trim()).then(function () {
        var label = button.querySelector("span");
        var icon = button.querySelector("i");
        label.textContent = "Copied";
        icon.className = "fa-solid fa-check";
        setTimeout(function () {
          label.textContent = "Copy";
          icon.className = "fa-solid fa-clipboard";
        }, 1500);
      });
    });
  });

  // --- Project popups -------------------------------------------------------
  var openDialog = null;
  var returnFocusTo = null;
  var FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input, select, textarea';

  function dialogFor(id) {
    var dialog = document.getElementById("project-" + id);
    return dialog && dialog.tagName === "DIALOG" ? dialog : null;
  }

  function clearHash() {
    if (window.location.hash) history.replaceState(null, "", window.location.pathname + window.location.search);
  }

  function open(id, opener) {
    var dialog = dialogFor(id);
    if (!dialog || typeof dialog.showModal !== "function") return false;
    if (openDialog && openDialog !== dialog) openDialog.close();
    if (!dialog.open) {
      returnFocusTo = opener || document.querySelector('.pub-icon[data-project-open="' + id + '"]') || null;
      dialog.showModal();
      dialog.scrollTop = 0;
      document.body.classList.add("project-dialog-open");
      openDialog = dialog;
      var close = dialog.querySelector("[data-project-close]");
      if (close) close.focus();
    }
    if (window.location.hash !== "#" + id) history.replaceState(null, "", "#" + id);
    return true;
  }

  document.querySelectorAll("dialog.project-dialog").forEach(function (dialog) {
    dialog.addEventListener("close", function () {
      document.body.classList.remove("project-dialog-open");
      if (openDialog === dialog) openDialog = null;
      clearHash();
      if (returnFocusTo && document.contains(returnFocusTo)) returnFocusTo.focus();
      returnFocusTo = null;
    });
    // Backdrop click: the click lands on the <dialog> itself, outside its content box.
    dialog.addEventListener("click", function (event) {
      if (event.target !== dialog) return;
      var r = dialog.getBoundingClientRect();
      var inside = event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom;
      if (!inside || (event.clientX === 0 && event.clientY === 0)) dialog.close();
    });
    dialog.querySelector("[data-project-close]").addEventListener("click", function () {
      dialog.close();
    });
    // Keep keyboard focus inside the popup.
    dialog.addEventListener("keydown", function (event) {
      if (event.key !== "Tab") return;
      var items = Array.prototype.filter.call(dialog.querySelectorAll(FOCUSABLE), function (el) {
        return el.offsetParent !== null || el === document.activeElement;
      });
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  });

  // Icons, links and buttons that open a popup; fall back to navigating to /publications/#id.
  document.querySelectorAll("[data-project-open]").forEach(function (link) {
    link.addEventListener("click", function (event) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button === 1) return;
      if (open(link.getAttribute("data-project-open"), link)) {
        event.preventDefault();
        event.stopPropagation();
      }
    });
  });

  function openFromHash() {
    var id = decodeURIComponent(window.location.hash.slice(1));
    if (id && dialogFor(id)) open(id);
  }
  window.addEventListener("hashchange", openFromHash);
  openFromHash();

  // --- Toast notification (e.g. CV page without a PDF) ----------------------
  var toast = document.querySelector(".site-toast");
  var toastTimer = null;
  document.querySelectorAll("[data-toast]").forEach(function (button) {
    button.addEventListener("click", function () {
      if (!toast) return;
      toast.textContent = button.getAttribute("data-toast");
      toast.hidden = false;
      toast.classList.add("is-visible");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () {
        toast.classList.remove("is-visible");
        toastTimer = setTimeout(function () {
          toast.hidden = true;
        }, 250);
      }, 3500);
    });
  });

  // --- Animated icons: play only while on screen, never with reduced motion --
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  var icons = document.querySelectorAll(".project-icon");
  if (icons.length && "IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          entry.target.classList.toggle("is-playing", entry.isIntersecting && !(reduce && reduce.matches));
        });
      },
      { threshold: 0.1 }
    );
    icons.forEach(function (icon) {
      observer.observe(icon);
    });
    if (reduce && reduce.addEventListener) {
      reduce.addEventListener("change", function () {
        if (reduce.matches) icons.forEach(function (icon) {
          icon.classList.remove("is-playing");
        });
      });
    }
  }
})();
