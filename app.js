/**
 * ═══════════════════════════════════════════════════════════════
 * SISTEMA DE CUESTIONARIOS EN LÍNEA - app.js
 * ═══════════════════════════════════════════════════════════════
 * 
 * 🎯 PROPÓSITO:
 * Este archivo contiene TODA la lógica del juego de cuestionarios.
 * NO necesitas modificar este archivo para cambiar de carpeta.
 * 
 * 📝 PARA CAMBIAR LA CARPETA DE CUESTIONARIOS:
 * Ve al archivo config.js y modifica CONFIG_CARPETA_ACTIVA
 * 
 * 🏗️ ARQUITECTURA:
 * Este archivo está organizado en secciones:
 * 1. Variables Globales
 * 2. Funciones de Carga de Datos
 * 3. Funciones de Navegación
 * 4. Funciones de Gestión del Quiz
 * 5. Funciones de Resultados
 * 6. Inicialización
 * 
 * ═══════════════════════════════════════════════════════════════
 */


// ╔══════════════════════════════════════════════════════════════╗
// ║  📦 VARIABLES GLOBALES DEL ESTADO DEL JUEGO                  ║
// ╚══════════════════════════════════════════════════════════════╝

/**
 * Objeto con todos los datos del cuestionario cargado desde JSON
 * Contiene: título, autor, secciones con preguntas, etc.
 */
 let quizData = null;

 /**
  * Array con las preguntas seleccionadas para el quiz actual
  * Se llena cuando el usuario inicia un quiz de N preguntas
  */
 let currentQuiz = [];
 
 /**
  * Índice de la pregunta que se está mostrando actualmente (base 0)
  * Ejemplo: 0 = primera pregunta, 1 = segunda pregunta, etc.
  */
 let currentQuestionIndex = 0;
 
 /**
  * Array que almacena las respuestas del usuario
  * Cada posición corresponde a una pregunta: null = no respondida, 'a'/'b'/'c'/etc = respondida
  */
 let userAnswers = [];
 
 /**
  * Número total de preguntas en el quiz actual
  * Se establece cuando el usuario selecciona 10, 20, 30 o 50 preguntas
  */
 let totalQuestions = 0;
 
 /**
  * Ruta completa del archivo JSON del cuestionario seleccionado
  * Ejemplo: "bd-preguntas/Lectura-5/cuestionario1.json"
  */
 let selectedQuizFile = null;
 
 /**
  * Lista de nombres de archivos de cuestionarios disponibles
  * Se carga desde el archivo index.json de la carpeta activa
  */
 let availableQuizzes = [];
 
 
 // ╔══════════════════════════════════════════════════════════════╗
 // ║  📥 FUNCIONES DE CARGA DE DATOS                              ║
 // ╚══════════════════════════════════════════════════════════════╝
 
 /**
  * Carga la lista de cuestionarios disponibles desde la carpeta configurada
  * 
  * PROCESO:
  * 1. Obtiene la configuración desde QuizConfig (definida en config.js)
  * 2. Muestra mensaje de carga en la interfaz
  * 3. Descarga el archivo index.json
  * 4. Parsea el JSON y extrae la lista de cuestionarios
  * 5. Genera tarjetas visuales para cada cuestionario
  * 6. Maneja errores si algo falla
  * 
  * DEPENDENCIAS:
  * - Requiere que config.js esté cargado antes que este archivo
  * - Usa el objeto global QuizConfig
  * 
  * @returns {Promise<void>} No retorna valor, modifica el DOM directamente
  */
 async function loadQuizList() {
     const container = document.getElementById('quizListContainer');
     
     // Mostrar indicador de carga mientras descargamos los datos
     container.innerHTML = '<p style="text-align: center; color: #666;">Cargando cuestionarios disponibles...</p>';
     
     try {
         // Obtener configuración procesada desde config.js
         const config = QuizConfig;
         const indexPath = config.rutaIndex;
         const baseQuizPath = config.rutaBaseCuestionarios;
         const carpetaActiva = config.carpetaActiva;
         
         console.log('═══════════════════════════════════════');
         console.log('📂 Cargando cuestionarios...');
         console.log('   Carpeta activa:', carpetaActiva);
         console.log('   Ruta índice:', indexPath);
         console.log('═══════════════════════════════════════');
         
         // Descargar el archivo índice
         const response = await fetch(indexPath);
         
         // Verificar que la descarga fue exitosa
         if (!response.ok) {
             throw new Error(`HTTP ${response.status}: No se encontró ${indexPath}`);
         }
         
         // Parsear el JSON
         const data = await response.json();
         availableQuizzes = data.cuestionarios || [];
         
         // Validar que haya cuestionarios
         if (availableQuizzes.length === 0) {
             mostrarMensajeNoHayCuestionarios(container, carpetaActiva);
             return;
         }
         
         console.log(`✅ ${availableQuizzes.length} cuestionarios encontrados`);
         
         // Renderizar la interfaz con los cuestionarios
         renderizarListaCuestionarios(container, carpetaActiva, baseQuizPath, availableQuizzes);
         
     } catch (error) {
         console.error('❌ Error cargando índice:', error);
         mostrarMensajeError(container, QuizConfig.carpetaActiva, error);
     }
 }
 
 /**
  * Muestra mensaje cuando no hay cuestionarios disponibles
  * 
  * @param {HTMLElement} container - Contenedor donde mostrar el mensaje
  * @param {string} carpeta - Nombre de la carpeta que se intentó cargar
  */
 function mostrarMensajeNoHayCuestionarios(container, carpeta) {
     container.innerHTML = `
         <div style="text-align: center; padding: 40px;">
             <p style="color: #999; font-size: 18px; margin-bottom: 15px;">🔭 No hay cuestionarios disponibles</p>
             <p style="color: #666; font-size: 14px;">Carpeta activa: <strong>${carpeta}</strong></p>
             <p style="color: #999; font-size: 12px; margin-top: 20px;">
                 Asegúrate de que la carpeta contenga archivos de cuestionarios<br>
                 y que estén listados en el archivo index.json
             </p>
         </div>
     `;
 }
 
 /**
  * Muestra mensaje de error detallado
  * 
  * @param {HTMLElement} container - Contenedor donde mostrar el error
  * @param {string} carpeta - Nombre de la carpeta que se intentó cargar
  * @param {Error} error - Objeto de error con detalles
  */
 function mostrarMensajeError(container, carpeta, error) {
     container.innerHTML = `
         <div style="text-align: center; padding: 40px;">
             <p style="color: #dc3545; font-size: 18px; margin-bottom: 15px;">❌ Error al cargar cuestionarios</p>
             <p style="color: #666; font-size: 14px; margin-bottom: 10px;">
                 No se pudo cargar desde: <strong>${carpeta}</strong>
             </p>
             <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                 <p style="color: #666; font-size: 13px; margin: 0;">
                     <strong>Detalles técnicos:</strong><br>
                     ${error.message}
                 </p>
             </div>
             <p style="color: #999; font-size: 13px; margin-bottom: 20px;">
                 <strong>Soluciones posibles:</strong><br>
                 • Verifica que la carpeta exista en bd-preguntas/<br>
                 • Asegúrate de que contenga el archivo index.json<br>
                 • Revisa la configuración en config.js
             </p>
             <button class="btn" onclick="loadQuizList()" style="margin-top: 20px;">🔄 Reintentar</button>
         </div>
     `;
 }
 
 /**
  * Renderiza la lista de cuestionarios en la interfaz
  * 
  * @param {HTMLElement} container - Contenedor donde renderizar
  * @param {string} carpeta - Nombre de la carpeta activa
  * @param {string} rutaBase - Ruta base de los cuestionarios
  * @param {Array<string>} cuestionarios - Lista de nombres de archivos
  */
 function renderizarListaCuestionarios(container, carpeta, rutaBase, cuestionarios) {
     // Limpiar contenedor
     container.innerHTML = '';
     
     // Crear encabezado visual
     const header = document.createElement('div');
     header.style.cssText = 'text-align: center; margin-bottom: 25px; padding: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; color: white;';
     header.innerHTML = `
         <h3 style="margin: 0 0 5px 0; font-size: 20px;">📚 ${carpeta}</h3>
         <p style="margin: 0; font-size: 14px; opacity: 0.9;">${cuestionarios.length} cuestionarios disponibles</p>
     `;
     container.appendChild(header);
     
     // Crear tarjeta para cada cuestionario
     cuestionarios.forEach(filename => {
         const quizCard = crearTarjetaCuestionario(filename, rutaBase);
         container.appendChild(quizCard);
     });
     
     // Añadir footer informativo
     const footer = document.createElement('p');
     footer.style.cssText = 'text-align: center; color: #999; margin-top: 20px; font-size: 13px; font-style: italic;';
     footer.textContent = `📂 Mostrando cuestionarios de: ${carpeta}`;
     container.appendChild(footer);
 }
 
 /**
  * Crea una tarjeta visual para un cuestionario
  * 
  * @param {string} filename - Nombre del archivo del cuestionario
  * @param {string} rutaBase - Ruta base donde se encuentra el archivo
  * @returns {HTMLElement} Elemento div con la tarjeta del cuestionario
  */
 function crearTarjetaCuestionario(filename, rutaBase) {
     const quizCard = document.createElement('div');
     quizCard.className = 'quiz-card';
     
     // Formatear nombre para visualización
     // "cuestionario1.json" → "Cuestionario 1"
     const displayName = filename
         .replace('.json', '')
         .replace(/-/g, ' ')
         .replace(/\b\w/g, letra => letra.toUpperCase());
     
     const rutaCompleta = rutaBase + filename;
     
     quizCard.innerHTML = `
         <h3>📋 ${displayName}</h3>
         <p style="color: #888; font-size: 13px; margin-top: 5px;">${filename}</p>
         <button class="btn" onclick="selectQuiz('${rutaCompleta}', '${filename}')">Seleccionar</button>
     `;
     
     return quizCard;
 }
 
 /**
  * Selecciona y carga un cuestionario específico
  * 
  * PROCESO:
  * 1. Guarda la ruta del archivo seleccionado
  * 2. Muestra indicador de carga
  * 3. Descarga el archivo JSON del cuestionario
  * 4. Parsea los datos y los guarda en quizData
  * 5. Cambia a la pantalla de configuración del quiz
  * 6. Maneja errores si algo falla
  * 
  * @param {string} filepath - Ruta completa al archivo JSON
  * @param {string} filename - Nombre del archivo (para mostrar al usuario)
  * @returns {Promise<void>}
  */
 async function selectQuiz(filepath, filename) {
     selectedQuizFile = filepath;
     
     console.log('═══════════════════════════════════════');
     console.log('📖 Cargando cuestionario...');
     console.log('   Archivo:', filename);
     console.log('   Ruta:', filepath);
     console.log('═══════════════════════════════════════');
     
     const container = document.getElementById('quizListContainer');
     
     // Mostrar indicador de carga animado
     container.innerHTML = `
         <div style="text-align: center; padding: 60px;">
             <div style="font-size: 48px; margin-bottom: 20px;">⏳</div>
             <p style="color: #666; font-size: 16px;">Cargando <strong>${filename}</strong>...</p>
         </div>
     `;
     
     try {
         // Descargar el cuestionario
         const response = await fetch(filepath);
         
         if (!response.ok) {
             throw new Error(`No se pudo cargar: ${filename}`);
         }
         
         // Parsear JSON y guardar datos
         const data = await response.json();
         quizData = data;
         
         console.log('✅ Cuestionario cargado exitosamente');
         console.log('   Secciones:', data.cuestionario?.secciones?.length || 0);
         
         // Cambiar a pantalla de configuración
         cambiarPantalla('quiz-selection-screen', 'setup-screen');
         
         // Actualizar título en la pantalla de configuración
         const quizTitle = document.getElementById('selectedQuizTitle');
         if (quizTitle) {
             quizTitle.textContent = filename;
         }
         
     } catch (error) {
         console.error('❌ Error cargando cuestionario:', error);
         alert(`❌ Error al cargar "${filename}"\n\n${error.message}\n\nVerifica que el archivo exista y tenga formato JSON válido.`);
         loadQuizList();
     }
 }
 
 
 // ╔══════════════════════════════════════════════════════════════╗
 // ║  🔀 FUNCIONES DE NAVEGACIÓN ENTRE PANTALLAS                  ║
 // ╚══════════════════════════════════════════════════════════════╝
 
 /**
  * Cambia entre pantallas de la aplicación
  * 
  * La aplicación tiene 4 pantallas principales:
  * 1. quiz-selection-screen: Selección de cuestionario
  * 2. setup-screen: Configuración del número de preguntas
  * 3. quiz-screen: Pantalla del juego con preguntas
  * 4. results-screen: Resultados finales
  * 
  * @param {string} pantallaOcultar - Clase de la pantalla a ocultar
  * @param {string} pantallaMostrar - Clase de la pantalla a mostrar
  */
 function cambiarPantalla(pantallaOcultar, pantallaMostrar) {
     document.querySelector(`.${pantallaOcultar}`).classList.remove('active');
     document.querySelector(`.${pantallaMostrar}`).classList.add('active');
     console.log(`🔀 Navegación: ${pantallaOcultar} → ${pantallaMostrar}`);
 }
 
 /**
  * Regresa a la selección de cuestionarios
  * Resetea los datos del cuestionario actual
  */
 function backToQuizSelection() {
     console.log('🔙 Regresando a selección de cuestionarios');
     
     cambiarPantalla('setup-screen', 'quiz-selection-screen');
     
     // Resetear datos
     quizData = null;
     selectedQuizFile = null;
     
     // Recargar lista
     loadQuizList();
 }
 
 
 // ╔══════════════════════════════════════════════════════════════╗
 // ║  🎮 FUNCIONES DE GESTIÓN DEL QUIZ                            ║
 // ╚══════════════════════════════════════════════════════════════╝
 
 /**
  * Obtiene todas las preguntas de todas las secciones
  * 
  * Los cuestionarios están organizados en secciones.
  * Esta función extrae TODAS las preguntas y las junta en un solo array.
  * 
  * ESTRUCTURA ESPERADA DEL JSON:
  * {
  *   "cuestionario": {
  *     "secciones": [
  *       { "preguntas": [...] },
  *       { "preguntas": [...] }
  *     ]
  *   }
  * }
  * 
  * @returns {Array} Array con todas las preguntas, o array vacío si no hay datos
  */
 function getAllQuestions() {
     if (!quizData || !quizData.cuestionario || !quizData.cuestionario.secciones) {
         console.warn('⚠️ No hay datos de cuestionario disponibles');
         return [];
     }
     
     let allQuestions = [];
     
     // Concatenar preguntas de todas las secciones
     quizData.cuestionario.secciones.forEach((seccion, index) => {
         const numPreguntas = seccion.preguntas?.length || 0;
         console.log(`   Sección ${index + 1}: ${numPreguntas} preguntas`);
         allQuestions = allQuestions.concat(seccion.preguntas || []);
     });
     
     console.log(`📊 Total de preguntas: ${allQuestions.length}`);
     return allQuestions;
 }
 
 /**
  * Mezcla aleatoriamente un array usando Fisher-Yates
  * 
  * ALGORITMO FISHER-YATES:
  * 1. Recorre el array de atrás hacia adelante
  * 2. En cada iteración, selecciona un índice aleatorio
  * 3. Intercambia el elemento actual con el aleatorio
  * 
  * Este algoritmo garantiza distribución uniforme y es eficiente O(n)
  * 
  * @param {Array} array - Array a mezclar
  * @returns {Array} Nuevo array mezclado (no modifica el original)
  */
 function shuffleArray(array) {
     const newArray = [...array];
     
     for (let i = newArray.length - 1; i > 0; i--) {
         const j = Math.floor(Math.random() * (i + 1));
         [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
     }
     
     return newArray;
 }
 
 /**
  * Inicia el quiz con el número de preguntas especificado
  * 
  * PROCESO:
  * 1. Obtiene todas las preguntas disponibles
  * 2. Valida que haya suficientes preguntas
  * 3. Mezcla las preguntas aleatoriamente
  * 4. Selecciona las primeras N preguntas
  * 5. Inicializa el estado del juego
  * 6. Muestra la primera pregunta
  * 
  * @param {number} numQuestions - Número de preguntas (10, 20, 30, 50)
  */
 function startQuiz(numQuestions) {
     console.log('═══════════════════════════════════════');
     console.log(`🎯 Iniciando quiz con ${numQuestions} preguntas`);
     
     const allQuestions = getAllQuestions();
     
     // Validar disponibilidad
     if (allQuestions.length === 0) {
         alert('❌ No hay preguntas disponibles.\nIntenta con otro cuestionario.');
         return;
     }
     
     // Ajustar si se piden más preguntas de las disponibles
     if (numQuestions > allQuestions.length) {
         alert(`ℹ️ Solo hay ${allQuestions.length} preguntas disponibles.\nSe usarán todas.`);
         numQuestions = allQuestions.length;
     }
     
     // Mezclar y seleccionar
     const shuffled = shuffleArray(allQuestions);
     currentQuiz = shuffled.slice(0, numQuestions);
     
     // Inicializar estado
     totalQuestions = numQuestions;
     currentQuestionIndex = 0;
     userAnswers = new Array(totalQuestions).fill(null);
     
     console.log(`✅ Quiz preparado con ${totalQuestions} preguntas`);
     console.log('═══════════════════════════════════════');
 
     // Cambiar a pantalla de juego
     cambiarPantalla('setup-screen', 'quiz-screen');
 
     // Mostrar primera pregunta
     displayQuestion();
 }
 
 /**
  * Muestra la pregunta actual en la interfaz
  * 
  * ACTUALIZA:
  * - Barra de progreso
  * - Número de pregunta
  * - Texto de la pregunta
  * - Opciones de respuesta
  * - Retroalimentación (si ya fue respondida)
  * - Botones de navegación
  * 
  * ESTRUCTURA DE UNA PREGUNTA:
  * {
  *   "pregunta": "¿Texto de la pregunta?",
  *   "opciones": { "a": "...", "b": "...", "c": "...", "d": "..." },
  *   "respuesta_correcta": "a",
  *   "referencia": "Página 123"
  * }
  */
 function displayQuestion() {
     const question = currentQuiz[currentQuestionIndex];
     
     console.log(`📝 Mostrando pregunta ${currentQuestionIndex + 1}/${totalQuestions}`);
     
     // Actualizar barra de progreso
     const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
     document.getElementById('progressFill').style.width = progress + '%';
     
     // Actualizar contador
     document.getElementById('questionNumber').textContent = 
         `Pregunta ${currentQuestionIndex + 1} de ${totalQuestions}`;
     
     // Mostrar pregunta
     document.getElementById('questionText').textContent = question.pregunta;
 
     // Renderizar opciones
     renderizarOpciones(question);
 
     // Actualizar retroalimentación
     actualizarRetroalimentacion(question);
 
     // Actualizar botones de navegación
     actualizarBotonesNavegacion();
 }
 
 /**
  * Renderiza las opciones de respuesta para la pregunta actual
  * 
  * @param {Object} question - Objeto con los datos de la pregunta
  */
 function renderizarOpciones(question) {
     const optionsContainer = document.getElementById('optionsContainer');
     optionsContainer.innerHTML = '';
 
     // Crear elemento para cada opción
     Object.keys(question.opciones).forEach(key => {
         const option = crearElementoOpcion(key, question);
         optionsContainer.appendChild(option);
     });
 }
 
 /**
  * Crea un elemento DOM para una opción de respuesta
  * 
  * @param {string} key - Letra de la opción (a, b, c, d)
  * @param {Object} question - Objeto de la pregunta actual
  * @returns {HTMLElement} Div con la opción
  */
 function crearElementoOpcion(key, question) {
     const option = document.createElement('div');
     option.className = 'option';
     option.textContent = `${key}) ${question.opciones[key]}`;
     option.setAttribute('data-option', key);
 
     // Si ya fue respondida, mostrar retroalimentación visual
     if (userAnswers[currentQuestionIndex]) {
         option.classList.add('disabled');
         
         if (key === userAnswers[currentQuestionIndex]) {
             option.classList.add('selected');
             if (key === question.respuesta_correcta) {
                 option.classList.add('correct');
             } else {
                 option.classList.add('incorrect');
             }
         }
         
         if (key === question.respuesta_correcta) {
             option.classList.add('correct');
         }
     } else {
         // Permitir selección
         option.addEventListener('click', () => selectOption(key));
     }
 
     return option;
 }
 
 /**
  * Actualiza la retroalimentación mostrada al usuario
  * 
  * @param {Object} question - Objeto de la pregunta actual
  */
 function actualizarRetroalimentacion(question) {
     const feedback = document.getElementById('feedback');
     const reference = document.getElementById('reference');
     
     if (userAnswers[currentQuestionIndex]) {
         // Ya respondida: mostrar feedback
         const isCorrect = userAnswers[currentQuestionIndex] === question.respuesta_correcta;
         
         feedback.className = 'feedback show ' + (isCorrect ? 'correct' : 'incorrect');
         feedback.textContent = isCorrect 
             ? '✓ ¡Correcto! Excelente.' 
             : '✗ Incorrecto. La respuesta correcta es: ' + question.respuesta_correcta;
         
         reference.textContent = '📖 ' + question.referencia;
         
         document.getElementById('nextBtn').disabled = false;
     } else {
         // No respondida: ocultar feedback
         feedback.className = 'feedback';
         reference.textContent = '';
         document.getElementById('nextBtn').disabled = true;
     }
 }
 
 /**
  * Actualiza el estado de los botones de navegación
  * - Deshabilita "Anterior" si estamos en la primera pregunta
  */
 function actualizarBotonesNavegacion() {
     document.getElementById('prevBtn').disabled = currentQuestionIndex === 0;
 }
 
 /**
  * Procesa la selección de una opción por el usuario
  * 
  * PROCESO:
  * 1. Valida que no se haya respondido antes
  * 2. Guarda la respuesta
  * 3. Verifica si es correcta
  * 4. Actualiza estilos visuales
  * 5. Muestra retroalimentación
  * 6. Habilita botón "Siguiente"
  * 
  * @param {string} selectedKey - Letra de la opción seleccionada (a, b, c, d)
  */
 function selectOption(selectedKey) {
     // Prevenir múltiples respuestas
     if (userAnswers[currentQuestionIndex]) {
         console.warn('⚠️ Pregunta ya respondida');
         return;
     }
 
     console.log(`👆 Opción seleccionada: ${selectedKey}`);
 
     // Guardar respuesta
     userAnswers[currentQuestionIndex] = selectedKey;
     
     const question = currentQuiz[currentQuestionIndex];
     const isCorrect = selectedKey === question.respuesta_correcta;
     
     console.log(isCorrect ? '✅ Correcto' : '❌ Incorrecto');
 
     // Actualizar estilos
     const options = document.querySelectorAll('.option');
     options.forEach(opt => {
         opt.classList.add('disabled');
         const key = opt.getAttribute('data-option');
         
         if (key === selectedKey) {
             opt.classList.add('selected');
             opt.classList.add(isCorrect ? 'correct' : 'incorrect');
         }
         
         if (key === question.respuesta_correcta) {
             opt.classList.add('correct');
         }
     });
 
     // Mostrar retroalimentación
     const feedback = document.getElementById('feedback');
     const reference = document.getElementById('reference');
     
     feedback.className = 'feedback show ' + (isCorrect ? 'correct' : 'incorrect');
     feedback.textContent = isCorrect 
         ? '✓ ¡Correcto! Excelente.' 
         : '✗ Incorrecto. La respuesta correcta es: ' + question.respuesta_correcta;
     
     reference.textContent = '📖 ' + question.referencia;
     
     // Habilitar siguiente
     document.getElementById('nextBtn').disabled = false;
 }
 
 /**
  * Avanza a la siguiente pregunta o muestra resultados
  */
 function nextQuestion() {
     if (currentQuestionIndex < totalQuestions - 1) {
         currentQuestionIndex++;
         console.log(`➡️ Pregunta ${currentQuestionIndex + 1}`);
         displayQuestion();
     } else {
         console.log('🏁 Quiz completado');
         showResults();
     }
 }
 
 /**
  * Retrocede a la pregunta anterior
  */
 function previousQuestion() {
     if (currentQuestionIndex > 0) {
         currentQuestionIndex--;
         console.log(`⬅️ Pregunta ${currentQuestionIndex + 1}`);
         displayQuestion();
     }
 }
 
 
 // ╔══════════════════════════════════════════════════════════════╗
 // ║  📊 FUNCIONES DE RESULTADOS Y FINALIZACIÓN                   ║
 // ╚══════════════════════════════════════════════════════════════╝
 
 /**
  * Calcula y muestra los resultados finales del quiz
  * 
  * CALCULA:
  * - Número de respuestas correctas
  * - Número de respuestas incorrectas
  * - Porcentaje de aciertos
  * 
  * MUESTRA:
  * - Estadísticas en tarjetas visuales
  * - Mensaje motivacional según el desempeño
  */
 function showResults() {
     console.log('═══════════════════════════════════════');
     console.log('📊 Calculando resultados...');
     
     // Contar respuestas correctas
     let correctAnswers = 0;
     currentQuiz.forEach((question, index) => {
         if (userAnswers[index] === question.respuesta_correcta) {
             correctAnswers++;
         }
     });
 
     const percentage = Math.round((correctAnswers / totalQuestions) * 100);
     
     console.log(`✅ Correctas: ${correctAnswers}/${totalQuestions}`);
     console.log(`📈 Porcentaje: ${percentage}%`);
     console.log('═══════════════════════════════════════');
 
     // Cambiar a pantalla de resultados
     cambiarPantalla('quiz-screen', 'results-screen');
 
     // Renderizar estadísticas
     renderizarEstadisticas(correctAnswers, totalQuestions, percentage);
 
     // Mostrar mensaje motivacional
     mostrarMensajeMotivacional(percentage);
 }
 
 /**
  * Renderiza las tarjetas de estadísticas
  * 
  * @param {number} correctas - Número de respuestas correctas
  * @param {number} total - Total de preguntas
  * @param {number} porcentaje - Porcentaje de aciertos
  */
 function renderizarEstadisticas(correctas, total, porcentaje) {
     const statsContainer = document.getElementById('statsContainer');
     statsContainer.innerHTML = `
         <div class="stat-card">
             <div class="stat-value">${correctas}</div>
             <div class="stat-label">Correctas</div>
         </div>
         <div class="stat-card">
             <div class="stat-value">${total - correctas}</div>
             <div class="stat-label">Incorrectas</div>
         </div>
         <div class="stat-card">
             <div class="stat-value">${porcentaje}%</div>
             <div class="stat-label">Puntuación</div>
         </div>
     `;
 }
 
 /**
  * Muestra mensaje motivacional según el desempeño
  * 
  * RANGOS:
  * - 90-100%: Excelente
  * - 70-89%: Muy bien
  * - 50-69%: Buen intento
  * - 0-49%: Sigue practicando
  * 
  * @param {number} porcentaje - Porcentaje de aciertos
  */

 
 /**
  * Reinicia la aplicación y vuelve a la pantalla inicial
  * 
  * RESETEA:
  * - Todas las variables del estado del juego
  * - Vuelve a la pantalla de selección
  * - Recarga la lista de cuestionarios
  */
 function restartQuiz() {
     console.log('═══════════════════════════════════════');
     console.log('🔄 Reiniciando aplicación');
     console.log('═══════════════════════════════════════');
     
     // Cambiar pantalla
     cambiarPantalla('results-screen', 'quiz-selection-screen');
     
     // Resetear estado
     resetearEstadoJuego();
     
     // Recargar cuestionarios
     loadQuizList();
 }
 
 /**
  * Sale del quiz actual con confirmación
  * 
  * Muestra advertencia porque se perderá el progreso.
  * Si el usuario confirma, regresa a la selección de cuestionarios.
  */
 function exitQuiz() {
     const confirmar = confirm(
         '¿Estás seguro de que deseas salir?\n\n' +
         'Se perderá tu progreso actual.'
     );
     
     if (confirmar) {
         console.log('🚪 Saliendo del quiz');
         
         cambiarPantalla('quiz-screen', 'quiz-selection-screen');
         resetearEstadoJuego();
         loadQuizList();
     }
 }
 
 /**
  * Resetea todas las variables del estado del juego
  * 
  * VARIABLES QUE RESETEA:
  * - currentQuiz: array de preguntas actual
  * - currentQuestionIndex: índice de pregunta actual
  * - userAnswers: respuestas del usuario
  * - totalQuestions: total de preguntas
  * - quizData: datos del cuestionario cargado
  * - selectedQuizFile: archivo seleccionado
  */
 function resetearEstadoJuego() {
     currentQuiz = [];
     currentQuestionIndex = 0;
     userAnswers = [];
     totalQuestions = 0;
     quizData = null;
     selectedQuizFile = null;
 }
 
 
 // ╔══════════════════════════════════════════════════════════════╗
 // ║  🚀 INICIALIZACIÓN DE LA APLICACIÓN                          ║
 // ╚══════════════════════════════════════════════════════════════╝
 
 /**
  * Punto de entrada de la aplicación
  * 
  * Se ejecuta automáticamente cuando el DOM está completamente cargado.
  * 
  * INICIALIZA:
  * 1. Muestra información de la configuración activa
  * 2. Carga la lista de cuestionarios disponibles
  * 
  * DEPENDENCIAS:
  * - Requiere que config.js esté cargado primero
  * - Requiere que QuizConfig esté definido
  */
 window.addEventListener('DOMContentLoaded', () => {
     console.clear(); // Limpiar consola para mejor legibilidad
     
     console.log('╔═══════════════════════════════════════════════════════╗');
     console.log('║   🎓 SISTEMA DE CUESTIONARIOS EN LÍNEA               ║');
     console.log('╚═══════════════════════════════════════════════════════╝');
     console.log('');
     console.log('📋 CONFIGURACIÓN ACTUAL:');
     console.log('   • Carpeta activa:', QuizConfig.carpetaActiva);
     console.log('   • Ruta índice:', QuizConfig.rutaIndex);
     console.log('   • Ruta base:', QuizConfig.rutaBaseCuestionarios);
     console.log('');
     console.log('💡 Para cambiar la carpeta de cuestionarios:');
     console.log('   1. Abre el archivo config.js');
     console.log('   2. Modifica CONFIG_CARPETA_ACTIVA');
     console.log('   3. Guarda y recarga la página');
     console.log('');
     console.log('═══════════════════════════════════════════════════════');
     console.log('');
     
     // Cargar cuestionarios disponibles
     loadQuizList();
 });
 
 
 // ═══════════════════════════════════════════════════════════════
 // 📖 DOCUMENTACIÓN ADICIONAL
 // ═══════════════════════════════════════════════════════════════
 //
 // FLUJO DE LA APLICACIÓN:
 // ========================
 //
 // 1. INICIALIZACIÓN (DOMContentLoaded)
 //    └─> loadQuizList()
 //        └─> Descarga index.json
 //        └─> Renderiza tarjetas de cuestionarios
 //
 // 2. SELECCIÓN DE CUESTIONARIO
 //    └─> selectQuiz(filepath, filename)
 //        └─> Descarga el archivo JSON del cuestionario
 //        └─> Guarda en quizData
 //        └─> Cambia a pantalla de configuración
 //
 // 3. INICIO DEL QUIZ
 //    └─> startQuiz(numQuestions)
 //        └─> getAllQuestions() - Obtiene todas las preguntas
 //        └─> shuffleArray() - Mezcla aleatoriamente
 //        └─> Selecciona N preguntas
 //        └─> displayQuestion() - Muestra primera pregunta
 //
 // 4. JUEGO (por cada pregunta)
 //    └─> displayQuestion()
 //        └─> Renderiza pregunta y opciones
 //        └─> Usuario hace clic en opción
 //            └─> selectOption(key)
 //                └─> Guarda respuesta
 //                └─> Muestra retroalimentación
 //                └─> Habilita botón "Siguiente"
 //    └─> nextQuestion() o previousQuestion()
 //
 // 5. FINALIZACIÓN
 //    └─> showResults()
 //        └─> Calcula estadísticas
 //        └─> Muestra resultados
 //        └─> Mensaje motivacional
 //
 // 6. REINICIO
 //    └─> restartQuiz() - Vuelve al inicio
 //    └─> exitQuiz() - Sale del quiz actual
 //
 //
 // ESTRUCTURA DE ARCHIVOS JSON:
 // =============================
 //
 // index.json (o index5.json, etc.):
 // {
 //   "cuestionarios": [
 //     "cuestionario1.json",
 //     "cuestionario2.json"
 //   ]
 // }
 //
 // cuestionario.json:
 // {
 //   "cuestionario": {
 //     "titulo": "Nombre del cuestionario",
 //     "autor": "Autor",
 //     "secciones": [
 //       {
 //         "titulo": "Sección 1",
 //         "preguntas": [
 //           {
 //             "pregunta": "¿Texto de la pregunta?",
 //             "opciones": {
 //               "a": "Opción A",
 //               "b": "Opción B",
 //               "c": "Opción C",
 //               "d": "Opción D"
 //             },
 //             "respuesta_correcta": "a",
 //             "referencia": "Página 123"
 //           }
 //         ]
 //       }
 //     ]
 //   }
 // }
 //
 //
 // PERSONALIZACIÓN:
 // ================
 //
 // Para cambiar la carpeta de cuestionarios:
 // → Modifica config.js, variable CONFIG_CARPETA_ACTIVA
 //
 // Para cambiar la ruta base (si no es "bd-preguntas"):
 // → Modifica config.js, variable CONFIG_RUTA_BASE
 //
 // Para cambiar el patrón del archivo índice:
 // → Modifica config.js, variable CONFIG_PATRON_INDEX
 //
 // Para modificar la lógica del juego:
 // → Edita las funciones en este archivo (app.js)
 //
 //
 // SOLUCIÓN DE PROBLEMAS:
 // ======================
 //
 // Si no carga los cuestionarios:
 // 1. Abre la consola del navegador (F12)
 // 2. Busca errores en rojo
 // 3. Verifica que la carpeta exista
 // 4. Verifica que el archivo index.json exista y sea válido
 // 5. Verifica la configuración en config.js
 //
 // Si las preguntas no se muestran correctamente:
 // 1. Verifica el formato del JSON del cuestionario
 // 2. Asegúrate de que tenga la estructura correcta
 // 3. Verifica que todas las preguntas tengan opciones y respuesta_correcta
 //
 // ═══════════════════════════════════════════════════════════════