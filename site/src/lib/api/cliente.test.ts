import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { esperarMinimoAntispam, nuevoSubmissionId } from './cliente'

/**
 * Estas pruebas existen por un fallo concreto.
 *
 * `crypto.randomUUID()` solo existe en contextos seguros -HTTPS o `localhost`-.
 * El servidor de revisión interno se sirve por HTTP en una IP de la red local, y
 * ahí la función no existe: el `useEffect` que la llamaba lanzaba durante la fase
 * de commit de React, y sin error boundary React desmontaba el árbol entero. El
 * formulario de contacto y la calculadora aparecían **en blanco**.
 *
 * Las 372 pruebas E2E no lo vieron porque corren contra `localhost`, que sí es
 * contexto seguro. De ahí que la cobertura del respaldo se haga aquí, simulando
 * un `crypto` sin `randomUUID`.
 */

const cryptoReal = globalThis.crypto

afterEach(() => {
  vi.stubGlobal('crypto', cryptoReal)
})

/** El mismo esquema que valida la función de ingestión. */
const esUuid = (valor: string) => z.uuid().safeParse(valor).success

describe('nuevoSubmissionId', () => {
  it('usa randomUUID cuando esta disponible', () => {
    const id = nuevoSubmissionId()
    expect(esUuid(id)).toBe(true)
  })

  it('sin randomUUID -contexto NO seguro- sigue dando un UUID valido', () => {
    // Es exactamente lo que expone el navegador sobre http:// en una IP:
    // `getRandomValues` si, `randomUUID` no.
    vi.stubGlobal('crypto', { getRandomValues: cryptoReal.getRandomValues.bind(cryptoReal) })

    const id = nuevoSubmissionId()
    expect(esUuid(id), `"${id}" no es un UUID valido`).toBe(true)
    // Version 4 y variante RFC 4122 en su sitio: el esquema de la funcion las
    // comprueba, asi que una cadena con la forma pero sin los bits correctos
    // seria rechazada en el servidor.
    expect(id[14]).toBe('4')
    expect(['8', '9', 'a', 'b']).toContain(id[19])
  })

  it('el respaldo no repite identificadores', () => {
    vi.stubGlobal('crypto', { getRandomValues: cryptoReal.getRandomValues.bind(cryptoReal) })

    const ids = new Set(Array.from({ length: 2000 }, () => nuevoSubmissionId()))
    // Un identificador repetido significa una deduplicacion que descarta un lead
    // legitimo por creerlo un reenvio.
    expect(ids.size).toBe(2000)
  })

  it('sin ninguna fuente de aleatoriedad falla de forma explicita', () => {
    // Antes que caer en Math.random(): dos visitantes con el mismo identificador
    // son un lead perdido, y un error visible es preferible a un dato que
    // desaparece en silencio.
    vi.stubGlobal('crypto', {})
    expect(() => nuevoSubmissionId()).toThrow(/getRandomValues/)
  })
})

/**
 * `esperarMinimoAntispam` existe para no perder leads de personas reales: el
 * servidor descarta en silencio lo que llega en menos de 3 s, y con el
 * autorrelleno del navegador una persona puede enviar antes.
 *
 * Se prueba con temporizadores falsos porque la alternativa es una prueba que
 * tarda tres segundos y medio de verdad.
 */
describe('esperarMinimoAntispam', () => {
  /**
   * Cuantos milisegundos pide esperar, o 0 si no espera.
   *
   * Se mide interceptando `setTimeout` en lugar de avanzar el reloj a saltos: lo
   * que se quiere comprobar es la **decision** -cuanto pide- y no el mecanismo del
   * temporizador, que es de la plataforma.
   */
  async function cuantoEspera(renderizadoEn: number, ahora: number): Promise<number> {
    // Sin `vi.useFakeTimers()` a proposito: con temporizadores falsos, el
    // `setTimeout` que hay que usar para no esperar de verdad ES el falso, asi que
    // la espera se programa en un reloj que nadie avanza y la prueba se cuelga. Se
    // falsea solo lo que hace falta: la hora y el temporizador.
    const relojReal = Date.now
    const temporizadorReal = globalThis.setTimeout

    let pedido = 0
    Date.now = () => ahora
    globalThis.setTimeout = ((fn: () => void, ms?: number) => {
      pedido = ms ?? 0
      // Se ejecuta ya: lo que se mide es el numero que pide, no la espera.
      return temporizadorReal(fn, 0)
    }) as unknown as typeof setTimeout

    try {
      await esperarMinimoAntispam(renderizadoEn)
    } finally {
      Date.now = relojReal
      globalThis.setTimeout = temporizadorReal
    }

    return pedido
  }

  it('no espera nada si el formulario aun no se ha montado', async () => {
    // `renderizadoEn` es 0 hasta que corre el efecto. Esperar ahi seria retener el
    // envio por una marca que no existe.
    expect(await cuantoEspera(0, 1_000_000)).toBe(0)
  })

  it('no espera nada si ya se superaron los 3 s', async () => {
    const ahora = 1_000_000
    expect(await cuantoEspera(ahora - 10_000, ahora)).toBe(0)
  })

  it('espera lo que falta cuando el envio es demasiado rapido', async () => {
    const ahora = 1_000_000
    // Han pasado 500 ms: faltan 2500, mas el margen de 250 para absorber la
    // diferencia entre el reloj del cliente y el del servidor.
    expect(await cuantoEspera(ahora - 500, ahora)).toBe(2750)
  })

  it('un reloj que salta hacia atras NO cuelga el envio', async () => {
    // ═══════════════════════════════════════════════════════════════════════════
    // Este caso lo encontro esta prueba, y era un cuelgue real.
    //
    // Si el reloj cambia entre el montaje y el envio -sincronizacion NTP, suspender
    // el portatil-, `transcurrido` sale negativo y `restante` se dispara. Con el
    // reloj adelantado un minuto se esperaban 63 segundos con el boton en
    // «enviando» y sin ninguna pista: la persona da la pagina por rota.
    //
    // Nunca hace falta esperar mas de lo que exige el umbral, y ese es el tope.
    // ═══════════════════════════════════════════════════════════════════════════
    const ahora = 1_000_000
    expect(await cuantoEspera(ahora + 60_000, ahora)).toBe(3250)
  })
})
