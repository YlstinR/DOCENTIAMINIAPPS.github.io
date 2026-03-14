// Initialize Telegram Web App
const twa = window.Telegram?.WebApp;

// --- INITIALIZATION ---
function setDynamicGreeting() {
  const greetingEl = document.getElementById('dynamic-greeting');
  if (!greetingEl) return;
  
  const hour = new Date().getHours();
  let greeting = "Buen día, Colega";
  
  if (hour >= 12 && hour < 19) {
    greeting = "Buenas tardes, Colega";
  } else if (hour >= 19 || hour < 5) {
    greeting = "Buenas noches, Colega";
  }
  
  greetingEl.textContent = greeting;
}

if (twa) {
  twa.ready();
  twa.expand();
  twa.setHeaderColor('secondary_bg_color');
  twa.setBackgroundColor('secondary_bg_color');
} else {
  console.warn("Telegram WebApp API not found. Running in standard browser mode for testing.");
  const syncStatusEl = document.getElementById('sync-status');
  if (syncStatusEl) {
    syncStatusEl.textContent = "Modo Prueba";
    const dot = syncStatusEl.previousElementSibling;
    if (dot) dot.style.backgroundColor = "#f59e0b";
  }
}

setDynamicGreeting();

// --- DOM ELEMENTS ---
const profileView = document.getElementById("profile-view");
const loginView = document.getElementById("login-view");
const rubricView = document.getElementById("rubric-view");
const planningView = document.getElementById("planning-view");
const unitView = document.getElementById("unit-view");
const sessionView = document.getElementById("session-view");

const profileForm = document.getElementById('profile-form');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const unitForm = document.getElementById('unit-form');
const sessionForm = document.getElementById('session-form');
const inputs = document.querySelectorAll('input, select, textarea');

const rubricBody = document.getElementById("rubric-body");
const btnAddCriterion = document.getElementById("btn-add-criterion");
const rubricTopic = document.getElementById("rubric-topic");
const syncStatus = document.getElementById('sync-status');

const progressAnual = document.getElementById("progress-anual");
const progressUnidades = document.getElementById("progress-unidades");
const progressSesiones = document.getElementById("progress-sesiones");
const statusAnualText = document.getElementById("status-anual");
const statusUnidadesText = document.getElementById("status-unidades");
const statusSesionesText = document.getElementById("status-sesiones");

let currentActiveForm = null;

// --- ROUTING & NAVIGATION ---
const startParam = twa?.initDataUnsafe?.start_param || new URLSearchParams(window.location.search).get('startapp') || '';

function updateMainButton(view) {
  if (!twa) return;
  twa.MainButton.color = twa.themeParams.button_color || "#2563eb";
  twa.MainButton.textColor = "#ffffff";
  twa.MainButton.show();

  switch (view) {
    case "LOGIN": twa.MainButton.text = "INICIAR SESIÓN"; break;
    case "REGISTER": twa.MainButton.text = "CREAR CUENTA"; break;
    case "RUBRICA": twa.MainButton.text = "GENERAR RÚBRICA"; break;
    case "PLANIFICACION": twa.MainButton.text = "COMPLETAR PLANIFICACIÓN"; break;
    case "UNIDAD": twa.MainButton.text = "GENERAR UNIDAD DIDÁCTICA"; break;
    case "SESION": twa.MainButton.text = "GENERAR SESIÓN DE APRENDIZAJE"; break;
    default: twa.MainButton.text = "GUARDAR MATRIZ PEDAGÓGICA"; break;
  }
}

function showView(viewName) {
  [profileView, loginView, rubricView, planningView, unitView, sessionView].forEach(v => { if(v) v.style.display = "none"; });

  switch (viewName) {
    case "login":
      if(loginView) loginView.style.display = "block";
      syncStatus.textContent = 'Acceso Restringido';
      currentActiveForm = loginForm;
      updateMainButton("LOGIN");
      break;
    case "rubrica":
      if(rubricView) rubricView.style.display = "block";
      syncStatus.textContent = 'Generador de Rúbricas';
      currentActiveForm = null;
      updateMainButton("RUBRICA");
      initRubricBuilder();
      break;
    case "planificacion":
      if(planningView) planningView.style.display = "block";
      syncStatus.textContent = 'Hub de Planificación';
      currentActiveForm = null;
      updateMainButton("PLANIFICACION");
      fetchPlanningStatus();
      break;
    case "sesion":
      if(sessionView) sessionView.style.display = "block";
      syncStatus.textContent = 'Generador de Sesiones';
      currentActiveForm = sessionForm;
      updateMainButton("SESION");
      break;
    case "unidad":
      if(unitView) unitView.style.display = "block";
      syncStatus.textContent = 'Generador de Unidades';
      currentActiveForm = unitForm;
      updateMainButton("UNIDAD");
      break;
    default:
      if(profileView) profileView.style.display = "block";
      syncStatus.textContent = 'Sincronizado';
      currentActiveForm = profileForm;
      updateMainButton("PERFIL");
      break;
  }
}

// Set initial view
if (startParam === 'login') showView("login");
else if (startParam === 'rubrica') showView("rubrica");
else if (startParam === 'planificacion') showView("planificacion");
else if (startParam === 'unidad') showView("unidad");
else if (startParam === 'sesion') showView("sesion");
else showView("perfil");

// --- VALIDATION & FEEDBACK ---
function shakeInput(input) {
  input.parentElement.parentElement.classList.add('error-shake');
  if (twa) twa.HapticFeedback.notificationOccurred('warning');
  setTimeout(() => input.parentElement.parentElement.classList.remove('error-shake'), 400);
}

function checkFormValidity() {
  if (!currentActiveForm) {
      if (rubricView.style.display === "block") updateMainButton("RUBRICA");
      else if (planningView.style.display === "block") updateMainButton("PLANIFICACION");
      return;
  }
  
  const isValid = currentActiveForm.checkValidity();
  if (twa) {
    if (isValid) {
      if (loginView.style.display === 'block') {
        updateMainButton((currentActiveForm.id === 'login-form') ? "LOGIN" : "REGISTER");
      } else {
        updateMainButton("PERFIL");
      }
    } else {
      twa.MainButton.hide();
    }
  }
}

inputs.forEach(input => {
  input.addEventListener('input', () => {
    input.parentElement.parentElement.classList.remove('error-shake');
    checkFormValidity();
  });
  input.addEventListener('blur', () => {
    if (!input.checkValidity() && input.value !== "") shakeInput(input);
  });
  input.addEventListener('change', checkFormValidity);
});

// Auth Toggle
const btnShowRegister = document.getElementById('btn-show-register');
const btnShowLogin = document.getElementById('btn-show-login');
if (btnShowRegister && btnShowLogin) {
  btnShowRegister.onclick = () => {
    loginForm.style.display = 'none';
    registerForm.style.display = 'flex';
    currentActiveForm = registerForm;
    twa?.HapticFeedback.selectionChanged();
    checkFormValidity();
  };
  btnShowLogin.onclick = () => {
    registerForm.style.display = 'none';
    loginForm.style.display = 'flex';
    currentActiveForm = loginForm;
    twa?.HapticFeedback.selectionChanged();
    checkFormValidity();
  };
}

// --- CORE ACTIONS ---

if (twa) {
    twa.MainButton.onClick(() => {
        if (rubricView.style.display === "block") return handleRubricSubmission();
        if (planningView.style.display === "block") return twa.showAlert("¡Felicidades! Estás al día con tu planificación.");
        
        if (!currentActiveForm || !currentActiveForm.checkValidity()) {
            const firstInvalid = currentActiveForm?.querySelector(':invalid');
            if (firstInvalid) shakeInput(firstInvalid);
            return;
        }

        const formData = new FormData(currentActiveForm);
        const data = Object.fromEntries(formData.entries());
        
        if (loginView.style.display === "block") {
            const mode = (currentActiveForm.id === 'login-form') ? 'login' : 'register';
            submitDataToBackend({ action: `auth_${mode}`, data, initData: twa.initData }, `/api/tma/auth/${mode}`);
        } else if (unitView.style.display === "block") {
            submitDataToBackend({ action: "generate_unit", data, initData: twa.initData }, "/api/tma/units/generate");
        } else if (sessionView.style.display === "block") {
            submitDataToBackend({ action: "generate_session", data, initData: twa.initData }, "/api/tma/sessions/generate");
        } else {
            twa.showPopup({
                title: "Confirmar Cambios",
                message: "¿Deseas guardar esta configuración?",
                buttons: [{id: "save", type: "default", text: "Guardar"}, {type: "cancel"}]
            }, (id) => { if(id === "save") submitDataToBackend({ action: "update_profile", data, initData: twa.initData }, "/api/tma/profile"); });
        }
    });
}

// --- RUBRIC LOGIC ---
function initRubricBuilder() {
    if (rubricBody && rubricBody.children.length === 0) {
        ["Comprensión Lectora", "Gramática", "Coherencia", "Creatividad"].forEach(c => addRubricRow(c));
    }
}

btnAddCriterion?.addEventListener("click", () => {
    addRubricRow("");
    twa?.HapticFeedback.selectionChanged();
});

function addRubricRow(criterion = "") {
    if (!rubricBody) return;
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td><input type="text" class="row-criterion" value="${criterion}" placeholder="Nuevo criterio..."></td>
        <td><input type="text" class="row-lvl" disabled value="IA"></td>
        <td><input type="text" class="row-lvl" disabled value="IA"></td>
        <td><input type="text" class="row-lvl" disabled value="IA"></td>
        <td><input type="text" class="row-lvl" disabled value="IA"></td>
        <td><button class="btn-remove-row">🗑️</button></td>
    `;
    tr.querySelector(".btn-remove-row").onclick = () => {
        tr.remove();
        twa?.HapticFeedback.notificationOccurred("warning");
    };
    rubricBody.appendChild(tr);
}

async function handleRubricSubmission() {
    if (!rubricTopic.value.trim()) return twa?.showAlert("Ingresa un tema.");
    const criteria = Array.from(rubricBody.querySelectorAll(".row-criterion")).map(i => i.value.trim()).filter(v => v);
    if (criteria.length === 0) return twa?.showAlert("Añade criterios.");
    
    submitDataToBackend({ 
        action: "generate_rubric", 
        data: { topic: rubricTopic.value.trim(), criteria }, 
        initData: twa.initData 
    }, "/api/tma/rubrics/generate");
}

// --- PLANNING LOGIC ---
async function fetchPlanningStatus() {
    try {
        const apiUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? `http://localhost:8000/api/tma/planning/status`
            : `https://docente-ia.onrender.com/api/tma/planning/status`; 

        const res = await fetch(apiUrl, { headers: { 'Authorization': `tma ${twa?.initData || ""}` } });
        if (res.ok) {
            const { data } = await res.json();
            progressAnual.style.width = `${data.anual.progress}%`;
            statusAnualText.textContent = data.anual.status;
            progressUnidades.style.width = `${data.unidades.progress}%`;
            statusUnidadesText.textContent = `${data.unidades.count} Unidades`;
            progressSesiones.style.width = `${data.sesiones.progress}%`;
            statusSesionesText.textContent = `${data.sesiones.count} Sesiones`;
        }
    } catch (e) { console.error("Planning error", e); }
}

document.querySelectorAll(".btn-plan").forEach(btn => {
    btn.onclick = () => {
        twa?.showAlert(`Gestionando ${btn.getAttribute("data-type")}... Desarrollo en curso.`);
        twa?.HapticFeedback.impactOccurred("medium");
    };
});

// --- BACKEND SYNC ---
async function submitDataToBackend(payload, endpoint) {
    twa?.MainButton.showProgress();
    try {
        const baseUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:8000' : 'https://docente-ia.onrender.com';
        const response = await fetch(`${baseUrl}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `tma ${payload.initData}` },
            body: JSON.stringify(payload.data)
        });

        if (response.ok) {
            twa?.HapticFeedback.notificationOccurred('success');
            
            const msg = (startParam === "login") ? "¡Acceso concedido!" :
                        (startParam === "rubrica") ? "¡Rúbrica generada!" :
                        (startParam === "unidad") ? "¡Unidad generada con éxito!" :
                        (startParam === "sesion") ? "¡Sesión generada con éxito!" :
                        "¡Cambios guardados!";
            
            twa?.showAlert(msg);
            setTimeout(() => twa?.close(), 1500);
        } else {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || "Error en el servidor");
        }
    } catch (error) {
        twa?.HapticFeedback.notificationOccurred('error');
        twa?.showAlert(`Error: ${error.message}`);
    } finally {
        twa?.MainButton.hideProgress();
    }
}
