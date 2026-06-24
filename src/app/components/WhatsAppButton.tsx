import { MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface WhatsAppButtonProps {
  message?: string;
  phoneNumber?: string;
  fullWidth?: boolean;
}

export function WhatsAppButton({
  message = "Hola! Me interesa una de las habitaciones disponibles en Barcelona. ¿Podéis darme más información sobre disponibilidad y precios? Muchas gracias 🙏",
  phoneNumber = "34632991218",
  fullWidth = false
}: WhatsAppButtonProps) {
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`${
        fullWidth ? 'w-full' : ''
      } inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all`}
    >
      <MessageCircle className="w-5 h-5" />
      <span>Contactar por WhatsApp</span>
    </motion.a>
  );
}