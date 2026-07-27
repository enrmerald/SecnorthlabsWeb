export const AdminMessages = () => {
  const mensajes = JSON.parse(localStorage.getItem('mensajes_contacto') || '[]');

  return (
    <div className="bg-[#050505] min-h-screen p-10 font-sans">
      <h1 className="text-[#00ffff] font-mono text-xs uppercase tracking-[0.5em] mb-10">
        Panel de Control // Mensajes Recibidos
      </h1>

      <div className="grid gap-4">
        {mensajes.length === 0 ? (
          <p className="text-gray-500 italic">No hay mensajes registrados de momento.</p>
        ) : (
          mensajes.map((m : any) => (
            <div key={m.id} className="bg-[#0a0a0a] border border-white/10 p-6 rounded-sm hover:border-[#00ffff]/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-white font-bold">{m.nombre}</p>
                  <p className="text-[#00ffff] text-xs font-mono">{m.email}</p>
                </div>
                <span className="text-gray-600 text-[10px] font-mono">{m.fecha}</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed border-t border-white/5 pt-4">
                {m.mensaje}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};