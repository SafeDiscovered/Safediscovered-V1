const tabs = document.querySelectorAll('.tab');
const forms = document.querySelectorAll('.form');
const authPanel = document.getElementById('auth-panel');
const dashboardPanel = document.getElementById('dashboard-panel');
const authStatus = document.getElementById('auth-status');
const logList = document.getElementById('log-list');
const runScanButton = document.getElementById('run-scan');
const progressBar = document.getElementById('scan-progress');
const protectionGrid = document.getElementById('protection-grid');
const controlGrid = document.getElementById('control-grid');
const restoreControlButton = document.getElementById('restore-control');

const USERS_KEY = 'safediscover_users';
const SESSION_KEY = 'safediscover_session';
const PROTECTIONS_KEY = 'safediscover_protections';
const CONTROLS_KEY = 'safediscover_controls';

const protectionCatalog = [
  {
    id: 'realtime',
    title: 'Real-time Process Shield',
    detail: 'Intercepts process injection and memory tampering in under 40ms.',
    state: 'active',
  },
  {
    id: 'ransomware',
    title: 'Ransomware Rollback Guard',
    detail: 'Monitors protected folders and snapshots encrypted write attempts.',
    state: 'active',
  },
  {
    id: 'web',
    title: 'Web Phishing Defense',
    detail: 'Blocks malicious domains using cloud reputation + TLS fingerprinting.',
    state: 'active',
  },
  {
    id: 'firewall',
    title: 'Adaptive Firewall Defense',
    detail: 'Learns normal traffic and auto-isolates suspicious outbound beacons.',
    state: 'monitoring',
  },
  {
    id: 'usb',
    title: 'USB Device Lockdown',
    detail: 'Applies allow-list controls and scans removable media before mount.',
    state: 'active',
  },
  {
    id: 'zero-day',
    title: 'Zero-day Behavior AI',
    detail: 'Detects novel malware from syscall patterns and entropy anomalies.',
    state: 'monitoring',
  },
];

const antiControlCatalog = [
  {
    id: 'anti-blackout',
    title: 'Anti-Blackout Continuity Shield',
    detail: 'Protects UI and service availability by auto-restoring display/control channels.',
    state: 'active',
  },
  {
    id: 'anti-remote',
    title: 'Anti-Control Access Lock',
    detail: 'Blocks unauthorized remote control sessions and unknown admin handshakes.',
    state: 'active',
  },
  {
    id: 'anti-privilege',
    title: 'Privilege Takeover Guard',
    detail: 'Prevents elevation abuse and unauthorized policy ownership changes.',
    state: 'monitoring',
  },
  {
    id: 'anti-disable',
    title: 'Service Disable Protection',
    detail: 'Stops attempts to disable AV services, scans, and tamper settings.',
    state: 'active',
  },
  {
    id: 'anti-lockout',
    title: 'Admin Lockout Recovery',
    detail: 'Recovers secure admin access if hostile actions lock legitimate operators out.',
    state: 'monitoring',
  },
  {
    id: 'anti-policy-hijack',
    title: 'Policy Hijack Firewall',
    detail: 'Rejects untrusted config pushes and restores signed golden policy baseline.',
    state: 'active',
  },
];

const systemState = {
  threats: 0,
  health: 98,
  control: 99,
  protections: loadRecords(PROTECTIONS_KEY, protectionCatalog),
  controls: loadRecords(CONTROLS_KEY, antiControlCatalog),
};

const hash = (text) => btoa(unescape(encodeURIComponent(text)));

function loadRecords(storageKey, defaults) {
  const persisted = localStorage.getItem(storageKey);
  if (!persisted) {
    return defaults;
  }

  const safe = JSON.parse(persisted);
  return defaults.map((item) => safe.find((entry) => entry.id === item.id) || item);
}

const getUsers = () => JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
const setUsers = (users) => localStorage.setItem(USERS_KEY, JSON.stringify(users));

const saveState = () => {
  localStorage.setItem(PROTECTIONS_KEY, JSON.stringify(systemState.protections));
  localStorage.setItem(CONTROLS_KEY, JSON.stringify(systemState.controls));
};

const setStatus = (message, ok = false) => {
  authStatus.textContent = message;
  authStatus.style.color = ok ? '#78f0c4' : '#ffc268';
};

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((item) => item.classList.remove('active'));
    forms.forEach((form) => form.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`${tab.dataset.form}-form`).classList.add('active');
    setStatus('');
  });
});

const pushLog = (message) => {
  const item = document.createElement('li');
  item.textContent = `${new Date().toLocaleTimeString()} — ${message}`;
  logList.prepend(item);
};

const setDashboardValues = () => {
  document.getElementById('threat-count').textContent = systemState.threats;
  document.getElementById('health-score').textContent = `${systemState.health}%`;
  document.getElementById('control-score').textContent = `${systemState.control}%`;
};

const renderCards = (container, records, actionLabel, actionAttr) => {
  container.innerHTML = '';
  records.forEach((item) => {
    const node = document.createElement('article');
    node.className = 'protection-item';
    node.innerHTML = `
      <div class="protection-meta">
        <div>
          <h4>${item.title}</h4>
          <p class="muted">${item.detail}</p>
        </div>
        <span class="badge ${item.state}">${item.state.toUpperCase()}</span>
      </div>
      <button class="mini" ${actionAttr}="${item.id}">${actionLabel}</button>
    `;
    container.append(node);
  });
};

const renderPanels = () => {
  renderCards(protectionGrid, systemState.protections, 'Harden', 'data-protection-id');
  renderCards(controlGrid, systemState.controls, 'Fortify', 'data-control-id');
};

protectionGrid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-protection-id]');
  if (!button) {
    return;
  }

  const found = systemState.protections.find((item) => item.id === button.dataset.protectionId);
  if (!found) {
    return;
  }

  found.state = 'active';
  systemState.health = Math.min(100, systemState.health + 1);
  saveState();
  setDashboardValues();
  renderPanels();
  pushLog(`${found.title} policy hardened and moved to active enforcement.`);
});

controlGrid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-control-id]');
  if (!button) {
    return;
  }

  const found = systemState.controls.find((item) => item.id === button.dataset.controlId);
  if (!found) {
    return;
  }

  found.state = 'active';
  systemState.control = Math.min(100, systemState.control + 2);
  systemState.health = Math.min(100, systemState.health + 1);
  saveState();
  setDashboardValues();
  renderPanels();
  pushLog(`${found.title} fortified. Anti-control resilience now actively enforced.`);
});

restoreControlButton.addEventListener('click', () => {
  systemState.controls = antiControlCatalog.map((item) => ({ ...item, state: 'active' }));
  systemState.control = 100;
  systemState.health = Math.min(100, systemState.health + 2);
  saveState();
  setDashboardValues();
  renderPanels();
  pushLog('Control plane restoration complete. Anti-blackout and anti-access controls are locked.');
});

const showDashboard = (email) => {
  authPanel.classList.remove('active');
  dashboardPanel.classList.add('active');
  renderPanels();
  pushLog(`Operator ${email} authenticated with hardened profile.`);
  pushLog('Real-time shield initialized and cloud reputation stream connected.');
};

const showAuth = () => {
  dashboardPanel.classList.remove('active');
  authPanel.classList.add('active');
};

document.getElementById('signup-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const name = formData.get('name').trim();
  const email = formData.get('email').toLowerCase().trim();
  const password = formData.get('password');
  const confirm = formData.get('confirm');

  if (password !== confirm) {
    setStatus('Passwords do not match.');
    return;
  }

  const users = getUsers();
  if (users.find((user) => user.email === email)) {
    setStatus('Account already exists. Please log in.');
    return;
  }

  users.push({ name, email, passwordHash: hash(password) });
  setUsers(users);
  setStatus('Account created. You can now log in.', true);
  document.querySelector('[data-form="login"]').click();
});

document.getElementById('login-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const email = formData.get('email').toLowerCase().trim();
  const password = formData.get('password');

  const user = getUsers().find((entry) => entry.email === email);
  if (!user || user.passwordHash !== hash(password)) {
    setStatus('Invalid credentials or policy mismatch.');
    return;
  }

  localStorage.setItem(SESSION_KEY, email);
  showDashboard(email);
  setDashboardValues();
});

runScanButton.addEventListener('click', () => {
  runScanButton.disabled = true;
  pushLog('Deep scan started: static, heuristic, behavior, and anti-control phases queued.');
  let progress = 0;

  const timer = setInterval(() => {
    progress += Math.floor(Math.random() * 14) + 8;
    progressBar.style.width = `${Math.min(progress, 100)}%`;

    if (progress > 24 && progress < 34) {
      pushLog('Anti-blackout continuity shield verified display/control channel persistence.');
    }

    if (progress > 38 && progress < 46) {
      pushLog('Anti-control access lock rejected unauthorized remote operator token.');
    }

    if (progress > 54 && progress < 62) {
      pushLog('Privilege takeover guard blocked unsigned elevation chain.');
    }

    if (progress > 72 && progress < 80) {
      pushLog('Policy hijack firewall restored signed baseline after tamper attempt.');
    }

    if (progress >= 100) {
      clearInterval(timer);
      const foundThreats = Math.floor(Math.random() * 4);
      const controlPressure = Math.floor(Math.random() * 3);
      systemState.threats += foundThreats;
      systemState.health = Math.max(89, systemState.health - foundThreats);
      systemState.control = Math.max(92, systemState.control - controlPressure);
      setDashboardValues();
      pushLog(
        foundThreats
          ? `${foundThreats} threat(s) quarantined. Control-plane takeover vectors neutralized.`
          : 'Scan complete. No active threats found. Anti-control envelope stable.'
      );
      runScanButton.disabled = false;
      setTimeout(() => {
        progressBar.style.width = '0';
      }, 1200);
    }
  }, 250);
});

document.getElementById('clear-logs').addEventListener('click', () => {
  logList.innerHTML = '';
});

document.getElementById('sign-out').addEventListener('click', () => {
  localStorage.removeItem(SESSION_KEY);
  showAuth();
  setStatus('Signed out successfully.', true);
});

const existingSession = localStorage.getItem(SESSION_KEY);
if (existingSession) {
  showDashboard(existingSession);
  setDashboardValues();
}
