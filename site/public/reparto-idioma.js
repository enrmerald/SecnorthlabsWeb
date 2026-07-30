// Reparto de `/` al idioma del navegador, ANTES de que se pinte nada.
//
// ⚠️ Es un fichero estatico de `public/` y NO pasa por el compilador: se sirve
// tal cual. Por eso va en JavaScript de toda la vida, sin modulos ni sintaxis
// moderna, y por eso lo carga un `<script src>` sin `async` ni `defer`: un script
// bloqueante en la cabeza del `<body>` se ejecuta antes de que el navegador
// pinte el primer fotograma, asi que el visitante no llega a ver la pagina de
// eleccion de idioma parpadear antes de la redireccion.
//
// Antes esto vivia en un `useEffect`, que corre DESPUES del primer pintado: la
// eleccion de idioma -centrada, con su titular y sus dos botones- aparecia un
// instante y desaparecia. Se confundia facilmente con un 404.
//
// La lista de prefijos y los destinos tienen que decir lo mismo que
// `netlify.toml` y que el manifiesto de rutas. No se pueden importar de ahi -esto
// se sirve crudo al navegador-, asi que `src/lib/idioma-navegador.test.ts`
// ejecuta este fichero y compara.
;(function () {
  var ESPANOL = ['es', 'ca', 'gl', 'eu']

  // La lista completa y en orden, no `navigator.language`, que es solo la
  // primera: quien tenga «catalan, castellano, ingles» debe acabar en castellano.
  var idiomas = navigator.languages || (navigator.language ? [navigator.language] : [])

  var destino = ''
  for (var i = 0; i < idiomas.length && !destino; i++) {
    var primario = String(idiomas[i]).trim().toLowerCase().split('-')[0]
    if (!primario) continue
    if (ESPANOL.indexOf(primario) !== -1) destino = '/es/'
    else if (primario === 'en') destino = '/en/'
  }

  // Ni castellano ni ingles: el ingles es el destino menos presuntuoso para quien
  // llega con un tercer idioma. Sin ningun idioma declarado, el predeterminado.
  if (!destino) destino = idiomas.length > 0 ? '/en/' : '/es/'

  // `replace` y no `assign`: la raiz no debe quedarse en el historial, o el boton
  // de atras devuelve aqui y vuelve a redirigir, dejando al visitante atrapado.
  window.location.replace(destino)
})()
