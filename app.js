const tabs = document.querySelectorAll('.tab');
const forms = document.querySelectorAll('.form');
const authPanel = document.getElementById('auth-panel');
const dashboardPanel = document.getElementById('dashboard-panel');
const authStatus = document.getElementById('auth-status');
const logList = document.getElementById('log-list');
const runScanButton = document.getElementById('run-scan');
const progressBar = document.getElementById('scan-progress');
const protectionGrid = document.getElementById('protection-grid');

const USERS_KEY = 'safediscover_users';
const SESSION_KEY = 'safediscover_session';
const PROTECTIONS_KEY = 'safediscover_protections';

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

const systemState = {
  threats: 0,
  health: 98,
  protections: loadProtections(),
};

const hash = (text) => btoa(unescape(encodeURIComponent(text)));

function loadProtections() {
  const persisted = localStorage.getItem(PROTECTIONS_KEY);
  if (!persisted) {
    return protectionCatalog;
  }
  const safe = JSON.parse(persisted);
  return protectionCatalog.map((item) => safe.find((entry) => entry.id === item.id) || item);
}

const getUsers = () => JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
const setUsers = (users) => localStorage.setItem(USERS_KEY, JSON.stringify(users));
const saveProtections = () =>
  localStorage.setItem(PROTECTIONS_KEY, JSON.stringify(systemState.protections));

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
  document.getElementById('last-scan').textContent = new Date().toLocaleTimeString();
};

const renderProtections = () => {
  protectionGrid.innerHTML = '';
  systemState.protections.forEach((item) => {
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
      <button class="mini" data-protection-id="${item.id}">Harden</button>
    `;
    protectionGrid.append(node);
  });
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
  saveProtections();
  setDashboardValues();
  renderProtections();
  pushLog(`${found.title} policy hardened and moved to active enforcement.`);
});

const showDashboard = (email) => {
  authPanel.classList.remove('active');
  dashboardPanel.classList.add('active');
  renderProtections();
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
  pushLog('Deep scan started: static, heuristic, and behavior phases queued.');
  let progress = 0;

  const timer = setInterval(() => {
    progress += Math.floor(Math.random() * 14) + 8;
    progressBar.style.width = `${Math.min(progress, 100)}%`;

    if (progress > 28 && progress < 36) {
      pushLog('Ransomware rollback guard engaged for rapid file shadowing.');
    }

    if (progress > 40 && progress < 46) {
      pushLog('Kernel integrity policy blocked unsigned driver chain.');
    }

    if (progress > 65 && progress < 72) {
      pushLog('Zero-day behavior AI flagged entropy spike in script host.');
    }

    if (progress >= 100) {
      clearInterval(timer);
      const foundThreats = Math.floor(Math.random() * 4);
      systemState.threats += foundThreats;
      systemState.health = Math.max(90, systemState.health - foundThreats);
      setDashboardValues();
      pushLog(
        foundThreats
          ? `${foundThreats} threat(s) quarantined. Memory artifacts isolated and IOC report generated.`
          : 'Scan complete. No active threats found. Signature graph synchronized.'
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
