import { createContext, useContext, useState } from 'react';

type Lang = 'es' | 'en';

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const translations = {
  es: {
    // Navbar
    'nav.home': 'Inicio',
    'nav.discover': 'Descubre BCN',
    'nav.contact': 'Contactar',
    'nav.tagline': 'Tu hogar en Barcelona',
    // Hero
    'hero.badge': '3 Habitaciones Disponibles Ahora',
    'hero.title1': 'Vive la magia de',
    'hero.title2': 'Barcelona',
    'hero.subtitle': 'Disfruta de una estancia cómoda, privada y bien conectada en Barcelona',
    'hero.cta': 'Ver Habitaciones',
    // Rooms
    'rooms.title': 'Habitaciones Disponibles',
    'rooms.subtitle': 'Espacios únicos en los mejores barrios, listos para que los conviertas en tu hogar',
    'rooms.perNight': 'Por noches',
    'rooms.monthly': 'Mensual',
    'rooms.askPrice': 'Precio a consultar',
    // FAQ
    'faq.label': 'FAQ',
    'faq.title': 'Preguntas Frecuentes',
    'faq.subtitle': 'Todo lo que necesitas saber antes de reservar',
    'faq.more': '¿Tienes más preguntas? Estamos aquí para ayudarte',
    // Footer
    'footer.tagline': 'Habitaciones de calidad en los mejores barrios de Barcelona. Tu experiencia en la ciudad, sin complicaciones.',
    'footer.contact': 'Contacto',
    'footer.neighborhoods': 'Barrios',
    'footer.rights': '© 2024 BCN Rooms. Todos los derechos reservados.',
    'footer.privacy': 'Privacidad',
    'footer.terms': 'Términos',
    'footer.cookies': 'Cookies',
    // WhatsApp
    'whatsapp.button': 'Contactar por WhatsApp',
    'whatsapp.message': 'Hola! Me interesa una de las habitaciones disponibles en Barcelona. ¿Podéis darme más información sobre disponibilidad y precios? Muchas gracias 🙏',
    // Modal
    'modal.askPrice': 'A consultar',
    'modal.askPriceSub': 'Según disponibilidad y duración',
    'modal.perNight': 'Por noches',
    'modal.monthly': 'Estancia mensual',
    'modal.contact': 'Consultar por WhatsApp',
    'modal.reply': 'Respuesta en menos de 1 hora',
    'modal.virtual': 'Visita virtual disponible',
    'modal.available': 'Disponible desde ya',
    'modal.features': 'Características incluidas',
    'modal.location': 'Ubicación aproximada',
    'modal.locationNote': '* La ubicación mostrada es aproximada para proteger la privacidad',
    'modal.price': 'Precio',
    // Discover
    'discover.badge': 'Guía Local',
    'discover.title1': 'Descubre',
    'discover.title2': 'Barcelona',
    'discover.subtitle': 'Los mejores lugares para vivir la auténtica experiencia barcelonesa',
    'discover.mustSee': 'Imprescindibles',
    'discover.mustSeeTitle': 'Lugares que no puedes perderte',
    'discover.mustSeeSub': 'Atracciones esenciales durante tu estancia',
    'discover.food': 'Gastronomía',
    'discover.foodTitle': 'Restaurantes Recomendados',
    'discover.foodSub': 'Sabores auténticos que debes probar',
    'discover.cta': '¿Necesitas más recomendaciones?',
    'discover.ctaSub': 'Como locales, conocemos los mejores secretos de Barcelona. ¡Pregúntanos lo que quieras!',
    'discover.ctaButton': 'Contactar por WhatsApp',
    'discover.bestTime': 'Mejor momento',
    'discover.specialty': 'Especialidad',
  },
  en: {
    // Navbar
    'nav.home': 'Home',
    'nav.discover': 'Discover BCN',
    'nav.contact': 'Contact',
    'nav.tagline': 'Your home in Barcelona',
    // Hero
    'hero.badge': '3 Rooms Available Now',
    'hero.title1': 'Live the magic of',
    'hero.title2': 'Barcelona',
    'hero.subtitle': 'Enjoy a comfortable, private and well-connected stay in Barcelona',
    'hero.cta': 'View Rooms',
    // Rooms
    'rooms.title': 'Available Rooms',
    'rooms.subtitle': 'Unique spaces in the best neighborhoods, ready for you to call home',
    'rooms.perNight': 'Per night',
    'rooms.monthly': 'Monthly',
    'rooms.askPrice': 'Price on request',
    // FAQ
    'faq.label': 'FAQ',
    'faq.title': 'Frequently Asked Questions',
    'faq.subtitle': 'Everything you need to know before booking',
    'faq.more': 'Have more questions? We are here to help',
    // Footer
    'footer.tagline': 'Quality rooms in the best neighborhoods of Barcelona. Your city experience, hassle-free.',
    'footer.contact': 'Contact',
    'footer.neighborhoods': 'Neighborhoods',
    'footer.rights': '© 2024 BCN Rooms. All rights reserved.',
    'footer.privacy': 'Privacy',
    'footer.terms': 'Terms',
    'footer.cookies': 'Cookies',
    // WhatsApp
    'whatsapp.button': 'Contact via WhatsApp',
    'whatsapp.message': 'Hi! I am interested in one of the rooms available in Barcelona. Could you give me more information about availability and prices? Thank you 🙏',
    // Modal
    'modal.askPrice': 'On request',
    'modal.askPriceSub': 'Based on availability and duration',
    'modal.perNight': 'Per night',
    'modal.monthly': 'Monthly stay',
    'modal.contact': 'Ask via WhatsApp',
    'modal.reply': 'Response in less than 1 hour',
    'modal.virtual': 'Virtual visit available',
    'modal.available': 'Available now',
    'modal.features': 'Included features',
    'modal.location': 'Approximate location',
    'modal.locationNote': '* Location shown is approximate to protect privacy',
    'modal.price': 'Price',
    // Discover
    'discover.badge': 'Local Guide',
    'discover.title1': 'Discover',
    'discover.title2': 'Barcelona',
    'discover.subtitle': 'The best places to live the authentic Barcelona experience',
    'discover.mustSee': 'Must-see',
    'discover.mustSeeTitle': 'Places you cannot miss',
    'discover.mustSeeSub': 'Essential attractions during your stay',
    'discover.food': 'Gastronomy',
    'discover.foodTitle': 'Recommended Restaurants',
    'discover.foodSub': 'Authentic flavors you must try',
    'discover.cta': 'Need more recommendations?',
    'discover.ctaSub': 'As locals, we know the best secrets of Barcelona. Ask us anything!',
    'discover.ctaButton': 'Contact via WhatsApp',
    'discover.bestTime': 'Best time',
    'discover.specialty': 'Specialty',
  }
};

const LanguageContext = createContext<LanguageContextType>({
  lang: 'es',
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('es');

  const t = (key: string): string => {
    return translations[lang][key as keyof typeof translations['es']] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}