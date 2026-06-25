import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router';
import { MapPin, Star, Sparkles, ChevronDown } from 'lucide-react';
import { rooms } from '../data/rooms';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { useLang } from '../components/LanguageContext';

const faqsEs = [
  {
    question: "¿Qué modalidades de alquiler ofrecéis?",
    answer: "Ofrecemos dos modalidades: alquiler por noches (estancias cortas) y alquiler mensual (30 días o más). Cada una tiene condiciones distintas adaptadas a tus necesidades."
  },
  {
    question: "¿Cómo funciona el alquiler por noches?",
    answer: "Para estancias cortas solicitamos una reserva de 5€ por persona y por día para asegurar la disponibilidad. El precio total se consulta según fechas y número de personas. Contáctanos por WhatsApp y te confirmamos en menos de 1 hora."
  },
  {
    question: "¿Cómo funciona el alquiler mensual?",
    answer: "Para estancias de 30 días o más solicitamos un depósito equivalente a un mes de alquiler más el mes en curso al inicio. Al finalizar la estancia, si todo está en orden, te devolvemos íntegramente el depósito."
  },
  {
    question: "¿Qué gastos están incluidos en el precio?",
    answer: "El precio incluye WiFi de alta velocidad, agua, electricidad y limpieza de zonas comunes. Solo pagas el alquiler, sin sorpresas."
  },
  {
    question: "¿Puedo visitar la habitación antes de decidirme?",
    answer: "¡Por supuesto! Ofrecemos visitas presenciales con cita previa o videollamadas si estás fuera de Barcelona. Tu comodidad es nuestra prioridad."
  },
  {
    question: "¿Las habitaciones están amuebladas?",
    answer: "Sí, todas vienen completamente amuebladas con cama, armario, escritorio y todo lo necesario. Solo tienes que traer tu maleta y empezar a disfrutar de Barcelona."
  }
];

const faqsEn = [
  {
    question: "What rental options do you offer?",
    answer: "We offer two options: nightly rentals (short stays) and monthly rentals (30 days or more). Each has different conditions tailored to your needs."
  },
  {
    question: "How does nightly rental work?",
    answer: "For short stays we require a reservation of €5 per person per day to secure availability. The total price is consulted based on dates and number of people. Contact us via WhatsApp and we confirm in less than 1 hour."
  },
  {
    question: "How does monthly rental work?",
    answer: "For stays of 30 days or more we require a deposit equivalent to one month's rent plus the current month upfront. At the end of the stay, if everything is in order, we return the deposit in full."
  },
  {
    question: "What expenses are included in the price?",
    answer: "The price includes high-speed WiFi, water, electricity and cleaning of common areas. You only pay the rent, no surprises."
  },
  {
    question: "Can I visit the room before deciding?",
    answer: "Of course! We offer in-person visits by appointment or video calls if you are outside Barcelona. Your comfort is our priority."
  },
  {
    question: "Are the rooms furnished?",
    answer: "Yes, all rooms come fully furnished with bed, wardrobe, desk and everything you need. Just bring your suitcase and start enjoying Barcelona."
  }
];

export function Home() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const { lang, t } = useLang();
  const faqs = lang === 'es' ? faqsEs : faqsEn;

  const slugMap: Record<number, string> = {
    1: 'sagrera',
    2: 'born',
    3: 'sagrada-familia',
  };

  return (
    <>
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1507619700079-021a504ac451?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxCYXJjZWxvbmElMjBjaXR5c2NhcGUlMjB2aWV3fGVufDF8fHx8MTc4MDc2NzgwNnww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Barcelona skyline"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/75 via-slate-800/50 to-slate-900/80" />
        </div>

        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                scale: 0,
                opacity: 0
              }}
              animate={{ scale: [0, 1, 0], opacity: [0, 0.8, 0] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: Math.random() * 3,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/25 px-6 py-3 rounded-full mb-8"
            >
              <Sparkles className="w-5 h-5 text-[#E05A2B]" />
              <span className="text-white font-medium">{t('hero.badge')}</span>
            </motion.div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight">
              {t('hero.title1')}
              <span className="block text-[#E05A2B]">{t('hero.title2')}</span>
            </h1>

            <p className="text-xl sm:text-2xl md:text-3xl text-white/85 mb-12 max-w-3xl mx-auto leading-relaxed">
              {t('hero.subtitle')}
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <a
                href="#habitaciones"
                className="px-8 py-4 bg-[#E05A2B] hover:bg-[#c94e23] text-white rounded-2xl font-bold text-lg transition-all hover:scale-105"
              >
                {t('hero.cta')}
              </a>
              <WhatsAppButton />
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <ChevronDown className="w-8 h-8 text-white/70" />
        </motion.div>
      </section>

      <section id="habitaciones" className="relative py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-[#0a1628]">
              {t('rooms.title')}
            </h2>
            <p className="text-lg text-slate-500 max-w-3xl mx-auto">
              {t('rooms.subtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {rooms.map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index }}
              >
                <Link to={`/habitacion/${slugMap[room.id]}`} className="group block">
                <div className="relative bg-white rounded-3xl overflow-hidden border border-slate-100 hover:border-[#E05A2B]/30 transition-all duration-500 hover:shadow-[0_8px_40px_rgba(232,87,42,0.12)]">
                  <div className="relative h-72 overflow-hidden">
                    <motion.img
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                      src={room.mainImage}
                      alt={room.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 items-end">
                      {room.rentalTypes.map((type, i) => (
                        <div
                          key={i}
                          className={`px-3 py-1.5 rounded-full ${i === 0 ? 'bg-[#E05A2B]' : 'bg-black/60 backdrop-blur-sm'}`}
                        >
                          <span className="font-medium text-white text-xs">{type}</span>
                        </div>
                      ))}
                      <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                        <span className="font-medium text-white text-xs">{t('rooms.askPrice')}</span>
                      </div>
                    </div>
                    <div className="absolute top-4 left-4 z-20">
                      <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-white font-semibold text-sm">{room.rating}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 text-slate-900">{room.title}</h3>
                    <div className="flex items-center gap-2 text-slate-500 mb-4">
                      <MapPin className="w-4 h-4 text-[#E05A2B]" />
                      <span className="text-sm font-medium">{room.location}</span>
                    </div>
                    <p className="text-slate-500 mb-6 line-clamp-2 leading-relaxed text-sm">
                      {room.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {room.features.slice(0, 3).map((feature, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-orange-50 text-[#E05A2B] px-3 py-1.5 rounded-full font-medium border border-orange-100"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#E05A2B] mb-3">
              {t('faq.label')}
            </p>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900">
              {t('faq.title')}
            </h2>
            <p className="text-lg text-slate-500">
              {t('faq.subtitle')}
            </p>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index }}
                className="bg-white rounded-2xl overflow-hidden border border-slate-100"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-[#0a1628] pr-4">{faq.question}</span>
                  <motion.div
                    animate={{ rotate: expandedFaq === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="w-5 h-5 text-[#E05A2B] flex-shrink-0" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {expandedFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 text-slate-500 leading-relaxed text-sm border-t border-slate-100 pt-4">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <p className="text-slate-500 mb-6 text-lg">{t('faq.more')}</p>
            <WhatsAppButton message={lang === 'es' ? "Hola! Tengo algunas preguntas sobre las habitaciones disponibles" : "Hi! I have some questions about the available rooms"} />
          </motion.div>
        </div>
      </section>
    </>
  );
}