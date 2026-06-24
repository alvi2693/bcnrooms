import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Home, Search } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 10 }}
          className="mb-8"
        >
          <h1 className="text-9xl font-bold bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
            404
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Página no encontrada
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
            Lo sentimos, la página que buscas no existe o ha sido movida.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              <Home className="w-5 h-5" />
              Volver al inicio
            </Link>
            <Link
              to="/descubre"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-pink-200 text-pink-600 rounded-xl font-semibold hover:bg-pink-50 transition-all"
            >
              <Search className="w-5 h-5" />
              Descubre Barcelona
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
