import { motion } from "framer-motion";
import Link from "next/link";

export default function ButtonPrimary({ href, text }) {
  return (
    <Link href={href} className="group">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative px-8 py-4 bg-gradient-to-br from-yellow-400 to-yellow-500 text-gray-900 font-bold text-lg rounded-full shadow-2xl overflow-hidden min-w-[200px]"
      >
        <span className="relative z-10">{text}</span>
        <motion.div
          className="absolute inset-0 bg-white/30 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"
        />
      </motion.button>
    </Link>
  );
}
