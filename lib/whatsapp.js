function normalizeIndianPhone(phone) {
  const digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

async function sendTemplate({ to, name, languageCode, bodyParameters = [] }) {
  const version = process.env.WHATSAPP_API_VERSION || "v23.0";
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken || !name) {
    return { skipped: true, reason: "WhatsApp is not configured." };
  }

  const url = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: normalizeIndianPhone(to),
      type: "template",
      template: {
        name,
        language: { code: languageCode },
        components: bodyParameters.length
          ? [{
              type: "body",
              parameters: bodyParameters.map((text) => ({ type: "text", text: String(text) }))
            }]
          : undefined
      }
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`WhatsApp API error: ${JSON.stringify(data)}`);
  }

  return data;
}

export async function sendOrderConfirmation({ phone, customerName, orderNumber, total }) {
  return sendTemplate({
    to: phone,
    name: process.env.WHATSAPP_ORDER_TEMPLATE_NAME,
    languageCode: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en_US",
    bodyParameters: [customerName, orderNumber, total]
  });
}

export async function sendCodVerification({ phone, customerName, orderNumber, total }) {
  return sendTemplate({
    to: phone,
    name: process.env.WHATSAPP_COD_TEMPLATE_NAME,
    languageCode: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en_US",
    bodyParameters: [customerName, orderNumber, total]
  });
}
