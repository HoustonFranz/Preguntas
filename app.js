// Variables globales
let quizData = null;
let currentQuiz = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let totalQuestions = 0;
let selectedQuizFile = null;
let availableQuizzes = [];

// Función para cargar la lista de cuestionarios disponibles desde el índice
async function loadQuizList() {
    const container = document.getElementById('quizListContainer');
    container.innerHTML = '<p style="text-align: center; color: #666;">Cargando cuestionarios disponibles...</p>';
    
    try {
        // Intentar cargar el archivo index.json
        const response = await fetch('bd-preguntas/index.json');
        
        if (!response.ok) {
            throw new Error('No se encontró el archivo index.json');
        }
        
        const data = await response.json();
        availableQuizzes = data.cuestionarios || [];
        
        if (availableQuizzes.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999; font-size: 18px; padding: 40px;">📭 No hay cuestionarios disponibles</p>';
            return;
        }
        
        // Mostrar los cuestionarios
        container.innerHTML = '';
        
        for (const filename of availableQuizzes) {
            const quizCard = document.createElement('div');
            quizCard.className = 'quiz-card';
            
            // Extraer nombre sin extensión y convertir guiones en espacios
            const displayName = filename
                .replace('.json', '')
                .replace(/-/g, ' ')
                .replace(/\b\w/g, l => l.toUpperCase());
            
            quizCard.innerHTML = `
                <h3>📋 ${filename}</h3>
                <p style="color: #888; font-size: 13px; margin-top: 5px;">${displayName}</p>
                <button class="btn" onclick="selectQuiz('bd-preguntas/${filename}', '${filename}')">Seleccionar</button>
            `;
            container.appendChild(quizCard);
        }
        
    } catch (error) {
        console.error('Error cargando índice de cuestionarios:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <p style="color: #dc3545; font-size: 18px; margin-bottom: 15px;">❌ Error al cargar cuestionarios</p>
                <button class="btn" onclick="loadQuizList()" style="margin-top: 20px;">🔄 Reintentar</button>
            </div>
        `;
    }
}

// Función para seleccionar un cuestionario
async function selectQuiz(filepath, filename) {
    selectedQuizFile = filepath;
    
    // Mostrar indicador de carga
    const container = document.getElementById('quizListContainer');
    container.innerHTML = `<p style="text-align: center; color: #666;">Cargando <strong>${filename}</strong>...</p>`;
    
    try {
        const response = await fetch(filepath);
        
        if (!response.ok) {
            throw new Error(`No se pudo cargar el archivo: ${filename}`);
        }
        
        const data = await response.json();
        quizData = data;
        
        // Mostrar pantalla de configuración de cantidad de preguntas
        document.querySelector('.quiz-selection-screen').classList.remove('active');
        document.querySelector('.setup-screen').classList.add('active');
        
        // Actualizar título con el nombre del cuestionario
        const quizTitle = document.getElementById('selectedQuizTitle');
        if (quizTitle) {
            quizTitle.textContent = filename;
        }
        
    } catch (error) {
        console.error('Error cargando cuestionario:', error);
        alert(`❌ Error al cargar el cuestionario "${filename}"`);
        loadQuizList(); // Recargar la lista
    }
}

// Función para volver a la selección de cuestionarios
function backToQuizSelection() {
    document.querySelector('.setup-screen').classList.remove('active');
    document.querySelector('.quiz-selection-screen').classList.add('active');
    quizData = null;
    selectedQuizFile = null;
    loadQuizList();
}

function getAllQuestions() {
    if (!quizData || !quizData.cuestionario || !quizData.cuestionario.secciones) {
        return [];
    }
    let allQuestions = [];
    quizData.cuestionario.secciones.forEach(seccion => {
        allQuestions = allQuestions.concat(seccion.preguntas);
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
        alert('No hay preguntas disponibles. Por favor, intente con otro cuestionario');
        return;
    }
    
    if (numQuestions > allQuestions.length) {
        alert(`Solo hay ${allQuestions.length} preguntas disponibles. Se usarán todas.`);
        numQuestions = allQuestions.length;
    }
    
    const shuffled = shuffleArray(allQuestions);
    currentQuiz = shuffled.slice(0, numQuestions);
    totalQuestions = numQuestions;
    currentQuestionIndex = 0;
    userAnswers = new Array(totalQuestions).fill(null);

    document.querySelector('.setup-screen').classList.remove('active');
    document.querySelector('.quiz-screen').classList.add('active');

    displayQuestion();
}

function displayQuestion() {
    const question = currentQuiz[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('questionNumber').textContent = `Pregunta ${currentQuestionIndex + 1} de ${totalQuestions}`;
    document.getElementById('questionText').textContent = question.pregunta;

    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';

    Object.keys(question.opciones).forEach(key => {
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

        optionsContainer.appendChild(option);
    });

    const feedback = document.getElementById('feedback');
    const reference = document.getElementById('reference');
    
    if (userAnswers[currentQuestionIndex]) {
        const isCorrect = userAnswers[currentQuestionIndex] === question.respuesta_correcta;
        feedback.className = 'feedback show ' + (isCorrect ? 'correct' : 'incorrect');
        feedback.textContent = isCorrect ? '✓ ¡Correcto! Excelente.' : '✗ Incorrecto. La respuesta correcta es: ' + question.respuesta_correcta;
        reference.textContent = '📖 ' + question.referencia;
        document.getElementById('nextBtn').disabled = false;
    } else {
        feedback.className = 'feedback';
        reference.textContent = '';
        document.getElementById('nextBtn').disabled = true;
    }

    document.getElementById('prevBtn').disabled = currentQuestionIndex === 0;
}

function selectOption(selectedKey) {
    if (userAnswers[currentQuestionIndex]) return;

    userAnswers[currentQuestionIndex] = selectedKey;
    const question = currentQuiz[currentQuestionIndex];
    const isCorrect = selectedKey === question.respuesta_correcta;

    const options = document.querySelectorAll('.option');
    options.forEach(opt => {
        opt.classList.add('disabled');
        const key = opt.getAttribute('data-option');
        
        if (key === selectedKey) {
            opt.classList.add('selected');
            if (isCorrect) {
                opt.classList.add('correct');
            } else {
                opt.classList.add('incorrect');
            }
        }
        
        if (key === question.respuesta_correcta) {
            opt.classList.add('correct');
        }
    });

    const feedback = document.getElementById('feedback');
    const reference = document.getElementById('reference');
    
    feedback.className = 'feedback show ' + (isCorrect ? 'correct' : 'incorrect');
    feedback.textContent = isCorrect ? '✓ ¡Correcto! Excelente.' : '✗ Incorrecto. La respuesta correcta es: ' + question.respuesta_correcta;
    reference.textContent = '📖 ' + question.referencia;
    
    document.getElementById('nextBtn').disabled = false;
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

function showResults() {
    let correctAnswers = 0;
    currentQuiz.forEach((question, index) => {
        if (userAnswers[index] === question.respuesta_correcta) {
            correctAnswers++;
        }
    });

    const percentage = Math.round((correctAnswers / totalQuestions) * 100);

    document.querySelector('.quiz-screen').classList.remove('active');
    document.querySelector('.results-screen').classList.add('active');

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

function restartQuiz() {
    document.querySelector('.results-screen').classList.remove('active');
    document.querySelector('.quiz-selection-screen').classList.add('active');
    currentQuiz = [];
    currentQuestionIndex = 0;
    userAnswers = [];
    totalQuestions = 0;
    quizData = null;
    selectedQuizFile = null;
    loadQuizList();
}

function exitQuiz() {
    if (confirm('¿Estás seguro de que deseas salir? Se perderá tu progreso actual.')) {
        document.querySelector('.quiz-screen').classList.remove('active');
        document.querySelector('.quiz-selection-screen').classList.add('active');
        currentQuiz = [];
        currentQuestionIndex = 0;
        userAnswers = [];
        totalQuestions = 0;
        quizData = null;
        selectedQuizFile = null;
        loadQuizList();
    }
}

// Cargar la lista de cuestionarios al iniciar
window.addEventListener('DOMContentLoaded', () => {
    loadQuizList();
});