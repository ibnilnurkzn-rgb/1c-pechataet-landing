module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const body = req.body || {};

  const message = [
    "💳 Готов внести предоплату",
    body.name ? `Имя: ${body.name}` : null,
    body.phone ? `Телефон: ${body.phone}` : null,
    body.contact ? `Почта/Telegram: ${body.contact}` : null,
    body.position ? `Должность: ${body.position}` : null,
    body.company ? `Компания: ${body.company}` : null,
    body.leadId ? `Lead ID: ${body.leadId}` : null
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
      console.error("Failed to notify Telegram about payment intent", err);
    }
  } else {
    console.warn("TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set — interest signal not forwarded", message);
  }

  res.status(200).json({ ok: true });
};
