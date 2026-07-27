import { useTranslation } from 'react-i18next';

export const AboutUs = () => {
  const { t } = useTranslation();

  return (

    <section 
      id="about" 
      className="py-24 px-6 md:px-16 lg:px-24 bg-[#050505]"
      aria-labelledby="about-title"
    >
      {/* Etiqueta superior estilo terminal */}
      <div className="flex justify-start mb-8">
        <div className="tarjeta-redondeada inline-flex items-center gap-2 border border-[#00ffff]/30 bg-[#00ffff]/10 px-4 py-1.5 rounded-full">
          <svg 
            viewBox="0 0 24 24" 
            className="w-3.5 h-3.5 text-[#00ffff] fill-current"
            aria-hidden="true" 
          >
            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
          </svg>
          <span className="font-mono text-[#00ffff] text-[11px] tracking-[0.2em] uppercase font-bold">
            {t('about.tag')}
          </span>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        
        {/* LADO IZQUIERDO: TEXTO E ICONOS */}
        <div className="space-y-12">
          <div className="space-y-6">
            <h2 id="about-title" className="font-display text-4xl md:text-6xl font-bold text-white leading-tight uppercase tracking-tighter">
              {t('about.title_main')} <br />
              <span className="text-white/40">{t('about.title_sub')}</span>
            </h2>
            <p className="font-sans text-gray-400 text-lg leading-relaxed max-w-xl">
              {t('about.description')}
            </p>
          </div>

          {/* Grid de mini-features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
            
            {/* Feature 1: Equipo Multidisciplinar */}
            <article className="flex flex-col items-start space-y-4">
              <div className="w-10 h-10 bg-white/5 flex items-center justify-center" aria-hidden="true">
                <svg className="w-5 h-5 text-[#00ffff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="space-y-2">
                <h4 className="font-display text-white font-bold uppercase text-[15px] tracking-tight">
                  {t('about.features.team_title')}
                </h4>
                <p className="font-sans text-gray-400 text-[13px] leading-relaxed max-w-[240px]">
                  {t('about.features.team_desc')}
                </p>
              </div>
            </article>

            {/* Feature 2: I+D Propio */}
            <article className="flex flex-col items-start space-y-4">
              <div className="w-10 h-10 bg-white/5 flex items-center justify-center" aria-hidden="true">
                <svg className="w-5 h-5 text-[#00ffff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="space-y-2">
                <h4 className="font-display text-white font-bold uppercase text-[15px] tracking-tight">
                  {t('about.features.rd_title')}
                </h4>
                <p className="font-sans text-gray-400 text-[13px] leading-relaxed max-w-[240px]">
                  {t('about.features.rd_desc')}
                </p>
              </div>
            </article>

            {/* Feature 3: Visión Global */}
            <article className="flex flex-col items-start space-y-4">
              <div className="w-10 h-10 bg-white/5 flex items-center justify-center" aria-hidden="true">
                <svg className="w-5 h-5 text-[#00ffff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <div className="space-y-2">
                <h4 className="font-display text-white font-bold uppercase text-[15px] tracking-tight">
                  {t('about.features.vision_title')}
                </h4>
                <p className="font-sans text-gray-400 text-[13px] leading-relaxed max-w-[240px]">
                  {t('about.features.vision_desc')}
                </p>
              </div>
            </article>
          </div>
        </div>

        {/* LADO DERECHO: TARJETAS DE SERVICIO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Card: Consultoria */}
          <div className="bg-[#0a0a0a] border border-white/5 p-8 hover:border-[#00ffff]/40 transition-all duration-500 group flex flex-col justify-end min-h-[300px]">
             <h3 className="font-display text-white text-xl font-bold uppercase mb-2">{t('about.services.consulting')}</h3>
             <p className="font-sans text-gray-500 text-sm">{t('about.services.consulting_desc')}</p>
          </div>

          {/* Card: Despliegue */}
          <div className="bg-[#0a0a0a] border border-white/5 p-8 hover:border-[#00ffff]/40 transition-all duration-500 group flex flex-col justify-end min-h-[300px]">
             <h3 className="font-display text-white text-xl font-bold uppercase mb-2">{t('about.services.deployment')}</h3>
             <p className="font-sans text-gray-500 text-sm">{t('about.services.deployment_desc')}</p>
          </div>

          {/* Card: Monitorización */}
          <div className="bg-[#0a0a0a] border border-white/5 p-8 hover:border-[#00ffff]/40 transition-all duration-500 group flex flex-col justify-end min-h-[300px]">
             <h3 className="font-display text-white text-xl font-bold uppercase mb-2">{t('about.services.monitoring')}</h3>
             <p className="font-sans text-gray-500 text-sm">{t('about.services.monitoring_desc')}</p>
          </div>

          {/* Card: Respuesta */}
          <div className="bg-[#0a0a0a] border border-white/5 p-8 hover:border-[#00ffff]/40 transition-all duration-500 group flex flex-col justify-end min-h-[300px]">
             <h3 className="font-display text-white text-xl font-bold uppercase mb-2">{t('about.services.response')}</h3>
             <p className="font-sans text-gray-500 text-sm">{t('about.services.response_desc')}</p>
          </div>
        </div>
      </div>
    </section>
  );
};