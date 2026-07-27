import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Menu, X } from 'lucide-react';

export const Navbar = () => {
  const { t, i18n } = useTranslation(); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-[150] nav-glass h-20 bg-black/80 backdrop-blur-md border-b border-white/5">
        <div className="w-full h-full flex items-center justify-between px-6 md:px-12">
          
          {/* LOGO (Izquierda) */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-5 h-5 bg-accent-cyan logo-glow"></div>
            <div className="flex flex-col leading-none">
              <span className="font-display font-bold text-xl tracking-tighter uppercase text-white">
                North <span className="text-white">Labs</span>
              </span>
              <span className="text-[7px] text-gray-300 tracking-[0.2em] uppercase mt-1">
                INNOVATION & SECURITY
              </span>
            </div>
          </div>

          {/* CONTENEDOR DERECHA (Idioma + Menú) */}
          <div className="flex items-center gap-4 ml-auto">

            {/* ENLACES ESCRITORIO  */}
            <div className="hidden md:flex items-center gap-8 font-mono uppercase tracking-widest text-gray-400 mr-6">
              <a href="/#home" className="nav-link transition-colors text-[11px]">{t('nav.home')}</a>
              <a href="/#about" className="nav-link transition-colors text-[11px]">{t('nav.about')}</a>
              <a href="/#product" className="nav-link transition-colors text-white text-[11px]">{t('nav.product')}</a>
              <a href="/#contacto" className="nav-link transition-colors text-[11px]">{t('nav.contact')}</a>
            </div>
            {/* SELECTOR DE IDIOMA: Visible en móvil y escritorio */}
            <div className="flex items-center gap-2 font-mono text-[10px] md:text-xs border-r border-white/10 pr-4 md:pr-6">
              <Globe size={14} className="text-accent-cyan" />
              <div className="flex gap-1.5 text-gray-500">
                <button
                  onClick={() => changeLanguage('es')}
                  className={`cursor-pointer hover:text-white transition-colors ${i18n.language === 'es' ? 'text-white font-bold' : ''}`}
                >ES</button>
                <span className="opacity-30">/</span>
                <button
                  onClick={() => changeLanguage('en')}
                  className={`cursor-pointer hover:text-white transition-colors ${i18n.language === 'en' ? 'text-white font-bold' : ''}`}
                >EN</button>
              </div>
            </div>

            {/* BOTÓN PARTNER ESCRITORIO */}
            <button className="hidden md:block bg-north-cyan text-black px-6 py-2 text-[11px] font-mono font-bold uppercase tracking-widest hover:bg-white transition-all duration-300">
              {t('nav.partner')}
            </button>

            {/* BOTÓN MÓVIL (Hamburguesa) */}
            <button 
              className="md:hidden text-white z-[160] relative p-2" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </nav>

      {/* OVERLAY (Fondo oscurecido) */}
      <div 
        className={`fixed inset-0 bg-black/40 z-[130] md:hidden transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* CAJA DE MENÚ EN LA ESQUINA (Solo Móvil) */}
      <div className={`
        fixed top-20 right-0 w-[220px] bg-black z-[140] md:hidden
        transform transition-all duration-300 ease-in-out border-l border-b border-white/10
        shadow-[-15px_15px_40px_rgba(0,0,0,0.8)]
        ${isMobileMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}>
        <nav className="flex flex-col py-6 px-6 gap-5 text-right font-display">
          {[
            { name: t('nav.home'), href: "/#home" },
            { name: t('nav.about'), href: "/#about" },
            { name: t('nav.product'), href: "/#product" },
            { name: t('nav.contact'), href: "/#contacto" }
          ].map((item, i) => (
            <a
              key={i}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm font-black uppercase tracking-[0.2em] text-white hover:text-accent-cyan transition-colors"
            >
              {item.name}
            </a>
          ))}

          <div className="w-full h-[1px] bg-white/10 my-1" />

          {/* BOTÓN HAZTE PARTNER (Mismo color que Navbar) */}
          <button className="bg-north-cyan text-black py-3 px-4 font-mono text-[9px] font-bold uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_15px_rgba(0,255,255,0.2)]">
            {t('nav.partner')}
          </button>
        </nav>
      </div>
    </>
  );
};