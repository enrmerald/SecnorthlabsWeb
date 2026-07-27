import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom'; 

export const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-[#050505] border-t border-white/5 pt-20 pb-10 px-6 md:px-24">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12">
        
        {/* LOGO Y DESC */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            {/* Accesibilidad: aria-hidden porque el logo es decorativo, el nombre está al lado */}
            <div className="w-5 h-5 bg-accent-cyan logo-glow flex-shrink-0" aria-hidden="true">
              <div className="w-full h-full border-[3px] border-black"></div>
            </div>
            <span className="font-bold text-xl tracking-tighter text-white uppercase">
              NORTH <span className="text-accent-cyan">LABS</span>
            </span>
          </div>
          {/* Texto traducido */}
          <p className="text-gray-500 text-[10px] md:text-xs leading-relaxed max-w-xs uppercase tracking-wider">
            {t('footer.description')}
          </p>
        </div>

        {/* LEGAL - ACCESIBILIDAD: Añadimos <nav> y aria-label */}
        <nav className="space-y-6 text-left md:text-right" aria-label="Footer Navigation">
          <h4 className="font-mono text-[10px] text-[#00ffff] uppercase tracking-widest font-bold">
            {t('footer.legal_title')}
          </h4>
          <ul className="space-y-4 text-gray-400 text-xs uppercase tracking-widest">
            <li>
              <Link to="/politica-privacidad" className="hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-accent-cyan">
                {t('footer.privacy')}
              </Link>
            </li>
            <li> 
              <Link to="/aviso-legal" className="hover:text-white cursor-pointer transition-colors focus:outline-none focus:ring-1 focus:ring-accent-cyan">
                {t('footer.legal_notice')}
              </Link>
            </li>
            <li>
              <Link to="/cookies" className="hover:text-white cursor-pointer transition-colors focus:outline-none focus:ring-1 focus:ring-accent-cyan">
                {t('footer.cookies')}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
};