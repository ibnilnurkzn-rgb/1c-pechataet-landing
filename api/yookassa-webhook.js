module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).send("Method not allowed");
    return;
  }

  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;
  const notification = req.body || {};
  const paymentId = notification.object && notification.object.id;

  if (!paymentId) {
    res.status(400).send("Missing payment id");
    return;
  }

  // YooKassa не подписывает уведомления — перепроверяем статус платежа напрямую в их API,
  // не доверяя телу вебхука, чтобы поддельный POST не мог сымитировать оплату.
  const auth = Buffer.from(`${shopId}:${secretKey}`).toString("base64");
  let payment;
  try {
    const ykRes = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
      headers: { Authorization: `Basic ${auth}` }
    });
    payment = await ykRes.json();
  } catch (err) {
    console.error("Failed to verify payment with YooKassa", err);
    res.status(502).send("Verification failed");
    return;
  }

  if (payment.status !== "succeeded") {
    res.status(200).send("ignored");
    return;
  }

  const metadata = payment.metadata || {};
  const message = [
    "💳 Оплата получена — 1С печатает…",
    `Сумма: ${payment.amount.value} ${payment.amount.currency}`,
    `Lead ID: ${metadata.leadId || "—"}`,
    metadata.name ? `Имя: ${metadata.name}` : null,
    metadata.contact ? `Контакт: ${metadata.contact}` : null,
    metadata.company ? `Компания: ${metadata.company}` : null,
    `Payment ID: ${paymentId}`
  ]
    .filter(Boolean)
    .join("\n");

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (token && chatId) {
    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: message })
      });
    } catch (err) {
      console.error("Failed to notify Telegram about payment", err);
    }
  } else {
    console.warn("TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set — payment not forwarded to Telegram", message);
  }

  res.status(200).send("ok");
};
