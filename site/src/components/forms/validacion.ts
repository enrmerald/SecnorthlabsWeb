/**
 * Reglas de validacion del formulario de contacto.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * Estaba dentro de `FormularioContacto.tsx`, leyendo el estado del componente y
 * devolviendo ya el texto traducido. Eso mezclaba tres cosas -la regla, el estado
 * y el idioma- y hacia que la parte mas facil de equivocarse fuera la unica sin
 * pruebas.
 *
 * Aqui las funciones son **puras y devuelven codigos**, no frases: el codigo es la
 * clave de `contact.errors.*` que el componente traduce, y es el mismo que
 * devuelve la Netlify Function cuando rechaza el mismo campo. Asi la regla se
 * puede probar sin montar React ni cargar mensajes.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** Campos del formulario que tienen alguna regla. Los demas no validan nada. */
export type CampoValidable =
  | 'firstName'
  | 'lastName'
  | 'company'
  | 'email'
  | 'phone'
  | 'role'
  | 'need'
  | 'message'

/** Tope del texto libre. Tiene que coincidir con `textoLargo(1000)` del servidor. */
export const MAX_MENSAJE = 1000

/**
 * Correo «suficientemente bien formado».
 *
 * Deliberadamente laxa: la estricta la hace el servidor con `z.email()`, y una
 * expresion agresiva en el cliente rechaza direcciones validas raras -las que
 * llevan `+`, guiones o dominios largos- delante de la persona que las escribe.
 */
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Dominios de correo personal. Provocan aviso, nunca bloqueo. */
const DOMINIOS_GENERICOS = ['gmail.', 'hotmail.', 'outlook.', 'yahoo.', 'live.', 'icloud.']

/**
 * Codigo de error de un campo, o `undefined` si esta bien.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * `exigirObligatorios` es la diferencia entre revisar y dar la lata.
 *
 * Al **salir de un campo** se llama con `false`: un campo vacio no se marca en
 * rojo. Recorrer el formulario con el tabulador para ver que piden, o dejar un
 * campo para el final, es comportamiento normal, y castigarlo con un error por
 * cada casilla convierte el formulario en un campo de minas antes de haber
 * intentado nada. Lo que si se comprueba al salir es el **contenido escrito**: si
 * alguien teclea un correo mal formado, decirselo ahi es un favor.
 *
 * Al **enviar** se llama con `true`, y entonces si se exige todo lo obligatorio.
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function codigoDeError(
  campo: CampoValidable,
  valor: string,
  exigirObligatorios: boolean,
): string | undefined {
  const v = valor.trim()
  const vacio = v === ''

  switch (campo) {
    case 'firstName':
      if (vacio) return exigirObligatorios ? 'firstName' : undefined
      return v.length < 2 || v.length > 40 ? 'firstName' : undefined

    case 'lastName':
      // Opcional: hay nombres de una sola palabra, y quien escribe desde otro pais
      // puede no tener «apellidos» en el sentido de aqui. Solo se comprueba que no
      // se pase de largo. Es la misma regla que aplican el servidor y la
      // calculadora.
      return v.length > 60 ? 'lastName' : undefined

    case 'company':
      if (vacio) return exigirObligatorios ? 'company' : undefined
      return v.length < 2 || v.length > 80 ? 'company' : undefined

    case 'email':
      if (vacio) return exigirObligatorios ? 'email' : undefined
      return CORREO.test(v) ? undefined : 'email'

    case 'need':
      return vacio && exigirObligatorios ? 'need' : undefined

    case 'message':
      return v.length > MAX_MENSAJE ? 'message' : undefined

    // `phone` y `role` son libres y opcionales: no hay nada que comprobar que no
    // vaya a rechazar a alguien por escribir su telefono de otra forma.
    default:
      return undefined
  }
}

/**
 * `true` si el correo es de un dominio personal.
 *
 * Provoca un **aviso suave**, no un error: quien solo tiene correo personal debe
 * poder enviar el formulario. Bloquearlo perderia consultas legitimas de autonomos
 * y de empresas pequenas.
 */
export function esDominioGenerico(correo: string): boolean {
  const v = correo.toLowerCase()
  return DOMINIOS_GENERICOS.some((d) => v.includes(d))
}
