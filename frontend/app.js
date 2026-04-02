// ===== FIREBASE CONFIG =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs, setDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-firestore.js";

import { runInsuranceCycle } from '../services/insuranceEngine.js';
import { getWeatherData } from '../services/weatherService.js';
import { calculatePremium } from '../utils/pricingEngine.js';
import { getEnvironmentalFactor } from '../utils/riskEngine.js';
import { calculatePayout } from '../utils/payoutEngine.js';

const firebaseConfig = {
  apiKey: "AIzaSyDyKZKmuteyNBKRFlcjRv1MBlRUDc5TWls",
  authDomain: "devtrails-guidewire-hackathon.firebaseapp.com",
  projectId: "devtrails-guidewire-hackathon",
  storageBucket: "devtrails-guidewire-hackathon.firebasestorage.app",
  messagingSenderId: "43647169445",
  appId: "1:43647169445:web:96ff4b3a12eba9fcdfae4c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===== STATE & ELEMENTS =====
const state = { mode: 'login', currentUser: null };

const elements = {
  tabLogin: document.getElementById('tabLogin'),
  tabSignup: document.getElementById('tabSignup'),
  loginForm: document.getElementById('loginForm'),
  signupForm: document.getElementById('signupForm'),
  loginSubmit: document.getElementById('loginSubmit'),
  signupSubmit: document.getElementById('signupSubmit'),
  loginEmail: document.getElementById('loginEmail'),
  loginPassword: document.getElementById('loginPassword'),
  signupEmail: document.getElementById('signupEmail'),
  signupPassword: document.getElementById('signupPassword'),
  city: document.getElementById('city'),
  workType: document.getElementById('workType'),
  weeklyHours: document.getElementById('weeklyHours'),
  weeklyValue: document.getElementById('weeklyValue'),
  loginStatus: document.getElementById('loginStatus'),
  signupStatus: document.getElementById('signupStatus'),
  smallToggleSignup: document.getElementById('smallToggleSignup'),
  smallToggleLogin: document.getElementById('smallToggleLogin'),
  passwordStrength: document.getElementById('passwordStrength'),
  glassCard: document.getElementById('glassCard'),
};

// ===== AUTH STATE MANAGEMENT =====
let authCheckDone = false;

function checkAuthState() {
  if (authCheckDone) return; // Prevent multiple checks
  authCheckDone = true;

  const isAuthPage = !!document.getElementById('loginForm');
  const isDashboardPage = !!document.getElementById('overview');

  onAuthStateChanged(auth, (user) => {
    if (user) {
      state.currentUser = user;
      // If on auth page, redirect to dashboard
      if (isAuthPage && !authCheckDone) {
        window.location.href = 'dashboard.html';
      }
    } else {
      state.currentUser = null;
      // If on dashboard, redirect to auth
      if (isDashboardPage && !authCheckDone) {
        window.location.href = 'auth.html';
      }
    }
  });
}

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validatePassword(value) {
  return value.trim().length >= 8;
}

function evaluatePasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (password.length >= 12) score += 1;

  if (score <= 1) return { label: 'Weak', className: 'pw-weak' };
  if (score === 2) return { label: 'Medium', className: 'pw-medium' };
  return { label: 'Strong', className: 'pw-strong' };
}

function setTab(mode) {
  state.mode = mode;
  const logForm = elements.loginForm;
  const signForm = elements.signupForm;

  if (mode === 'login') {
    logForm.classList.remove('hidden');
    signForm.classList.add('hidden');
    elements.tabLogin.classList.add('active');
    elements.tabSignup.classList.remove('active');
  } else {
    signForm.classList.remove('hidden');
    logForm.classList.add('hidden');
    elements.tabSignup.classList.add('active');
    elements.tabLogin.classList.remove('active');
  }

  clearStatus();
  clearFieldStyles();
  validateForm();
}

function clearFieldStyles() {
  document.querySelectorAll('.input-field').forEach((i) => i.classList.remove('invalid'));
}

function clearStatus() {
  elements.loginStatus.textContent = '';
  elements.signupStatus.textContent = '';
  elements.loginStatus.classList.remove('status-error');
  elements.signupStatus.classList.remove('status-error');
}

function setError(input, message) {
  input.classList.add('invalid');
  const help = document.getElementById(`${input.id}Help`);
  if (help) {
    help.textContent = message;
    help.classList.remove('hidden');
  }
}

function clearError(input) {
  input.classList.remove('invalid');
  const help = document.getElementById(`${input.id}Help`);
  if (help) {
    help.classList.add('hidden');
  }
}

function toggleInputs(disabled) {
  [...document.querySelectorAll('input, select, button')].forEach((el) => { el.disabled = disabled; });
}

function setButtonLoading(button, isLoading, text) {
  const label = button.querySelector('.btn-text');
  const spinner = button.querySelector('.loading-dot');
  if (isLoading) {
    label.textContent = text;
    spinner.classList.remove('hidden');
    button.classList.add('opacity-80');
  } else {
    label.textContent = text;
    spinner.classList.add('hidden');
    button.classList.remove('opacity-80');
  }
}

function showStatus(type, message, isError = false) {
  const target = type === 'login' ? elements.loginStatus : elements.signupStatus;
  target.textContent = message;
  target.classList.toggle('status-error', isError);
  if (isError) {
    const form = type === 'login' ? elements.loginForm : elements.signupForm;
    form.classList.add('shake');
    setTimeout(() => form.classList.remove('shake'), 400);
  }
}

function applySuccess() {
  elements.glassCard.classList.add('success-glow');
  setTimeout(() => elements.glassCard.classList.remove('success-glow'), 650);
}

function validateForm() {
  const loginEmailValid = validateEmail(elements.loginEmail.value);
  const loginPassValid = validatePassword(elements.loginPassword.value);
  const loginReady = loginEmailValid && loginPassValid;
  elements.loginSubmit.disabled = !loginReady;

  const signupEmailValid = validateEmail(elements.signupEmail.value);
  const signupPassValid = validatePassword(elements.signupPassword.value);
  const cityValid = elements.city.value.trim() !== '';
  const typeValid = elements.workType.value.trim() !== '';
  const signupReady = signupEmailValid && signupPassValid && cityValid && typeValid;

  elements.signupSubmit.disabled = !signupReady;

  const strength = evaluatePasswordStrength(elements.signupPassword.value);
  elements.passwordStrength.textContent = elements.signupPassword.value ? `${strength.label} password` : '';
  elements.passwordStrength.className = elements.signupPassword.value ? `pw-strength ${strength.className}` : 'pw-strength';
}

// ===== FIREBASE AUTH HANDLERS =====
async function processLogin(e) {
  e.preventDefault();
  clearStatus();

  const email = elements.loginEmail.value.trim().toLowerCase();
  const password = elements.loginPassword.value.trim();

  if (!validateEmail(email) || !validatePassword(password)) {
    showStatus('login', 'Please check your login fields', true);
    return;
  }

  setLoadingState(true, 'login');

  try {
    await signInWithEmailAndPassword(auth, email, password);
    applySuccess();
    showStatus('login', 'Login successful! Redirecting...');

    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1200);
  } catch (error) {
    setLoadingState(false, 'login');
    const errorMsg = error.code === 'auth/user-not-found' ? 'User not found.' : 'Invalid credentials.';
    showStatus('login', errorMsg, true);
  }
}

async function processSignup(e) {
  e.preventDefault();
  clearStatus();

  const email = elements.signupEmail.value.trim().toLowerCase();
  const password = elements.signupPassword.value.trim();
  const city = elements.city.value.trim();
  const workType = elements.workType.value.trim();
  const weeklyHours = Number(elements.weeklyHours.value);

  if (!validateEmail(email) || !validatePassword(password) || !city || !workType) {
    showStatus('signup', 'Please complete all fields correctly', true);
    return;
  }

  setLoadingState(true, 'signup');

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // Save user profile to Firestore
    await setDoc(doc(db, 'profiles', uid), {
      email,
      city,
      workType,
      weeklyHours,
      createdAt: new Date(),
      activePlan: null,
    });

    applySuccess();
    showStatus('signup', 'Account created! Redirecting...');

    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1200);
  } catch (error) {
    setLoadingState(false, 'signup');
    const errorMsg = error.code === 'auth/email-already-in-use' ? 'Email already registered.' : 'Signup failed.';
    showStatus('signup', errorMsg, true);
  }
}

function setLoadingState(active, mode) {
  if (active) {
    toggleInputs(true);
    const targetButton = mode === 'login' ? elements.loginSubmit : elements.signupSubmit;
    setButtonLoading(targetButton, true, mode === 'login' ? 'Logging in...' : 'Creating account...');
  } else {
    toggleInputs(false);
    setButtonLoading(elements.loginSubmit, false, 'Login');
    setButtonLoading(elements.signupSubmit, false, 'Sign Up');
  }
}

function makeRipple() {
  document.querySelectorAll('.submit-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const circle = document.createElement('span');
      const diameter = Math.max(btn.clientWidth, btn.clientHeight);
      const radius = diameter / 2;
      circle.style.width = circle.style.height = `${diameter}px`;
      const rect = btn.getBoundingClientRect();
      circle.style.left = `${e.clientX - rect.left - radius}px`;
      circle.style.top = `${e.clientY - rect.top - radius}px`;
      circle.className = 'ripple';
      const ripple = btn.getElementsByClassName('ripple')[0];
      if (ripple) ripple.remove();
      btn.appendChild(circle);
    });
  });
}

function wireEvents() {
  elements.tabLogin.addEventListener('click', () => setTab('login'));
  elements.tabSignup.addEventListener('click', () => setTab('signup'));
  elements.smallToggleSignup.addEventListener('click', () => setTab('signup'));
  elements.smallToggleLogin.addEventListener('click', () => setTab('login'));

  document.querySelectorAll('.show-hide-btn').forEach((btn) => btn.addEventListener('click', () => {
    const target = document.getElementById(btn.dataset.target);
    if (target) {
      target.type = target.type === 'password' ? 'text' : 'password';
      btn.textContent = target.type === 'password' ? 'Show' : 'Hide';
    }
  }));

  setTimeout(makeRipple, 0);

  elements.loginForm.addEventListener('input', validateForm);
  elements.signupForm.addEventListener('input', validateForm);

  elements.weeklyHours.addEventListener('input', () => {
    elements.weeklyValue.textContent = elements.weeklyHours.value;
  });

  elements.loginForm.addEventListener('submit', processLogin);
  elements.signupForm.addEventListener('submit', processSignup);
}

function init() {
  checkAuthState();

  // Check if this is auth.html
  if (document.getElementById('loginForm')) {
    setTab('login');
    wireEvents();
    validateForm();
  }

  // Check if this is dashboard.html
  if (document.getElementById('overview')) {
    initDashboard();
  }

  // Global navigation handler for all pages with sidebar
  setupGlobalNavigation();
}

// Setup global navigation for internal and external links
function setupGlobalNavigation() {
  document.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      // Allow external page navigation (claims.html, transactions.html)
      if (href && (href.includes('claims.html') || href.includes('transactions.html') || href.includes('dashboard.html'))) {
        e.preventDefault();
        window.location.href = href;
      }
      // For anchor links, just let default behavior happen
    });
  });
}

// ===== DASHBOARD FUNCTIONS =====
async function initDashboard() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = 'auth.html';
        resolve();
        return;
      }

      const uid = user.uid;
      const email = user.email;
      const initial = email.charAt(0).toUpperCase();

      // Fetch user profile from Firestore
      const profileDoc = await getDoc(doc(db, 'profiles', uid));
      if (!profileDoc.exists()) {
        console.error('Profile not found');
        resolve();
        return;
      }

      const profile = profileDoc.data();

  // Update UI with user info
  if (document.getElementById('avatarTop')) {
    document.getElementById('avatarTop').textContent = initial;
  }
  if (document.getElementById('heroName')) {
    document.getElementById('heroName').textContent = email.split('@')[0];
  }
  if (document.getElementById('greetingText')) {
    document.getElementById('greetingText').textContent = `Welcome back, ${email.split('@')[0]}`;
  }

  // Display work type and hours chips
  if (document.getElementById('workTypeChip')) {
    document.getElementById('workTypeChip').textContent = `Work Type: ${profile.workType}`;
  }
  if (document.getElementById('hoursChip')) {
    document.getElementById('hoursChip').textContent = `Weekly Hours: ${profile.weeklyHours}h`;
  }

  // Calculate metrics
  const weeklyHours = profile.weeklyHours || 40;
  const dailyRate = 400;
  const monthlyIncome = Math.round((weeklyHours / 7) * dailyRate * 30);

  const riskLevel = weeklyHours > 50 ? 'High' : weeklyHours > 35 ? 'Medium' : 'Low';
  const activeCoverage = profile.activePlan ?
    (profile.activePlan === 'Basic' ? 50000 : profile.activePlan === 'Pro' ? 125000 : 250000) : 0;

  if (document.getElementById('incomeValue')) {
    document.getElementById('incomeValue').textContent = `₹${monthlyIncome.toLocaleString()}`;
  }
  if (document.getElementById('riskValue')) {
    document.getElementById('riskValue').textContent = riskLevel;
  }
  if (document.getElementById('coverageValue')) {
    document.getElementById('coverageValue').textContent = activeCoverage > 0 ? `₹${activeCoverage.toLocaleString()}` : '₹0';
  }

  const nextPremiumDate = new Date();
  nextPremiumDate.setDate(nextPremiumDate.getDate() + 7);
  if (document.getElementById('nextPremiumValue')) {
    document.getElementById('nextPremiumValue').textContent = profile.activePlan ? nextPremiumDate.toLocaleDateString() : 'N/A';
  }

  let recommendedPlan = 'Accident Shield Pro';
  if (weeklyHours > 50) recommendedPlan = 'Elite Protection';
  else if (weeklyHours > 35) recommendedPlan = 'Accident Shield Pro';
  else recommendedPlan = 'Basic Coverage';

  if (document.getElementById('aiPlanName')) {
    document.getElementById('aiPlanName').textContent = recommendedPlan;
  }
  if (document.getElementById('aiRisk')) {
    document.getElementById('aiRisk').textContent = `Based on your ${weeklyHours}h weekly schedule, we recommend ${recommendedPlan}.`;
  }

  if (document.getElementById('earningsValue')) {
    document.getElementById('earningsValue').textContent = `₹${monthlyIncome.toLocaleString()}`;
  }
  const monthlyPremium = profile.activePlan ?
    (profile.activePlan === 'Basic' ? 499 : profile.activePlan === 'Pro' ? 999 : 1799) : 0;
  if (document.getElementById('premiumsValue')) {
    document.getElementById('premiumsValue').textContent = `₹${monthlyPremium}`;
  }

  const maxIncome = monthlyIncome * 1.2;
  const incomePercent = (monthlyIncome / maxIncome) * 100;
  const premiumPercent = monthlyPremium > 0 ? (monthlyPremium / monthlyIncome) * 100 : 5;

  if (document.getElementById('earningsBar')) {
    document.getElementById('earningsBar').style.width = Math.min(incomePercent, 100) + '%';
  }
  if (document.getElementById('premiumsBar')) {
    document.getElementById('premiumsBar').style.width = Math.min(premiumPercent, 100) + '%';
  }

  loadTransactions(uid);

      // Attach event listeners
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) logoutBtn.addEventListener('click', logoutDashboard);

      document.querySelectorAll('.buy-plan').forEach(btn => {
        btn.addEventListener('click', (e) => buyPlan(e, uid, profile));
      });

      const downloadBtn = document.getElementById('downloadSummaryBtn');
      if (downloadBtn) downloadBtn.addEventListener('click', () => downloadSummary(email, profile, uid));

      const viewPlanBtn = document.getElementById('viewPlanBtn');
      if (viewPlanBtn) {
        viewPlanBtn.addEventListener('click', () => {
          document.getElementById('plans').scrollIntoView({ behavior: 'smooth' });
        });
      }

      resolve();
    });
  });
}

async function loadTransactions(uid) {
  const txnsQuery = query(collection(db, 'transactions'), where('uid', '==', uid));
  const querySnapshot = await getDocs(txnsQuery);

  const txns = [];
  querySnapshot.forEach((doc) => {
    txns.push(doc.data());
  });

  // Sort by date descending
  txns.sort((a, b) => b.date - a.date);

  const tbody = document.getElementById('transactionTableBody');
  const empty = document.getElementById('emptyTransactions');
  const count = document.getElementById('transactionCount');

  if (!tbody) return;

  if (txns.length === 0) {
    if (empty) empty.classList.remove('hidden');
    tbody.innerHTML = '';
    if (count) count.textContent = '0 records';
  } else {
    if (empty) empty.classList.add('hidden');
    tbody.innerHTML = txns.map(t => `
      <tr class="border-t border-slate-200">
        <td class="py-2">${new Date(t.date).toLocaleDateString()}</td>
        <td class="py-2 font-medium">${t.type}</td>
        <td class="py-2">₹${t.amount}</td>
        <td class="py-2"><span class="rounded-full px-2 py-0.5 text-xs font-semibold ${t.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">${t.status}</span></td>
      </tr>
    `).join('');
    if (count) count.textContent = txns.length + ' record' + (txns.length > 1 ? 's' : '');
  }
}

async function buyPlan(e, uid, profile) {
  const btn = e.target;
  const planCard = btn.closest('article');
  const planName = planCard ? planCard.querySelector('h3').textContent : 'Unknown';
  const priceText = planCard ? planCard.querySelector('p.text-4xl')?.textContent || '₹0' : '₹0';
  const price = parseInt(priceText.replace(/[^\d]/g, ''));

  btn.textContent = 'Processing...';
  btn.disabled = true;

  setTimeout(async () => {
    try {
      // Update profile with active plan
      await setDoc(doc(db, 'profiles', uid), { ...profile, activePlan: planName }, { merge: true });

      // Add transaction record
      await addDoc(collection(db, 'transactions'), {
        uid,
        date: Date.now(),
        type: 'Premium',
        amount: price,
        status: 'Paid',
      });

      btn.textContent = '✓ Plan Activated';
      btn.classList.add('bg-green-500', 'text-white');
      loadTransactions(uid);

      setTimeout(() => {
        btn.textContent = 'Buy Plan';
        btn.disabled = false;
        btn.classList.remove('bg-green-500', 'text-white');
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error buying plan:', error);
      btn.textContent = 'Buy Plan';
      btn.disabled = false;
    }
  }, 800);
}

async function downloadSummary(email, profile, uid) {
  const txnsQuery = query(collection(db, 'transactions'), where('uid', '==', uid));
  const querySnapshot = await getDocs(txnsQuery);

  const txns = [];
  querySnapshot.forEach((doc) => {
    txns.push(doc.data());
  });

  const summary = `
ShieldRider Account Summary
============================
Generated: ${new Date().toLocaleString()}

User Details:
- Email: ${email}
- City: ${profile.city}
- Work Type: ${profile.workType}
- Weekly Hours: ${profile.weeklyHours}h
- Active Plan: ${profile.activePlan || 'None'}

Recent Transactions:
${txns.length === 0 ? 'No transactions yet' : txns.map(t => `- ${new Date(t.date).toLocaleDateString()}: ${t.type} ₹${t.amount} (${t.status})`).join('\n')}

Thank you for choosing ShieldRider!
  `.trim();

  const blob = new Blob([summary], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `shieldrider-summary-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

async function logoutDashboard() {
  try {
    await signOut(auth);
    window.location.href = 'auth.html';
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// Auto-run insurance cycle on supported pages
function runAutoInsuranceLoop() {
  const user = JSON.parse(localStorage.getItem('shieldrider_current_user'));
  if (!user) return;

  // only run this on pages using the ShieldRider UI values
  if (!document.getElementById('currentPremium') && !document.getElementById('riskLevelDisplay')) return;

  // ensure plan is normalized for engine (BASIC, PRO, ELITE)
  const planName = (user.plan || '').toString().toUpperCase();
  if (planName === 'PREMIUM') {
    user.plan = 'ELITE';
  } else if (['BASIC','PRO','ELITE'].includes(planName)) {
    user.plan = planName;
  } else {
    user.plan = 'PRO';
  }

  const result = runInsuranceCycle(user);

  const premiumEl = document.getElementById('currentPremium');
  if (premiumEl) premiumEl.textContent = `₹${result.premium.toLocaleString()}`;

  const planNameEl = document.getElementById('currentPlanName');
  if (planNameEl) planNameEl.textContent = user.plan || 'PRO';

  const incomeEl = document.getElementById('currentIncome');
  if (incomeEl) incomeEl.textContent = `₹${Number(user.income || 0).toLocaleString()}`;

  const riskZoneEl = document.getElementById('currentRiskZone');
  if (riskZoneEl) riskZoneEl.textContent = user.riskZone || 'Medium';

  const riskLevelEl = document.getElementById('riskLevelDisplay');
  if (riskLevelEl) riskLevelEl.textContent = result.environment?.level ?? user.riskZone;

  if (result.payout > 0 && result.event) {
    const transaction = {
      type: 'Payout',
      amount: result.payout,
      date: new Date().toLocaleString(),
      event: result.event.type,
      status: 'Credited'
    };
    user.transactions = Array.isArray(user.transactions) ? user.transactions : [];
    user.transactions.push(transaction);
    localStorage.setItem('shieldrider_current_user', JSON.stringify(user));
    alert(`🔔 Auto payout triggered: ₹${transaction.amount} for ${transaction.event} event.`);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  init();
  runAutoInsuranceLoop();
  setInterval(runAutoInsuranceLoop, 30000);
});