import { motion } from 'motion/react';
import { MapPin, UtensilsCrossed, Landmark, Star, Clock, Euro } from 'lucide-react';

const attractions = [
  {
    id: 1,
    name: "Sagrada Família",
    category: "Arquitectura",
    description: "La obra maestra inacabada de Gaudí, un símbolo icónico de Barcelona que debes visitar al menos una vez.",
    image: "https://images.unsplash.com/photo-1690403021832-4934d206cb5f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxCYXJjZWxvbmElMjBhdHRyYWN0aW9ucyUyMHNhZ3JhZGElMjBmYW1pbGlhJTIwcGFyayUyMGd1ZWxsfGVufDF8fHx8MTc4MDc2ODMxM3ww&ixlib=rb-4.1.0&q=80&w=1080",
    location: "Eixample",
    price: "26€",
    bestTime: "Temprano en la mañana"
  },
  {
    id: 2,
    name: "Park Güell",
    category: "Naturaleza y Arte",
    description: "Parque público con impresionantes obras de Gaudí y vistas panorámicas de la ciudad.",
    image: "https://images.unsplash.com/photo-1767362667517-1a3a6dc3d983?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxCYXJjZWxvbmElMjBhdHRyYWN0aW9ucyUyMHNhZ3JhZGElMjBmYW1pbGlhJTIwcGFyayUyMGd1ZWxsfGVufDF8fHx8MTc4MDc2ODMxM3ww&ixlib=rb-4.1.0&q=80&w=1080",
    location: "Gràcia",
    price: "10€",
    bestTime: "Atardecer"
  },
  {
    id: 3,
    name: "Las Ramblas",
    category: "Paseo Urbano",
    description: "El paseo más famoso de Barcelona, lleno de vida, artistas callejeros y ambiente único.",
    image: "https://images.unsplash.com/photo-1532467153506-f1a99719af14?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxCYXJjZWxvbmElMjBjaXR5c2NhcGUlMjB2aWV3fGVufDF8fHx8MTc4MDc2NzgwNnww&ixlib=rb-4.1.0&q=80&w=1080",
    location: "Ciutat Vella",
    price: "Gratis",
    bestTime: "Mañana o tarde"
  },
  {
    id: 4,
    name: "Barrio Gótico",
    category: "Historia",
    description: "Calles medievales llenas de encanto, historia y secretos por descubrir en cada esquina.",
    image: "https://images.unsplash.com/photo-1507619700079-021a504ac451?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxCYXJjZWxvbmElMjBjaXR5c2NhcGUlMjB2aWV3fGVufDF8fHx8MTc4MDc2NzgwNnww&ixlib=rb-4.1.0&q=80&w=1080",
    location: "Ciutat Vella",
    price: "Gratis",
    bestTime: "Tarde-noche"
  }
];

const restaurants = [
  {
    id: 1,
    name: "Cervecería Catalana",
    cuisine: "Tapas Tradicionales",
    description: "Tapas auténticas en uno de los lugares más populares de Barcelona. Perfecto para probar la gastronomía local.",
    image: "https://images.unsplash.com/photo-1656423521731-9665583f100c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxCYXJjZWxvbmElMjByZXN0YXVyYW50cyUyMHRhcGFzJTIwZm9vZHxlbnwxfHx8fDE3ODA3NjgzMTJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    location: "Eixample",
    priceRange: "€€",
    rating: 4.6,
    specialty: "Jamón ibérico, Patatas bravas"
  },
  {
    id: 2,
    name: "El Xampanyet",
    cuisine: "Tapas y Cava",
    description: "Bar tradicional con encanto bohemio. Famoso por su cava y tapas caseras desde 1929.",
    image: "https://images.unsplash.com/photo-1565599837634-134bc3aadce8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxCYXJjZWxvbmElMjByZXN0YXVyYW50cyUyMHRhcGFzJTIwZm9vZHxlbnwxfHx8fDE3ODA3NjgzMTJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    location: "El Born",
    priceRange: "€",
    rating: 4.5,
    specialty: "Boquerones, Anchoas, Cava"
  },
  {
    id: 3,
    name: "La Boqueria Market",
    cuisine: "Mercado Gastronómico",
    description: "El mercado más emblemático de Barcelona. Colores, sabores y productos frescos en cada rincón.",
    image: "https://images.unsplash.com/photo-1697546567711-8cc9a2f34d32?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxCYXJjZWxvbmElMjByZXN0YXVyYW50cyUyMHRhcGFzJTIwZm9vZHxlbnwxfHx8fDE3ODA3NjgzMTJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    location: "Ciutat Vella",
    priceRange: "€€",
    rating: 4.7,
    specialty: "Frutas, Mariscos, Zumos naturales"
  },
  {
    id: 4,
    name: "Cal Pep",
    cuisine: "Mariscos",
    description: "Experiencia gastronómica auténtica con los mejores mariscos y pescados frescos de Barcelona.",
    image: "https://images.unsplash.com/photo-1714425342554-84ebb62349f0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw0fHxCYXJjZWxvbmElMjByZXN0YXVyYW50cyUyMHRhcGFzJTIwZm9vZHxlbnwxfHx8fDE3ODA3NjgzMTJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    location: "El Born",
    priceRange: "€€€",
    rating: 4.8,
    specialty: "Gambas, Calamares, Pescado fresco"
  },
  {
    id: 5,
    name: "Tickets Bar",
    cuisine: "Tapas Modernas",
    description: "Cocina creativa de los hermanos Adrià. Una experiencia gastronómica inolvidable y diferente.",
    image: "https://images.unsplash.com/photo-1697546430330-e5261a541adc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw2fHxCYXJjZWxvbmElMjByZXN0YXVyYW50cyUyMHRhcGFzJTIwZm9vZHxlbnwxfHx8fDE3ODA3NjgzMTJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    location: "Poble Sec",
    priceRange: "€€€",
    rating: 4.9,
    specialty: "Tapas de autor, Gastronomía molecular"
  },
  {
    id: 6,
    name: "Paella Marinera",
    cuisine: "Cocina Mediterránea",
    description: "La mejor paella de Barcelona con vistas al mar. Auténtica cocina mediterránea con ingredientes frescos.",
    image: "https://images.unsplash.com/photo-1650964807311-970cb88d347c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw4fHxCYXJjZWxvbmElMjByZXN0YXVyYW50cyUyMHRhcGFzJTIwZm9vZHxlbnwxfHx8fDE3ODA3NjgzMTJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    location: "Barceloneta",
    priceRange: "€€",
    rating: 4.7,
    specialty: "Paella de mariscos, Fideuà"
  }
];

export function Discover() {
  return (
    <>
      {/* Hero Discover — fondo oscuro limpio, sin gradients de colores */}
      <section className="relative min-h-[60vh] flex items-center bg-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1600&q=80"
            alt="Barcelona"
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-5 py-2.5 rounded-full mb-6"
            >
              <Landmark className="w-4 h-4 text-[#E05A2B]" />
              <span className="text-white/90 font-medium text-sm">Guía Local</span>
            </motion.div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-white leading-tight">
              Descubre{' '}
              <span className="text-[#E05A2B]">Barcelona</span>
            </h1>
            <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
              Los mejores lugares para vivir la auténtica experiencia barcelonesa
            </p>
          </motion.div>
        </div>
      </section>

      {/* Atracciones */}
      <section className="relative py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#E05A2B] mb-3">
              Imprescindibles
            </p>
            <h2 className="text-4xl font-bold mb-3 text-slate-900 flex items-center gap-3">
              <Landmark className="w-8 h-8 text-[#E05A2B]" />
              Lugares que no puedes perderte
            </h2>
            <p className="text-slate-500">
              Atracciones esenciales durante tu estancia
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
            {attractions.map((place, index) => (
              <motion.div
                key={place.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index }}
                className="group bg-white rounded-3xl overflow-hidden border border-slate-100 hover:border-[#E05A2B]/20 hover:shadow-[0_8px_40px_rgba(224,90,43,0.10)] transition-all duration-500"
              >
                <div className="relative h-72 overflow-hidden">
                  <motion.img
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.6 }}
                    src={place.image}
                    alt={place.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

                  <div className="absolute top-4 left-4">
                    <span className="bg-white/95 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700">
                      {place.category}
                    </span>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                    <h3 className="text-2xl font-bold mb-2">{place.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-white/80">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{place.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Euro className="w-3.5 h-3.5" />
                        <span>{place.price}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <p className="text-slate-500 mb-4 leading-relaxed text-sm">
                    {place.description}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-[#E05A2B]" />
                    <span className="text-slate-600">
                      <span className="font-medium">Mejor momento:</span> {place.bestTime}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Restaurantes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#E05A2B] mb-3">
              Gastronomía
            </p>
            <h2 className="text-4xl font-bold mb-3 text-slate-900 flex items-center gap-3">
              <UtensilsCrossed className="w-8 h-8 text-[#E05A2B]" />
              Restaurantes Recomendados
            </h2>
            <p className="text-slate-500">
              Sabores auténticos que debes probar
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {restaurants.map((restaurant, index) => (
              <motion.div
                key={restaurant.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index }}
                className="group bg-white rounded-3xl overflow-hidden border border-slate-100 hover:border-[#E05A2B]/20 hover:shadow-[0_8px_40px_rgba(224,90,43,0.10)] transition-all duration-500"
              >
                <div className="relative h-52 overflow-hidden">
                  <motion.img
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.6 }}
                    src={restaurant.image}
                    alt={restaurant.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                  <div className="absolute top-4 right-4">
                    <div className="bg-white/95 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold text-slate-900 text-sm">{restaurant.rating}</span>
                    </div>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-bold text-white mb-0.5">{restaurant.name}</h3>
                    <p className="text-white/75 text-xs">{restaurant.cuisine}</p>
                  </div>
                </div>

                <div className="p-5">
                  <p className="text-slate-500 mb-4 leading-relaxed line-clamp-2 text-sm">
                    {restaurant.description}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1.5 text-sm text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-[#E05A2B]" />
                      <span>{restaurant.location}</span>
                    </div>
                    <span className="text-[#E05A2B] font-bold text-sm">{restaurant.priceRange}</span>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-400">
                      <span className="font-medium text-slate-600">Especialidad:</span> {restaurant.specialty}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final — oscuro, sin gradient de colores */}
      <section className="relative py-20 bg-slate-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-3xl font-bold mb-4 text-white">
              ¿Necesitas más recomendaciones?
            </h3>
            <p className="text-slate-400 mb-8 leading-relaxed">
              Como locales, conocemos los mejores secretos de Barcelona. ¡Pregúntanos lo que quieras!
            </p>
            <a
              href="https://wa.me/34612345678?text=Hola!%20Me%20gustaría%20recibir%20más%20recomendaciones%20sobre%20Barcelona"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#E05A2B] hover:bg-[#c94e23] text-white rounded-2xl font-bold text-lg transition-all hover:scale-105"
            >
              Contactar por WhatsApp
            </a>
          </motion.div>
        </div>
      </section>
    </>
  );
}