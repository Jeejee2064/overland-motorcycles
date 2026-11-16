import Image from 'next/image';
import Link from 'next/link';

// Logo + accent bottom border, same look as the public navigation (dark bar, yellow rule).
export default function CustomerBrandBar({ homeHref = '/' }) {
  return (
    <header className="bg-white border-b-2 border-accent">
      <div className="max-w-2xl mx-auto px-4 h-16 flex items-center">
        <Link href={homeHref} className="relative block w-12 h-12" aria-label="Overland Motorcycles">
          <Image src="/logo.png" alt="Overland Motorcycles" fill sizes="48px" className="object-contain" priority />
        </Link>
      </div>
    </header>
  );
}
