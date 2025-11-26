/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GAONA VIEWER - Sistema de Visualización de Preguntas y Respuestas
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 🎯 PROPÓSITO:
 * Permite visualizar todas las preguntas y respuestas de cualquier cuestionario
 * disponible en el sistema. Funcionalidad especial para revisión de contenido.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║  🔐 ACTIVACIÓN DEL MODO VISOR                                             ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

let modoVisorActivo = false;

/**
 * Activa el modo visor de preguntas y respuestas
 */
function activarModoVisor() {
    modoVisorActivo = true;
    
    // Ocultar pantalla actual
    const pantallaActual = document.querySelector('.quiz-selection-screen');
    pantallaActual.classList.remove('active');
    
    // Mostrar pantalla de visor
    mostrarPantallaVisor();
}


// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║  🖼️ RENDERIZADO DE INTERFAZ DEL VISOR                                     ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * Crea y muestra la pantalla del visor
 */
function mostrarPantallaVisor() {
    // Verificar si ya existe la pantalla
    let pantallaVisor = document.querySelector('.viewer-screen');
    
    if (!pantallaVisor) {
        pantallaVisor = crearPantallaVisor();
        document.querySelector('.container').appendChild(pantallaVisor);
    }
    
    pantallaVisor.classList.add('active');
    cargarListaCuestionariosVisor();
}

/**
 * Crea el elemento HTML de la pantalla del visor
 */
function crearPantallaVisor() {
    const pantalla = document.createElement('div');
    pantalla.className = 'viewer-screen';
    
    pantalla.innerHTML = `
        <div class="viewer-header">
            <h2>🔍 Visor de Preguntas y Respuestas</h2>
            <p style="color: #666; margin-top: 10px;">
                Selecciona un cuestionario para visualizar todas sus preguntas y respuestas
            </p>
        </div>
        
        <div id="viewerQuizList" class="viewer-quiz-list"></div>
        
        <div id="viewerContent" class="viewer-content"></div>
        
        <div style="text-align: center; margin-top: 30px;">
            <button class="btn btn-back" onclick="cerrarModoVisor()">← Volver al Menú Principal</button>
        </div>
    `;
    
    return pantalla;
}


// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║  📋 CARGA Y LISTADO DE CUESTIONARIOS                                      ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * Carga la lista de cuestionarios disponibles para el visor
 */
async function cargarListaCuestionariosVisor() {
    const container = document.getElementById('viewerQuizList');
    container.innerHTML = '<p style="text-align: center; color: #666;">Cargando cuestionarios...</p>';
    
    try {
        const config = QuizConfig;
        const indexPath = config.rutaIndex;
        const baseQuizPath = config.rutaBaseCuestionarios;
        
        const response = await fetch(indexPath);
        
        if (!response.ok) {
            throw new Error(`No se encontró ${indexPath}`);
        }
        
        const data = await response.json();
        const cuestionarios = data.cuestionarios || [];
        
        if (cuestionarios.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999;">No hay cuestionarios disponibles</p>';
            return;
        }
        
        renderizarListaVisor(container, cuestionarios, baseQuizPath);
        
    } catch (error) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <p style="color: #dc3545;">❌ Error al cargar cuestionarios</p>
                <p style="color: #666; font-size: 13px; margin-top: 10px;">${error.message}</p>
            </div>
        `;
    }
}

/**
 * Renderiza la lista de cuestionarios en el visor
 */
function renderizarListaVisor(container, cuestionarios, rutaBase) {
    container.innerHTML = '';
    
    const lista = document.createElement('div');
    lista.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; margin-bottom: 30px;';
    
    cuestionarios.forEach(filename => {
        const card = crearTarjetaVisor(filename, rutaBase);
        lista.appendChild(card);
    });
    
    container.appendChild(lista);
}

/**
 * Crea una tarjeta de cuestionario para el visor
 */
function crearTarjetaVisor(filename, rutaBase) {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.style.cssText = 'cursor: pointer; transition: transform 0.2s;';
    
    const displayName = filename
        .replace('.json', '')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, letra => letra.toUpperCase());
    
    const rutaCompleta = rutaBase + filename;
    
    card.innerHTML = `
        <h3>📋 ${displayName}</h3>
        <p style="color: #888; font-size: 12px; margin-top: 5px;">${filename}</p>
        <button class="btn" style="margin-top: 10px;">👁️ Ver Todo</button>
    `;
    
    card.onclick = () => cargarYMostrarCuestionario(rutaCompleta, displayName);
    
    // Efecto hover
    card.onmouseenter = () => card.style.transform = 'translateY(-5px)';
    card.onmouseleave = () => card.style.transform = 'translateY(0)';
    
    return card;
}


// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║  📖 CARGA Y VISUALIZACIÓN DE PREGUNTAS                                    ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * Carga un cuestionario y muestra todas sus preguntas
 */
async function cargarYMostrarCuestionario(filepath, displayName) {
    const container = document.getElementById('viewerContent');
    
    container.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <div style="font-size: 48px; margin-bottom: 20px;">⏳</div>
            <p style="color: #666;">Cargando <strong>${displayName}</strong>...</p>
        </div>
    `;
    
    try {
        const response = await fetch(filepath);
        
        if (!response.ok) {
            throw new Error(`No se pudo cargar: ${displayName}`);
        }
        
        const data = await response.json();
        mostrarTodasLasPreguntas(data, displayName);
        
        // Scroll suave hacia el contenido
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
    } catch (error) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <p style="color: #dc3545; font-size: 18px;">❌ Error al cargar</p>
                <p style="color: #666; margin-top: 10px;">${error.message}</p>
            </div>
        `;
    }
}

/**
 * Muestra todas las preguntas y respuestas de un cuestionario
 */
function mostrarTodasLasPreguntas(data, displayName) {
    const container = document.getElementById('viewerContent');
    container.innerHTML = '';
    
    // Header del cuestionario
    const header = crearHeaderCuestionario(data, displayName);
    container.appendChild(header);
    
    // Extraer todas las preguntas
    const todasLasPreguntas = extraerTodasLasPreguntas(data);
    
    if (todasLasPreguntas.length === 0) {
        container.innerHTML += '<p style="text-align: center; color: #999; margin-top: 30px;">No hay preguntas en este cuestionario</p>';
        return;
    }
    
    // Renderizar cada pregunta
    todasLasPreguntas.forEach((pregunta, index) => {
        const card = crearTarjetaPreguntaVisor(pregunta, index + 1);
        container.appendChild(card);
    });
    
    // Footer con estadísticas
    const footer = crearFooterEstadisticas(todasLasPreguntas);
    container.appendChild(footer);
}

/**
 * Crea el header del cuestionario
 */
function crearHeaderCuestionario(data, displayName) {
    const header = document.createElement('div');
    header.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 25px;
        border-radius: 12px;
        margin-bottom: 30px;
        text-align: center;
    `;
    
    const titulo = data.cuestionario?.titulo || displayName;
    const descripcion = data.cuestionario?.descripcion || 'Cuestionario de estudio';
    
    header.innerHTML = `
        <h2 style="margin: 0 0 10px 0; font-size: 26px;">📚 ${titulo}</h2>
        <p style="margin: 0; opacity: 0.95; font-size: 15px;">${descripcion}</p>
    `;
    
    return header;
}

/**
 * Extrae todas las preguntas de todas las secciones
 */
function extraerTodasLasPreguntas(data) {
    let todasLasPreguntas = [];
    
    if (!data.cuestionario || !data.cuestionario.secciones) {
        return todasLasPreguntas;
    }
    
    data.cuestionario.secciones.forEach((seccion) => {
        if (seccion.preguntas && Array.isArray(seccion.preguntas)) {
            todasLasPreguntas = todasLasPreguntas.concat(seccion.preguntas);
        }
    });
    
    return todasLasPreguntas;
}

/**
 * Crea una tarjeta de pregunta para el visor
 */
function crearTarjetaPreguntaVisor(pregunta, numero) {
    const card = document.createElement('div');
    card.className = 'viewer-question-card';
    
    const tipoPregunta = pregunta.tipo || 'multiple_choice';
    const badgeTipo = obtenerBadgeTipoVisor(tipoPregunta);
    
    card.innerHTML = `
        <div class="viewer-question-header">
            <div class="viewer-question-number">Pregunta ${numero}</div>
            ${badgeTipo}
        </div>
        
        <div class="viewer-question-text">
            ${pregunta.pregunta}
        </div>
        
        ${renderizarRespuestaSegunTipo(pregunta, tipoPregunta)}
        
        <div class="viewer-reference">
            📖 Referencia: ${pregunta.referencia || 'No especificada'}
        </div>
    `;
    
    return card;
}

/**
 * Obtiene el badge de tipo de pregunta
 */
function obtenerBadgeTipoVisor(tipo) {
    const badges = {
        'multiple_choice': '<span class="type-badge multiple">☑️ Opción Múltiple</span>',
        'single_word': '<span class="type-badge single-word">🔤 Palabra Única</span>',
        'true_false': '<span class="type-badge true-false">✓✗ Verdadero/Falso</span>',
        'fill_blank': '<span class="type-badge fill-blank">📝 Completar</span>',
        'multiple_keywords': '<span class="type-badge keywords">🔑 Palabras Clave</span>',
        'open_ended': '<span class="type-badge open">📖 Pregunta Abierta</span>'
    };
    
    return badges[tipo] || '<span class="type-badge">❓ Pregunta</span>';
}

/**
 * Renderiza la respuesta según el tipo de pregunta
 */
function renderizarRespuestaSegunTipo(pregunta, tipo) {
    switch(tipo) {
        case 'multiple_choice':
            return renderizarRespuestaMultiple(pregunta);
            
        case 'single_word':
            return renderizarRespuestaPalabraUnica(pregunta);
            
        case 'true_false':
            return renderizarRespuestaVerdaderoFalso(pregunta);
            
        case 'fill_blank':
        case 'multiple_keywords':
        case 'open_ended':
            return renderizarRespuestaPalabrasClave(pregunta);
            
        default:
            return '<div class="viewer-answer">Tipo de pregunta no reconocido</div>';
    }
}

/**
 * Renderiza respuesta de opción múltiple
 */
function renderizarRespuestaMultiple(pregunta) {
    const opciones = pregunta.opciones || {};
    const respuestaCorrecta = pregunta.respuesta_correcta;
    
    let html = '<div class="viewer-options">';
    
    Object.keys(opciones).forEach(key => {
        const esCorrecta = key === respuestaCorrecta;
        const clase = esCorrecta ? 'viewer-option correct' : 'viewer-option';
        const icono = esCorrecta ? '✅' : '⚪';
        
        html += `
            <div class="${clase}">
                ${icono} <strong>${key})</strong> ${opciones[key]}
            </div>
        `;
    });
    
    html += '</div>';
    
    html += `
        <div class="viewer-answer">
            <strong>✓ Respuesta Correcta:</strong> ${respuestaCorrecta}
        </div>
    `;
    
    return html;
}

/**
 * Renderiza respuesta de palabra única
 */
function renderizarRespuestaPalabraUnica(pregunta) {
    const respuesta = pregunta.respuesta_correcta;
    const sinonimos = pregunta.sinonimos || [];
    
    let html = `
        <div class="viewer-answer">
            <strong>✓ Respuesta Correcta:</strong> <span class="highlight-answer">${respuesta}</span>
        </div>
    `;
    
    if (sinonimos.length > 0) {
        html += `
            <div class="viewer-synonyms">
                <strong>Sinónimos aceptados:</strong> ${sinonimos.join(', ')}
            </div>
        `;
    }
    
    return html;
}

/**
 * Renderiza respuesta verdadero/falso
 */
function renderizarRespuestaVerdaderoFalso(pregunta) {
    const respuesta = pregunta.respuesta_correcta;
    
    return `
        <div class="viewer-answer">
            <strong>✓ Respuesta Correcta:</strong> 
            <span class="highlight-answer">${respuesta}</span>
        </div>
    `;
}

/**
 * Renderiza respuesta con palabras clave
 */
function renderizarRespuestaPalabrasClave(pregunta) {
    const palabrasClave = pregunta.palabras_clave || {};
    const palabras = palabrasClave.palabras || [];
    const pesos = palabrasClave.pesos || [];
    const sinonimos = palabrasClave.sinonimos || {};
    const umbral = palabrasClave.umbral_minimo || 0.6;
    
    let html = '<div class="viewer-keywords">';
    html += '<strong>🔑 Palabras Clave Requeridas:</strong>';
    html += '<div class="keywords-list">';
    
    palabras.forEach((palabra, index) => {
        const peso = pesos[index] || 1;
        const pesoText = peso > 1 ? ` <span class="peso-badge">${peso}pts</span>` : '';
        const sinonimosPalabra = sinonimos[palabra] || [];
        
        html += `
            <div class="keyword-item">
                <span class="keyword-tag">${palabra}${pesoText}</span>
                ${sinonimosPalabra.length > 0 ? `<span class="keyword-synonyms">o: ${sinonimosPalabra.join(', ')}</span>` : ''}
            </div>
        `;
    });
    
    html += '</div>';
    html += `<div class="viewer-threshold">📊 Umbral mínimo de aprobación: ${Math.round(umbral * 100)}%</div>`;
    html += '</div>';
    
    return html;
}

/**
 * Crea el footer con estadísticas
 */
function crearFooterEstadisticas(preguntas) {
    const footer = document.createElement('div');
    footer.style.cssText = `
        background: #f8f9fa;
        padding: 20px;
        border-radius: 10px;
        margin-top: 30px;
        text-align: center;
    `;
    
    // Contar tipos de preguntas
    const tiposCuenta = contarTiposPreguntas(preguntas);
    
    footer.innerHTML = `
        <h3 style="color: #667eea; margin-bottom: 15px;">📊 Estadísticas del Cuestionario</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <div style="background: white; padding: 15px; border-radius: 8px;">
                <div style="font-size: 28px; color: #667eea; font-weight: bold;">${preguntas.length}</div>
                <div style="color: #666; font-size: 14px;">Total de Preguntas</div>
            </div>
            ${renderizarEstadisticasTipos(tiposCuenta)}
        </div>
    `;
    
    return footer;
}

/**
 * Cuenta los tipos de preguntas
 */
function contarTiposPreguntas(preguntas) {
    const cuenta = {};
    
    preguntas.forEach(pregunta => {
        const tipo = pregunta.tipo || 'multiple_choice';
        cuenta[tipo] = (cuenta[tipo] || 0) + 1;
    });
    
    return cuenta;
}

/**
 * Renderiza estadísticas de tipos
 */
function renderizarEstadisticasTipos(tiposCuenta) {
    const nombres = {
        'multiple_choice': 'Opción Múltiple',
        'single_word': 'Palabra Única',
        'true_false': 'Verdadero/Falso',
        'fill_blank': 'Completar',
        'multiple_keywords': 'Palabras Clave',
        'open_ended': 'Abiertas'
    };
    
    let html = '';
    
    Object.keys(tiposCuenta).forEach(tipo => {
        const nombre = nombres[tipo] || tipo;
        const cantidad = tiposCuenta[tipo];
        
        html += `
            <div style="background: white; padding: 15px; border-radius: 8px;">
                <div style="font-size: 24px; color: #764ba2; font-weight: bold;">${cantidad}</div>
                <div style="color: #666; font-size: 13px;">${nombre}</div>
            </div>
        `;
    });
    
    return html;
}


// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║  🚪 CERRAR MODO VISOR                                                     ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * Cierra el modo visor y regresa al menú principal
 */
function cerrarModoVisor() {
    modoVisorActivo = false;
    
    const pantallaVisor = document.querySelector('.viewer-screen');
    if (pantallaVisor) {
        pantallaVisor.classList.remove('active');
    }
    
    const pantallaSeleccion = document.querySelector('.quiz-selection-screen');
    pantallaSeleccion.classList.add('active');
    
    // Limpiar contenido del visor
    const viewerContent = document.getElementById('viewerContent');
    if (viewerContent) {
        viewerContent.innerHTML = '';
    }
}