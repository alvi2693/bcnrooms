import { useState } from 'react';
import { motion } from 'motion/react';
import { Star, Send, MessageCircle } from 'lucide-react';

interface Review {
  id: number;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

interface ReviewSectionProps {
  reviews: Review[];
}

export function ReviewSection({ reviews }: ReviewSectionProps) {
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [hoveredStar, setHoveredStar] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNewComment('');
    setNewRating(5);
    setShowCommentForm(false);
  };

  return (
    <div className="border-t border-pink-100 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h4 className="font-bold text-xl flex items-center gap-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          <MessageCircle className="w-6 h-6 text-pink-600" />
          Reseñas
        </h4>
        <motion.button
          onClick={() => setShowCommentForm(!showCommentForm)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-gradient-to-r from-orange-500 to-pink-600 text-white px-4 py-2 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all"
        >
          {showCommentForm ? 'Cancelar' : 'Escribir reseña'}
        </motion.button>
      </div>

      {showCommentForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6 bg-gradient-to-br from-orange-50 to-pink-50 p-6 rounded-2xl border border-pink-100"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Tu valoración
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <motion.button
                    key={star}
                    type="button"
                    onClick={() => setNewRating(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    className="transition-all"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= (hoveredStar || newRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </motion.button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Tu comentario
              </label>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Comparte tu experiencia con esta habitación..."
                className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-pink-300 resize-none bg-white"
                rows={4}
                required
              />
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-orange-500 to-pink-600 text-white py-3 rounded-xl font-bold hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              Publicar reseña
            </motion.button>
          </form>
        </motion.div>
      )}

      <div className="space-y-4">
        {reviews.map((review, idx) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white border border-pink-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-bold text-gray-900 text-lg">{review.author}</div>
                <div className="flex items-center gap-1 mt-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < review.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <span className="text-sm text-gray-500 font-medium">{review.date}</span>
            </div>
            <p className="text-gray-700 leading-relaxed">{review.comment}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
