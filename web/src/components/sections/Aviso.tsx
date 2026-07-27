import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

export const Aviso = () => {
  const { t } = useTranslation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    {
      id: 1,
      title: t('legal.sections.responsable.title'),
      content: (
        <address className="space-y-2 not-italic">
          <p><span className="text-[#00ffff] font-bold">{t('legal.sections.responsable.holder')}:</span> Innovation & NORTH LABS SL</p>
          <p><span className="text-[#00ffff] font-bold">{t('legal.sections.responsable.address')}:</span> Calle Peña Brava 21, oficina 1B, PI de Silvota, Llanera, CP 33192</p>
          <p><span className="text-[#00ffff] font-bold">{t('legal.sections.responsable.nif')}:</span> B22966139</p>
          <p><span className="text-[#00ffff] font-bold">{t('legal.sections.responsable.email')}:</span> <a href="mailto:info@secnorthlabs.eu" className="hover:underline">info@secnorthlabs.eu</a></p>
        </address>
      )
    },
    {
      id: 2,
      title: t('legal.sections.objeto.title'),
      content: (
        <div className="space-y-4">
          <p>{t('legal.sections.objeto.p1')}</p>
          <p>{t('legal.sections.objeto.p2')}</p>
        </div>
      )
    },
    {
      id: 3,
      title: t('legal.sections.propiedad.title'),
      content: (
        <div className="space-y-4">
          <p>{t('legal.sections.propiedad.p1')}</p>
          <p>{t('legal.sections.propiedad.p2')}</p>
          <p>{t('legal.sections.propiedad.p3')}</p>
        </div>
      )
    },
    {
      id: 4,
      title: t('legal.sections.enlaces.title'),
      content: (
        <div className="space-y-4">
          <p>{t('legal.sections.enlaces.p1')}</p>
          <p>{t('legal.sections.enlaces.p2')}</p>
          <p>{t('legal.sections.enlaces.p3')}</p>
        </div>
      )
    },
    {
      id: 5,
      title: t('legal.sections.uso.title'),
      content: (
        <div className="space-y-4">
          <p>{t('legal.sections.uso.p1')}</p>
          <p>{t('legal.sections.uso.p2')}</p>
        </div>
      )
    },
    {
      id: 6,
      title: t('legal.sections.exclusion.title'),
      content: (
        <div className="space-y-4">
          <p>{t('legal.sections.exclusion.p1')}</p>
          <p>{t('legal.sections.exclusion.p2')}</p>
          <p>{t('legal.sections.exclusion.p3')}</p>
          <p>{t('legal.sections.exclusion.p4')}</p>
          <p>{t('legal.sections.exclusion.p5')}</p>
        </div>
      )
    },
    {
      id: 7,
      title: t('legal.sections.proteccion.title'),
      content: (
        <div className="space-y-4">
          <p>{t('legal.sections.proteccion.p1')}</p>
          <p>{t('legal.sections.proteccion.p2')}</p>
        </div>
      )
    },
    {
      id: 8,
      title: t('legal.sections.cookies.title'),
      content: (
        <div className="space-y-4">
          <p>{t('legal.sections.cookies.content')}</p>
        </div>
      )
    },
    {
      id: 9,
      title: t('legal.sections.miscelanea.title'),
      content: (
        <div className="space-y-4">
          <p>{t('legal.sections.miscelanea.p1')}</p>
        </div>
      )
    },
    {
      id: 10,
      title: t('legal.sections.jurisdiccion.title'),
      content: (
        <div className="space-y-4">
          <p>{t('legal.sections.jurisdiccion.p1')}</p>
          <p>{t('legal.sections.jurisdiccion.p2')}</p>
        </div>
      )
    }
  ];

  return (
    <main className="bg-[#050505] min-h-screen pt-32 pb-20 px-6 font-sans selection:bg-[#00ffff] selection:text-black">
      <article className="max-w-4xl mx-auto">
        
        {/* Encabezado Semántico */}
        <header className="mb-16">
          <Link 
            to="/" 
            className="text-[#00ffff] font-mono text-[10px] uppercase tracking-[0.3em] hover:text-white transition-colors flex items-center gap-2"
            aria-label={t('legal.back')}
          >
            <span>&larr;</span> {t('legal.back')}
          </Link>
          <h1 className="text-white text-5xl md:text-6xl font-bold uppercase tracking-tighter mt-6">
            {t('legal.title')} <span className="text-[#00ffff]">{t('legal.titleHighlight')}</span>
          </h1>
        </header>

        {/* Lista de Secciones */}
        <div className="flex flex-col gap-6">
          {sections.map((section) => (
            <section 
              key={section.id}
              className="group bg-[#0a0a0a] border border-white/10 p-8 transition-all duration-300 
                         hover:border-[#00ffff]/40 rounded-sm"
            >
              <div className="flex items-center mb-6">
                <h2 className="text-white font-bold uppercase tracking-widest text-sm flex items-center">
                  <span className="text-[#00ffff] font-mono mr-4 text-xs opacity-70">
                    {section.id < 10 ? `0${section.id}` : section.id}.
                  </span>
                  {section.title}
                </h2>
              </div>
              
              <div className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-200 transition-colors">
                {section.content}
              </div>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
};