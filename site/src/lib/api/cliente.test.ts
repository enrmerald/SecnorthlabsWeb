import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { nuevoSubmissionId } from './cliente'

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
