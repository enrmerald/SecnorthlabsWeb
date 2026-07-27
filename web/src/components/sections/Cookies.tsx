import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

export const Cookies = () => {
  const { t } = useTranslation();


  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    {
      id: 1,
      title: t('cookies.sections.info.title'),
      content: (
        <div className="space-y-4">
          {(t('cookies.sections.info.paragraphs', { returnObjects: true }) as string[]).map((p, index) => (
            <p key={index}>{p}</p>
          ))}
        </div>
      )
    },
  ];

  return (
    <main className="bg-[#050505] min-h-screen pt-32 pb-20 px-6 font-sans selection:bg-[#00ffff] selection:text-black">
      <article className="max-w-4xl mx-auto">
        
        {/* Encabezado Semántico */}
        <header className="mb-16">
          <Link 
            to="/" 
            className="text-[#00ffff] font-mono text-[10px] uppercase tracking-[0.3em] hover:text-white transition-colors flex items-center gap-2"
            aria-label={t('cookies.back')}
          >
            <span>&larr;</span> {t('cookies.back')}
          </Link>
          <h1 className="text-white text-5xl md:text-6xl font-bold uppercase tracking-tighter mt-6">
            {t('cookies.title')} <span className="text-[#00ffff]">{t('cookies.titleHighlight')}</span>
          </h1>
        </header>

        {/* Lista de Secciones con efecto Glassmorphism suave */}
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