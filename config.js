/**
 * ═══════════════════════════════════════════════════════════════
 * ARCHIVO DE CONFIGURACIÓN - config.js
 * ═══════════════════════════════════════════════════════════════
 * 
 * 🎯 PROPÓSITO:
 * Este archivo contiene ÚNICAMENTE la configuración de carpetas.
 * Aquí defines de dónde se cargarán los cuestionarios.
 * 
 * 📝 CÓMO USAR ESTE ARCHIVO:
 * 
 * PASO 1: Identifica el nombre de tu carpeta de cuestionarios
 *         Ejemplo: "Lectura-4", "Lectura-5", "Parcial-2", etc.
 * 
 * PASO 2: Modifica la variable CONFIG_CARPETA_ACTIVA (línea 30)
 *         Cambia solo el texto entre comillas
 * 
 * PASO 3: Guarda el archivo
 * 
 * PASO 4: Recarga la página en tu navegador (F5 o Ctrl+R)
 * 
 * ═══════════════════════════════════════════════════════════════
 */


// ╔══════════════════════════════════════════════════════════════╗
// ║  🔧 CONFIGURACIÓN PRINCIPAL - MODIFICAR AQUÍ                 ║
// ╚══════════════════════════════════════════════════════════════╝

/**
 * CARPETA DE CUESTIONARIOS ACTIVA
 * 
 * ⚠️ IMPORTANTE: Solo cambia el texto entre las comillas ' '
 * 
 * 📂 Estructura esperada:
 *    bd-preguntas/
 *    ├── Lectura-4/
 *    │   ├── index4.json
 *    │   └── cuestionario1.json
 *    ├── Lectura-5/
 *    │   ├── index5.json
 *    │   └── cuestionario1.json
 *    └── Parcial-2/
 *        ├── index2.json
 *        └── cuestionario1.json
 * 
 * 💡 EJEMPLOS DE USO:
 * 
 * Para usar cuestionarios de cuarto grado:
 *   const CONFIG_CARPETA_ACTIVA = 'Lectura-4';
 * 
 * Para usar cuestionarios de quinto grado:
 *   const CONFIG_CARPETA_ACTIVA = 'Lectura-5';
 * 
 * Para usar cuestionarios de un parcial:
 *   const CONFIG_CARPETA_ACTIVA = 'Parcial-2';
 * 
 * Para usar cualquier otra carpeta:
 *   const CONFIG_CARPETA_ACTIVA = 'NombreDeTuCarpeta';
 */
 const CONFIG_CARPETA_ACTIVA = 'Lectura-6'; // 👈 CAMBIAR AQUÍ


 // ╔══════════════════════════════════════════════════════════════╗
 // ║  📋 CONFIGURACIÓN AVANZADA (Opcional)                        ║
 // ╚══════════════════════════════════════════════════════════════╝
 
 /**
  * RUTA BASE DE CUESTIONARIOS
  * 
  * Si tu carpeta principal NO se llama "bd-preguntas", cámbiala aquí.
  * La mayoría de usuarios NO necesita cambiar esto.
  * 
  * Ejemplo: Si tus cuestionarios están en "mis-cuestionarios/" en lugar de "bd-preguntas/":
  *   const CONFIG_RUTA_BASE = 'mis-cuestionarios';
  */
 const CONFIG_RUTA_BASE = 'bd-preguntas';
 
 
 /**
  * PATRÓN DE NOMBRE DE ARCHIVO INDEX
  * 
  * Define cómo se llaman los archivos índice en tus carpetas.
  * 
  * Opciones:
  * - 'index{numero}.json'  → Busca index4.json, index5.json, etc.
  * - 'index.json'          → Siempre busca index.json (sin número)
  * - 'lista.json'          → Busca un archivo llamado lista.json
  * 
  * La variable {numero} se extrae automáticamente del nombre de la carpeta.
  * Ejemplo: "Lectura-5" → número = 5 → buscará "index5.json"
  */
 const CONFIG_PATRON_INDEX = 'indexl6.json';
 
 
 // ╔══════════════════════════════════════════════════════════════╗
 // ║  🔒 NO MODIFICAR ABAJO DE ESTA LÍNEA                         ║
 // ║  (Funciones auxiliares para procesar la configuración)       ║
 // ╚══════════════════════════════════════════════════════════════╝
 
 /**
  * Extrae el número de una cadena de texto
  * 
  * Ejemplo: "Lectura-5" → "5"
  *          "Parcial-2" → "2"
  *          "MiCarpeta" → "" (vacío)
  * 
  * @param {string} texto - Texto del cual extraer el número
  * @returns {string} El primer número encontrado o cadena vacía
  */
 function extraerNumero(texto) {
     const match = texto.match(/\d+/);
     return match ? match[0] : '';
 }
 
 /**
  * Genera la ruta completa del archivo índice según la configuración
  * 
  * Combina:
  * - CONFIG_RUTA_BASE: "bd-preguntas"
  * - CONFIG_CARPETA_ACTIVA: "Lectura-5"
  * - CONFIG_PATRON_INDEX: "index{numero}.json"
  * 
  * Resultado: "bd-preguntas/Lectura-5/index5.json"
  * 
  * @returns {string} Ruta completa al archivo índice
  */
 function obtenerRutaIndex() {
     const numero = extraerNumero(CONFIG_CARPETA_ACTIVA);
     const nombreIndex = CONFIG_PATRON_INDEX.replace('{numero}', numero);
     return `${CONFIG_RUTA_BASE}/${CONFIG_CARPETA_ACTIVA}/${nombreIndex}`;
 }
 
 /**
  * Genera la ruta base de la carpeta de cuestionarios
  * 
  * Resultado: "bd-preguntas/Lectura-5/"
  * 
  * @returns {string} Ruta base de la carpeta activa
  */
 function obtenerRutaBaseCuestionarios() {
     return `${CONFIG_RUTA_BASE}/${CONFIG_CARPETA_ACTIVA}/`;
 }
 
 
 // ╔══════════════════════════════════════════════════════════════╗
 // ║  📤 EXPORTAR CONFIGURACIÓN                                   ║
 // ║  (Estas variables se usarán en app.js)                       ║
 // ╚══════════════════════════════════════════════════════════════╝
 
 /**
  * Objeto con toda la configuración procesada
  * Este objeto se exporta para que app.js pueda usarlo
  */
 const QuizConfig = {
     // Nombre de la carpeta activa
     carpetaActiva: CONFIG_CARPETA_ACTIVA,
     
     // Ruta completa al archivo índice
     rutaIndex: obtenerRutaIndex(),
     
     // Ruta base de los cuestionarios
     rutaBaseCuestionarios: obtenerRutaBaseCuestionarios(),
     
     // Configuración original (por si se necesita)
     config: {
         rutaBase: CONFIG_RUTA_BASE,
         carpetaActiva: CONFIG_CARPETA_ACTIVA,
         patronIndex: CONFIG_PATRON_INDEX
     }
 };
 
 
 // ═══════════════════════════════════════════════════════════════
 // 📖 GUÍA RÁPIDA DE SOLUCIÓN DE PROBLEMAS
 // ═══════════════════════════════════════════════════════════════
 //
 // ❌ PROBLEMA: "No se encontraron cuestionarios"
 // ✅ SOLUCIÓN:
 //    1. Verifica que CONFIG_CARPETA_ACTIVA sea exactamente igual
 //       al nombre de tu carpeta (respeta mayúsculas/minúsculas)
 //    2. Asegúrate que la carpeta exista en bd-preguntas/
 //    3. Verifica que la carpeta contenga un archivo index.json
 //
 // ❌ PROBLEMA: "Error al cargar el archivo index"
 // ✅ SOLUCIÓN:
 //    1. Revisa que el archivo índice tenga el nombre correcto
 //    2. Si usas "index5.json" para "Lectura-5", verifica que
 //       el número coincida
 //    3. Si tu índice se llama diferente (ej: "lista.json"),
 //       modifica CONFIG_PATRON_INDEX
 //
 // ❌ PROBLEMA: Los cambios no se aplican
 // ✅ SOLUCIÓN:
 //    1. Guarda el archivo después de modificarlo
 //    2. Recarga la página con Ctrl+F5 (recarga forzada)
 //    3. Abre la consola del navegador (F12) y busca mensajes
 //       que indiquen qué carpeta se está intentando cargar
 //
 // ═══════════════════════════════════════════════════════════════
