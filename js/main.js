(function () {
  "use strict";

  // ---- Модальное окно с формой лида ----
  var overlay = document.getElementById("lead-modal-overlay");
  var form = document.getElementById("lead-form");
  var submitBtn = document.getElementById("lead-form-submit");
  var errorBanner = document.getElementById("lead-form-error");

  function openModal() {
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  document.querySelectorAll("[data-open-lead-form]").forEach(function (btn) {
    btn.addEventListener("click", openModal);
  });

  document.querySelectorAll("[data-close-lead-form]").forEach(function (btn) {
    btn.addEventListener("click", closeModal);
  });

  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && overlay.classList.contains("open")) closeModal();
  });

  // ---- Валидация и отправка формы ----
  var validators = {
    name: function (v) {
      return v.trim().length >= 2;
    },
    phone: function (v) {
      return /^[+]?[\d\s().-]{10,}$/.test(v.trim());
    },
    contact: function (v) {
      var val = v.trim();
      return /^\S+@\S+\.\S+$/.test(val) || /^@?[a-zA-Z0-9_]{4,}$/.test(val);
    },
    position: function (v) {
      return v.trim().length >= 2;
    },
    company: function (v) {
      return v.trim().length >= 2;
    }
  };

  function validateField(name) {
    var wrapper = form.querySelector('[data-field="' + name + '"]');
    var input = wrapper.querySelector("input");
    var valid = validators[name](input.value);
    wrapper.classList.toggle("invalid", !valid);
    return valid;
  }

  Object.keys(validators).forEach(function (name) {
    var wrapper = form.querySelector('[data-field="' + name + '"]');
    var input = wrapper.querySelector("input");
    input.addEventListener("blur", function () {
      validateField(name);
    });
  });

  var privacyField = form.querySelector('[data-field="privacyConsent"]');

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    errorBanner.classList.remove("show");

    var allValid = Object.keys(validators).reduce(function (acc, name) {
      var ok = validateField(name);
      return acc && ok;
    }, true);

    var privacyChecked = form.privacyConsent.checked;
    privacyField.classList.toggle("invalid", !privacyChecked);
    allValid = allValid && privacyChecked;

    if (!allValid) {
      errorBanner.classList.add("show");
      return;
    }

    var leadData = {
      name: form.name.value.trim(),
      phone: form.phone.value.trim(),
      contact: form.contact.value.trim(),
      position: form.position.value.trim(),
      company: form.company.value.trim(),
      marketingConsent: form.marketingConsent.checked
    };

    submitBtn.disabled = true;
    submitBtn.textContent = "Отправляем...";

    var leadId = "lead_" + Date.now();
    leadData.leadId = leadId;

    fetch("/api/submit-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leadData)
    })
      .catch(function (err) {
        console.error("submit-lead failed", err);
      })
      .finally(function () {
        sessionStorage.setItem("leadData", JSON.stringify(leadData));
        window.location.href = "payment.html";
      });
  });

  // ---- Переключатель тарифов "месяц / год" ----
  var priceSwitch = document.getElementById("price-switch");
  if (priceSwitch) {
    var priceAmounts = document.querySelectorAll(".price-amount");

    function formatRub(n) {
      return Number(n).toLocaleString("ru-RU") + " ₽";
    }

    priceSwitch.addEventListener("click", function () {
      var annual = !priceSwitch.classList.contains("on");
      priceSwitch.classList.toggle("on", annual);
      priceSwitch.setAttribute("aria-pressed", annual ? "true" : "false");

      priceAmounts.forEach(function (el) {
        var value = annual ? el.getAttribute("data-annual") : el.getAttribute("data-monthly");
        el.textContent = formatRub(value);
        var note = el.closest(".card").querySelector(".plan-price-annual-note");
        note.textContent = annual ? "при оплате за год, 2 месяца в подарок" : "";
      });
    });
  }

  // ---- Демо ассистента: чипсы с вопросами ----
  var chips = document.querySelectorAll(".chip");
  var demoPanels = document.querySelectorAll(".demo-dialog");

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var target = chip.getAttribute("data-demo");

      chips.forEach(function (c) {
        c.classList.toggle("active", c === chip);
        c.setAttribute("aria-selected", c === chip ? "true" : "false");
      });

      demoPanels.forEach(function (panel) {
        panel.classList.toggle("active", panel.getAttribute("data-demo-panel") === target);
      });
    });
  });

  // ---- Плавное появление блоков при скролле ----
  var revealEls = document.querySelectorAll(
    ".vert-row, .stat, .core-panel, .pillars-band, .demo-wrap, .signal-cat, .step, .plan-card, .faq-item"
  );

  if ("IntersectionObserver" in window && revealEls.length) {
    revealEls.forEach(function (el) {
      el.classList.add("reveal");
    });

    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: "0px 0px -5% 0px" }
    );

    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });
  }
})();
