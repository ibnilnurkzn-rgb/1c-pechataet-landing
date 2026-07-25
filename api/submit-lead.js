const REQUIRED_FIELDS = ["name", "phone", "contact", "position", "company"];

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const body = req.body || {};
  const missing = REQUIRED_FIELDS.filter((field) => !String(body[field] || "").trim());

  if (missing.length > 0) {
    res.status(400).json({ ok: false, error: "Missing fields", missing });
    return;
  }

  const leadId = body.leadId || `lead_${Date.now()}`;

  const message = [
    "🆕 Новая заявка — 1С печатает…",
    `Имя: ${body.name}`,
    `Телефон: ${body.phone}`,
    `Почта/Telegram: ${body.contact}`,
    `Должность: ${body.position}`,
    `Компания: ${body.company}`,
    `Согласие на рассылку: ${body.marketingConsent ? "да" : "нет"}`,
    `Lead ID: ${leadId}`
  ].join("\n");

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
      console.error("Failed to notify Telegram", err);
    }
  } else {
    console.warn("TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set — lead not forwarded to Telegram", message);
  }

  res.status(200).json({ ok: true, leadId });
};
