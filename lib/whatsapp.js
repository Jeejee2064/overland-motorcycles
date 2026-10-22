// WhatsApp links to the shop number with a prefilled message (tours have their own in lib/tours.js).
const NUMBER = '50768051100';

const MESSAGES = {
  en: "Hello Overland, I'd like to rent a motorcycle. Could you help me with availability and prices?",
  es: 'Hola Overland, me gustaría reservar una moto. ¿Me pueden ayudar con la disponibilidad y los precios?',
  fr: "Bonjour Overland, j'aimerais réserver une moto. Pouvez-vous m'aider avec les disponibilités et les prix ?",
  pt: 'Olá Overland, gostaria de reservar uma moto. Podem me ajudar com disponibilidade e preços?',
};

export const shopWhatsappLink = (locale = 'en') =>
  `https://wa.me/${NUMBER}?text=${encodeURIComponent(MESSAGES[locale] || MESSAGES.en)}`;
