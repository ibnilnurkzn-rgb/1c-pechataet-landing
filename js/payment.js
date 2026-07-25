(function () {
  "use strict";

  var leadData = {};
  try {
    leadData = JSON.parse(sessionStorage.getItem("leadData")) || {};
  } catch (e) {
    leadData = {};
  }

  var params = new URLSearchParams(window.location.search);

  if (params.get("paid") === "1") {
    document.getElementById("payment-before").style.display = "none";
    document.getElementById("payment-after").style.display = "block";
    return;
  }

  var nameEl = document.getElementById("payment-lead-name");
  if (leadData.name) {
    nameEl.textContent = leadData.name;
  }

  var payButton = document.getElementById("pay-button");
  var errorBanner = document.getElementById("payment-error");

  payButton.addEventListener("click", function () {
    errorBanner.classList.remove("show");
    payButton.disabled = true;
    payButton.textContent = "Открываем оплату...";

    fetch("/api/create-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leadData)
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok || !data.ok) throw new Error(data.error || "payment failed");
          return data;
        });
      })
      .then(function (data) {
        window.location.href = data.confirmationUrl;
      })
      .catch(function (err) {
        console.error("create-payment failed", err);
        errorBanner.classList.add("show");
        payButton.disabled = false;
        payButton.textContent = "Поддержать";
      });
  });
})();
