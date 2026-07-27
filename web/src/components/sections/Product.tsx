import { useTranslation } from 'react-i18next';

export const Product = () => {
  const { t } = useTranslation();

  const pocSteps = t('product.poc.steps', { returnObjects: true });
  const pocStepsArray = Array.isArray(pocSteps) ? pocSteps : [];

  return (
    <section 
      id="product" 
      className="py-24 px-6 md:px-16 lg:px-24 bg-[#050505] text-white"
      aria-labelledby="product-title"
    > 
      {/* Cabecera y badge */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center gap-2 border border-[#00ffff]/30 bg-[#00ffff]/10 px-4 py-1 rounded-full">
          <span className="font-mono text-[#00ffff] text-[10px] tracking-[0.2em] uppercase font-bold">
            {t('product.badge')}
          </span>
        </div>
      </div>

      <div className="text-center mb-20 space-y-6">
        <h2 id="product-title" className="font-display text-5xl md:text-7xl font-bold tracking-tighter ">
          {t('product.title_main')} <span className="text-[#00ffff]">{t('product.title_sub')}</span>
        </h2>
        <p className="font-sans text-gray-400 text-lg leading-relaxed max-w-3xl mx-auto">
          {t('product.description')}
        </p>
      </div>

      {/* Grid de beneficios  */}
      <div className="grid lg:grid-cols-4 gap-4 mb-4">
        {[
          { icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z", title: 'visibility', desc: 'visibility_desc' },
          { icon: "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z", title: 'ai', desc: 'ai_desc' },
          { icon: "M9 3v2m6-2v2", title: 'interrupt', desc: 'interrupt_desc', specialIcon: true },
          { icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", title: 'sovereignty', desc: 'sovereignty_desc' }
        ].map((item, idx) => (
          <article key={idx} className="bg-[#0a0a0a] border border-white/5 p-8 hover:border-[#00ffff]/30 transition-all duration-500 group">
            <div className="w-10 h-10 bg-white/5 flex items-center justify-center mb-6" aria-hidden="true">
              <svg className="w-5 h-5 text-[#00ffff]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                {item.specialIcon ? (
                  <>
                    <rect x="9" y="3" width="6" height="6" rx="1" /><rect x="3" y="15" width="6" height="6" rx="1" /><rect x="15" y="15" width="6" height="6" rx="1" /><path d="M12 9v3m0 0H6v3m6-3h6v3" />
                  </>
                ) : (
                  <path d={item.icon} />
                )}
              </svg>
            </div>
            <h3 className="font-display text-base font-bold uppercase mb-3">{t(`product.benefits.${item.title}_title`)}</h3>
            <p className="font-sans text-gray-500 text-xs leading-relaxed">{t(`product.benefits.${item.desc}`)}</p>
          </article>
        ))}
      </div>

      {/* Sección PoC */}
      <div className="bg-[#0a0a0a] border border-white/5 p-10 md:p-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="font-display text-4xl font-bold text-white uppercase">{t('product.poc.title')}</h2>
            <p className="font-sans text-gray-400 text-sm leading-relaxed max-w-md">{t('product.poc.description')}</p>
            
            {/* ACCESIBILIDAD: Lista con rol definido */}
            <ul className="space-y-4" role="list">
              {pocStepsArray.map((step: string, idx: number) => (
                <li key={idx} className="flex items-center gap-3 text-gray-300 font-sans text-sm">
                  <div className="w-5 h-5 rounded-full border border-[#00ffff]/40 flex items-center justify-center" aria-hidden="true">
                    <svg className="w-3 h-3 text-[#00ffff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>{step}</span>
                </li>
              ))}
            </ul>

            <button 
              aria-label="Contactar para iniciar una prueba de concepto"
              className="bg-white text-black font-display font-black text-[13px] tracking-[0.2em] px-7 py-4 hover:bg-[#c7c7c6] transition-all"
            >
              {t('product.poc.cta')}
            </button>
          </div>

          {/* Caja de Análisis Semanas */}
          <div className="bg-black/40 border border-white/5 p-12 md:p-20 flex flex-col items-center text-center" aria-hidden="true">
            <span className="font-display font-bold text-white/10 text-7xl md:text-9xl mb-4">{t('product.poc.weeks')}</span>
            <p className="font-display text-[#00ffff] text-sm font-bold uppercase tracking-widest">{t('product.poc.weeks_label')}</p>
            <div className="w-12 h-[1px] bg-[#00ffff]/30 my-4" />
            <p className="font-mono text-gray-600 text-[10px] uppercase tracking-widest">{t('product.poc.phase_label')}</p>
          </div>
        </div>
      </div>
    </section>
  );
};