import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

export const Privacidad = () => {
  const { t } = useTranslation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    {
      id: 1,
      title: t('privacy.sections.responsable.title'),
      content: (
        <address className="space-y-2 not-italic">
          <p><span className="text-[#00ffff] font-bold">{t('privacy.sections.responsable.holder')}:</span> Innovation & NORTH LABS SL</p>
          <p><span className="text-[#00ffff] font-bold">{t('privacy.sections.responsable.address')}:</span> Calle Peña Brava 21, oficina 1B, PI de Silvota, Llanera, CP 33192</p>
          <p><span className="text-[#00ffff] font-bold">{t('privacy.sections.responsable.nif')}:</span> B22966139</p>
          <p><span className="text-[#00ffff] font-bold">{t('privacy.sections.responsable.email')}:</span> <a href="mailto:info@secnorthlabs.eu" className="hover:underline">info@secnorthlabs.eu</a></p>
        </address>
      )
    },
    {
      id: 2,
      title: t('privacy.sections.finalidades.title'),
      content: (
        <div className="space-y-4">
          <p className="text-gray-300 font-bold">{t('privacy.sections.finalidades.intro')}</p>
          <ul className="list-disc ml-5 space-y-2">
            {(t('privacy.sections.finalidades.list', { returnObjects: true }) as string[]).map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )
    },
    {
      id: 3,
      title: t('privacy.sections.legitimacion.title'),
      content: (
        <div className="space-y-4">
          {(t('privacy.sections.legitimacion.content', { returnObjects: true }) as string[]).map((item, index) => (
            <p key={index}>{item}</p>
          ))}
        </div>
      )
    },
    {
      id: 4,
      title: t('privacy.sections.categorias.title'),
      content: (
        <div className="space-y-4">
          <ul className="list-disc ml-5 space-y-2">
            {(t('privacy.sections.categorias.list', { returnObjects: true }) as string[]).map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
          <p className="border-t border-white/5 pt-4 text-[11px] text-gray-500 italic">
            {t('privacy.sections.categorias.note')}
          </p>
        </div>
      )
    },
    {
      id: 5,
      title: t('privacy.sections.comunicaciones.title'),
      content: (
        <ul className="list-disc ml-5 space-y-2">
          {(t('privacy.sections.comunicaciones.list', { returnObjects: true }) as string[]).map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      )
    },
    {
      id: 6,
      title: t('privacy.sections.transferencias.title'),
      content: <p>{t('privacy.sections.transferencias.content')}</p>
    },
    {
      id: 7,
      title: t('privacy.sections.conservacion.title'),
      content: (
        <div className="space-y-4">
          {(t('privacy.sections.conservacion.content', { returnObjects: true }) as string[]).map((item, index) => (
            <p key={index}>{item}</p>
          ))}
        </div>
      )
    },
    {
      id: 8,
      title: t('privacy.sections.derechos.title'),
      content: (
        <ul className="list-disc ml-5 space-y-2">
          {(t('privacy.sections.derechos.list', { returnObjects: true }) as string[]).map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      )
    },
    {
      id: 9,
      title: t('privacy.sections.seguridad.title'),
      content: (
        <div className="space-y-4">
          {(t('privacy.sections.seguridad.content', { returnObjects: true }) as string[]).map((item, index) => (
            <p key={index}>{item}</p>
          ))}
        </div>
      )
    }
  ];

  return (
    <main className="bg-[#050505] min-h-screen pt-32 pb-20 px-6 font-sans selection:bg-[#00ffff] selection:text-black">
      <article className="max-w-4xl mx-auto">
        
        {/* Encabezado */}
        <header className="mb-16">
          <Link 
            to="/" 
            className="text-[#00ffff] font-mono text-[10px] uppercase tracking-[0.3em] hover:text-white transition-colors flex items-center gap-2"
            aria-label={t('privacy.back')}
          >
            <span>&larr;</span> {t('privacy.back')}
          </Link>
          <h1 className="text-white text-5xl md:text-6xl font-bold uppercase tracking-tighter mt-6">
            {t('privacy.title')} <span className="text-[#00ffff]">{t('privacy.titleHighlight')}</span>
          </h1>
          <p className="text-gray-500 mt-4 text-xs font-mono uppercase tracking-widest">
            {t('privacy.lastUpdate', 'Última actualización: Marzo 2026')}
          </p>
        </header>

        {/* Lista de Secciones Semántica */}
        <div className="flex flex-col gap-6">
          {sections.map((section) => (
            <section 
              key={section.id}
              className="group bg-[#0a0a0a] border border-white/10 p-8 transition-all duration-300 
                         hover:border-[#00ffff]/40 rounded-sm"
            >
              <div className="flex items-center mb-6">
                <h2 className="text-white font-bold uppercase tracking-widest text-sm flex items-center">
                  <span className="text-[#00ffff] font-mono mr-4 text-xs opacity-70">0{section.id}.</span>
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