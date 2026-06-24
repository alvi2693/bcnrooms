import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';

interface RoomGalleryProps {
  images: string[];
}

const isVideo = (url: string) => url.includes('.mp4') || url.includes('/video/');

export function RoomGallery({ images }: RoomGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const media = images; // includes both images and videos

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 1000 : -1000, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 1000 : -1000, opacity: 0 })
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => Math.abs(offset) * velocity;

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prev) => {
      const next = prev + newDirection;
      if (next < 0) return media.length - 1;
      if (next >= media.length) return 0;
      return next;
    });
  };

  const currentIsVideo = isVideo(media[currentIndex]);

  return (
    <div className="relative">
      {/* Viewer principal */}
      <div className="relative h-96 bg-slate-100 rounded-2xl overflow-hidden">
        <AnimatePresence initial={false} custom={direction}>
          {currentIsVideo ? (
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              className="absolute inset-0"
            >
              <video
                src={media[currentIndex]}
                controls
                className="w-full h-full object-contain bg-black"
                playsInline
              />
            </motion.div>
          ) : (
            <motion.img
              key={currentIndex}
              src={media[currentIndex]}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = swipePower(offset.x, velocity.x);
                if (swipe < -swipeConfidenceThreshold) paginate(1);
                else if (swipe > swipeConfidenceThreshold) paginate(-1);
              }}
              className="absolute w-full h-full object-contain cursor-grab active:cursor-grabbing"
              alt={`Room image ${currentIndex + 1}`}
            />
          )}
        </AnimatePresence>

        {/* Flechas */}
        {media.length > 1 && (
          <>
            <motion.button
              onClick={() => paginate(-1)}
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/95 p-2.5 rounded-full shadow-lg z-10"
            >
              <ChevronLeft className="w-5 h-5 text-slate-700" />
            </motion.button>
            <motion.button
              onClick={() => paginate(1)}
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/95 p-2.5 rounded-full shadow-lg z-10"
            >
              <ChevronRight className="w-5 h-5 text-slate-700" />
            </motion.button>
          </>
        )}

        {/* Dots */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
          {media.map((_, idx) => (
            <button
              key={idx}
              onClick={() => { setDirection(idx > currentIndex ? 1 : -1); setCurrentIndex(idx); }}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentIndex ? 'w-6 bg-[#E05A2B]' : 'w-1.5 bg-white/60 hover:bg-white/90'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Thumbnails */}
      <div className="grid grid-cols-4 gap-2 mt-3">
        {media.map((item, idx) => (
          <motion.button
            key={idx}
            onClick={() => { setDirection(idx > currentIndex ? 1 : -1); setCurrentIndex(idx); }}
            whileHover={{ scale: 0.97 }}
            whileTap={{ scale: 0.95 }}
            className={`relative h-20 rounded-xl overflow-hidden transition-all ${
              idx === currentIndex
                ? 'ring-2 ring-[#E05A2B] opacity-100'
                : 'opacity-55 hover:opacity-90'
            }`}
          >
            {isVideo(item) ? (
              <>
                <video src={item} className="w-full h-full object-cover" muted />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Play className="w-5 h-5 text-white fill-white" />
                </div>
              </>
            ) : (
              <img src={item} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}