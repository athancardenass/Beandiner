export const WHATSAPP_NUMBER = "639635913031";
export const WHATSAPP_URL_LIMIT = 2000;

const ORDER_REQUEST_STATUS = "Order request, awaiting confirmation.";

export const withOrderRequestStatus = (message: string) => {
  const text = message.trim();
  return text.endsWith(ORDER_REQUEST_STATUS)
    ? text
    : `${text}\n\n${ORDER_REQUEST_STATUS}`;
};

// Use normal HTTPS links so WhatsApp can offer its app or web handoff.
export const getWhatsAppUrl = (message = "", web = false) => {
  const base = web
    ? `https://web.whatsapp.com/send?phone=${WHATSAPP_NUMBER}`
    : `https://wa.me/${WHATSAPP_NUMBER}`;
  return message
    ? `${base}${web ? "&" : "?"}text=${encodeURIComponent(message)}`
    : base;
};
