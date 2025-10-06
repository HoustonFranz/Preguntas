// Cargar datos del JSON
fetch('preguntas.json')
    .then(response => response.json())
    .then(data => {
        quizData = data;
    })
    .catch(error => {
        console.error('Error cargando preguntas:', error);
        alert('Error al cargar las preguntas.');
});

let currentQuiz = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let totalQuestions = 0;

function getAllQuestions() {
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
        message = '¡Muy bien! 👏 Buen conocimiento del tema.';
    } else if (percentage >= 50) {
        message = '¡Buen intento! 📚 Sigue estudiando.';
    } else {
        message = '¡No te rindas! 💪 La práctica hace al maestro.';
    }

    document.getElementById('scoreMessage').textContent = message;
}

function restartQuiz() {
    document.querySelector('.results-screen').classList.remove('active');
    document.querySelector('.setup-screen').classList.add('active');
    currentQuiz = [];
    currentQuestionIndex = 0;
    userAnswers = [];
    totalQuestions = 0;
}

function exitQuiz() {
    if (confirm('¿Estás seguro de que deseas salir? Se perderá tu progreso actual.')) {
        document.querySelector('.quiz-screen').classList.remove('active');
        document.querySelector('.setup-screen').classList.add('active');
        currentQuiz = [];
        currentQuestionIndex = 0;
        userAnswers = [];
        totalQuestions = 0;
    }
}