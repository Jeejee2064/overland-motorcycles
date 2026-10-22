// Source of truth for the guided motorcycle tours (structure, price, duration).
// Translatable copy lives in messages/*.json under the "Tours" namespace (items.<id>).
// Nights = days - 1 for every tour: the last day is the return day.

export const WHATSAPP_NUMBER = '50768051100';

// Approximate coordinates of every stop. Copy for each place lives in Tours.places.<id>.
export const PLACES = {
  panama: { lat: 8.9824, lng: -79.5199 },
  gamboa: { lat: 9.1183, lng: -79.6978 },
  embera: { lat: 9.16, lng: -79.64 },
  valle: { lat: 8.6, lng: -80.1333 },
  santacatalina: { lat: 7.6333, lng: -81.25 },
  cambutal: { lat: 7.2556, lng: -80.4778 },
  lastablas: { lat: 7.7667, lng: -80.275 },
  santafe: { lat: 8.5167, lng: -81.0667 },
  coronado: { lat: 8.5333, lng: -79.9 },
  bocachica: { lat: 8.2058, lng: -82.1319 },
  boquete: { lat: 8.7833, lng: -82.4333 },
  bocas: { lat: 9.3403, lng: -82.242 },
};

export const TOURS = [
  {
    id: 'central',
    stops: ['panama', 'valle', 'santacatalina', 'cambutal', 'lastablas', 'panama'],
    slug: '5-day-panama-motorcycle-tour-central-pacific',
    days: 5,
    nights: 4,
    price: 2906,
    image: '/montagne.webp',
  },
  {
    id: 'grand',
    stops: ['panama', 'gamboa', 'embera', 'valle', 'santacatalina', 'santafe', 'coronado', 'panama'],
    slug: '7-day-panama-motorcycle-tour-embera-santa-fe',
    days: 7,
    nights: 6,
    price: 4099,
    image: '/pirogue.jpg',
  },
  {
    id: 'loop',
    stops: ['panama', 'valle', 'santafe', 'bocachica', 'boquete', 'santacatalina', 'coronado', 'panama'],
    slug: '10-day-panama-motorcycle-tour-boquete-boca-chica',
    days: 10,
    nights: 9,
    price: 5836,
    image: '/cascade.webp',
  },
  {
    id: 'wild',
    stops: ['panama', 'valle', 'santafe', 'santacatalina', 'bocachica', 'boquete', 'bocas'],
    slug: '12-day-panama-motorcycle-tour-bocas-del-toro',
    days: 12,
    nights: 11,
    price: 6948,
    image: '/sanblas.webp',
  },
];

export const getTourBySlug = (slug) => TOURS.find((tour) => tour.slug === slug);

export const whatsappLink = (message) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

export const formatPrice = (price) =>
  `$${price.toLocaleString('en-US')}`;
