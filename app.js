/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SISTEMA DE CUESTIONARIOS EN LÍNEA - app.js (Versión 3.0)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 🎯 PROPÓSITO:
 * Sistema completo de cuestionarios con soporte para múltiples tipos de preguntas:
 * - Opción múltiple (multiple_choice)
 * - Preguntas abiertas con palabras clave (open_ended)
 * - Preguntas de una sola palabra (single_word)
 * - Verdadero/Falso (true_false)
 * - Completar oraciones (fill_blank)
 * - Múltiples palabras clave (multiple_keywords)
 * 
 * 🆕 NOVEDADES VERSIÓN 3.0:
 * - Soporte para 6 tipos diferentes de preguntas
 * - Validación inteligente según el tipo de pregunta
 * - Sistema de palabras clave con pesos y prioridades
 * - Interfaz adaptativa según el tipo de pregunta
 * - Feedback visual mejorado y personalizado
 * 
 * 📝 PARA CAMBIAR LA CARPETA DE CUESTIONARIOS:
 * Ve al archivo config.js y modifica CONFIG_CARPETA_ACTIVA
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */


// ╔═══════════════════════════════════════════════════════════════════════╗
// ║  📦 VARIABLES GLOBALES DEL ESTADO DEL JUEGO                           ║
// ╚═══════════════════════════════════════════════════════════════════════╝

let quizData = null;
let currentQuiz = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let totalQuestions = 0;
let selectedQuizFile = null;
let availableQuizzes = [];


// ╔═══════════════════════════════════════════════════════════════════════╗
// ║  🔧 UTILIDADES DE NORMALIZACIÓN DE TEXTO                              ║
// ╚═══════════════════════════════════════════════════════════════════════╝

/**
 * Normaliza un texto para comparación
 * Proceso: minúsculas, sin tildes, sin puntuación, sin espacios extras
 * 
 * @param {string} texto - Texto a normalizar
 * @returns {string} Texto normalizado
 */
function normalizarTexto(texto) {
    if (!texto) return '';
    
    return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Extrae palabras individuales de un texto normalizado
 * 
 * @param {string} texto - Texto del cual extraer palabras
 * @returns {Array<string>} Array de palabras
 */
function extraerPalabras(texto) {
    const textoNormalizado = normalizarTexto(texto);
    return textoNormalizado.split(' ').filter(palabra => palabra.length > 0);
}


// ╔═══════════════════════════════════════════════════════════════════════╗
// ║  ✅ VALIDACIÓN DE RESPUESTAS POR TIPO                                 ║
// ╚═══════════════════════════════════════════════════════════════════════╝

/**
 * Valida una respuesta de una sola palabra
 * Compara la respuesta del usuario con la respuesta correcta o sus sinónimos
 * 
 * @param {string} respuestaUsuario - Respuesta del usuario
 * @param {Object} question - Objeto de pregunta
 * @returns {Object} Resultado de validación
 */
function validarRespuestaPalabraUnica(respuestaUsuario, question) {
    const respuestaNormalizada = normalizarTexto(respuestaUsuario);
    const respuestaCorrectaNormalizada = normalizarTexto(question.respuesta_correcta);
    
    // Verificar respuesta exacta
    let esCorrecta = respuestaNormalizada === respuestaCorrectaNormalizada;
    
    // Verificar sinónimos si existen
    if (!esCorrecta && question.sinonimos) {
        esCorrecta = question.sinonimos.some(sinonimo => 
            normalizarTexto(sinonimo) === respuestaNormalizada
        );
    }
    
    return {
        esCorrecta: esCorrecta,
        respuestaEsperada: question.respuesta_correcta,
        respuestaNormalizada: respuestaNormalizada
    };
}

/**
 * Valida una respuesta verdadero/falso
 * 
 * @param {string} respuestaUsuario - "verdadero" o "falso"
 * @param {Object} question - Objeto de pregunta
 * @returns {Object} Resultado de validación
 */
function validarRespuestaVerdaderoFalso(respuestaUsuario, question) {
    const respuestaNormalizada = normalizarTexto(respuestaUsuario);
    const respuestaCorrectaNormalizada = normalizarTexto(question.respuesta_correcta);
    
    return {
        esCorrecta: respuestaNormalizada === respuestaCorrectaNormalizada,
        respuestaEsperada: question.respuesta_correcta
    };
}

/**
 * Valida una respuesta con palabras clave (versión mejorada)
 * Soporta palabras con diferentes pesos y prioridades
 * 
 * ESTRUCTURA ESPERADA:
 * {
 *   palabras: ["palabra1", "palabra2", "palabra3"],
 *   pesos: [3, 2, 1],  // Opcional: peso de cada palabra
 *   sinonimos: {
 *     "palabra1": ["sinónimo1", "sinónimo2"]
 *   },
 *   umbral_minimo: 0.6  // Porcentaje mínimo para aprobar (60%)
 * }
 * 
 * @param {string} respuestaUsuario - Respuesta del usuario
 * @param {Object} palabrasClave - Configuración de palabras clave
 * @returns {Object} Resultado de validación detallado
 */
function validarRespuestaPalabrasClave(respuestaUsuario, palabrasClave) {
    const respuestaNormalizada = normalizarTexto(respuestaUsuario);
    
    const palabrasRequeridas = palabrasClave.palabras || [];
    const pesos = palabrasClave.pesos || palabrasRequeridas.map(() => 1);
    const sinonimos = palabrasClave.sinonimos || {};
    const umbralMinimo = palabrasClave.umbral_minimo || 0.6;
    
    const palabrasEncontradas = [];
    const palabrasFaltantes = [];
    let puntajeObtenido = 0;
    let puntajeTotal = 0;
    
    palabrasRequeridas.forEach((palabraRequerida, index) => {
        const peso = pesos[index] || 1;
        puntajeTotal += peso;
        
        const palabraNormalizada = normalizarTexto(palabraRequerida);
        
        // Crear lista de variantes (palabra + sinónimos)
        const variantes = [palabraNormalizada];
        if (sinonimos[palabraRequerida]) {
            sinonimos[palabraRequerida].forEach(sinonimo => {
                variantes.push(normalizarTexto(sinonimo));
            });
        }
        
        // Verificar si alguna variante está presente
        const encontrada = variantes.some(variante => 
            respuestaNormalizada.includes(variante)
        );
        
        if (encontrada) {
            palabrasEncontradas.push({
                palabra: palabraRequerida,
                peso: peso
            });
            puntajeObtenido += peso;
        } else {
            palabrasFaltantes.push({
                palabra: palabraRequerida,
                peso: peso
            });
        }
    });
    
    const porcentaje = puntajeTotal > 0 ? puntajeObtenido / puntajeTotal : 0;
    const esCorrecta = porcentaje >= umbralMinimo;
    
    return {
        esCorrecta: esCorrecta,
        porcentaje: porcentaje,
        palabrasEncontradas: palabrasEncontradas,
        palabrasFaltantes: palabrasFaltantes,
        puntajeObtenido: puntajeObtenido,
        puntajeTotal: puntajeTotal,
        respuestaNormalizada: respuestaNormalizada
    };
}

/**
 * Función principal de validación
 * Detecta el tipo de pregunta y aplica la validación correspondiente
 * 
 * @param {string} respuestaUsuario - Respuesta del usuario
 * @param {Object} question - Objeto de pregunta completo
 * @returns {Object} Resultado de validación
 */
function validarRespuesta(respuestaUsuario, question) {
    const tipo = question.tipo || 'multiple_choice';
    
    switch(tipo) {
        case 'single_word':
            return validarRespuestaPalabraUnica(respuestaUsuario, question);
            
        case 'true_false':
            return validarRespuestaVerdaderoFalso(respuestaUsuario, question);
            
        case 'fill_blank':
        case 'multiple_keywords':
        case 'open_ended':
            return validarRespuestaPalabrasClave(respuestaUsuario, question.palabras_clave);
            
        default:
            return { esCorrecta: false };
    }
}


// ╔═══════════════════════════════════════════════════════════════════════╗
// ║  🔥 FUNCIONES DE CARGA DE DATOS                                       ║
// ╚═══════════════════════════════════════════════════════════════════════╝

async function loadQuizList() {
    const container = document.getElementById('quizListContainer');
    container.innerHTML = '<p style="text-align: center; color: #666;">Cargando cuestionarios disponibles...</p>';
    
    try {
        const config = QuizConfig;
        const indexPath = config.rutaIndex;
        const baseQuizPath = config.rutaBaseCuestionarios;
        const carpetaActiva = config.carpetaActiva;
        
        const response = await fetch(indexPath);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: No se encontró ${indexPath}`);
        }
        
        const data = await response.json();
        availableQuizzes = data.cuestionarios || [];
        
        if (availableQuizzes.length === 0) {
            mostrarMensajeNoHayCuestionarios(container, carpetaActiva);
            return;
        }
        
        renderizarListaCuestionarios(container, carpetaActiva, baseQuizPath, availableQuizzes);
        
    } catch (error) {
        mostrarMensajeError(container, QuizConfig.carpetaActiva, error);
    }
}

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

function renderizarListaCuestionarios(container, carpeta, rutaBase, cuestionarios) {
    container.innerHTML = '';
    
    const header = document.createElement('div');
    header.style.cssText = 'text-align: center; margin-bottom: 25px; padding: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; color: white;';
    header.innerHTML = `
        <h3 style="margin: 0 0 5px 0; font-size: 20px;">📚 ${carpeta}</h3>
        <p style="margin: 0; font-size: 14px; opacity: 0.9;">${cuestionarios.length} cuestionarios disponibles</p>
    `;
    container.appendChild(header);
    
    cuestionarios.forEach(filename => {
        const quizCard = crearTarjetaCuestionario(filename, rutaBase);
        container.appendChild(quizCard);
    });
    
    const footer = document.createElement('p');
    footer.style.cssText = 'text-align: center; color: #999; margin-top: 20px; font-size: 13px; font-style: italic;';
    footer.textContent = `📂 Mostrando cuestionarios de: ${carpeta}`;
    container.appendChild(footer);
}

function crearTarjetaCuestionario(filename, rutaBase) {
    const quizCard = document.createElement('div');
    quizCard.className = 'quiz-card';
    
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

async function selectQuiz(filepath, filename) {
    selectedQuizFile = filepath;
    
    const container = document.getElementById('quizListContainer');
    
    container.innerHTML = `
        <div style="text-align: center; padding: 60px;">
            <div style="font-size: 48px; margin-bottom: 20px;">⏳</div>
            <p style="color: #666; font-size: 16px;">Cargando <strong>${filename}</strong>...</p>
        </div>
    `;
    
    try {
        const response = await fetch(filepath);
        
        if (!response.ok) {
            throw new Error(`No se pudo cargar: ${filename}`);
        }
        
        const data = await response.json();
        quizData = data;
        
        cambiarPantalla('quiz-selection-screen', 'setup-screen');
        
        const quizTitle = document.getElementById('selectedQuizTitle');
        if (quizTitle) {
            quizTitle.textContent = filename;
        }
        
    } catch (error) {
        alert(`❌ Error al cargar "${filename}"\n\n${error.message}\n\nVerifica que el archivo exista y tenga formato JSON válido.`);
        loadQuizList();
    }
}


// ╔═══════════════════════════════════════════════════════════════════════╗
// ║  🔀 FUNCIONES DE NAVEGACIÓN ENTRE PANTALLAS                           ║
// ╚═══════════════════════════════════════════════════════════════════════╝

function cambiarPantalla(pantallaOcultar, pantallaMostrar) {
    document.querySelector(`.${pantallaOcultar}`).classList.remove('active');
    document.querySelector(`.${pantallaMostrar}`).classList.add('active');
}

function backToQuizSelection() {
    cambiarPantalla('setup-screen', 'quiz-selection-screen');
    quizData = null;
    selectedQuizFile = null;
    loadQuizList();
}


// ╔═══════════════════════════════════════════════════════════════════════╗
// ║  🎮 FUNCIONES DE GESTIÓN DEL QUIZ                                     ║
// ╚═══════════════════════════════════════════════════════════════════════╝

function getAllQuestions() {
    if (!quizData || !quizData.cuestionario || !quizData.cuestionario.secciones) {
        return [];
    }
    
    let allQuestions = [];
    
    quizData.cuestionario.secciones.forEach((seccion) => {
        allQuestions = allQuestions.concat(seccion.preguntas || []);
    });
    
    return allQuestions;
}

function shuffleArray(array) {
    const newArray = [...array];
    
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    
    return newArray;
}

function startQuiz(numQuestions) {
    const allQuestions = getAllQuestions();
    
    if (allQuestions.length === 0) {
        alert('❌ No hay preguntas disponibles.\nIntenta con otro cuestionario.');
        return;
    }
    
    if (numQuestions > allQuestions.length) {
        alert(`ℹ️ Solo hay ${allQuestions.length} preguntas disponibles.\nSe usarán todas.`);
        numQuestions = allQuestions.length;
    }
    
    const shuffled = shuffleArray(allQuestions);
    currentQuiz = shuffled.slice(0, numQuestions);
    
    totalQuestions = numQuestions;
    currentQuestionIndex = 0;
    userAnswers = new Array(totalQuestions).fill(null);

    cambiarPantalla('setup-screen', 'quiz-screen');
    displayQuestion();
}


// ╔═══════════════════════════════════════════════════════════════════════╗
// ║  🖼️ RENDERIZADO DE PREGUNTAS                                          ║
// ╚═══════════════════════════════════════════════════════════════════════╝

/**
 * Muestra la pregunta actual en la interfaz
 * Detecta el tipo de pregunta y renderiza la interfaz apropiada
 */
function displayQuestion() {
    const question = currentQuiz[currentQuestionIndex];
    const tipoPregunta = question.tipo || 'multiple_choice';
    
    // Actualizar barra de progreso
    const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
    
    // Actualizar contador
    document.getElementById('questionNumber').textContent = 
        `Pregunta ${currentQuestionIndex + 1} de ${totalQuestions}`;
    
    // Mostrar pregunta
    document.getElementById('questionText').textContent = question.pregunta;

    // Renderizar según tipo de pregunta
    switch(tipoPregunta) {
        case 'multiple_choice':
            renderizarPreguntaOpcionMultiple(question);
            break;
            
        case 'single_word':
            renderizarPreguntaPalabraUnica(question);
            break;
            
        case 'true_false':
            renderizarPreguntaVerdaderoFalso(question);
            break;
            
        case 'fill_blank':
        case 'multiple_keywords':
        case 'open_ended':
            renderizarPreguntaPalabrasClave(question);
            break;
            
        default:
            renderizarPreguntaOpcionMultiple(question);
    }

    // Actualizar retroalimentación
    actualizarRetroalimentacion(question);

    // Actualizar botones de navegación
    actualizarBotonesNavegacion();
}

/**
 * Renderiza pregunta de opción múltiple
 */
function renderizarPreguntaOpcionMultiple(question) {
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';
    optionsContainer.className = 'options';

    Object.keys(question.opciones).forEach(key => {
        const option = crearElementoOpcion(key, question);
        optionsContainer.appendChild(option);
    });
}

/**
 * Renderiza pregunta de una sola palabra
 */
function renderizarPreguntaPalabraUnica(question) {
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';
    optionsContainer.className = 'open-answer-container';

    const yaRespondida = userAnswers[currentQuestionIndex] !== null;
    
    if (yaRespondida) {
        const userAnswer = userAnswers[currentQuestionIndex];
        const validationResult = userAnswer.validationResult;
        
        optionsContainer.innerHTML = `
            <div class="answer-submitted ${validationResult.esCorrecta ? 'correct' : 'incorrect'}">
                <div class="answer-label">Tu respuesta:</div>
                <div class="answer-text single-word">"${userAnswer.respuestaTexto}"</div>
                ${validationResult.esCorrecta 
                    ? '<div class="feedback-simple">✅ ¡Correcto!</div>' 
                    : `<div class="feedback-simple">❌ La respuesta correcta es: <strong>${validationResult.respuestaEsperada}</strong></div>`
                }
            </div>
        `;
    } else {
        optionsContainer.innerHTML = `
            <div class="open-answer-input-container single-word-input">
                <input 
                    type="text" 
                    id="singleWordInput" 
                    class="single-word-input" 
                    placeholder="Escribe una palabra..."
                    maxlength="50"
                />
                <div class="input-helper">
                    💡 Tip: Escribe solo una palabra como respuesta
                </div>
                <button 
                    class="btn btn-submit-answer" 
                    onclick="submitSingleWordAnswer()"
                >
                    ✓ Enviar Respuesta
                </button>
            </div>
        `;
        
        setTimeout(() => {
            const input = document.getElementById('singleWordInput');
            input?.focus();
            input?.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    submitSingleWordAnswer();
                }
            });
        }, 100);
    }
}

/**
 * Renderiza pregunta verdadero/falso
 */
function renderizarPreguntaVerdaderoFalso(question) {
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';
    optionsContainer.className = 'true-false-container';

    const yaRespondida = userAnswers[currentQuestionIndex] !== null;
    
    if (yaRespondida) {
        const userAnswer = userAnswers[currentQuestionIndex];
        const validationResult = userAnswer.validationResult;
        const respuestaUsuario = userAnswer.respuestaTexto;
        
        optionsContainer.innerHTML = `
            <div class="true-false-options answered">
                <button class="btn-true-false ${respuestaUsuario === 'verdadero' ? (validationResult.esCorrecta ? 'selected correct' : 'selected incorrect') : (validationResult.respuestaEsperada.toLowerCase() === 'verdadero' ? 'correct-answer' : '')}" disabled>
                    ✓ Verdadero
                </button>
                <button class="btn-true-false ${respuestaUsuario === 'falso' ? (validationResult.esCorrecta ? 'selected correct' : 'selected incorrect') : (validationResult.respuestaEsperada.toLowerCase() === 'falso' ? 'correct-answer' : '')}" disabled>
                    ✗ Falso
                </button>
            </div>
        `;
    } else {
        optionsContainer.innerHTML = `
            <div class="true-false-options">
                <button class="btn-true-false" onclick="submitTrueFalseAnswer('verdadero')">
                    ✓ Verdadero
                </button>
                <button class="btn-true-false" onclick="submitTrueFalseAnswer('falso')">
                    ✗ Falso
                </button>
            </div>
            <div class="input-helper">
                💡 Tip: Selecciona Verdadero o Falso
            </div>
        `;
    }
}

/**
 * Renderiza pregunta con palabras clave (abierta, completar, múltiples palabras)
 */
function renderizarPreguntaPalabrasClave(question) {
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';
    optionsContainer.className = 'open-answer-container';

    const yaRespondida = userAnswers[currentQuestionIndex] !== null;
    
    if (yaRespondida) {
        const userAnswer = userAnswers[currentQuestionIndex];
        const validationResult = userAnswer.validationResult;
        
        optionsContainer.innerHTML = `
            <div class="answer-submitted ${validationResult.esCorrecta ? 'correct' : 'incorrect'}">
                <div class="answer-label">Tu respuesta:</div>
                <div class="answer-text">"${userAnswer.respuestaTexto}"</div>
                ${crearFeedbackPalabras(validationResult)}
            </div>
        `;
    } else {
        const placeholder = obtenerPlaceholderPorTipo(question.tipo);
        
        optionsContainer.innerHTML = `
            <div class="open-answer-input-container">
                <textarea 
                    id="openAnswerInput" 
                    class="open-answer-input" 
                    placeholder="${placeholder}"
                    rows="4"
                ></textarea>
                <div class="input-helper">
                    💡 Tip: Incluye las palabras clave importantes en tu respuesta
                </div>
                <button 
                    class="btn btn-submit-answer" 
                    onclick="submitKeywordsAnswer()"
                >
                    ✓ Enviar Respuesta
                </button>
            </div>
        `;
        
        setTimeout(() => {
            document.getElementById('openAnswerInput')?.focus();
        }, 100);
    }
}

/**
 * Obtiene el placeholder apropiado según el tipo de pregunta
 */
function obtenerPlaceholderPorTipo(tipo) {
    const placeholders = {
        'fill_blank': 'Completa la oración...',
        'multiple_keywords': 'Escribe tu respuesta aquí...',
        'open_ended': 'Escribe tu respuesta aquí...'
    };
    
    return placeholders[tipo] || 'Escribe tu respuesta aquí...';
}

/**
 * Crea el feedback visual de palabras clave
 */
function crearFeedbackPalabras(validationResult) {
    const { palabrasEncontradas, palabrasFaltantes, porcentaje, puntajeObtenido, puntajeTotal } = validationResult;
    
    let html = '<div class="keywords-feedback">';
    
    // Palabras encontradas
    if (palabrasEncontradas.length > 0) {
        html += '<div class="keywords-found">';
        html += '<strong>✓ Palabras correctas:</strong> ';
        html += palabrasEncontradas.map(item => {
            const pesoIndicator = item.peso > 1 ? ` <span class="peso-badge">${item.peso}pts</span>` : '';
            return `<span class="keyword-tag found">${item.palabra}${pesoIndicator}</span>`;
        }).join(' ');
        html += '</div>';
    }
    
    // Palabras faltantes
    if (palabrasFaltantes.length > 0) {
        html += '<div class="keywords-missing">';
        html += '<strong>✗ Palabras faltantes:</strong> ';
        html += palabrasFaltantes.map(item => {
            const pesoIndicator = item.peso > 1 ? ` <span class="peso-badge">${item.peso}pts</span>` : '';
            return `<span class="keyword-tag missing">${item.palabra}${pesoIndicator}</span>`;
        }).join(' ');
        html += '</div>';
    }
    
    // Puntuación
    html += `<div class="accuracy-score">Puntuación: ${puntajeObtenido}/${puntajeTotal} pts (${Math.round(porcentaje * 100)}%)</div>`;
    
    html += '</div>';
    return html;
}

/**
 * Crea elemento de opción para preguntas de opción múltiple
 */
function crearElementoOpcion(key, question) {
    const option = document.createElement('div');
    option.className = 'option';
    option.textContent = `${key}) ${question.opciones[key]}`;
    option.setAttribute('data-option', key);

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
        option.addEventListener('click', () => selectOption(key));
    }

    return option;
}


// ╔═══════════════════════════════════════════════════════════════════════╗
// ║  ✏️ MANEJO DE RESPUESTAS                                              ║
// ╚═══════════════════════════════════════════════════════════════════════╝

/**
 * Procesa respuesta de palabra única
 */
function submitSingleWordAnswer() {
    const input = document.getElementById('singleWordInput');
    const respuestaTexto = input?.value?.trim() || '';
    
    if (respuestaTexto === '') {
        alert('⚠️ Por favor escribe una respuesta.');
        return;
    }
    
    const question = currentQuiz[currentQuestionIndex];
    const validationResult = validarRespuesta(respuestaTexto, question);
    
    userAnswers[currentQuestionIndex] = {
        respuestaTexto: respuestaTexto,
        validationResult: validationResult
    };
    
    displayQuestion();
}

/**
 * Procesa respuesta verdadero/falso
 */
function submitTrueFalseAnswer(respuesta) {
    const question = currentQuiz[currentQuestionIndex];
    const validationResult = validarRespuesta(respuesta, question);
    
    userAnswers[currentQuestionIndex] = {
        respuestaTexto: respuesta,
        validationResult: validationResult
    };
    
    displayQuestion();
}

/**
 * Procesa respuesta con palabras clave
 */
function submitKeywordsAnswer() {
    const input = document.getElementById('openAnswerInput');
    const respuestaTexto = input?.value?.trim() || '';
    
    if (respuestaTexto === '') {
        alert('⚠️ Por favor escribe una respuesta.');
        return;
    }
    
    const question = currentQuiz[currentQuestionIndex];
    const validationResult = validarRespuesta(respuestaTexto, question);
    
    userAnswers[currentQuestionIndex] = {
        respuestaTexto: respuestaTexto,
        validationResult: validationResult
    };
    
    displayQuestion();
}

/**
 * Procesa selección de opción múltiple
 */
function selectOption(selectedKey) {
    if (userAnswers[currentQuestionIndex]) {
        return;
    }

    userAnswers[currentQuestionIndex] = selectedKey;
    
    const question = currentQuiz[currentQuestionIndex];
    const isCorrect = selectedKey === question.respuesta_correcta;

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

    const feedback = document.getElementById('feedback');
    const reference = document.getElementById('reference');
    
    feedback.className = 'feedback show ' + (isCorrect ? 'correct' : 'incorrect');
    feedback.textContent = isCorrect 
        ? '✓ ¡Correcto! Excelente.' 
        : '✗ Incorrecto. La respuesta correcta es: ' + question.respuesta_correcta;
    
    reference.textContent = '📖 ' + question.referencia;
    document.getElementById('nextBtn').disabled = false;
}

/**
 * Actualiza el área de retroalimentación según el tipo de pregunta
 */
function actualizarRetroalimentacion(question) {
    const feedback = document.getElementById('feedback');
    const reference = document.getElementById('reference');
    const tipoPregunta = question.tipo || 'multiple_choice';
    
    if (userAnswers[currentQuestionIndex]) {
        if (tipoPregunta === 'multiple_choice') {
            const isCorrect = userAnswers[currentQuestionIndex] === question.respuesta_correcta;
            
            feedback.className = 'feedback show ' + (isCorrect ? 'correct' : 'incorrect');
            feedback.textContent = isCorrect 
                ? '✓ ¡Correcto! Excelente.' 
                : '✗ Incorrecto. La respuesta correcta es: ' + question.respuesta_correcta;
        } else {
            const userAnswer = userAnswers[currentQuestionIndex];
            const validationResult = userAnswer.validationResult;
            const isCorrect = validationResult.esCorrecta;
            
            feedback.className = 'feedback show ' + (isCorrect ? 'correct' : 'incorrect');
            
            if (isCorrect) {
                feedback.textContent = '✓ ¡Correcto!';
            } else {
                if (tipoPregunta === 'single_word' || tipoPregunta === 'true_false') {
                    feedback.textContent = `✗ Incorrecto. La respuesta correcta es: ${validationResult.respuestaEsperada}`;
                } else {
                    const porcentaje = Math.round(validationResult.porcentaje * 100);
                    feedback.textContent = `✗ Respuesta incompleta (${porcentaje}% de precisión).`;
                }
            }
        }
        
        reference.textContent = '📖 ' + question.referencia;
        document.getElementById('nextBtn').disabled = false;
    } else {
        feedback.className = 'feedback';
        reference.textContent = '';
        document.getElementById('nextBtn').disabled = true;
    }
}

function actualizarBotonesNavegacion() {
    document.getElementById('prevBtn').disabled = currentQuestionIndex === 0;
}

function nextQuestion() {
    if (currentQuestionIndex < totalQuestions - 1) {
        currentQuestionIndex++;
        displayQuestion();
    } else {
        showResults();
    }
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    }
}


// ╔═══════════════════════════════════════════════════════════════════════╗
// ║  📊 FUNCIONES DE RESULTADOS Y FINALIZACIÓN                            ║
// ╚═══════════════════════════════════════════════════════════════════════╝

function showResults() {
    let correctAnswers = 0;
    currentQuiz.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        const tipoPregunta = question.tipo || 'multiple_choice';
        
        if (tipoPregunta === 'multiple_choice') {
            if (userAnswer === question.respuesta_correcta) {
                correctAnswers++;
            }
        } else {
            if (userAnswer && userAnswer.validationResult && userAnswer.validationResult.esCorrecta) {
                correctAnswers++;
            }
        }
    });

    const percentage = Math.round((correctAnswers / totalQuestions) * 100);

    cambiarPantalla('quiz-screen', 'results-screen');
    renderizarEstadisticas(correctAnswers, totalQuestions, percentage);
    mostrarMensajeMotivacional(percentage);
}

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

function mostrarMensajeMotivacional(porcentaje) {
    const scoreMessage = document.getElementById('scoreMessage');
    let mensaje = '';
    let emoji = '';
    
    if (porcentaje >= 90) {
        emoji = '🏆';
        mensaje = '¡Excelente trabajo! Dominas el tema perfectamente.';
    } else if (porcentaje >= 70) {
        emoji = '🎯';
        mensaje = '¡Muy bien! Tienes un buen conocimiento del tema.';
    } else if (porcentaje >= 50) {
        emoji = '💪';
        mensaje = 'Buen intento. Con un poco más de estudio mejorarás.';
    } else {
        emoji = '📚';
        mensaje = 'Sigue practicando. La práctica hace al maestro.';
    }
    
    scoreMessage.innerHTML = `${emoji} ${mensaje}`;
}


// ╔═══════════════════════════════════════════════════════════════════════╗
// ║  🔍 FUNCIONES DE REVISIÓN DE RESPUESTAS                               ║
// ╚═══════════════════════════════════════════════════════════════════════╝

function showReview() {
    cambiarPantalla('results-screen', 'review-screen');
    renderizarResumenRevision();
    renderizarPreguntasRevision();
}

function renderizarResumenRevision() {
    const summaryContainer = document.getElementById('reviewSummary');
    
    let correctas = 0;
    currentQuiz.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        const tipoPregunta = question.tipo || 'multiple_choice';
        
        if (tipoPregunta === 'multiple_choice') {
            if (userAnswer === question.respuesta_correcta) {
                correctas++;
            }
        } else {
            if (userAnswer && userAnswer.validationResult && userAnswer.validationResult.esCorrecta) {
                correctas++;
            }
        }
    });
    
    const porcentaje = Math.round((correctas / totalQuestions) * 100);
    
    summaryContainer.innerHTML = `
        ✅ Respuestas correctas: <strong>${correctas}</strong> de <strong>${totalQuestions}</strong> (${porcentaje}%)
    `;
}

function renderizarPreguntasRevision() {
    const container = document.getElementById('reviewQuestionsContainer');
    container.innerHTML = '';
    
    currentQuiz.forEach((question, index) => {
        const tipoPregunta = question.tipo || 'multiple_choice';
        let card;
        
        if (tipoPregunta === 'multiple_choice') {
            card = crearTarjetaRevisionMultiple(question, index);
        } else {
            card = crearTarjetaRevisionOtrosTipos(question, index);
        }
        
        container.appendChild(card);
    });
}

function crearTarjetaRevisionOtrosTipos(question, index) {
    const userAnswer = userAnswers[index];
    const validationResult = userAnswer?.validationResult;
    const isCorrect = validationResult?.esCorrecta || false;
    
    const card = document.createElement('div');
    card.className = `review-question-card ${isCorrect ? 'correct' : 'incorrect'}`;
    
    const statusIcon = isCorrect ? '✓' : '✗';
    const statusColor = isCorrect ? '#28a745' : '#dc3545';
    
    const respuestaTexto = userAnswer?.respuestaTexto || '(Sin respuesta)';
    const tipoBadge = obtenerBadgeTipo(question.tipo);
    
    let feedbackContent = '';
    if (question.tipo === 'single_word' || question.tipo === 'true_false') {
        feedbackContent = validationResult?.esCorrecta 
            ? '<div class="feedback-simple">✅ ¡Correcto!</div>' 
            : `<div class="feedback-simple">❌ La respuesta correcta es: <strong>${validationResult?.respuestaEsperada}</strong></div>`;
    } else {
        feedbackContent = validationResult ? crearFeedbackPalabras(validationResult) : '';
    }
    
    card.innerHTML = `
        <div class="review-question-header">
            <div class="review-question-number">Pregunta ${index + 1} de ${totalQuestions}</div>
            <div class="review-question-status" style="color: ${statusColor};">${statusIcon}</div>
        </div>
        
        <div class="review-question-type">
            ${tipoBadge}
        </div>
        
        <div class="review-question-text">${question.pregunta}</div>
        
        <div class="review-answers">
            <div class="review-answer-row ${isCorrect ? 'user-correct' : 'user-incorrect'}">
                <span class="review-answer-label">${isCorrect ? '✓' : '✗'} Tu respuesta:</span>
                <span class="review-answer-value">"${respuestaTexto}"</span>
            </div>
            ${feedbackContent}
        </div>
        
        <div class="review-feedback">
            📖 ${question.referencia}
        </div>
    `;
    
    return card;
}

function crearTarjetaRevisionMultiple(question, index) {
    const userAnswer = userAnswers[index];
    const correctAnswer = question.respuesta_correcta;
    const isCorrect = userAnswer === correctAnswer;
    
    const card = document.createElement('div');
    card.className = `review-question-card ${isCorrect ? 'correct' : 'incorrect'}`;
    
    const statusIcon = isCorrect ? '✓' : '✗';
    const statusColor = isCorrect ? '#28a745' : '#dc3545';
    
    card.innerHTML = `
        <div class="review-question-header">
            <div class="review-question-number">Pregunta ${index + 1} de ${totalQuestions}</div>
            <div class="review-question-status" style="color: ${statusColor};">${statusIcon}</div>
        </div>
        
        <div class="review-question-type">
            <span class="type-badge multiple">☑️ Opción Múltiple</span>
        </div>
        
        <div class="review-question-text">${question.pregunta}</div>
        
        <div class="review-answers">
            ${renderizarRespuestasUsuario(userAnswer, correctAnswer, question.opciones, isCorrect)}
        </div>
        
        <div class="review-feedback">
            📖 ${question.referencia}
        </div>
    `;
    
    return card;
}

function obtenerBadgeTipo(tipo) {
    const badges = {
        'single_word': '<span class="type-badge single-word">📝 Palabra Única</span>',
        'true_false': '<span class="type-badge true-false">✓✗ Verdadero/Falso</span>',
        'fill_blank': '<span class="type-badge fill-blank">📝 Completar</span>',
        'multiple_keywords': '<span class="type-badge keywords">🔑 Palabras Clave</span>',
        'open_ended': '<span class="type-badge open">📖 Pregunta Abierta</span>'
    };
    
    return badges[tipo] || '<span class="type-badge">❓ Pregunta</span>';
}

function renderizarRespuestasUsuario(userAnswer, correctAnswer, opciones, isCorrect) {
    let html = '';
    
    if (isCorrect) {
        html = `
            <div class="review-answer-row user-correct">
                <span class="review-answer-label">✓ Tu respuesta:</span>
                <span class="review-answer-value">${userAnswer}) ${opciones[userAnswer]}</span>
            </div>
        `;
    } else {
        html = `
            <div class="review-answer-row user-incorrect">
                <span class="review-answer-label">✗ Tu respuesta:</span>
                <span class="review-answer-value">${userAnswer}) ${opciones[userAnswer]}</span>
            </div>
            <div class="review-answer-row correct-answer">
                <span class="review-answer-label">✓ Correcta:</span>
                <span class="review-answer-value">${correctAnswer}) ${opciones[correctAnswer]}</span>
            </div>
        `;
    }
    
    return html;
}

function backToResults() {
    cambiarPantalla('review-screen', 'results-screen');
}

function restartQuiz() {
    cambiarPantalla('results-screen', 'quiz-selection-screen');
    resetearEstadoJuego();
    loadQuizList();
}

function exitQuiz() {
    const confirmar = confirm(
        '¿Estás seguro de que deseas salir?\n\n' +
        'Se perderá tu progreso actual.'
    );
    
    if (confirmar) {
        cambiarPantalla('quiz-screen', 'quiz-selection-screen');
        resetearEstadoJuego();
        loadQuizList();
    }
}

function resetearEstadoJuego() {
    currentQuiz = [];
    currentQuestionIndex = 0;
    userAnswers = [];
    totalQuestions = 0;
    quizData = null;
    selectedQuizFile = null;
}


// ╔═══════════════════════════════════════════════════════════════════════╗
// ║  🚀 INICIALIZACIÓN DE LA APLICACIÓN                                   ║
// ╚═══════════════════════════════════════════════════════════════════════╝

window.addEventListener('DOMContentLoaded', () => {
    loadQuizList();
});