import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NotFound = () => {
  const { t } = useTranslation();

  return (
    <section className="min-h-screen bg-[#050505] flex items-center justify-center px-6 overflow-hidden relative">
      
      {/* CAPA DE LLUVIA BINARIA DENSA */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(40)].map((_, i) => (
          <div 
            key={i}
            className="absolute text-[#00ffff] font-mono text-[8px] md:text-[11px] leading-none opacity-[0.12] animate-fall"
            style={{
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 5 + 2}s`, 
              animationDelay: `${Math.random() * 8}s`,        
            }}
          >
            
            {Array.from({ length: 60 }, () => (Math.random() > 0.5 ? "0" : "1")).map((bit, idx) => (
              <div key={idx} className="my-1">{bit}</div>
            ))}
          </div>
        ))}
      </div>

      {/* Luces de fondo estilo North Labs */}
      <div className="absolute w-[400px] h-[400px] bg-[#00ffff]/5 rounded-full blur-[150px] -top-20 -left-20" />
      <div className="absolute w-[400px] h-[400px] bg-[#00ffff]/5 rounded-full blur-[150px] -bottom-20 -right-20" />
      
      <div className="text-center z-10">
        <h1 className="font-display text-[150px] md:text-[200px] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-[#00ffff] to-[#008b8b] drop-shadow-[0_0_20px_rgba(0,255,255,0.4)] select-none">
          404
        </h1>

        <div className="space-y-6 -mt-4">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white uppercase tracking-[0.2em]">
            {t('notfound.title', 'Conexión Interrumpida')}
          </h2>

          <div className="w-24 h-[1px] bg-[#00ffff] mx-auto shadow-[0_0_15px_#00ffff]" />
          
          <p className="font-sans text-gray-400 text-sm md:text-base max-w-sm mx-auto leading-relaxed">
            {t('notfound.description', 'El sistema no ha podido localizar la dirección solicitada.')}
          </p>

          <div className="pt-8">
            <Link
              to="/"
              className="inline-block bg-transparent border border-[#00ffff]/50 text-[#00ffff] font-display font-black uppercase text-[10px] tracking-[0.3em] px-10 py-5 hover:bg-[#00ffff] hover:text-black transition-all duration-300 shadow-[0_0_15px_rgba(0,255,255,0.1)] hover:shadow-[0_0_30px_rgba(0,255,255,0.4)]"
            >
              {t('notfound.back_home', 'Reiniciar Sistema')}
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fall {
          0% { 
            transform: translateY(-110%); 
            opacity: 0; 
          }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { 
            transform: translateY(120vh); 
            opacity: 0; 
          }
        }
        .animate-fall {
          animation-name: fall;
          animation-iteration-count: infinite;
          animation-timing-function: linear;
        }
      `}</style>
    </section>
  );
};

export default NotFound;