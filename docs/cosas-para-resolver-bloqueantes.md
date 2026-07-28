
#	Qué	Quién	Bloquea
1	Cuenta de Resend y dominio notify.secnorthlabs.eu verificado	Sistemas	B
2	Dos API keys de Resend (sending_access), producción y staging	Sistemas	B
3	Buzón leads-ingest@secnorthlabs.eu con sus carpetas	Sistemas	B
4	Cuatro pares de claves criptográficas (prod y staging)	Sistemas	B
5	Site ID de Netlify y secreto del proxy firmado	Sistemas	B
6	Plan de Netlify contratado	Dirección	B
7	Export del blog actual: artículos, formato e idiomas	Marketing	B
8	Texto que se muestra al usuario tras enviar	Dirección	B — propuesta más abajo
9	Decisión pnpm 10 o 11	Desarrollo	B
10	Elección de analítica	Dirección	B para la Fase 8
11	Confirmar precios de licencia EDR y MDR	Dirección	C — afectan al precio publicado
12	Retención de las carpetas del buzón	Cumplimiento	C
13	DPA de Resend aceptado y política de privacidad actualizada	Cumplimiento	C
14	Export de URLs indexadas de Search Console	Marketing	C
15	Teléfono de incidentes 24/7: existe o no	Dirección	C
16	LinkedIn de empresa	Marketing	—
17	Logos oficiales de Microsoft, Huntress, OPNsense, Fortinet, Ewala	Marketing	—
18	EspoCRM: equipo, usuario de API, campos y su Metadata	Sistemas	Bloquea el servicio externo, no a mí

# 1. Cuenta registrada con: soportedesarrollo@ewala.es  Dominio: secnorthlabs.eu
Ya tengo enlazada la cuenta de Resend con el dominio `secnorthlabs.eu`

# 2. Solo tengo las dos apy keys.

# 3. Pedido a sistemas, a la espera que lo creen.

# 4. Los pares de claves criptográficas están creadas en una carpeta en la raíz del repositorio llamado `claves`

# 5. Project ID: 7273e05b-30e8-4123-a459-588f24bee2f3 . Tengo un problema que te cuento en el siguiente punto con el secreto del proxy.

# 6. Esta en gratuito.
Por esto tengo un problema en las variables de las claves criptigráficas. Me hablas de crear NETLIFY_PROXY_SIGNING_SECRET, se me marcan todas:
Specific scopes
Limit this environment variable to specific scopes, such as builds, functions, or post processing

Upgrade to unlock

Builds
Includes project builds

Functions
Includes Functions, Edge Functions, and On-demand Builders

Runtime
Includes forms and signed proxy redirects

Post processing
Includes snippet injection

> Lo unico que puedo hacer es aquí cambiar el valor dependiendo el tipo de despliegue:
Different value for each deploy context
Use different environment variable values for production, Deploy Previews, branch deploys, and local development. Optionally override these values on specific branches.
Production

Most values that are set for production should also be set for Deploy Previews, so that these contexts match in behavior
Deploy Previews

Branch deploys

This value applies to all branch deploys. You can override the value on a specific branch
Preview Server & Agent Runners

This value applies to all Preview Servers and Agent Runners. You can override the value on a specific branch
Local development (Netlify CLI)

This value is available to the CLI, and is not considered secret.



# 7. El blog esta en https://ewala.es/blog y los posts en https://ewala.es/blog/posts/ . El repo es publico y lo tengo en mi cuenta, [enrmerald/ewalaweb](https://github.com/enrmerald/EwalaWeb.git) . El Blog esta creado con Hugo, y el contenido de los posts son MarkDown con toda la información de cada punto en ese markdown

# 8. Me parece bien los textos que se muestra el usuario al usuario tras enviar, incluso les haría con más contenido profesional y formal. Esto te lo dejo a ti que seguro que sabes mejor que yo.

# 9. pnpm 11

# 10. No se a que te refieres con eso

# 11. Eso lo haré un poco más adelante, primero que funcione todo y luego ya confirmamos precio ya que eso será cambiar unos parametros y ya esta.

# 12. Eso se encarga la encargada de GRC, ya se lo diré más adelante cuando lleguen correos, no es bloqueante

# 16. https://www.linkedin.com/company/isn-labs/

# 17. Tengo todos los logos que me pides en el punto 17 así que dime donde les pongo. ¿En /site/public/?

# 18. Ya tengo todo lo que me dices