import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Star, Sparkles, ChevronDown } from 'lucide-react';
import { rooms } from '../data/rooms';
import type { Room } from '../data/rooms';
import { RoomModal } from '../components/RoomModal';
import { WhatsAppButton } from '../components/WhatsAppButton';

const faqs = [
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

export function Home() {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <>
      {/* ── HERO ── fondo dividido: mitad azul eléctrico, foto derecha */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1507619700079-021a504ac451?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxCYXJjZWxvbmElMjBjaXR5c2NhcGUlMjB2aWV3fGVufDF8fHx8MTc4MDc2NzgwNnww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Barcelona skyline"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/75 via-slate-800/50 to-slate-900/80" />
        </div>

        {/* partículas — igual que antes */}
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
            {/* badge — azul eléctrico con borde */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/25 px-6 py-3 rounded-full mb-8"
            >
              <Sparkles className="w-5 h-5 text-[#E05A2B]" />
              <span className="text-white font-medium">3 Habitaciones Disponibles Ahora</span>
            </motion.div>

            {/* título — blanco limpio, acento azul eléctrico */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight">
              Vive la magia de
              <span className="block text-[#E05A2B]">
                Barcelona
              </span>
            </h1>

            <p className="text-xl sm:text-2xl md:text-3xl text-white/85 mb-12 max-w-3xl mx-auto leading-relaxed">
              Disfruta de una estancia cómoda, privada y bien conectada en Barcelona
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              {/* CTA principal — azul sólido */}
              <a
                href="#habitaciones"
                className="px-8 py-4 bg-[#E05A2B] hover:bg-[#c94e23] text-white rounded-2xl font-bold text-lg transition-all hover:scale-105"
              >
                Ver Habitaciones
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

      {/* ── HABITACIONES ── fondo blanco limpio */}
      <section id="habitaciones" className="relative py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            {/* label pequeño azul eléctrico */}
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#E05A2B] mb-3">
            </p>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-[#0a1628]">
              Habitaciones Disponibles
            </h2>
            <p className="text-lg text-slate-500 max-w-3xl mx-auto">
              Espacios únicos en los mejores barrios, listos para que los conviertas en tu hogar
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
                onClick={() => setSelectedRoom(room)}
                className="group cursor-pointer"
              >
                <div className="relative bg-white rounded-3xl overflow-hidden border border-slate-100 hover:border-[#E05A2B]/30 transition-all duration-500 hover:shadow-[0_8px_40px_rgba(232,87,42,0.12)]">

                  <div className="relative h-72 overflow-hidden">
                    <motion.img
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                      src={room.mainImage}
                      alt={room.title}
                      className="w-full h-full object-cover"
                    />
                    {/* tipo alquiler — sin precio */}
                    <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 items-end">
                      <div className="bg-[#E05A2B] px-3 py-1.5 rounded-full">
                        <span className="font-medium text-white text-xs">Por noches</span>
                      </div>
                      <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                        <span className="font-medium text-white text-xs">Precio a consultar</span>
                      </div>
                    </div>
                    {/* rating — oscuro */}
                    <div className="absolute top-4 left-4 z-20">
                      <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-white font-semibold text-sm">{room.rating}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 text-slate-900">
                      {room.title}
                    </h3>
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
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── fondo gris muy suave */}
      <section className="relative py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#E05A2B] mb-3">
              FAQ
            </p>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900">
              Preguntas Frecuentes
            </h2>
            <p className="text-lg text-slate-500">
              Todo lo que necesitas saber antes de reservar
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
            <p className="text-slate-500 mb-6 text-lg">
              ¿Tienes más preguntas? Estamos aquí para ayudarte
            </p>
            <WhatsAppButton message="Hola! Tengo algunas preguntas sobre las habitaciones disponibles" />
          </motion.div>
        </div>
      </section>

      <RoomModal
        room={selectedRoom}
        onClose={() => setSelectedRoom(null)}
      />
    </>
  );
}