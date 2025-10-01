import { motion } from "framer-motion";
import Link from "next/link";

export default function ButtonSecondary({ href, text, theme = "dark" }) {
  // Dark = button on a dark background (white text / yellow border)
  // Light = button on a white background (dark text / yellow border)
  const styles =
    theme === "dark"
      ? "border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-background"
      : "border-yellow-500 text-background hover:bg-yellow-500 hover:text-white";

  return (
    <Link href={href} className="group">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`relative px-8 py-4 bg-transparent border-2 font-bold text-lg rounded-full overflow-hidden min-w-[200px] transition-colors duration-300 ${styles}`}
      >
        {/* background animation */}
        <motion.div
          className={`absolute inset-0 ${
            theme === "dark" ? "bg-yellow-400" : "bg-yellow-500"
          } scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}
        />
        <span className="relative z-10">{text}</span>
      </motion.button>
    </Link>
  );
}
