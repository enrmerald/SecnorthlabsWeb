import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import emailjs from '@emailjs/browser';

export const Contacto = () => {
  const { t } = useTranslation();

  // 1. Estado para los campos del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    empresa: '',
    mensaje: ''
  });

  // 2. Estado para el mensaje de éxito debajo del botón
  const [mostrarExito, setMostrarExito] = useState(false);

  // 3. Función de envío
  const manejarEnvio = (e: React.FormEvent) => {
    e.preventDefault();

    const serviceID = 'REDACTED_SERVICE_ID'; 
    const templateID = 'REDACTED_TEMPLATE_ID';
    const publicKey = 'REDACTED_PUBLIC_KEY';

    const templateParams = {
      from_name: formData.nombre,
      from_email: formData.email,
      company: formData.empresa,
      message: formData.mensaje,
      to_name: 'North Labs Admin',
    };

    emailjs.send(serviceID, templateID, templateParams, publicKey)
      .then(() => {
        setFormData({ nombre: '', email: '', empresa: '', mensaje: '' });
        setMostrarExito(true);
        setTimeout(() => setMostrarExito(false), 5000);
      })
      .catch((err) => {
        console.error('ERROR:', err);
        alert("Hubo un error al enviar el mensaje.");
      });
  };

  return (
    <section 
      id="contacto" 
      className="py-24 px-6 md:px-16 lg:px-24 bg-[#050505] text-white"
      aria-labelledby="contact-title"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
        
        {/* COLUMNA IZQUIERDA: INFORMACIÓN */}
        <div className="space-y-12">
          <div className="space-y-6">
            {/* SEO: H2 con ID para accesibilidad */}
            <h2 id="contact-title" className="font-display text-5xl font-bold tracking-tighter uppercase">
              {t('contact.title')}
            </h2>
            <p className="font-sans text-gray-400 text-base leading-relaxed max-w-md">
              {t('contact.description')}
            </p>
          </div>

          <div className="space-y-8">
            {/* Item: Email - Ahora con enlace activo */}
            <div className="flex items-start gap-6 group">
              <div className="w-12 h-12 bg-white/5 flex items-center justify-center shrink-0 border border-transparent group-hover:border-[#00ffff]/30 transition-colors" aria-hidden="true">
                <svg className="w-5 h-5 text-[#00ffff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-display font-bold text-sm uppercase tracking-wider mb-1">{t('contact.info.email')}</h4>
                <a href="mailto:info@secnorthlabs.eu" className="font-sans text-gray-400 text-sm hover:text-[#00ffff] transition-colors">
                  info@secnorthlabs.eu
                </a>
              </div>
            </div>

            {/* Item: Teléfono - Ahora con enlace activo */}
            <div className="flex items-start gap-6 group">
              <div className="w-12 h-12 bg-white/5 flex items-center justify-center shrink-0 border border-transparent group-hover:border-[#00ffff]/30 transition-colors" aria-hidden="true">
                <svg className="w-5 h-5 text-[#00ffff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <h4 className="font-display font-bold text-sm uppercase tracking-wider mb-1">{t('contact.info.phone')}</h4>
                <a href="tel:+34634651312" className="font-sans text-gray-400 text-sm hover:text-[#00ffff] transition-colors">
                  +34 634 651 312
                </a>
              </div>
            </div>

            {/* Item: Oficinas - Semántica address */}
            <address className="flex items-start gap-6 group not-italic">
              <div className="w-12 h-12 bg-white/5 flex items-center justify-center shrink-0 border border-transparent group-hover:border-[#00ffff]/30 transition-colors" aria-hidden="true">
                <svg className="w-5 h-5 text-[#00ffff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-display font-bold text-sm uppercase tracking-wider mb-1">{t('contact.info.offices')}</h4>
                <p className="font-sans text-gray-400 text-xs leading-relaxed">
                  Innovation And Security North Labs SL<br />
                  Calle Peña Brava 21, Oficina 1B<br />
                  PI de Silvota, Llanera, CP 33192
                </p>
              </div>
            </address>
          </div>
        </div>

        {/* FORMULARIO: Se mantiene igual según tu petición */}
        <div className="bg-[#0a0a0a] border border-white/5 p-8 md:p-12">
          <h3 className="font-display text-xl font-bold mb-8 uppercase tracking-tight">{t('contact.form.title')}</h3>
          
          <form className="space-y-6" onSubmit={manejarEnvio}>
            <div className="space-y-2">
              <label className="font-sans text-[10px] uppercase tracking-widest text-gray-500 font-bold">{t('contact.form.label_name')}</label>
              <input 
                type="text" 
                required
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                placeholder={t('contact.form.placeholder_name')} 
                className="w-full bg-black/50 border border-white/10 p-4 font-sans text-sm focus:border-[#00ffff]/50 outline-none transition-colors" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="font-sans text-[10px] uppercase tracking-widest text-gray-500 font-bold">{t('contact.form.label_email')}</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder={t('contact.form.placeholder_email')} 
                  className="w-full bg-black/50 border border-white/10 p-4 font-sans text-sm focus:border-[#00ffff]/50 outline-none transition-colors" 
                />
              </div>
              <div className="space-y-2">
                <label className="font-sans text-[10px] uppercase tracking-widest text-gray-500 font-bold">{t('contact.form.label_company')}</label>
                <input 
                  type="text" 
                  value={formData.empresa}
                  onChange={(e) => setFormData({...formData, empresa: e.target.value})}
                  placeholder={t('contact.form.placeholder_company')} 
                  className="w-full bg-black/50 border border-white/10 p-4 font-sans text-sm focus:border-[#00ffff]/50 outline-none transition-colors" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-sans text-[10px] uppercase tracking-widest text-gray-500 font-bold">{t('contact.form.label_message')}</label>
              <textarea 
                rows={4} 
                required
                value={formData.mensaje}
                onChange={(e) => setFormData({...formData, mensaje: e.target.value})}
                placeholder={t('contact.form.placeholder_message')} 
                className="w-full bg-black/50 border border-white/10 p-4 font-sans text-sm focus:border-[#00ffff]/50 outline-none transition-colors resize-none" 
              />
            </div>

            <div className="space-y-4 text-center">
              <button type="submit" className="w-full bg-[#00ffff] text-black font-display font-black uppercase text-xs tracking-[0.3em] py-5 hover:bg-white transition-all duration-300">
                {t('contact.form.submit')}
              </button>

              <div 
                aria-live="polite"
                className={`transition-all duration-500 ${mostrarExito ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-2 pointer-events-none'}`}
              >
                <p className="text-[#00ffff] font-display font-bold text-[11px] uppercase tracking-widest pt-2">
                  ✓ {t('contact.form.success_msg', 'Mensaje enviado con éxito')}
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};