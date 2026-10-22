import { MessageCircle } from 'lucide-react';

export default function TourWhatsAppButton({ href, text, variant = 'primary' }) {
  const styles =
    variant === 'primary'
      ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-gray-900 shadow-2xl hover:scale-105'
      : 'border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-gray-900';

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 px-8 py-4 font-bold text-lg rounded-full transition duration-300 min-w-[200px] ${styles}`}
    >
      <MessageCircle size={20} />
      {text}
    </a>
  );
}
