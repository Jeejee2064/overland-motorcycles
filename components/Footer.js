import { Clock, Phone, Mail, MapPin, Facebook, Instagram } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';

const Footer = () => {
  const t = useTranslations('Footer');

  const socialLinks = [
    {
      name: 'Facebook',
      icon: Facebook,
      href: 'https://www.facebook.com/profile.php?id=61573828461831',
      color: 'hover:text-blue-400'
    },
    {
      name: 'Instagram', 
      icon: Instagram,
      href: 'https://www.instagram.com/overlandmotorcycles/',
      color: 'hover:text-pink-400'
    }
  ];

  return (
    <footer className="bg-background border-t border-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-12">
          
          {/* Company Info & Logo */}
          <div className="lg:col-span-2 text-center md:text-left">
            <div className="mb-8 flex justify-center md:justify-start">
              <Image
                src="/LOGOBL.svg"
                alt="Overland Motorcycles"
                width={280}
                height={120}
                className="h-20 w-auto"
              />
            </div>
            <p className="text-gris text-lg mb-8 leading-relaxed max-w-md mx-auto md:mx-0">
              {t('description')}
            </p>
            
            {/* Social Media */}
            <div className="space-y-4">
              <h4 className="text-accent font-semibold text-lg">{t('followUs')}</h4>
              <div className="flex justify-center md:justify-start space-x-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    className={`w-12 h-12 bg-gris/10 rounded-full flex items-center justify-center text-gris transition-all duration-300 ${social.color} hover:bg-accent/10 border border-gris/20 hover:border-accent/50`}
                  >
                    <social.icon size={20} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Opening Hours */}
          <div className="text-center md:text-left">
            <h4 className="text-accent font-semibold text-lg mb-6 flex items-center justify-center md:justify-start gap-2">
              <Clock size={20} />
              {t('openingHours')}
            </h4>
            <div className="space-y-4">
              <div className="flex flex-col">
                <span className="text-white font-medium">{t('weekdays')}</span>
                <span className="text-gris">{t('weekdayHours')}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-white font-medium">{t('weekend')}</span>
                <span className="text-gris">{t('weekendHours')}</span>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="text-center md:text-left">
            <h4 className="text-accent font-semibold text-lg mb-6">{t('getInTouch')}</h4>
            <div className="space-y-4">
              
              {/* Address */}
              <div className="flex items-start gap-3 justify-center md:justify-start">
                <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center mt-1 flex-shrink-0">
                  <MapPin size={14} className="text-accent" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <p className="text-gris leading-relaxed">
                    {t('address')}
                  </p>
                </div>
              </div>

              {/* Email */}
              <a 
                href="mailto:overlandmotorcycles@gmail.com"
                className="flex items-center gap-3 text-gris hover:text-accent transition-all duration-300 justify-center md:justify-start group hover:scale-105"
              >
                <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-accent/30 transition-colors duration-300">
                  <Mail size={14} className="text-accent" />
                </div>
                <span className="group-hover:translate-x-1 transition-transform duration-300">{t('email')}</span>
              </a>

              {/* WhatsApp */}
              <a 
                href="https://wa.me/50768051100"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-gris hover:text-accent transition-all duration-300 justify-center md:justify-start group hover:scale-105"
              >
                <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-accent/30 transition-colors duration-300">
                  <Phone size={14} className="text-accent" />
                </div>
                <span className="group-hover:translate-x-1 transition-transform duration-300">{t('phone')}</span>
              </a>

            </div>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gris/20 bg-background/50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <p className="text-gris text-sm">
              © 2025 {t('companyName')}. {t('allRightsReserved')}
            </p>
            
            <div className="flex gap-6 text-sm">
              <Link href="/privacy" className="text-gris hover:text-accent transition-colors duration-300">
                {t('privacy')}
              </Link>
              <Link href="/terms" className="text-gris hover:text-accent transition-colors duration-300">
                {t('terms')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;