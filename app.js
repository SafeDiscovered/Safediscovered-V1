const tabs = document.querySelectorAll('.tab');
const forms = document.querySelectorAll('.form');
const authPanel = document.getElementById('auth-panel');
const dashboardPanel = document.getElementById('dashboard-panel');
const authStatus = document.getElementById('auth-status');
const logList = document.getElementById('log-list');
const runScanButton = document.getElementById('run-scan');
const progressBar = document.getElementById('scan-progress');

const USERS_KEY = 'safediscover_users';
const SESSION_KEY = 'safediscover_session';

const systemState = {
  threats: 0,
  health: 98,
};

const hash = (text) => btoa(unescape(encodeURIComponent(text)));

const getUsers = () => JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
const setUsers = (users) => localStorage.setItem(USERS_KEY, JSON.stringify(users));

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

const showDashboard = (email) => {
  authPanel.classList.remove('active');
  dashboardPanel.classList.add('active');
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

    if (progress > 34 && progress < 40) {
      pushLog('Suspicious script bundle isolated and sent for sandbox detonation.');
    }

    if (progress >= 100) {
      clearInterval(timer);
      const foundThreats = Math.floor(Math.random() * 3);
      systemState.threats += foundThreats;
      systemState.health = Math.max(91, systemState.health - foundThreats);
      setDashboardValues();
      pushLog(
        foundThreats
          ? `${foundThreats} threat(s) quarantined. Remediation policy applied.`
          : 'Scan complete. No active threats found.'
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
