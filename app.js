/**
 * SISTEMA DE CUESTIONARIOS EN LÍNEA - CONFIGURACIÓN SIMPLE
 * 
 * Este archivo maneja toda la lógica de la aplicación de cuestionarios.
 * Para cambiar de carpeta de cuestionarios, solo modifica la variable CONFIG_CARPETA_ACTIVA
 * 
 * INSTRUCCIONES PARA CAMBIAR DE TEMA:
 * 1. Busca la sección "CONFIGURACIÓN PRINCIPAL" más abajo
 * 2. Cambia el valor de CONFIG_CARPETA_ACTIVA a la carpeta que desees usar
 * 3. Ejemplos: 'Lectura-4', 'Lectura-5', 'Lectura-6', etc.
 */

// ============================================
// 🔧 CONFIGURACIÓN PRINCIPAL - CAMBIAR AQUÍ
// ============================================

/**
 * CARPETA ACTIVA DE CUESTIONARIOS
 * Cambia este valor para seleccionar qué carpeta de cuestionarios usar
 * 
 * Valores posibles:
 * - 'Lectura-4' → Usará bd-preguntas/Lectura-4/
 * - 'Lectura-5' → Usará bd-preguntas/Lectura-5/
 * - 'Lectura-6' → Usará bd-preguntas/Lectura-6/ (futura)
 * 
 * IMPORTANTE: La carpeta debe existir y contener un archivo index.json
 */
 const CONFIG_CARPETA_ACTIVA = 'Lectura-5'; // ← CAMBIAR AQUÍ PARA USAR OTRA CARPETA

 // ============================================
 // VARIABLES GLOBALES
 // ============================================
 
 // Almacena todos los datos del cuestionario actual cargado desde JSON
 let quizData = null;
 
 // Array con las preguntas seleccionadas para el quiz actual
 let currentQuiz = [];
 
 // Índice de la pregunta actual que se está mostrando (0-based)
 let currentQuestionIndex = 0;
 
 // Array que almacena las respuestas del usuario para cada pregunta
 let userAnswers = [];
 
 // Número total de preguntas en el quiz actual
 let totalQuestions = 0;
 
 // Ruta completa del archivo JSON del cuestionario seleccionado
 let selectedQuizFile = null;
 
 // Lista de cuestionarios disponibles en la carpeta activa
 let availableQuizzes = [];
 
 
 // ============================================
 // FUNCIONES DE CARGA DE DATOS
 // ============================================
 
 /**
  * Carga la lista de cuestionarios disponibles de la carpeta configurada
  * Lee el archivo index.json dentro de la carpeta CONFIG_CARPETA_ACTIVA
  * 
  * Ejemplos de rutas que carga:
  * - Si CONFIG_CARPETA_ACTIVA = 'Lectura-5' → carga bd-preguntas/Lectura-5/index5.json
  * - Si CONFIG_CARPETA_ACTIVA = 'Lectura-4' → carga bd-preguntas/Lectura-4/index4.json
  */
 async function loadQuizList() {
     const container = document.getElementById('quizListContainer');
     container.innerHTML = '<p style="text-align: center; color: #666;">Cargando cuestionarios disponibles...</p>';
     
     try {
         // Construir la ruta del índice según la carpeta activa
         // Extrae el número de la carpeta (ej: "Lectura-5" → "5")
         const carpetaNumero = CONFIG_CARPETA_ACTIVA.match(/\d+/)?.[0] || '';
         const indexPath = `bd-preguntas/${CONFIG_CARPETA_ACTIVA}/index${carpetaNumero}.json`;
         const baseQuizPath = `bd-preguntas/${CONFIG_CARPETA_ACTIVA}/`;
         
         console.log(`📂 Cargando cuestionarios desde: ${indexPath}`);
         
         // Cargar el archivo índice de cuestionarios
         const response = await fetch(indexPath);
         
         if (!response.ok) {
             throw new Error(`No se encontró el archivo ${indexPath}`);
         }
         
         const data = await response.json();
         availableQuizzes = data.cuestionarios || [];
         
         // Validar que haya cuestionarios disponibles
         if (availableQuizzes.length === 0) {
             container.innerHTML = `
                 <div style="text-align: center; padding: 40px;">
                     <p style="color: #999; font-size: 18px; margin-bottom: 15px;">🔭 No hay cuestionarios disponibles</p>
                     <p style="color: #666; font-size: 14px;">Carpeta activa: <strong>${CONFIG_CARPETA_ACTIVA}</strong></p>
                 </div>
             `;
             return;
         }
         
         console.log(`✅ Encontrados ${availableQuizzes.length} cuestionarios`);
         
         // Limpiar contenedor y mostrar encabezado
         container.innerHTML = '';
         
         // Encabezado con información de la carpeta activa
         const header = document.createElement('div');
         header.style.cssText = 'text-align: center; margin-bottom: 25px; padding: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; color: white;';
         header.innerHTML = `
             <h3 style="margin: 0 0 5px 0; font-size: 20px;">📚 ${CONFIG_CARPETA_ACTIVA}</h3>
             <p style="margin: 0; font-size: 14px; opacity: 0.9;">${availableQuizzes.length} cuestionarios disponibles</p>
         `;
         container.appendChild(header);
         
         // Crear tarjeta para cada cuestionario disponible
         for (const filename of availableQuizzes) {
             const quizCard = document.createElement('div');
             quizCard.className = 'quiz-card';
             
             // Formatear nombre del cuestionario para mejor visualización
             // Ejemplo: "cuestionario1.json" → "Cuestionario 1"
             const displayName = filename
                 .replace('.json', '')
                 .replace(/-/g, ' ')
                 .replace(/\b\w/g, l => l.toUpperCase());
             
             quizCard.innerHTML = `
                 <h3>📋 ${displayName}</h3>
                 <p style="color: #888; font-size: 13px; margin-top: 5px;">${filename}</p>
                 <button class="btn" onclick="selectQuiz('${baseQuizPath}${filename}', '${filename}')">Seleccionar</button>
             `;
             container.appendChild(quizCard);
         }
         
         // Mensaje informativo al final
         const footer = document.createElement('p');
         footer.style.cssText = 'text-align: center; color: #999; margin-top: 20px; font-size: 13px; font-style: italic;';
         footer.textContent = `Mostrando cuestionarios de: ${CONFIG_CARPETA_ACTIVA}`;
         container.appendChild(footer);
         
     } catch (error) {
         console.error('❌ Error cargando índice de cuestionarios:', error);
         
         // Mostrar mensaje de error detallado
         container.innerHTML = `
             <div style="text-align: center; padding: 40px;">
                 <p style="color: #dc3545; font-size: 18px; margin-bottom: 15px;">❌ Error al cargar cuestionarios</p>
                 <p style="color: #666; font-size: 14px; margin-bottom: 10px;">
                     No se pudo cargar desde: <strong>${CONFIG_CARPETA_ACTIVA}</strong>
                 </p>
                 <p style="color: #999; font-size: 13px; margin-bottom: 20px;">
                     Verifica que la carpeta exista y contenga el archivo index.json
                 </p>
                 <button class="btn" onclick="loadQuizList()" style="margin-top: 20px;">🔄 Reintentar</button>
             </div>
         `;
     }
 }
 
 /**
  * Selecciona y carga un cuestionario específico
  * 
  * @param {string} filepath - Ruta completa al archivo JSON del cuestionario
  *                           Ejemplo: "bd-preguntas/Lectura-5/cuestionario1.json"
  * @param {string} filename - Nombre del archivo para mostrar al usuario
  *                           Ejemplo: "cuestionario1.json"
  */
 async function selectQuiz(filepath, filename) {
     selectedQuizFile = filepath;
     
     console.log(`📖 Cargando cuestionario: ${filepath}`);
     
     // Mostrar indicador de carga mientras se descarga el archivo
     const container = document.getElementById('quizListContainer');
     container.innerHTML = `
         <div style="text-align: center; padding: 60px;">
             <div style="font-size: 48px; margin-bottom: 20px;">⏳</div>
             <p style="color: #666; font-size: 16px;">Cargando <strong>${filename}</strong>...</p>
         </div>
     `;
     
     try {
         // Cargar el archivo JSON del cuestionario
         const response = await fetch(filepath);
         
         if (!response.ok) {
             throw new Error(`No se pudo cargar el archivo: ${filename}`);
         }
         
         const data = await response.json();
         quizData = data;
         
         console.log(`✅ Cuestionario cargado exitosamente`);
         console.log(`   Secciones: ${data.cuestionario?.secciones?.length || 0}`);
         
         // Cambiar a la pantalla de configuración del quiz
         document.querySelector('.quiz-selection-screen').classList.remove('active');
         document.querySelector('.setup-screen').classList.add('active');
         
         // Actualizar título con el nombre del cuestionario seleccionado
         const quizTitle = document.getElementById('selectedQuizTitle');
         if (quizTitle) {
             quizTitle.textContent = filename;
         }
         
     } catch (error) {
         console.error('❌ Error cargando cuestionario:', error);
         alert(`❌ Error al cargar el cuestionario "${filename}"\n\nVerifica que el archivo exista y tenga el formato correcto.`);
         
         // Volver a cargar la lista de cuestionarios
         loadQuizList();
     }
 }
 
 
 // ============================================
 // FUNCIONES DE NAVEGACIÓN ENTRE PANTALLAS
 // ============================================
 
 /**
  * Regresa a la selección de cuestionarios desde la pantalla de configuración
  * Resetea los datos del cuestionario seleccionado
  */
 function backToQuizSelection() {
     console.log('🔙 Regresando a selección de cuestionarios');
     
     // Cambiar visibilidad de pantallas
     document.querySelector('.setup-screen').classList.remove('active');
     document.querySelector('.quiz-selection-screen').classList.add('active');
     
     // Limpiar datos del cuestionario seleccionado
     quizData = null;
     selectedQuizFile = null;
     
     // Recargar la lista de cuestionarios
     loadQuizList();
 }
 
 
 // ============================================
 // FUNCIONES DE GESTIÓN DEL QUIZ
 // ============================================
 
 /**
  * Obtiene todas las preguntas disponibles de todas las secciones del cuestionario
  * 
  * El cuestionario está organizado en secciones, esta función las extrae todas
  * y las junta en un solo array para poder mezclarlas y seleccionarlas aleatoriamente
  * 
  * @returns {Array} Array con todas las preguntas del cuestionario
  *                  Retorna array vacío si no hay datos válidos
  */
 function getAllQuestions() {
     // Validar que existan los datos necesarios
     if (!quizData || !quizData.cuestionario || !quizData.cuestionario.secciones) {
         console.warn('⚠️ No hay datos de cuestionario disponibles');
         return [];
     }
     
     let allQuestions = [];
     
     // Recorrer todas las secciones y concatenar sus preguntas
     quizData.cuestionario.secciones.forEach((seccion, index) => {
         console.log(`   Sección ${index + 1}: ${seccion.preguntas?.length || 0} preguntas`);
         allQuestions = allQuestions.concat(seccion.preguntas || []);
     });
     
     console.log(`📊 Total de preguntas disponibles: ${allQuestions.length}`);
     
     return allQuestions;
 }
 
 /**
  * Mezcla aleatoriamente un array usando el algoritmo Fisher-Yates
  * 
  * Este algoritmo garantiza una distribución uniforme y aleatoria
  * No modifica el array original, crea una copia
  * 
  * @param {Array} array - Array a mezclar
  * @returns {Array} Nuevo array con los elementos mezclados aleatoriamente
  */
 function shuffleArray(array) {
     // Crear una copia para no modificar el original
     const newArray = [...array];
     
     // Algoritmo Fisher-Yates: recorre el array de atrás hacia adelante
     // y intercambia cada elemento con uno aleatorio anterior
     for (let i = newArray.length - 1; i > 0; i--) {
         const j = Math.floor(Math.random() * (i + 1));
         [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
     }
     
     return newArray;
 }
 
 /**
  * Inicia el cuestionario con el número especificado de preguntas
  * 
  * Proceso:
  * 1. Obtiene todas las preguntas disponibles
  * 2. Las mezcla aleatoriamente
  * 3. Selecciona la cantidad solicitada
  * 4. Inicializa variables de estado
  * 5. Muestra la primera pregunta
  * 
  * @param {number} numQuestions - Cantidad de preguntas para el quiz (10, 20, 30, 50)
  */
 function startQuiz(numQuestions) {
     console.log(`🎯 Iniciando quiz con ${numQuestions} preguntas`);
     
     const allQuestions = getAllQuestions();
     
     // Validar que haya preguntas disponibles
     if (allQuestions.length === 0) {
         alert('❌ No hay preguntas disponibles.\nPor favor, intente con otro cuestionario.');
         return;
     }
     
     // Ajustar cantidad si excede las preguntas disponibles
     if (numQuestions > allQuestions.length) {
         alert(`ℹ️ Solo hay ${allQuestions.length} preguntas disponibles.\nSe usarán todas las preguntas.`);
         numQuestions = allQuestions.length;
     }
     
     // Mezclar todas las preguntas y seleccionar las primeras N
     const shuffled = shuffleArray(allQuestions);
     currentQuiz = shuffled.slice(0, numQuestions);
     
     // Inicializar variables de estado del quiz
     totalQuestions = numQuestions;
     currentQuestionIndex = 0;
     userAnswers = new Array(totalQuestions).fill(null); // Array con todas las respuestas en null
     
     console.log(`✅ Quiz iniciado - ${totalQuestions} preguntas seleccionadas`);
 
     // Cambiar a la pantalla del quiz
     document.querySelector('.setup-screen').classList.remove('active');
     document.querySelector('.quiz-screen').classList.add('active');
 
     // Mostrar la primera pregunta
     displayQuestion();
 }
 
 /**
  * Muestra la pregunta actual en la interfaz
  * 
  * Actualiza todos los elementos visuales:
  * - Barra de progreso
  * - Número de pregunta
  * - Texto de la pregunta
  * - Opciones de respuesta
  * - Retroalimentación (si ya fue respondida)
  * - Estado de botones de navegación
  */
 function displayQuestion() {
     const question = currentQuiz[currentQuestionIndex];
     
     console.log(`📝 Mostrando pregunta ${currentQuestionIndex + 1}/${totalQuestions}`);
     
     // Calcular y actualizar barra de progreso
     const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
     document.getElementById('progressFill').style.width = progress + '%';
     
     // Actualizar número de pregunta
     document.getElementById('questionNumber').textContent = `Pregunta ${currentQuestionIndex + 1} de ${totalQuestions}`;
     
     // Mostrar texto de la pregunta
     document.getElementById('questionText').textContent = question.pregunta;
 
     // ===== GENERAR OPCIONES DE RESPUESTA =====
     const optionsContainer = document.getElementById('optionsContainer');
     optionsContainer.innerHTML = ''; // Limpiar opciones anteriores
 
     // Recorrer todas las opciones (a, b, c, d, etc.)
     Object.keys(question.opciones).forEach(key => {
         const option = document.createElement('div');
         option.className = 'option';
         option.textContent = `${key}) ${question.opciones[key]}`;
         option.setAttribute('data-option', key);
 
         // Si la pregunta ya fue respondida, mostrar retroalimentación
         if (userAnswers[currentQuestionIndex]) {
             option.classList.add('disabled'); // Deshabilitar clic
             
             // Marcar la opción que el usuario seleccionó
             if (key === userAnswers[currentQuestionIndex]) {
                 option.classList.add('selected');
                 
                 // Indicar si fue correcta o incorrecta
                 if (key === question.respuesta_correcta) {
                     option.classList.add('correct');
                 } else {
                     option.classList.add('incorrect');
                 }
             }
             
             // Siempre mostrar cuál era la respuesta correcta
             if (key === question.respuesta_correcta) {
                 option.classList.add('correct');
             }
         } else {
             // Si no fue respondida, permitir selección con clic
             option.addEventListener('click', () => selectOption(key));
         }
 
         optionsContainer.appendChild(option);
     });
 
     // ===== ACTUALIZAR RETROALIMENTACIÓN =====
     const feedback = document.getElementById('feedback');
     const reference = document.getElementById('reference');
     
     if (userAnswers[currentQuestionIndex]) {
         // Ya fue respondida: mostrar feedback
         const isCorrect = userAnswers[currentQuestionIndex] === question.respuesta_correcta;
         
         feedback.className = 'feedback show ' + (isCorrect ? 'correct' : 'incorrect');
         feedback.textContent = isCorrect 
             ? '✔ ¡Correcto! Excelente.' 
             : '✗ Incorrecto. La respuesta correcta es: ' + question.respuesta_correcta;
         
         reference.textContent = '📖 ' + question.referencia;
         
         // Habilitar botón siguiente
         document.getElementById('nextBtn').disabled = false;
     } else {
         // No fue respondida: ocultar feedback
         feedback.className = 'feedback';
         reference.textContent = '';
         
         // Deshabilitar botón siguiente hasta que responda
         document.getElementById('nextBtn').disabled = true;
     }
 
     // ===== ACTUALIZAR BOTONES DE NAVEGACIÓN =====
     // Deshabilitar botón "Anterior" si estamos en la primera pregunta
     document.getElementById('prevBtn').disabled = currentQuestionIndex === 0;
 }
 
 /**
  * Procesa la selección de una opción por parte del usuario
  * 
  * Cuando el usuario hace clic en una opción:
  * 1. Guarda la respuesta
  * 2. Verifica si es correcta
  * 3. Actualiza los estilos de las opciones
  * 4. Muestra retroalimentación inmediata
  * 5. Habilita el botón "Siguiente"
  * 
  * @param {string} selectedKey - Letra de la opción seleccionada (a, b, c, d, etc.)
  */
 function selectOption(selectedKey) {
     // Prevenir selección múltiple (solo se puede responder una vez)
     if (userAnswers[currentQuestionIndex]) {
         console.warn('⚠️ Esta pregunta ya fue respondida');
         return;
     }
 
     console.log(`👆 Opción seleccionada: ${selectedKey}`);
 
     // Guardar la respuesta del usuario
     userAnswers[currentQuestionIndex] = selectedKey;
     
     const question = currentQuiz[currentQuestionIndex];
     const isCorrect = selectedKey === question.respuesta_correcta;
     
     console.log(isCorrect ? '✅ Respuesta correcta' : '❌ Respuesta incorrecta');
 
     // ===== ACTUALIZAR ESTILOS DE LAS OPCIONES =====
     const options = document.querySelectorAll('.option');
     options.forEach(opt => {
         opt.classList.add('disabled'); // Deshabilitar todas las opciones
         const key = opt.getAttribute('data-option');
         
         // Marcar la opción seleccionada por el usuario
         if (key === selectedKey) {
             opt.classList.add('selected');
             
             // Indicar si fue correcta o incorrecta
             if (isCorrect) {
                 opt.classList.add('correct');
             } else {
                 opt.classList.add('incorrect');
             }
         }
         
         // Siempre resaltar la respuesta correcta
         if (key === question.respuesta_correcta) {
             opt.classList.add('correct');
         }
     });
 
     // ===== MOSTRAR RETROALIMENTACIÓN =====
     const feedback = document.getElementById('feedback');
     const reference = document.getElementById('reference');
     
     feedback.className = 'feedback show ' + (isCorrect ? 'correct' : 'incorrect');
     feedback.textContent = isCorrect 
         ? '✔ ¡Correcto! Excelente.' 
         : '✗ Incorrecto. La respuesta correcta es: ' + question.respuesta_correcta;
     
     // Mostrar la referencia bibliográfica
     reference.textContent = '📖 ' + question.referencia;
     
     // Habilitar el botón "Siguiente"
     document.getElementById('nextBtn').disabled = false;
 }
 
 /**
  * Avanza a la siguiente pregunta o muestra resultados si es la última
  * 
  * Verifica si hay más preguntas:
  * - Si hay: avanza a la siguiente
  * - Si es la última: muestra la pantalla de resultados
  */
 function nextQuestion() {
     if (currentQuestionIndex < totalQuestions - 1) {
         // Hay más preguntas: avanzar
         currentQuestionIndex++;
         console.log(`➡️ Avanzando a pregunta ${currentQuestionIndex + 1}`);
         displayQuestion();
     } else {
         // Era la última pregunta: mostrar resultados
         console.log('🏁 Quiz completado - Mostrando resultados');
         showResults();
     }
 }
 
 /**
  * Retrocede a la pregunta anterior
  * 
  * Permite revisar preguntas ya respondidas
  * El botón está deshabilitado si estamos en la primera pregunta
  */
 function previousQuestion() {
     if (currentQuestionIndex > 0) {
         currentQuestionIndex--;
         console.log(`⬅️ Retrocediendo a pregunta ${currentQuestionIndex + 1}`);
         displayQuestion();
     }
 }
 
 
 // ============================================
 // FUNCIONES DE RESULTADOS Y FINALIZACIÓN
 // ============================================
 
 /**
  * Calcula y muestra los resultados finales del quiz
  * 
  * Proceso:
  * 1. Cuenta respuestas correctas e incorrectas
  * 2. Calcula porcentaje de aciertos
  * 3. Muestra estadísticas visuales
  * 4. Genera mensaje motivacional según el desempeño
  */
 function showResults() {
     console.log('📊 Calculando resultados...');
     
     // Contar respuestas correctas
     let correctAnswers = 0;
     currentQuiz.forEach((question, index) => {
         if (userAnswers[index] === question.respuesta_correcta) {
             correctAnswers++;
         }
     });
 
     // Calcular porcentaje de aciertos
     const percentage = Math.round((correctAnswers / totalQuestions) * 100);
     
     console.log(`✅ Correctas: ${correctAnswers}/${totalQuestions} (${percentage}%)`);
 
     // Cambiar a pantalla de resultados
     document.querySelector('.quiz-screen').classList.remove('active');
     document.querySelector('.results-screen').classList.add('active');
 
     // ===== MOSTRAR ESTADÍSTICAS =====
     const statsContainer = document.getElementById('statsContainer');
     statsContainer.innerHTML = `
         <div class="stat-card">
             <div class="stat-value">${correctAnswers}</div>
             <div class="stat-label">Correctas</div>
         </div>
         <div class="stat-card">
             <div class="stat-value">${totalQuestions - correctAnswers}</div>
             <div class="stat-label">Incorrectas</div>
         </div>
         <div class="stat-card">
             <div class="stat-value">${percentage}%</div>
             <div class="stat-label">Puntuación</div>
         </div>
     `;
 
     // ===== GENERAR MENSAJE MOTIVACIONAL =====
     let message = '';
     if (percentage >= 90) {
         message = '¡Excelente trabajo! 🌟 Dominas el tema.';
     } else if (percentage >= 70) {
         message = '¡Muy bien! 👍 Buen conocimiento del tema.';
     } else if (percentage >= 50) {
         message = '¡Buen intento! 📚 Sigue estudiando.';
     } else {
         message = '¡No te rindas! 💪 La práctica hace al maestro.';
     }
 
     document.getElementById('scoreMessage').textContent = message;
 }
 
 /**
  * Reinicia la aplicación y vuelve a la pantalla inicial
  * 
  * Resetea todas las variables y recarga la lista de cuestionarios
  * disponibles en la carpeta configurada
  */
 function restartQuiz() {
     console.log('🔄 Reiniciando aplicación');
     
     // Cambiar a pantalla inicial
     document.querySelector('.results-screen').classList.remove('active');
     document.querySelector('.quiz-selection-screen').classList.add('active');
     
     // Resetear todas las variables globales
     currentQuiz = [];
     currentQuestionIndex = 0;
     userAnswers = [];
     totalQuestions = 0;
     quizData = null;
     selectedQuizFile = null;
     
     // Recargar lista de cuestionarios
     loadQuizList();
 }
 
 /**
  * Sale del quiz actual confirmando con el usuario
  * 
  * Muestra un mensaje de confirmación porque se perderá el progreso actual
  * Si el usuario confirma, regresa a la pantalla de selección de cuestionarios
  */
 function exitQuiz() {
     const confirmExit = confirm('¿Estás seguro de que deseas salir?\n\nSe perderá tu progreso actual.');
     
     if (confirmExit) {
         console.log('🚪 Saliendo del quiz');
         
         // Cambiar a pantalla de selección
         document.querySelector('.quiz-screen').classList.remove('active');
         document.querySelector('.quiz-selection-screen').classList.add('active');
         
         // Resetear variables
         currentQuiz = [];
         currentQuestionIndex = 0;
         userAnswers = [];
         totalQuestions = 0;
         quizData = null;
         selectedQuizFile = null;
         
         // Recargar lista de cuestionarios
         loadQuizList();
     }
 }
 
 
 // ============================================
 // 🚀 INICIALIZACIÓN DE LA APLICACIÓN
 // ============================================
 
 /**
  * Punto de entrada de la aplicación
  * 
  * Se ejecuta automáticamente cuando el DOM está completamente cargado
  * Carga la lista de cuestionarios de la carpeta configurada en CONFIG_CARPETA_ACTIVA
  */
 window.addEventListener('DOMContentLoaded', () => {
     console.log('🎓 Aplicación de Cuestionarios Iniciada');
     console.log(`📂 Carpeta activa: ${CONFIG_CARPETA_ACTIVA}`);
     console.log('━'.repeat(50));
     
     // Cargar cuestionarios disponibles
     loadQuizList();
 });