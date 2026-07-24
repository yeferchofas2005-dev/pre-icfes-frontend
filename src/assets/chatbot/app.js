/**
 * app.js — Lógica del frontend del Chatbot Vocacional Adaptativo
 * Vanilla JS con Fetch API, gestión de estado y transiciones animadas
 */

// ============================================================
// Configuración
// ============================================================
const API_BASE = 'http://localhost:8000';   // Misma origin (FastAPI sirve el frontend)
const LIKERT_EMOJIS = ['😐', '🙂', '😊', '🤩'];

// ============================================================
// Estado Global de la Aplicación
// ============================================================
const state = {
  sessionId: null,
  usuarioId: null,
  nombre: null,
  contexto: 'estudiante',
  resultadoId: null,
  preguntaActual: null,
  totalPreguntas: 0,
  globalConf: 0,
  puedePredicir: false,
  feedbackEnviado: false,
  tiempoInicioPregunta: null,
};

// ============================================================
// Inicialización
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initWelcomeForm();
  renderFieldBadges([]);  // Inicializar badges vacíos
});

// ============================================================
// PANTALLA 1: Bienvenida
// ============================================================
function initWelcomeForm() {
  const form = document.getElementById('form-welcome');
  const contextoButtons = document.querySelectorAll('.contexto-btn');

  // Selección de contexto
  contextoButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      contextoButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.contexto = btn.dataset.value;
    });
  });

  // Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await iniciarSesion();
  });
}

async function iniciarSesion() {
  const btnIniciar = document.getElementById('btn-iniciar');
  const nombre = document.getElementById('input-nombre').value.trim();
  const edadStr = document.getElementById('input-edad').value.trim();
  const edad = edadStr ? parseInt(edadStr) : null;

  btnIniciar.disabled = true;
  btnIniciar.querySelector('.btn-text').textContent = 'Iniciando...';

  try {
    const response = await fetch(`${API_BASE}/api/iniciar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, edad, contexto: state.contexto }),
    });

    if (!response.ok) throw new Error(await response.text());

    const data = await response.json();
    state.sessionId = data.session_id;
    state.usuarioId = data.usuario_id;
    state.nombre = nombre || 'Explorador';

    // Renderizar opciones Likert desde la API
    if (data.opciones_respuesta) {
      renderLikertOptions(data.opciones_respuesta);
    }

    // Transición a pantalla de chat
    showScreen('chat');
    document.getElementById('sidebar-nombre').textContent = state.nombre;
    updateConfidenceBar(0, 0, false);

    // Cargar primera pregunta
    await loadNextQuestion();

  } catch (err) {
    showError('No se pudo conectar con el servidor. ¿Está corriendo la API?');
    console.error(err);
  } finally {
    btnIniciar.disabled = false;
    btnIniciar.querySelector('.btn-text').textContent = 'Comenzar mi orientación';
  }
}

// ============================================================
// PANTALLA 2: Chat / Preguntas
// ============================================================
async function loadNextQuestion() {
  if (!state.sessionId) return;

  showLoadingQuestion(true);
  hideQuestionCard();

  try {
    const response = await fetch(`${API_BASE}/api/pregunta/${state.sessionId}`);
    if (!response.ok) throw new Error(await response.text());

    const data = await response.json();

    if (data.listo_para_prediccion) {
      // Suficiente confianza → predecir
      showLoadingQuestion(false);
      await realizarPrediccion();
      return;
    }

    // Renderizar pregunta
    const pregunta = data.pregunta;
    state.preguntaActual = pregunta;
    state.tiempoInicioPregunta = Date.now();

    // Actualizar UI de estado
    updateConfidenceBar(
      data.estado.global_confidence,
      data.estado.global_percentage,
      data.estado.puede_predecir
    );
    document.getElementById('q-num').textContent = data.estado.total_preguntas + 1;

    renderQuestion(pregunta);

  } catch (err) {
    showError('Error al cargar la siguiente pregunta.');
    console.error(err);
  } finally {
    showLoadingQuestion(false);
  }
}

function renderQuestion(pregunta) {
  const card = document.getElementById('question-card');
  const textEl = document.getElementById('question-text');
  const razonEl = document.getElementById('question-reason');
  const competenciaEl = document.getElementById('q-competencia-badge');
  const nivelEl = document.getElementById('q-nivel-badge');
  const optionsEl = document.getElementById('likert-options');

  // Animar salida y entrada
  card.classList.remove('fade-in');
  void card.offsetWidth; // reflow

  textEl.textContent = pregunta.texto;
  razonEl.textContent = pregunta.razon ? `💡 ${pregunta.razon}` : '';
  competenciaEl.textContent = formatCompetencia(pregunta.competencia);
  nivelEl.textContent = pregunta.nivel;

  // Habilitar botones
  optionsEl.querySelectorAll('.likert-btn').forEach(btn => {
    btn.disabled = false;
    btn.classList.remove('selected');
  });

  card.classList.remove('hidden');
  card.classList.add('fade-in');
}

function renderLikertOptions(opciones) {
  const container = document.getElementById('likert-options');
  container.innerHTML = '';

  opciones.forEach((opcion, i) => {
    const btn = document.createElement('button');
    btn.className = 'likert-btn';
    btn.id = `likert-${i}`;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', 'false');
    btn.dataset.score = opcion.valor;
    btn.innerHTML = `
      <span class="likert-emoji">${LIKERT_EMOJIS[i]}</span>
      <span>${opcion.etiqueta}</span>
    `;
    btn.addEventListener('click', () => onLikertSelected(opcion.valor, btn));
    container.appendChild(btn);
  });
}

async function onLikertSelected(score, clickedBtn) {
  if (!state.preguntaActual) return;

  // Visual feedback
  document.querySelectorAll('.likert-btn').forEach(b => {
    b.disabled = true;
    b.classList.remove('selected');
    b.setAttribute('aria-checked', 'false');
  });
  clickedBtn.classList.add('selected');
  clickedBtn.setAttribute('aria-checked', 'true');

  const tiempoSegundos = state.tiempoInicioPregunta
    ? (Date.now() - state.tiempoInicioPregunta) / 1000
    : null;

  const pregunta = state.preguntaActual;

  // Agregar mensaje al chat
  addChatMessage({
    tipo: 'usuario',
    texto: clickedBtn.querySelector('span:last-child').textContent,
    puntos: score,
  });

  try {
    const response = await fetch(`${API_BASE}/api/responder/${state.sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pregunta: pregunta.texto,
        pregunta_id: pregunta.pregunta_id,
        competencia: pregunta.competencia,
        score: parseFloat(score),
        peso: pregunta.peso || 1.0,
        tiempo_segundos: tiempoSegundos,
      }),
    });

    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();

    state.totalPreguntas++;

    // Actualizar UI
    updateConfidenceBar(
      data.estado.global_confidence,
      data.estado.global_percentage,
      data.estado.puede_predecir
    );
    renderFieldBadges(data.estado.campos);

    // Mensaje de aliento
    if (data.mensaje) {
      addSystemMessage(data.mensaje);
    }

    // Pequeña pausa antes de la siguiente pregunta
    await sleep(400);

    if (data.siguiente_accion === 'predecir') {
      await realizarPrediccion();
    } else {
      await loadNextQuestion();
    }

  } catch (err) {
    showError('Error al enviar respuesta. Intenta de nuevo.');
    document.querySelectorAll('.likert-btn').forEach(b => b.disabled = false);
    console.error(err);
  }
}

function updateConfidenceBar(confidence, percentage, puedePredicir) {
  const bar = document.getElementById('confidence-bar');
  const pctEl = document.getElementById('global-pct');
  const hintEl = document.getElementById('confidence-hint');
  const predictBtn = document.getElementById('btn-predict-sidebar');

  bar.style.width = `${percentage}%`;
  pctEl.textContent = `${percentage?.toFixed(0) ?? 0}%`;
  state.globalConf = confidence;
  state.puedePredicir = puedePredicir;

  // Hint
  if (percentage < 30) {
    hintEl.textContent = 'Sigue respondiendo para conocerte mejor';
  } else if (percentage < 65) {
    hintEl.textContent = `¡Bien! ${(65 - percentage).toFixed(0)}% más para la predicción`;
  } else {
    hintEl.textContent = '¡Listo para generar tu predicción!';
  }

  // Mostrar botón de predicción
  if (puedePredicir) {
    predictBtn.classList.remove('hidden');
  } else {
    predictBtn.classList.add('hidden');
  }
}

function renderFieldBadges(campos) {
  const grid = document.getElementById('fields-grid');
  if (!campos || campos.length === 0) {
    // Badges vacíos iniciales
    const competencias = [
      'análisis_cuantitativo', 'comunicación', 'pensamiento_crítico', 'liderazgo',
      'creatividad', 'atención_detalle', 'visualización_espacial', 'estabilidad_emocional'
    ];
    grid.innerHTML = competencias.map(c => `
      <div class="field-badge debil">
        <span class="field-badge-name">${formatCompetencia(c)}</span>
        <span class="field-badge-pct">0%</span>
      </div>
    `).join('');
    return;
  }

  grid.innerHTML = campos.map(campo => `
    <div class="field-badge ${campo.estado}">
      <span class="field-badge-name">${formatCompetencia(campo.competencia)}</span>
      <span class="field-badge-pct">${(campo.confianza * 100).toFixed(0)}%</span>
    </div>
  `).join('');
}

function addChatMessage({ tipo, texto, puntos }) {
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = `chat-message ${tipo} fade-in`;

  if (tipo === 'sistema') {
    div.innerHTML = `
      <div class="msg-avatar">🤖</div>
      <div class="msg-bubble">${texto}</div>
    `;
  } else {
    div.innerHTML = `
      <div class="msg-bubble user-bubble">${texto}</div>
    `;
    div.style.justifyContent = 'flex-end';
    const bubble = div.querySelector('.msg-bubble');
    if (bubble) {
      bubble.style.cssText = 'border-radius: var(--radius-lg) 0 var(--radius-lg) var(--radius-lg); background: hsla(262,83%,68%,0.12); border-color: hsla(262,83%,68%,0.25);';
    }
  }

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function addSystemMessage(texto) {
  addChatMessage({ tipo: 'sistema', texto });
}

function triggerPrediction() {
  realizarPrediccion();
}

// ============================================================
// PANTALLA 3: Loading → Predicción
// ============================================================
async function realizarPrediccion() {
  showScreen('loading');
  animateLoadingSteps();

  try {
    const response = await fetch(`${API_BASE}/api/predicir/${state.sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();

    state.resultadoId = data.resultado_id;

    // Esperar animación mínima
    await sleep(2500);

    // Renderizar resultados
    renderResultados(data);
    showScreen('result');

  } catch (err) {
    showError('Error al generar la predicción. Intenta de nuevo.');
    showScreen('chat');
    console.error(err);
  }
}

function animateLoadingSteps() {
  const steps = document.querySelectorAll('.loading-step');
  steps.forEach(s => { s.classList.remove('active', 'done'); });

  steps[0].classList.add('active');
  setTimeout(() => {
    steps[0].classList.replace('active', 'done');
    steps[1].classList.add('active');
  }, 900);
  setTimeout(() => {
    steps[1].classList.replace('active', 'done');
    steps[2].classList.add('active');
  }, 1800);
}

// ============================================================
// PANTALLA 4: Resultados
// ============================================================
function renderResultados(data) {
  const { top3_carreras, vector_competencias, campos, preguntas_respondidas, confianza_porcentaje } = data;

  // Subtítulo
  document.getElementById('result-subtitle').textContent =
    `Análisis basado en ${preguntas_respondidas} respuestas • Confianza: ${confianza_porcentaje?.toFixed(0) ?? '--'}%`;

  // Cards de carreras
  const careersGrid = document.getElementById('careers-grid');
  careersGrid.innerHTML = top3_carreras.map((carrera, i) => `
    <div class="career-card rank-${i + 1}" style="animation-delay: ${i * 0.15}s">
      <div class="career-rank">${i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
      <div class="career-info">
        <div class="career-name">${carrera.carrera}</div>
        <div class="career-bar-track">
          <div class="career-bar-fill" style="width:${carrera.porcentaje}%; animation-delay:${0.3 + i * 0.15}s"></div>
        </div>
      </div>
      <div class="career-pct">${carrera.porcentaje?.toFixed(0) ?? '--'}%</div>
    </div>
  `).join('');

  // Barras de competencias
  const competenciasData = campos || Object.entries(vector_competencias || {}).map(([k, v]) => ({
    competencia: k, valor: v, confianza: v
  }));

  const barsContainer = document.getElementById('competencias-bars');
  barsContainer.innerHTML = competenciasData.map((campo, i) => {
    const val = campo.valor ?? campo.confianza ?? 0;
    return `
      <div class="comp-bar-row" style="animation-delay:${i * 0.05}s">
        <span class="comp-bar-label">${formatCompetencia(campo.competencia)}</span>
        <div class="comp-bar-track">
          <div class="comp-bar-fill" style="width:${(val * 100).toFixed(0)}%; animation-delay:${0.5 + i * 0.05}s"></div>
        </div>
        <span class="comp-bar-val">${(val * 100).toFixed(0)}%</span>
      </div>
    `;
  }).join('');
}

// ============================================================
// Feedback
// ============================================================
async function sendFeedback(esAcertada) {
  if (state.feedbackEnviado) return;

  document.getElementById('btn-feedback-si').disabled = true;
  document.getElementById('btn-feedback-no').disabled = true;

  if (!esAcertada) {
    // Mostrar input para carrera real
    document.getElementById('feedback-extra').classList.remove('hidden');
    return;
  }

  await submitFeedbackData({ fue_acertada: true });
}

async function submitFeedback() {
  const carreraReal = document.getElementById('carrera-real').value.trim();
  await submitFeedbackData({
    fue_acertada: false,
    carrera_real: carreraReal || null,
  });
}

async function submitFeedbackData(feedbackData) {
  if (!state.resultadoId || state.feedbackEnviado) return;
  state.feedbackEnviado = true;

  try {
    await fetch(`${API_BASE}/api/retroalimentacion/${state.resultadoId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedbackData),
    });

    document.getElementById('feedback-extra').classList.add('hidden');
    document.getElementById('feedback-thanks').classList.remove('hidden');
  } catch (err) {
    console.error('Error enviando feedback:', err);
  }
}

// ============================================================
// Utilidades de navegación
// ============================================================
function showScreen(screenName) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(`screen-${screenName}`);
  if (target) {
    target.classList.add('active');
    window.scrollTo(0, 0);
  }
}

function hideQuestionCard() {
  document.getElementById('question-card').classList.add('hidden');
}

function showLoadingQuestion(show) {
  const el = document.getElementById('loading-question');
  if (show) {
    el.classList.remove('hidden');
  } else {
    el.classList.add('hidden');
  }
}

function restartApp() {
  // Reset state
  Object.assign(state, {
    sessionId: null, usuarioId: null, nombre: null,
    resultadoId: null, preguntaActual: null,
    totalPreguntas: 0, globalConf: 0,
    puedePredicir: false, feedbackEnviado: false,
  });

  // Reset UI
  document.getElementById('form-welcome').reset();
  document.getElementById('chat-messages').innerHTML = `
    <div class="chat-message system fade-in" id="msg-intro">
      <div class="msg-avatar">🤖</div>
      <div class="msg-bubble">
        ¡Hola! Voy a hacerte algunas preguntas para conocer mejor tus aptitudes e intereses.
        <strong>No hay respuestas correctas o incorrectas</strong>, solo sé honesto contigo mismo.
      </div>
    </div>
  `;
  document.getElementById('feedback-extra').classList.add('hidden');
  document.getElementById('feedback-thanks').classList.add('hidden');
  document.getElementById('btn-feedback-si').disabled = false;
  document.getElementById('btn-feedback-no').disabled = false;
  updateConfidenceBar(0, 0, false);
  renderFieldBadges([]);

  showScreen('welcome');
}

function showError(mensaje) {
  // Toast de error
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    background: hsla(355,85%,62%,0.9); color: white; padding: 12px 24px;
    border-radius: 12px; font-size: 0.9rem; font-weight: 500;
    z-index: 9999; animation: fade-in 0.3s ease;
    backdrop-filter: blur(10px);
  `;
  toast.textContent = `⚠️ ${mensaje}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ============================================================
// Helpers
// ============================================================
function formatCompetencia(comp) {
  if (!comp) return '';
  // Formatear: análisis_cuantitativo → Análisis cuantitativo
  const labels = {
    'análisis_cuantitativo': 'Análisis cuantitativo',
    'comunicación': 'Comunicación',
    'pensamiento_crítico': 'Pensamiento crítico',
    'liderazgo': 'Liderazgo',
    'creatividad': 'Creatividad',
    'atención_detalle': 'Atención al detalle',
    'visualización_espacial': 'Visual-espacial',
    'estabilidad_emocional': 'Estabilidad emocional',
  };
  return labels[comp] || comp.replace(/_/g, ' ');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
