const sharedData = {
  who: [
    "el autobus de mi linea",
    "el tren de cercanias",
    "la aplicacion del parking",
    "mi vecino del garaje",
    "un repartidor bloqueando la calle",
    "la grua municipal",
    "el ascensor del edificio",
    "la alarma de casa",
    "mi jefe anterior llamandome",
    "el semaforo principal",
    "una manifestacion en el centro",
    "una averia en la via",
    "mi coche",
    "la puerta del portal",
  ],
  action: [
    "provoco un bloqueo",
    "genero una retencion",
    "causo un retraso importante",
    "dejo la via colapsada",
    "obligo a tomar un desvio largo",
    "dejo sin servicio la ruta habitual",
    "ralentizo todo el trayecto",
    "complico el acceso principal",
    "freno la circulacion",
    "descuadro mi salida",
    "afecto la entrada al edificio",
    "hizo imposible mantener el horario",
    "retraso el ultimo tramo",
    "interrumpio el recorrido normal",
  ],
  what: [
    "mi ruta al trabajo",
    "el acceso al garaje",
    "mi tarjeta de transporte",
    "la entrada al edificio",
    "mi plan de salida",
    "el trafico de la avenida",
    "la conexion del navegador GPS",
    "mi hora de llegada",
    "la puerta del parking",
    "mi organizacion de la manana",
    "mi margen de tiempo",
    "la entrada principal",
    "el itinerario habitual",
    "la cola del control de acceso",
  ],
  when: [
    "hoy temprano",
    "esta manana",
    "justo antes de salir",
    "de camino a la oficina",
    "en hora punta",
    "a primera hora",
    "diez minutos antes de entrar",
    "en el ultimo tramo del recorrido",
    "cuando ya estaba llegando",
    "durante el trayecto habitual",
    "al salir de casa",
    "justo en mi hora de entrada",
    "en el acceso final",
    "durante el cambio de turno",
  ],
  where: [
    "en la M-30",
    "en la entrada del parking",
    "en la estacion principal",
    "en el tunel de acceso",
    "en la rotonda de siempre",
    "en el cruce de la oficina",
    "en la puerta del edificio",
    "en la zona de obras",
    "en el paso subterraneo",
    "en la salida del barrio",
    "en el control de acceso",
    "en el carril de incorporacion",
  ],
  delay: [
    "y perdi 12 minutos",
    "y se me fueron 18 minutos",
    "y llegue con 22 minutos de retraso",
    "y acumule casi media hora",
    "y se me descuadro todo el horario",
    "y no pude recuperar el tiempo",
    "y termine entrando mas tarde",
    "y se me junto con mas trafico",
    "y me atraso justo en el tramo final",
    "y no consegui alternativa rapida",
    "y me hizo llegar fuera de hora",
    "y tuve que esperar a que se despejara",
  ],
  evidence: [
    "Tengo capturas de la app de trafico.",
    "Puedo ensenar el aviso de incidencia.",
    "La aplicacion de transporte marco demora.",
    "Tengo el parte de la averia en el movil.",
    "Quedo registrado en el control de acceso.",
    "Hay aviso oficial del corte en la zona.",
    "Tengo el historial del GPS con el desvio.",
    "La incidencia aparece en la web municipal.",
    "Puedo enviar la evidencia del recorrido.",
    "Tengo el ticket con la hora exacta.",
    "La camara del parking registra la cola.",
    "Tengo mensajes reportando el incidente.",
  ],
  tonePrefixes: {
    casual: "Vale, no te vas a creer esto:",
    formal: "Lamento informar que",
    dramatic: "Fue una cadena de eventos tragica:",
    absurd: "Atencion, porque esto es realismo magico:",
  },
  getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  },
  buildBaseExcuse() {
    const randomWho = this.getRandomElement(this.who);
    const randomAction = this.getRandomElement(this.action);
    const randomWhat = this.getRandomElement(this.what);
    const randomWhen = this.getRandomElement(this.when);
    const randomWhere = this.getRandomElement(this.where);
    const randomDelay = this.getRandomElement(this.delay);
    const randomEvidence = this.getRandomElement(this.evidence);

    const normalizedWho = randomWho.charAt(0).toLowerCase() + randomWho.slice(1);

    return `${randomWhen}, ${normalizedWho} ${randomAction} ${randomWhere}, y afecto ${randomWhat}; ${randomDelay}. ${randomEvidence}`;
  },
};

const tonePrefixes = {
  ...sharedData.tonePrefixes,
};

const pendingRequests = [];
const approvedRequests = [];
const faultRequests = [];
let totalRegistered = 0;
let excuseEnabled = false;
let currentStatus = "unknown";
let isProcessing = false;
let bossMuteTimerId = null;
let bossAutoCloseTimerId = null;
let bossDeniedTimerId = null;
let platformAutoCloseTimerId = null;
let typewriterTimerId = null;

const START_WORK_MIN = 9 * 60;
const NO_EXCUSE_END_MIN = 9 * 60 + 30;
const EXCUSE_END_MIN = 18 * 60;
const PROCESSING_DELAY_MS = 3000;
const CALENDAR_STORAGE_KEY = "excuse-calendar-by-day";
const CALENDAR_SEEDED_KEY = "excuse-calendar-seeded-v2";

const monthNames = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

let calendarMonthDate = new Date();
let selectedCalendarDateKey = "";
let calendarExcusesByDate = loadCalendarExcuses();
const dismissalsRecords = [];
let dismissalsPageSize = 5;
let dismissalsPage = 0;
const PENDING_PAGE_SIZE = 2;
let pendingPage = 0;

const SPAIN_NATIONAL_HOLIDAYS_2026 = [
  "2026-01-01",
  "2026-01-06",
  "2026-04-03",
  "2026-05-01",
  "2026-08-15",
  "2026-10-12",
  "2026-11-01",
  "2026-12-06",
  "2026-12-08",
  "2026-12-25",
];

function randomItem(array) {
  return sharedData.getRandomElement(array);
}

function buildExcuse(tone) {
  const prefix = tonePrefixes[tone] || tonePrefixes.casual;
  const baseExcuse = sharedData.buildBaseExcuse();

  return `${prefix} ${baseExcuse}`;
}

function buildHiddenExcuse() {
  const availableTones = Object.keys(tonePrefixes);
  const hiddenTone = randomItem(availableTones);
  return buildExcuse(hiddenTone);
}

function loadCalendarExcuses() {
  try {
    const raw = localStorage.getItem(CALENDAR_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveCalendarExcuses() {
  localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(calendarExcusesByDate));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatTime(hours, minutes) {
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function randomCheckinTime() {
  const totalMinutes = randomInt(NO_EXCUSE_END_MIN + 1, EXCUSE_END_MIN);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return formatTime(hours, minutes);
}

function toMinutesValue(timeValue) {
  const [hoursText, minutesText] = String(timeValue).split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
}

function forceLateCheckinTime(timeValue) {
  const totalMinutes = toMinutesValue(timeValue);
  if (totalMinutes !== null && totalMinutes >= NO_EXCUSE_END_MIN + 1 && totalMinutes <= EXCUSE_END_MIN) {
    return timeValue;
  }

  return randomCheckinTime();
}

function buildShortExcuse() {
  const who = randomItem(sharedData.who);
  const action = randomItem(sharedData.action);
  return `${who} ${action}`;
}

function buildEmployeePool() {
  const firstNames = [
    "Laura",
    "Daniel",
    "Sara",
    "Carlos",
    "Ana",
    "Mario",
    "Lucia",
    "Diego",
    "Marta",
    "Hugo",
    "Irene",
    "Pablo",
    "Elena",
    "Ruben",
    "Nuria",
    "Jorge",
    "Clara",
    "Raul",
    "Alba",
    "Kevin",
    "Sonia",
    "Ivan",
    "Maria",
    "Sergio",
    "Noa",
    "Adrian",
    "Paula",
    "Bruno",
    "Ainhoa",
    "Nicolas",
  ];
  const lastNames = [
    "Martinez",
    "Torres",
    "Jimenez",
    "Ruiz",
    "Perez",
    "Gil",
    "Navarro",
    "Molina",
    "Soria",
    "Cabrera",
    "Campos",
    "Santos",
    "Blanco",
    "Cano",
    "Vidal",
    "Lopez",
    "Mendez",
    "Benitez",
    "Navas",
    "Ramos",
    "Ortega",
    "Prieto",
    "Leon",
    "Lara",
    "Paredes",
    "Dominguez",
    "Iglesias",
    "Herrera",
    "Nieto",
    "Rey",
  ];

  const employees = [];
  let idCounter = 100;

  firstNames.forEach((firstName) => {
    lastNames.forEach((lastName) => {
      idCounter += 1;
      employees.push({
        name: `${firstName} ${lastName}`,
        employeeId: `EMP-${idCounter}`,
      });
    });
  });

  return employees;
}

function buildDemoCompanyRecords(year) {
  const recordsByDate = {};
  const employees = buildEmployeePool();
  const current = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);

  while (current <= end) {
    const dateKey = dateToKey(current);

    if (!isWeekendOrHoliday(current)) {
      const entriesCount = randomInt(10, 15);
      const entries = [];
      const usedIndexes = new Set();

      while (entries.length < entriesCount) {
        const employeeIndex = randomInt(0, employees.length - 1);
        if (usedIndexes.has(employeeIndex)) continue;
        usedIndexes.add(employeeIndex);

        const employee = employees[employeeIndex];
        const checkinTime = randomCheckinTime();
        const excuseText = buildShortExcuse();
        entries.push(`${checkinTime} - ${employee.name} (${employee.employeeId}) | Excusa: ${excuseText}.`);
      }

      recordsByDate[dateKey] = entries;
    }

    current.setDate(current.getDate() + 1);
  }

  return recordsByDate;
}

function isWeekendOrHoliday(date) {
  const day = date.getDay();
  const dateKey = dateToKey(date);

  // Check if the day is Saturday (6) or Sunday (0) or a holiday
  return day === 0 || day === 6 || SPAIN_NATIONAL_HOLIDAYS_2026.includes(dateKey);
}

function ensureExcuseInCalendarEntry(entry) {
  if (typeof entry !== "string") return "";

  const [leftPart, maybeExcuse] = entry.split("| Excusa:");
  const cleanLeft = (leftPart || "").trim();
  const cleanExcuse = (maybeExcuse || "").trim();

  const leftMatch = cleanLeft.match(/^(\d{2}:\d{2})\s-\s(.+)\s\((EMP-\d+)\)$/);

  if (!leftMatch) {
    return `${randomCheckinTime()} - Registro Empresa (EMP-000) | Excusa: ${buildShortExcuse()}.`;
  }

  const fixedTime = forceLateCheckinTime(leftMatch[1]);
  const employeeName = leftMatch[2].trim();
  const employeeId = leftMatch[3].trim();
  const excuseText = cleanExcuse || `${buildShortExcuse()}.`;

  return `${fixedTime} - ${employeeName} (${employeeId}) | Excusa: ${excuseText}`;
}

function seedCalendarWithDemoDataIfNeeded() {
  Object.keys(calendarExcusesByDate).forEach((key) => {
    const currentEntries = Array.isArray(calendarExcusesByDate[key]) ? calendarExcusesByDate[key] : [];
    calendarExcusesByDate[key] = currentEntries.map((entry) => ensureExcuseInCalendarEntry(entry)).filter(Boolean);
  });

  const alreadySeeded = localStorage.getItem(CALENDAR_SEEDED_KEY) === "1";
  if (alreadySeeded) {
    refillFridaysFromDemoData(new Date().getFullYear());
    purgeSundayDelays();
    purgeNationalHolidayDelays();
    saveCalendarExcuses();
    return;
  }

  const currentYear = new Date().getFullYear();
  const demoData = buildDemoCompanyRecords(currentYear);
  const keys = Object.keys(demoData);

  keys.forEach((key) => {
    if (!calendarExcusesByDate[key]) {
      calendarExcusesByDate[key] = [];
    }

    const existing = new Set(calendarExcusesByDate[key]);
    demoData[key].forEach((entry) => {
      if (!existing.has(entry)) {
        calendarExcusesByDate[key].push(entry);
      }
    });
  });

  purgeSundayDelays();
  purgeNationalHolidayDelays();

  saveCalendarExcuses();
  localStorage.setItem(CALENDAR_SEEDED_KEY, "1");
}

function todayDateKey() {
  return dateToKey(new Date());
}

function dateToKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateKeyToWeekday(dateKey) {
  const [yearText, monthText, dayText] = dateKey.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  return new Date(year, month - 1, day).getDay();
}

function isSundayDateKey(dateKey) {
  const weekday = dateKeyToWeekday(dateKey);
  return weekday === 0;
}

function isSpainNationalHolidayDateKey(dateKey) {
  return SPAIN_NATIONAL_HOLIDAYS_2026.includes(dateKey);
}

function purgeSundayDelays() {
  Object.keys(calendarExcusesByDate).forEach((dateKey) => {
    if (isSundayDateKey(dateKey)) {
      calendarExcusesByDate[dateKey] = [];
    }
  });
}

function purgeNationalHolidayDelays() {
  Object.keys(calendarExcusesByDate).forEach((dateKey) => {
    if (isSpainNationalHolidayDateKey(dateKey)) {
      calendarExcusesByDate[dateKey] = [];
    }
  });
}

function refillFridaysFromDemoData(year) {
  const demoData = buildDemoCompanyRecords(year);

  Object.keys(demoData).forEach((dateKey) => {
    if (dateKeyToWeekday(dateKey) !== 5) return;

    const existingEntries = Array.isArray(calendarExcusesByDate[dateKey]) ? calendarExcusesByDate[dateKey] : [];
    if (existingEntries.length > 0) return;

    calendarExcusesByDate[dateKey] = demoData[dateKey]
      .map((entry) => ensureExcuseInCalendarEntry(entry))
      .filter(Boolean);
  });
}

function formatHumanDate(dateKey) {
  const [year, month, day] = dateKey.split("-");
  return `${day}/${month}/${year}`;
}

function addExcuseToCalendar(dateKey, value) {
  if (!dateKey || !value) return;
  if (isSundayDateKey(dateKey) || isSpainNationalHolidayDateKey(dateKey)) return;

  if (!calendarExcusesByDate[dateKey]) {
    calendarExcusesByDate[dateKey] = [];
  }

  calendarExcusesByDate[dateKey].unshift(value);
  saveCalendarExcuses();
}

function renderCalendarDayDetail() {
  const title = document.getElementById("calendar-day-title");
  const list = document.getElementById("calendar-day-list");
  if (!title || !list) return;

  const key = selectedCalendarDateKey || todayDateKey();
  const items = calendarExcusesByDate[key] || [];

  title.textContent = `Excusas del dia ${formatHumanDate(key)}`;
  list.innerHTML = "";

  if (items.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No hay excusas registradas para este dia.";
    list.appendChild(li);
    return;
  }

  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  });
}

function renderCalendar() {
  const monthLabel = document.getElementById("calendar-month-label");
  const grid = document.getElementById("calendar-grid");
  if (!monthLabel || !grid) return;

  const year = calendarMonthDate.getFullYear();
  const month = calendarMonthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (firstDay.getDay() + 6) % 7;

  monthLabel.textContent = `${monthNames[month]} ${year}`;
  grid.innerHTML = "";

  for (let i = 0; i < offset; i += 1) {
    const empty = document.createElement("div");
    empty.className = "calendar-day-empty";
    grid.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const key = dateToKey(date);
    const weekDay = date.getDay();
    const button = document.createElement("button");
    button.type = "button";
    button.className = "calendar-day";
    button.textContent = String(day);

    if (weekDay === 0 || weekDay === 6) {
      button.classList.add("weekend");
    }

    if (isSpainNationalHolidayDateKey(key)) {
      button.classList.add("holiday");
    }

    if ((calendarExcusesByDate[key] || []).length > 0) {
      button.classList.add("has-excuse");
    }

    if (key === selectedCalendarDateKey) {
      button.classList.add("selected");
    }

    button.addEventListener("click", () => {
      selectedCalendarDateKey = key;
      renderCalendar();
      renderCalendarDayDetail();
    });

    grid.appendChild(button);
  }
}

function shiftCalendarMonth(diff) {
  calendarMonthDate = new Date(calendarMonthDate.getFullYear(), calendarMonthDate.getMonth() + diff, 1);
  renderCalendar();
}

function renderSimpleList(listId, items) {
  const target = document.getElementById(listId);
  if (!target) return;

  target.innerHTML = "";

  if (items.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "Sin registros todavía.";
    target.appendChild(empty);
    return;
  }

  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    target.appendChild(li);
  });
}

function renderExcuse() {
  const excuseElement = document.getElementById("excuse");

  if (!excuseElement || !excuseEnabled) return;

  const excuse = buildHiddenExcuse();
  typewriteExcuse(excuseElement, excuse);
}

function typewriteExcuse(element, text) {
  if (typewriterTimerId) {
    clearInterval(typewriterTimerId);
    typewriterTimerId = null;
  }

  element.textContent = "";
  element.classList.add("typing");

  let index = 0;
  typewriterTimerId = setInterval(() => {
    index += 1;
    element.textContent = text.slice(0, index);

    if (index >= text.length) {
      clearInterval(typewriterTimerId);
      typewriterTimerId = null;
      element.classList.remove("typing");
    }
  }, 22);
}

function setPlainExcuseText(text) {
  const excuseElement = document.getElementById("excuse");
  if (!excuseElement) return;

  if (typewriterTimerId) {
    clearInterval(typewriterTimerId);
    typewriterTimerId = null;
  }

  excuseElement.classList.remove("typing");
  excuseElement.textContent = text;
}

function evaluateRange(totalMinutes) {
  if (totalMinutes >= START_WORK_MIN && totalMinutes <= NO_EXCUSE_END_MIN) {
    return "on-time";
  }

  if (totalMinutes >= START_WORK_MIN + 31 && totalMinutes <= EXCUSE_END_MIN) {
    return "late";
  }

  return "off-hours";
}

function updateExcuseControls() {
  const checkBtn = document.getElementById("check-btn");
  const registerBtn = document.getElementById("register-btn");
  const nameInput = document.getElementById("employee-name");
  const idInput = document.getElementById("employee-id");
  const dateInput = document.getElementById("checkin-date");
  const timeInput = document.getElementById("checkin-time");

  const disableRegister = isProcessing || currentStatus !== "late";

  if (checkBtn) checkBtn.disabled = isProcessing;
  if (registerBtn) registerBtn.disabled = disableRegister;
  if (nameInput) nameInput.disabled = isProcessing;
  if (idInput) idInput.disabled = isProcessing;
  if (dateInput) dateInput.disabled = isProcessing;
  if (timeInput) timeInput.disabled = isProcessing;
}

function setProcessingState(processing) {
  const indicator = document.getElementById("processing-indicator");
  isProcessing = processing;

  if (indicator) {
    indicator.classList.toggle("hidden", !processing);
  }

  updateExcuseControls();
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function evaluateCheckinTime() {
  if (isProcessing) return;

  const nameInput = document.getElementById("employee-name");
  const idInput = document.getElementById("employee-id");
  const timeInput = document.getElementById("checkin-time");
  const excuseElement = document.getElementById("excuse");
  const helper = document.getElementById("helper");

  const name = nameInput?.value.trim() || "";
  const employeeId = idInput?.value.trim() || "";
  const timeValue = timeInput?.value || "";

  if (!name || !employeeId || !timeValue) {
    currentStatus = "invalid";
    excuseEnabled = false;
    updateExcuseControls();
    setPlainExcuseText("Completa nombre, ID y hora para evaluar tu ingreso.");
    updateStatus("Debes completar nombre, ID de empresa y hora de ingreso.", "status-alert");
    return;
  }

  setProcessingState(true);
  setPlainExcuseText("Procesando solicitud...");
  updateStatus("Estamos validando tu registro. Espera 3 segundos...", "status-warning");

  await sleep(PROCESSING_DELAY_MS);

  const totalMinutes = toMinutes(timeValue);

  if (totalMinutes === null) {
    currentStatus = "invalid";
    excuseEnabled = false;
    updateExcuseControls();
    setPlainExcuseText("Ingresa una hora valida para continuar.");
    updateStatus("Debes ingresar una hora valida en formato HH:MM.", "status-alert");
    setProcessingState(false);
    return;
  }

  currentStatus = evaluateRange(totalMinutes);

  if (currentStatus === "on-time") {
    excuseEnabled = false;
    updateExcuseControls();
    setPlainExcuseText("Llegaste en horario permitido (09:00 a 09:30). No necesitas dar explicaciones.");
    if (helper) helper.textContent = "Puedes registrar la solicitud sin excusa.";
    updateStatus("Ingreso correcto: no hace falta generar excusa.", "status-ok");
    setProcessingState(false);
    return;
  }

  if (currentStatus === "late") {
    excuseEnabled = true;
    updateExcuseControls();
    if (helper) helper.textContent = "Llegaste tarde: genera una excusa para registrar la solicitud.";
    updateStatus("Ingreso con demora: debes presentar una explicacion.", "status-warning");
    renderExcuse();
    setProcessingState(false);
    return;
  }

  excuseEnabled = false;
  updateExcuseControls();
  setPlainExcuseText("Estas fuera de horario laboral. No corresponde registrar ingreso en este momento.");
  if (helper) helper.textContent = "Horario laboral valido: 09:00 a 18:00.";
  updateStatus("Por que estas en la oficina si estas fuera de tu horario laboral?", "status-alert");
  setProcessingState(false);
}

function createRequestSummary(record) {
  const excuseText = record.excuse ? ` | Excusa: ${record.excuse}` : "";
  return `${record.name} (${record.employeeId}) - ${record.timeLabel} - ${record.statusLabel}${excuseText}`;
}

function moveRequest(record, approvedByButton) {
  const inOrder = record.status === "on-time" || (record.status === "late" && approvedByButton && record.excuseQuality === "creible");

  if (inOrder) {
    approvedRequests.unshift(createRequestSummary(record));
    renderSimpleList("approved-list", approvedRequests);
    return;
  }

  faultRequests.unshift(createRequestSummary(record));
  renderSimpleList("fault-list", faultRequests);
}

function renderPendingRequests() {
  const list = document.getElementById("history-list");
  const pageLabel = document.getElementById("pending-page-label");
  const prevBtn = document.getElementById("prev-pending-btn");
  const nextBtn = document.getElementById("next-pending-btn");
  if (!list) return;

  list.innerHTML = "";

  if (pendingRequests.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "No hay solicitudes pendientes.";
    list.appendChild(empty);
    if (pageLabel) pageLabel.textContent = "Pagina 0";
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;
    return;
  }

  const totalPages = Math.ceil(pendingRequests.length / PENDING_PAGE_SIZE);
  pendingPage = Math.max(0, Math.min(pendingPage, totalPages - 1));

  const start = pendingPage * PENDING_PAGE_SIZE;
  const end = start + PENDING_PAGE_SIZE;
  const visibleRequests = pendingRequests.slice(start, end);

  visibleRequests.forEach((record, pageIndex) => {
    const realIndex = start + pageIndex;
    const li = document.createElement("li");
    li.className = "request-card";

    const title = document.createElement("strong");
    title.textContent = `${record.name} (${record.employeeId})`;

    const meta = document.createElement("p");
    meta.className = "request-meta";
    meta.textContent = `Ingreso: ${record.timeLabel} | Estado: ${record.statusLabel}`;

    const details = document.createElement("p");
    details.className = "request-meta";
    details.textContent = record.excuse ? `Excusa: ${record.excuse}` : "Sin excusa requerida.";

    const actions = document.createElement("div");
    actions.className = "request-actions";

    const approveBtn = document.createElement("button");
    approveBtn.type = "button";
    approveBtn.className = "btn-approve";
    approveBtn.textContent = "✓ Aceptar";
    approveBtn.addEventListener("click", () => resolveRequest(realIndex, true));

    const rejectBtn = document.createElement("button");
    rejectBtn.type = "button";
    rejectBtn.className = "btn-reject";
    rejectBtn.textContent = "✕ Cancelar";
    rejectBtn.addEventListener("click", () => resolveRequest(realIndex, false));

    actions.appendChild(approveBtn);
    actions.appendChild(rejectBtn);
    li.appendChild(title);
    li.appendChild(meta);
    li.appendChild(details);
    li.appendChild(actions);
    list.appendChild(li);
  });

  if (pageLabel) pageLabel.textContent = `Pagina ${pendingPage + 1} de ${totalPages}`;
  if (prevBtn) prevBtn.disabled = pendingPage === 0;
  if (nextBtn) nextBtn.disabled = pendingPage >= totalPages - 1;
}

function shiftPendingPage(diff) {
  pendingPage += diff;
  renderPendingRequests();
}

function resolveRequest(index, approvedByButton) {
  const record = pendingRequests[index];
  if (!record) return;

  pendingRequests.splice(index, 1);
  moveRequest(record, approvedByButton);
  renderPendingRequests();

  if (!approvedByButton) {
    openBossCallModal();
  }
}

function clearBossCallTimers() {
  if (bossMuteTimerId) {
    clearTimeout(bossMuteTimerId);
    bossMuteTimerId = null;
  }

  if (bossAutoCloseTimerId) {
    clearTimeout(bossAutoCloseTimerId);
    bossAutoCloseTimerId = null;
  }

  if (bossDeniedTimerId) {
    clearTimeout(bossDeniedTimerId);
    bossDeniedTimerId = null;
  }

  if (platformAutoCloseTimerId) {
    clearTimeout(platformAutoCloseTimerId);
    platformAutoCloseTimerId = null;
  }
}

function setCallButtonsEnabled(enabled) {
  const hangupBtn = document.getElementById("boss-hangup-btn");
  const attendBtn = document.getElementById("boss-attend-btn");
  const muteBtn = document.getElementById("boss-mute-btn");

  if (hangupBtn) hangupBtn.disabled = !enabled;
  if (attendBtn) attendBtn.disabled = !enabled;
  if (muteBtn) muteBtn.disabled = !enabled;
}

function updateBossCallMessage(message) {
  const callMessage = document.getElementById("boss-call-message");
  if (!callMessage) return;

  callMessage.classList.remove("call-result", "call-fired", "call-warning");
  callMessage.textContent = message;
}

function updateBossCallResult(message, fired) {
  const callMessage = document.getElementById("boss-call-message");
  if (!callMessage) return;

  callMessage.classList.add("call-result");
  callMessage.classList.toggle("call-fired", fired);
  callMessage.classList.toggle("call-warning", !fired);
  callMessage.textContent = message;
}

function closeBossCallModal() {
  const modal = document.getElementById("boss-call-modal");
  if (!modal) return;

  clearBossCallTimers();
  modal.classList.add("hidden");
}

function finishBossCall(resultMessage, fired) {
  clearBossCallTimers();
  setCallButtonsEnabled(false);
  updateBossCallResult(resultMessage, fired);

  if (fired) {
    updateStatus("ESTAS DESPEDIDO!", "status-alert");
  } else {
    updateStatus("Porfavor llega a la hora", "status-warning");
  }

  bossAutoCloseTimerId = setTimeout(() => {
    closeBossCallModal();
  }, 2200);
}

function renderAccessDeniedPanel() {
  let overlay = document.getElementById("platform-block-overlay");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "platform-block-overlay";
    overlay.className = "platform-block-overlay";

    const card = document.createElement("div");
    card.className = "platform-block-card";

    const title = document.createElement("h2");
    title.textContent = "No tienes acceso a la plataforma";

    const text = document.createElement("p");
    text.id = "platform-block-text";
    text.textContent = "Tu sesion fue bloqueada por incumplimiento de normas.";

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "platform-close-btn";
    closeBtn.textContent = "Cerrar pestana";
    closeBtn.addEventListener("click", attemptClosePlatformTab);

    card.appendChild(title);
    card.appendChild(text);
    card.appendChild(closeBtn);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
  }

  overlay.classList.remove("hidden");

  if (platformAutoCloseTimerId) {
    clearTimeout(platformAutoCloseTimerId);
  }

  platformAutoCloseTimerId = setTimeout(() => {
    attemptClosePlatformTab();
  }, 5000);
}

function attemptClosePlatformTab() {
  const infoText = document.getElementById("platform-block-text");
  if (infoText) {
    infoText.textContent = "Intentando cerrar la pestana...";
  }

  try {
    window.open("", "_self");
    window.close();
  } catch {
    // Ignorado: se muestra mensaje de fallback.
  }

  setTimeout(() => {
    const fallbackText = document.getElementById("platform-block-text");
    if (fallbackText) {
      fallbackText.textContent = "Si no se cerro automaticamente, cierrala manualmente desde el navegador.";
    }
  }, 1200);
}

function denyPlatformAccess() {
  clearBossCallTimers();
  setCallButtonsEnabled(false);
  updateBossCallResult("ESTAS DESPEDIDO!", true);
  updateStatus("ESTAS DESPEDIDO!", "status-alert");

  bossDeniedTimerId = setTimeout(() => {
    renderAccessDeniedPanel();
    updateStatus("No tienes acceso a la plataforma", "status-alert");
  }, 5000);
}

function handleBossMute() {
  if (bossMuteTimerId) return;

  updateBossCallMessage("Llamada en mute... si pasan 5 segundos, estas despedido.");
  bossMuteTimerId = setTimeout(() => {
    denyPlatformAccess();
  }, 5000);
}

function openBossCallModal() {
  const modal = document.getElementById("boss-call-modal");
  if (!modal) return;

  clearBossCallTimers();
  setCallButtonsEnabled(true);
  updateBossCallMessage("Tu jefe te esta llamando por la solicitud cancelada.");
  modal.classList.remove("hidden");
}

async function registerRequest() {
  if (isProcessing) return;

  if (currentStatus !== "late") {
    updateStatus("Solo se puede registrar solicitud cuando el ingreso requiere excusa (09:31 a 18:00).", "status-alert");
    return;
  }

  const nameInput = document.getElementById("employee-name");
  const idInput = document.getElementById("employee-id");
  const dateInput = document.getElementById("checkin-date");
  const timeInput = document.getElementById("checkin-time");
  const excuseElement = document.getElementById("excuse");
  const totalElement = document.getElementById("total-generated");

  const name = nameInput?.value.trim() || "";
  const employeeId = idInput?.value.trim() || "";
  const dateLabel = dateInput?.value || todayDateKey();
  const timeLabel = timeInput?.value || "";

  if (!name || !employeeId) {
    updateStatus("Debes completar nombre e ID de empresa antes de registrar.", "status-alert");
    return;
  }

  if (!timeLabel) {
    updateStatus("Debes indicar la hora de ingreso antes de registrar.", "status-alert");
    return;
  }

  if (currentStatus === "unknown" || currentStatus === "invalid") {
    await evaluateCheckinTime();
  }

  if (currentStatus === "invalid" || currentStatus === "unknown") {
    return;
  }

  const excuseText = excuseEnabled ? excuseElement?.textContent || "" : "";
  const excuseQuality = excuseEnabled ? (Math.random() < 0.5 ? "creible" : "mala") : "n/a";

  const statusLabelMap = {
    "on-time": "Dentro de horario",
    late: "Llega tarde",
    "off-hours": "Fuera de horario",
  };

  const record = {
    name,
    employeeId,
    timeLabel,
    status: currentStatus,
    statusLabel: statusLabelMap[currentStatus],
    excuse: excuseText,
    excuseQuality,
  };

  pendingRequests.unshift(record);
  renderPendingRequests();

  if (excuseText) {
    addExcuseToCalendar(dateLabel, `${timeLabel} - ${name} (${employeeId}): ${excuseText}`);
    selectedCalendarDateKey = dateLabel;
    renderCalendar();
    renderCalendarDayDetail();
  }

  totalRegistered += 1;
  if (totalElement) totalElement.textContent = String(totalRegistered);

  updateStatus("Solicitud registrada. Usa ✓ o ✕ para resolverla.", "status-ok");
}

function toMinutes(timeValue) {
  const [hoursText, minutesText] = timeValue.split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
}

function updateStatus(message, type) {
  const statusMessage = document.getElementById("status-message");
  if (!statusMessage) return;

  statusMessage.textContent = message;
  statusMessage.classList.remove("status-ok", "status-warning", "status-alert");
  statusMessage.classList.add(type);
}

window.addEventListener("DOMContentLoaded", () => {
  const checkBtn = document.getElementById("check-btn");
  const registerBtn = document.getElementById("register-btn");
  const dateInput = document.getElementById("checkin-date");
  const timeInput = document.getElementById("checkin-time");
  const prevMonthBtn = document.getElementById("prev-month-btn");
  const nextMonthBtn = document.getElementById("next-month-btn");
  const excuseElement = document.getElementById("excuse");
  const bossCloseBtn = document.getElementById("boss-close-btn");
  const bossHangupBtn = document.getElementById("boss-hangup-btn");
  const bossAttendBtn = document.getElementById("boss-attend-btn");
  const bossMuteBtn = document.getElementById("boss-mute-btn");
  const prevPendingBtn = document.getElementById("prev-pending-btn");
  const nextPendingBtn = document.getElementById("next-pending-btn");
  const prevDismissalsBtn = document.getElementById("prev-dismissals-btn");
  const nextDismissalsBtn = document.getElementById("next-dismissals-btn");

  if (dateInput) {
    dateInput.value = todayDateKey();
  }

  selectedCalendarDateKey = dateInput?.value || todayDateKey();
  calendarMonthDate = new Date(selectedCalendarDateKey);

  seedCalendarWithDemoDataIfNeeded();

  updateExcuseControls();

  if (excuseElement) {
    setPlainExcuseText("Aun no hay excusa. Primero evalua tu hora de ingreso.");
  }

  renderPendingRequests();
  renderSimpleList("approved-list", approvedRequests);
  renderSimpleList("fault-list", faultRequests);
  renderCalendar();
  renderCalendarDayDetail();
  dismissalsRecords.length = 0;
  dismissalsRecords.push(...buildDismissalsData(55));
  dismissalsPage = 0;
  updateDismissalsPageSize();
  renderDismissalsPage();

  checkBtn?.addEventListener("click", evaluateCheckinTime);
  timeInput?.addEventListener("change", () => {
    currentStatus = "unknown";
    updateExcuseControls();
  });

  dateInput?.addEventListener("change", () => {
    if (!dateInput.value) return;
    selectedCalendarDateKey = dateInput.value;
    calendarMonthDate = new Date(dateInput.value);
    renderCalendar();
    renderCalendarDayDetail();
  });

  prevMonthBtn?.addEventListener("click", () => shiftCalendarMonth(-1));
  nextMonthBtn?.addEventListener("click", () => shiftCalendarMonth(1));

  registerBtn?.addEventListener("click", registerRequest);

  bossCloseBtn?.addEventListener("click", closeBossCallModal);

  bossHangupBtn?.addEventListener("click", () => {
    denyPlatformAccess();
  });

  bossAttendBtn?.addEventListener("click", () => {
    finishBossCall("Porfavor llega a la hora", false);
  });

  bossMuteBtn?.addEventListener("click", handleBossMute);
  prevPendingBtn?.addEventListener("click", () => shiftPendingPage(-1));
  nextPendingBtn?.addEventListener("click", () => shiftPendingPage(1));
  prevDismissalsBtn?.addEventListener("click", () => shiftDismissalsPage(-1));
  nextDismissalsBtn?.addEventListener("click", () => shiftDismissalsPage(1));

  window.addEventListener("resize", () => {
    updateDismissalsPageSize();
    renderDismissalsPage();
  });
});

function openCalendarModal() {
  const modal = document.getElementById("calendar-modal");
  const recordsList = document.getElementById("all-calendar-records");

  // Clear existing records
  recordsList.innerHTML = "";

  // Load all records into the modal
  Object.keys(calendarExcusesByDate).forEach((dateKey) => {
    const records = calendarExcusesByDate[dateKey] || [];
    const dateItem = document.createElement("li");
    dateItem.textContent = `${dateKey}:`;

    const recordList = document.createElement("ul");
    records.forEach((record) => {
      const recordItem = document.createElement("li");
      recordItem.textContent = record;
      recordList.appendChild(recordItem);
    });

    dateItem.appendChild(recordList);
    recordsList.appendChild(dateItem);
  });

  modal.classList.add("active");
}

function closeCalendarModal() {
  const modal = document.getElementById("calendar-modal");
  modal.classList.remove("active");
}

function buildDismissalsData(totalRecords = 55) {
  const employees = buildEmployeePool();
  const seenIds = new Set();
  const generated = [];

  while (generated.length < totalRecords) {
    const employee = employees[Math.floor(Math.random() * employees.length)];
    if (seenIds.has(employee.employeeId)) continue;
    seenIds.add(employee.employeeId);

    const faults = randomInt(5, 10);
    generated.push(`${employee.name} (${employee.employeeId}) - ${faults} faltas este mes. Despido precedente.`);
  }

  return generated;
}

function calculateDismissalsPageSize() {
  const panel = document.querySelector(".dismissals-panel");
  const top = panel?.querySelector(".dismissals-top");
  const dismissalsList = document.getElementById("dismissals-list");

  if (!panel || !dismissalsList) return 5;

  const panelStyles = window.getComputedStyle(panel);
  const topStyles = top ? window.getComputedStyle(top) : null;
  const listStyles = window.getComputedStyle(dismissalsList);

  const panelPaddingTop = parseFloat(panelStyles.paddingTop) || 0;
  const panelPaddingBottom = parseFloat(panelStyles.paddingBottom) || 0;
  const topMarginBottom = topStyles ? parseFloat(topStyles.marginBottom) || 0 : 0;
  const headerHeight = (top?.offsetHeight || 0) + topMarginBottom;
  const gap = parseFloat(listStyles.rowGap || listStyles.gap) || 0;

  const sample = document.createElement("li");
  sample.textContent = dismissalsRecords[0] || "Registro de despido de prueba.";
  sample.style.visibility = "hidden";
  sample.style.position = "absolute";
  sample.style.pointerEvents = "none";
  sample.style.width = `${dismissalsList.clientWidth}px`;
  dismissalsList.appendChild(sample);
  const itemHeight = sample.offsetHeight || 48;
  sample.remove();

  const availableHeight = panel.clientHeight - panelPaddingTop - panelPaddingBottom - headerHeight;
  const fittedItems = Math.floor((availableHeight + gap) / (itemHeight + gap));

  return Math.max(1, fittedItems);
}

function updateDismissalsPageSize() {
  dismissalsPageSize = calculateDismissalsPageSize();
}

function renderDismissalsPage() {
  const dismissalsList = document.getElementById("dismissals-list");
  const pageLabel = document.getElementById("dismissals-page-label");
  const prevBtn = document.getElementById("prev-dismissals-btn");
  const nextBtn = document.getElementById("next-dismissals-btn");
  if (!dismissalsList) return;

  dismissalsList.innerHTML = "";

  if (dismissalsRecords.length === 0) {
    const listItem = document.createElement("li");
    listItem.textContent = "Sin registros todavía.";
    dismissalsList.appendChild(listItem);
    if (pageLabel) pageLabel.textContent = "Pagina 0";
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;
    return;
  }

  const totalPages = Math.ceil(dismissalsRecords.length / dismissalsPageSize);
  dismissalsPage = Math.max(0, Math.min(dismissalsPage, totalPages - 1));

  const start = dismissalsPage * dismissalsPageSize;
  const end = start + dismissalsPageSize;
  const pageItems = dismissalsRecords.slice(start, end);

  pageItems.forEach((text) => {
    const listItem = document.createElement("li");
    listItem.textContent = text;
    dismissalsList.appendChild(listItem);
  });

  if (pageLabel) pageLabel.textContent = `Pagina ${dismissalsPage + 1} de ${totalPages}`;
  if (prevBtn) prevBtn.disabled = dismissalsPage === 0;
  if (nextBtn) nextBtn.disabled = dismissalsPage >= totalPages - 1;
}

function shiftDismissalsPage(diff) {
  dismissalsPage += diff;
  renderDismissalsPage();
}

function limitVisibleRecords(panelId, limit) {
  const panel = document.getElementById(panelId);
  const items = panel.querySelectorAll("li");

  items.forEach((item, index) => {
    if (index >= limit) {
      item.style.display = "none";
    }
  });
}

// Limita los registros visibles en el calendario y despidos
limitVisibleRecords("calendar-day-list", 5);
