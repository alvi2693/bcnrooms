import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Star, MessageCircle } from 'lucide-react';
import type { Room } from '../data/rooms';
import { RoomGallery } from './RoomGallery';
import { ReviewSection } from './ReviewSection';

interface RoomModalProps {
  room: Room | null;
  onClose: () => void;
}

export function RoomModal({ room, onClose }: RoomModalProps) {
  if (!room) return null;

  const waMessage = encodeURIComponent(
    `Hola! Estoy interesado/a en la habitación: ${room.title} en ${room.location}. ¿Podéis darme más información sobre precio y disponibilidad?`
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl max-w-5xl w-full my-8 shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 rounded-t-3xl flex items-center justify-between z-10">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">
                {room.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="w-4 h-4 text-[#E05A2B]" />
                <span className="text-sm text-slate-500">{room.location}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-slate-600" />
            </button>
          </div>

          <div className="p-6 max-h-[80vh] overflow-y-auto">
            <RoomGallery images={room.images} />

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Columna principal */}
              <div className="md:col-span-2 space-y-6">

                {/* Rating + descripción */}
                <div>
                  <div className="flex items-center gap-1 mb-3">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-lg text-slate-900">{room.rating}</span>
                    <span className="text-slate-400 ml-1 text-sm">
                      ({room.reviews.length} reseñas)
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    {room.description}
                  </p>
                </div>

                {/* Features */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <h4 className="font-semibold text-slate-900 mb-4">
                    Características incluidas
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {room.features.map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 text-slate-700 bg-white px-4 py-2.5 rounded-xl border border-slate-100"
                      >
                        <div className="w-2 h-2 bg-[#E05A2B] rounded-full flex-shrink-0" />
                        <span className="text-sm font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mapa */}
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#E05A2B]" />
                    Ubicación aproximada
                  </h4>
                  <div className="rounded-2xl overflow-hidden border border-slate-100 h-52">
                    <iframe
                      title="Ubicación aproximada"
                      src={`https://maps.google.com/maps?q=${room.mapQuery}&output=embed&z=15`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    * La ubicación mostrada es aproximada para proteger la privacidad
                  </p>
                </div>

                <ReviewSection reviews={room.reviews} />
              </div>

              {/* Sidebar precio/contacto */}
              <div className="md:col-span-1">
                <div className="bg-white p-6 rounded-2xl sticky top-24 border border-slate-100 shadow-sm">

                  {/* Badge tipo alquiler */}
                  <div className="flex gap-2 mb-5">
                    <span className="text-xs bg-orange-50 text-[#E05A2B] px-3 py-1.5 rounded-full font-medium border border-orange-100">
                      Por noches
                    </span>
                    <span className="text-xs bg-orange-50 text-[#E05A2B] px-3 py-1.5 rounded-full font-medium border border-orange-100">
                      Estancia mensual
                    </span>
                  </div>

                  {/* Precio a consultar */}
                  <div className="text-center mb-5 py-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Precio</p>
                    <p className="text-xl font-bold text-slate-900">A consultar</p>
                    <p className="text-xs text-slate-400 mt-1">Según disponibilidad y duración</p>
                  </div>

                  {/* Botón WhatsApp */}
                  <a
                    href={`https://wa.me/34632991218?text=${waMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-[#E05A2B] hover:bg-[#c94e23] text-white font-semibold py-3.5 px-6 rounded-xl transition-all hover:scale-[1.02] text-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Consultar por WhatsApp
                  </a>

                  <div className="mt-5 space-y-2.5 text-sm">
                    <div className="flex items-center gap-2 text-slate-500">
                      <span className="text-[#E05A2B] font-bold">✓</span>
                      <span>Respuesta en menos de 1 hora</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <span className="text-[#E05A2B] font-bold">✓</span>
                      <span>Visita virtual disponible</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <span className="text-[#E05A2B] font-bold">✓</span>
                      <span>Disponible desde ya</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}