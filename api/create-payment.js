const crypto = require("crypto");

const PREPAYMENT_AMOUNT = "4990.00";

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;

  if (!shopId || !secretKey) {
    console.error("YOOKASSA_SHOP_ID / YOOKASSA_SECRET_KEY not set");
    res.status(500).json({ ok: false, error: "Payment provider not configured" });
    return;
  }

  const body = req.body || {};
  const origin = `https://${req.headers.host}`;
  const auth = Buffer.from(`${shopId}:${secretKey}`).toString("base64");

  const payload = {
    amount: { value: PREPAYMENT_AMOUNT, currency: "RUB" },
    capture: true,
    confirmation: {
      type: "redirect",
      return_url: `${origin}/payment.html?paid=1`
    },
    description: "Предоплата «1С печатает…» — фиксация скидки −50% на первые 3 месяца",
    metadata: {
      leadId: body.leadId || "",
      name: body.name || "",
      contact: body.contact || "",
      company: body.company || ""
    }
  };

  try {
    const ykRes = await fetch("https://api.yookassa.ru/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Idempotence-Key": crypto.randomUUID(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await ykRes.json();

    if (!ykRes.ok) {
      console.error("YooKassa create payment failed", data);
      res.status(502).json({ ok: false, error: "YooKassa error", details: data });
      return;
    }

    res.status(200).json({ ok: true, confirmationUrl: data.confirmation.confirmation_url });
  } catch (err) {
    console.error("YooKassa request failed", err);
    res.status(502).json({ ok: false, error: "YooKassa request failed" });
  }
};
