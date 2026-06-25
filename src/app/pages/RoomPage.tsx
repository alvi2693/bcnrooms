import { useParams, Link } from 'react-router';
import { motion } from 'motion/react';
import { MapPin, Star, MessageCircle, ArrowLeft } from 'lucide-react';
import { rooms } from '../data/rooms';
import { RoomGallery } from '../components/RoomGallery';
import { ReviewSection } from '../components/ReviewSection';
import { useLang } from '../components/LanguageContext';

export function RoomPage() {
  const { slug } = useParams();
  const { t, lang } = useLang();

  const slugMap: Record<string, number> = {
    'sagrera': 1,
    'born': 2,
    'sagrada-familia': 3,
  };

  const room = rooms.find(r => r.id === slugMap[slug || '']);

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Habitación no encontrada</h2>
          <Link to="/" className="text-[#E05A2B] hover:underline">← Volver al inicio</Link>
        </div>
      </div>
    );
  }

  const waMessage = encodeURIComponent(
    lang === 'es'
      ? `Hola! Estoy interesado/a en la habitación: ${room.title}. ¿Podéis darme más información sobre disponibilidad y precios?`
      : `Hi! I'm interested in the room: ${room.title}. Could you give me more info about availability and prices?`
  );

  return (
    <div className="min-h-screen bg-white pt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-[#E05A2B] transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            {lang === 'es' ? 'Volver a habitaciones' : 'Back to rooms'}
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">{room.title}</h1>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-slate-500">
              <MapPin className="w-4 h-4 text-[#E05A2B]" />
              <span className="text-sm">{room.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-slate-900 text-sm">{room.rating}</span>
              <span className="text-slate-400 text-sm">({room.reviews.length} {lang === 'es' ? 'reseñas' : 'reviews'})</span>
            </div>
            {room.rentalTypes.map((type, i) => (
              <span key={i} className={`text-xs px-3 py-1 rounded-full font-medium ${
                i === 0 ? 'bg-[#E05A2B] text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {type}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Gallery */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          <RoomGallery images={room.images} />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Main content */}
          <div className="md:col-span-2 space-y-8">

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-slate-600 leading-relaxed">{room.description}</p>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-50 p-5 rounded-2xl border border-slate-100"
            >
              <h3 className="font-semibold text-slate-900 mb-4">
                {lang === 'es' ? 'Características incluidas' : 'Included features'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {room.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-slate-100">
                    <div className="w-2 h-2 bg-[#E05A2B] rounded-full flex-shrink-0" />
                    <span className="text-sm font-medium text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Map */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#E05A2B]" />
                {lang === 'es' ? 'Ubicación aproximada' : 'Approximate location'}
              </h3>
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
                {lang === 'es'
                  ? '* La ubicación mostrada es aproximada para proteger la privacidad'
                  : '* Location shown is approximate to protect privacy'}
              </p>
            </motion.div>

            {/* Reviews */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <ReviewSection reviews={room.reviews} />
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="md:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm sticky top-24"
            >
              <div className="flex gap-2 mb-5 flex-wrap">
                {room.rentalTypes.map((type, i) => (
                  <span key={i} className="text-xs bg-orange-50 text-[#E05A2B] px-3 py-1.5 rounded-full font-medium border border-orange-100">
                    {type}
                  </span>
                ))}
              </div>

              <div className="text-center mb-5 py-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
                  {lang === 'es' ? 'Precio' : 'Price'}
                </p>
                <p className="text-xl font-bold text-slate-900">
                  {lang === 'es' ? 'A consultar' : 'On request'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === 'es' ? 'Según disponibilidad y duración' : 'Based on availability and duration'}
                </p>
              </div>

              <a
                href={`https://wa.me/34632991218?text=${waMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-[#E05A2B] hover:bg-[#c94e23] text-white font-semibold py-3.5 px-6 rounded-xl transition-all hover:scale-[1.02] text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                {lang === 'es' ? 'Consultar por WhatsApp' : 'Ask via WhatsApp'}
              </a>

              <div className="mt-5 space-y-2.5 text-sm">
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="text-[#E05A2B] font-bold">✓</span>
                  <span>{lang === 'es' ? 'Respuesta en menos de 1 hora' : 'Response in less than 1 hour'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="text-[#E05A2B] font-bold">✓</span>
                  <span>{lang === 'es' ? 'Visita virtual disponible' : 'Virtual visit available'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="text-[#E05A2B] font-bold">✓</span>
                  <span>{lang === 'es' ? 'Disponible desde ya' : 'Available now'}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}