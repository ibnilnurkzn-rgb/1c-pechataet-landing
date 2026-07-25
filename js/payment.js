(function () {
  "use strict";

  var leadData = {};
  try {
    leadData = JSON.parse(sessionStorage.getItem("leadData")) || {};
  } catch (e) {
    leadData = {};
  }

  var nameEl = document.getElementById("payment-lead-name");
  if (leadData.name) {
    nameEl.textContent = leadData.name;
  }

  var payButton = document.getElementById("pay-button");
  var errorBanner = document.getElementById("payment-error");
  var beforeEl = document.getElementById("payment-before");
  var afterEl = document.getElementById("payment-after");

  payButton.addEventListener("click", function () {
    errorBanner.classList.remove("show");
    payButton.disabled = true;
    payButton.textContent = "Отправляем...";

    fetch("/api/notify-interest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leadData)
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok || !data.ok) throw new Error(data.error || "notify failed");
          return data;
        });
      })
      .then(function () {
        beforeEl.style.display = "none";
        afterEl.style.display = "block";
      })
      .catch(function (err) {
        console.error("notify-interest failed", err);
        errorBanner.classList.add("show");
        payButton.disabled = false;
        payButton.textContent = "Поддержать";
      });
  });
})();
