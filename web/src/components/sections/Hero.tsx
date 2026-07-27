import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async'; 

export const Hero = () => {
  const { t } = useTranslation();

  // Función para ir a Producto
  const scrollToProduct = () => {
    const element = document.getElementById('product');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Función para ir a Contacto
  const scrollToContact = () => {
    const element = document.getElementById('contacto');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* 2. CONFIGURACIÓN SEO ESPECÍFICA PARA LA HOME */}
      <Helmet>
        <title>North Labs | Ciberseguridad Industrial OT & NDR</title>
        <meta name="description" content="Especialistas en Ciberseguridad Industrial y soluciones NDR. Protegemos infraestructuras críticas y entornos OT con tecnología avanzada." />
        <meta name="keywords" content="NDR, Ciberseguridad Industrial, Seguridad OT, North Labs, Protección infraestructuras críticas" />
      </Helmet>

      <section
        id="home"
        className="relative min-h-[90vh] md:min-h-screen flex flex-col justify-center px-6 sm:px-10 md:px-24 pt-24 md:pt-32 pb-16 md:pb-20 overflow-hidden"
      >
        {/* Fondo de cuadrícula técnica */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:30px_30px] md:bg-[size:40px_40px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between w-full max-w-7xl mx-auto items-center gap-12 lg:gap-8">
          
          {/* PARTE IZQUIERDA */}
          <div className="max-w-3xl w-full">
            <div className="flex items-center gap-4 mb-6 md:mb-8">
              <div className="w-10 h-[1px] bg-north-cyan shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
              <span className="text-north-cyan font-mono text-[10px] tracking-[0.35em] uppercase font-bold">
                {t('hero.system_tag')}
              </span>
            </div>

            {/* H1: Punto clave para SEO */}
            <h1
              className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black uppercase leading-[0.95] sm:leading-[0.9] md:leading-[0.85] tracking-[-0.04em] mb-6 md:mb-8"
            >
              <span className="text-white block">{t('hero.title_1')}</span>
              <span className="text-white block">{t('hero.title_2')}</span>
              <span className="bg-gradient-to-r from-white via-white to-[#3c3c3c] bg-clip-text text-transparent">
                {t('hero.title_3')}
              </span>
            </h1>

            <p className="text-gray-400 font-sans text-sm sm:text-base lg:text-lg leading-relaxed max-w-xl mb-8 md:mb-10">
              {t('hero.description')}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 md:gap-6">
              {/* ACCESIBILIDAD: Añadido aria-label */}
              <button 
                onClick={scrollToContact}
                aria-label="Ir al formulario de contacto para solicitar demo"
                className="w-full sm:w-auto bg-north-cyan text-black px-8 py-4 font-mono text-sm font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:brightness-110 active:scale-95"
              >
                {t('hero.cta_demo')}
              </button>

              <button 
                onClick={scrollToProduct}
                aria-label="Ir a la sección de productos y servicios"
                className="w-full sm:w-auto border border-white/20 text-white px-8 py-4 font-mono text-sm uppercase tracking-widest hover:bg-white/5 transition-all duration-300 active:scale-95"
              >
                {t('hero.cta_discover')}
              </button>
            </div>
          </div>

          {/* TARJETAS DE STATS */}
          <div className="w-full lg:w-auto grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-col gap-4 md:gap-6 z-20">
            
            {/* Amenazas */}
            <div className="border border-white/10 p-5 md:p-8 backdrop-blur-sm transition-all duration-500 group hover:border-north-cyan hover:shadow-[0_0_20px_rgba(0,255,255,0.1)]">
              <div className="flex items-center gap-4 mb-4">
                <svg className="w-6 h-6 md:w-8 md:h-8 text-north-cyan" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <div className="text-north-cyan text-[9px] md:text-[10px] font-mono uppercase tracking-widest leading-tight">
                  {t('hero.stats.threats')}
                </div>
              </div>
              <div className="text-white font-mono text-2xl md:text-3xl font-bold group-hover:text-north-cyan transition-colors">
                100%
              </div>
            </div>

            {/* Actividad */}
            <div className="border border-white/10 p-5 md:p-8 backdrop-blur-sm transition-all duration-500 group hover:border-north-cyan hover:shadow-[0_0_20px_rgba(0,255,255,0.1)]">
              <div className="flex items-center gap-4 mb-4">
                <svg className="w-6 h-6 md:w-8 md:h-8 text-north-cyan" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
                <div className="text-north-cyan text-[9px] md:text-[10px] font-mono uppercase tracking-widest leading-tight">
                  {t('hero.stats.uptime')}
                </div>
              </div>
              <div className="text-white font-mono text-2xl md:text-3xl font-bold group-hover:text-north-cyan transition-colors">
                24/7
              </div>
            </div>

            {/* Encriptación */}
            <div className="border border-white/10 p-5 md:p-8 backdrop-blur-sm transition-all duration-500 group hover:border-north-cyan hover:shadow-[0_0_20px_rgba(0,255,255,0.1)]">
              <div className="flex items-center gap-4 mb-4">
                <svg className="w-6 h-6 md:w-8 md:h-8 text-north-cyan" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                </svg>
                <div className="text-north-cyan text-[9px] md:text-[10px] font-mono uppercase tracking-widest leading-tight">
                  {t('hero.stats.encryption')}
                </div>
              </div>
              <div className="text-white font-mono text-2xl md:text-3xl font-bold group-hover:text-north-cyan transition-colors">
                AES-256
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
};