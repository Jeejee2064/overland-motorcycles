import Link from "next/link";

export default function ButtonPrimary({ href, text }) {
  return (
    <Link
      href={href}
      className="group relative inline-flex items-center justify-center px-8 py-4 bg-gradient-to-br from-yellow-400 to-yellow-500 text-gray-900 font-bold text-lg rounded-full shadow-2xl overflow-hidden min-w-[200px] transition-transform duration-200 hover:scale-105 active:scale-95"
    >
      <span className="relative z-10">{text}</span>
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-white/30 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"
      />
    </Link>
  );
}
