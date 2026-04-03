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
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // Fetch user profile from Firestore
    const profileDoc = await getDoc(doc(db, 'profiles', uid));
    let profileData = null;
    if (profileDoc.exists()) {
      profileData = profileDoc.data();
    }

    // Set localStorage for the app
    const existingUser = JSON.parse(localStorage.getItem('shieldrider_current_user') || '{}');
    const userData = {
      ...existingUser,
      uid,
      email,
      profileCompleted: profileData ? true : false,
      profile: profileData ? {
        name: profileData.city || '', // Note: signup saves city, but we use as name placeholder
        workType: profileData.workType || '',
        weeklyIncome: 0, // Will be set in registration
        weeklyHours: profileData.weeklyHours || 40,
        location: profileData.city || '',
        riskLevel: 'Medium' // Default
      } : existingUser.profile || null
    };
    localStorage.setItem('shieldrider_current_user', JSON.stringify(userData));

    applySuccess();
    showStatus('login', 'Login successful! Redirecting...');

    setTimeout(() => {
      const allowGuestMode = true;
      // Optional registration support: if guests allowed, send to dashboard
      if (userData.profileCompleted || allowGuestMode) {
        window.location.href = 'dashboard.html';
      } else {
        window.location.href = 'registration.html';
      }
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

    // Set localStorage for the app (merge with existing object)
    const existingUser = JSON.parse(localStorage.getItem('shieldrider_current_user') || '{}');
    const userData = {
      ...existingUser,
      uid,
      email,
      profileCompleted: false, // Profile not completed yet
      profile: existingUser.profile || null
    };
    localStorage.setItem('shieldrider_current_user', JSON.stringify(userData));

    applySuccess();
    showStatus('signup', 'Account created! Redirecting...');

    setTimeout(() => {
      window.location.href = 'registration.html'; // New users go to registration
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
      // Allow external page navigation (claims.html, transactions.html, registration.html)
      if (href && (href.includes('claims.html') || href.includes('transactions.html') || href.includes('dashboard.html') || href.includes('registration.html'))) {
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

      // Check if profile is completed (optional now)
      const allowGuestMode = true;
      const localUser = JSON.parse(localStorage.getItem('shieldrider_current_user') || '{}');
      if (!localUser.profileCompleted && !allowGuestMode) {
        window.location.href = 'registration.html';
        resolve();
        return;
      }

      const uid = user.uid;
      const email = user.email;
      const initial = email.charAt(0).toUpperCase();

      // Use profile from localStorage
      const profile = localUser.profile;

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

  let monthlyIncome = 0;
  let riskLevel = 'Unknown';
  let chipsWorkType = 'N/A';
  let chipsWeeklyHours = 0;

  if (profile) {
    // Required source-of-truth mapping
    monthlyIncome = Number(profile.weeklyIncome || 0) * 4;
    riskLevel = profile.riskLevel || 'Unknown';
    chipsWorkType = profile.workType || 'N/A';
    chipsWeeklyHours = Number(profile.weeklyHours || 0);

    document.getElementById('aiRisk').textContent = `Based on your profile, we recommend updates for ${chipsWorkType}.`;
  } else {
    // No profile at all
    document.getElementById('aiRisk').textContent = 'Complete your profile to see personalized insights';
  }

  // Display work type and hours chips
  if (document.getElementById('workTypeChip')) {
    document.getElementById('workTypeChip').textContent = `Work Type: ${chipsWorkType}`;
  }
  if (document.getElementById('hoursChip')) {
    document.getElementById('hoursChip').textContent = `Weekly Hours: ${chipsWeeklyHours}h`;
  }

  // Set metric values
  if (document.getElementById('incomeValue')) {
    document.getElementById('incomeValue').textContent = `₹${monthlyIncome.toLocaleString()}`;
  }
  if (document.getElementById('riskValue')) {
    document.getElementById('riskValue').textContent = riskLevel;
  }

  const coverageAmount = (localUser.plan && Number(localUser.plan.coverage)) || 0;
  if (document.getElementById('coverageValue')) {
    document.getElementById('coverageValue').textContent = coverageAmount > 0 ? `₹${coverageAmount.toLocaleString()}` : '₹0';
  }

  const weeklyHours = profile ? Number(profile.weeklyHours || 0) : 0;
  const recommendedPlan = profile ? (weeklyHours > 50 ? 'Elite Protection' : weeklyHours > 35 ? 'Accident Shield Pro' : 'Basic Coverage') : 'No profile data';

  if (document.getElementById('aiPlanName')) {
    document.getElementById('aiPlanName').textContent = recommendedPlan;
  }

  if (document.getElementById('aiRisk')) {
    document.getElementById('aiRisk').textContent = profile ?
      `Based on your ${weeklyHours}h weekly schedule, we recommend ${recommendedPlan}.` :
      'Complete your profile to see personalized insights';
  }

  if (document.getElementById('earningsValue')) {
    document.getElementById('earningsValue').textContent = `₹${monthlyIncome.toLocaleString()}`;
  }

  const monthlyPremium = profile && profile.activePlan ?
    (profile.activePlan === 'Basic' ? 499 : profile.activePlan === 'Pro' ? 999 : 1799) : 0;
  if (document.getElementById('premiumsValue')) {
    document.getElementById('premiumsValue').textContent = `₹${monthlyPremium}`;
  }

  const maxIncome = monthlyIncome > 0 ? monthlyIncome * 1.2 : 1;
  const incomePercent = monthlyIncome > 0 ? (monthlyIncome / maxIncome) * 100 : 0;
  const premiumPercent = monthlyPremium > 0 && monthlyIncome > 0 ? (monthlyPremium / monthlyIncome) * 100 : 5;

  const nextPremiumDate = new Date();
  nextPremiumDate.setDate(nextPremiumDate.getDate() + 7);
  if (document.getElementById('nextPremiumValue')) {
    document.getElementById('nextPremiumValue').textContent = profile && profile.activePlan ? nextPremiumDate.toLocaleDateString() : 'N/A';
  }

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

// Transaction persistence helper (localStorage + Firestore)
async function persistTransaction(uid, transaction) {
  if (!transaction || !transaction.type) return;

  const now = Date.now();
  const canonicalTx = {
    type: transaction.type,
    date: now,
    dateFormatted: new Date(now).toLocaleString(),
    amount: Number(transaction.amount) || 0,
    plan: transaction.plan || null,
    coverage: transaction.coverage ?? null,
    event: transaction.event || null,
    status: transaction.status || (transaction.type === 'Payout' ? 'Credited' : 'Billed'),
    uid: uid || 'anonymous',
  };

  const firestoreUid = uid && uid !== 'anonymous' ? uid : null;
  // Persist to Firestore when user is authenticated
  try {
    if (firestoreUid) {
      await addDoc(collection(db, 'transactions'), canonicalTx);
    }
  } catch (error) {
    console.error('[ShieldRider] Firestore transaction log failed', error);
  }

  // Persist locally for immediate UI update and broader offline support
  const localUser = JSON.parse(localStorage.getItem('shieldrider_current_user') || '{}');
  localUser.transactions = Array.isArray(localUser.transactions) ? localUser.transactions : [];
  localUser.transactions.push(canonicalTx);
  localStorage.setItem('shieldrider_current_user', JSON.stringify(localUser));
  localStorage.setItem('shieldrider_transactions_updated_at', new Date().toISOString());
}

async function persistClaim(uid, claim) {
  if (!claim || !claim.id) return;

  const canonicalClaim = {
    id: claim.id,
    userId: claim.userId || uid || 'anonymous',
    date: claim.createdAt || new Date().toLocaleDateString(),
    dateMs: claim.createdAtMs || Date.now(),
    reason: claim.event || claim.reason || 'unknown',
    severity: claim.severity || 'unknown',
    status: claim.status || 'Pending',
    payout: Number(claim.payoutAmount || claim.payout || 0),
    description: claim.description || '',
    fraudScore: claim.fraudScore ?? 0,
    isFraud: claim.isFraud ?? false,
    riskFactor: claim.riskFactor || 'Medium',
    behavior: claim.behavior || 'normal',
    income: Number(claim.income || 0),
    uid: uid || 'anonymous',
  };

  const firestoreUid = uid && uid !== 'anonymous' ? uid : null;
  try {
    if (firestoreUid) {
      await addDoc(collection(db, 'claims'), { ...canonicalClaim, uid: firestoreUid });
    }
  } catch (error) {
    console.error('[ShieldRider] Firestore claim log failed', error);
  }

  const localUser = JSON.parse(localStorage.getItem('shieldrider_current_user') || '{}');
  localUser.claims = Array.isArray(localUser.claims) ? localUser.claims : [];
  localUser.claims.push(canonicalClaim);
  localStorage.setItem('shieldrider_current_user', JSON.stringify(localUser));
  localStorage.setItem('shieldrider_claims_updated_at', new Date().toISOString());
}

const simulationState = {
  timerId: null,
  active: true,
  forcedEvent: null, // 'rain' | 'heatwave' | 'pollution'
};

function startSimulation() {
  if (simulationState.active && simulationState.timerId) return;
  simulationState.active = true;
  if (simulationState.timerId) clearInterval(simulationState.timerId);
  simulationState.timerId = setInterval(runAutoInsuranceLoop, 30000);
  document.getElementById('startSimulationBtn')?.classList.add('opacity-70');
  document.getElementById('pauseSimulationBtn')?.classList.remove('opacity-70');
}

function pauseSimulation() {
  simulationState.active = false;
  if (simulationState.timerId) {
    clearInterval(simulationState.timerId);
    simulationState.timerId = null;
  }
  document.getElementById('pauseSimulationBtn')?.classList.add('opacity-70');
  document.getElementById('startSimulationBtn')?.classList.remove('opacity-70');
}

function setClaimLifecycle(stage) {
  const lifecycleEl = document.getElementById('claimLifecycleStatus');
  if (!lifecycleEl) return;
  lifecycleEl.textContent = `Claim Lifecycle: ${stage}`;
}

function logAutomatedTrigger(message) {
  const logEl = document.getElementById('automatedTriggerLog');
  if (!logEl) return;
  const item = document.createElement('div');
  item.className = 'text-xs text-slate-700 border-b border-slate-200 py-1';
  item.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  if (logEl.querySelector('p')) logEl.innerHTML = '';
  logEl.prepend(item);
  const children = logEl.children;
  if (children.length > 6) logEl.removeChild(children[children.length - 1]);
}

function computeMlPremiumAdjustment(user, result) {
  const behavior = (user.behavior || 'normal').toLowerCase();
  const stability = (user.stability || 'normal').toLowerCase();
  let adjustmentFactor = 1.0;

  // ML-inspired scoring:
  // - low risk behavior / stability gives discount
  // - environmental risk increases premium
  if (behavior === 'safe') adjustmentFactor -= 0.04;
  if (behavior === 'risky') adjustmentFactor += 0.1;
  if (stability === 'stable') adjustmentFactor -= 0.03;
  if (stability === 'unstable') adjustmentFactor += 0.06;

  const envFactor = Number(result.environment?.factor || 1.0);
  adjustmentFactor += (envFactor - 1) * 0.12;

  // Add zone-based remedy
  if ((user.riskZone || 'Medium') === 'High') adjustmentFactor += 0.08;
  else if ((user.riskZone || 'Medium') === 'Low') adjustmentFactor -= 0.03;

  const predictivePremium = Number(result.premium) * adjustmentFactor;
  return {
    adjustmentFactor: Number(adjustmentFactor.toFixed(3)),
    predictivePremium: Number(predictivePremium.toFixed(2)),
  };
}

function evaluateAutomatedTriggers(user, result) {
  const triggers = [];

  // Flood risk trigger
  if (result.weather?.rain > 70) {
    triggers.push('Flood risk (rain) trigger');
    result.environment.factor = Number((result.environment.factor + 0.12).toFixed(2));
  }

  // Heatwave trigger
  if (result.weather?.temp > 42) {
    triggers.push('Heatwave trigger');
    result.environment.factor = Number((result.environment.factor + 0.15).toFixed(2));
  }

  // Pollution trigger
  if (result.weather?.aqi > 220) {
    triggers.push('AQI pollution trigger');
    result.environment.factor = Number((result.environment.factor + 0.10).toFixed(2));
  }

  // Traffic disruption (mock random)
  if (Math.random() < 0.02) {
    triggers.push('Traffic disruption trigger');
    result.environment.factor = Number((result.environment.factor + 0.05).toFixed(2));
  }

  // Extreme weather feed
  if (result.weather?.wind > 70 && result.weather?.rain > 60) {
    triggers.push('Extreme weather feed trigger');
    result.environment.factor = Number((result.environment.factor + 0.18).toFixed(2));
  }

  triggers.forEach((msg) => logAutomatedTrigger(msg));
  if (triggers.length) {
    setClaimLifecycle('Claim Detected');
    setTimeout(() => setClaimLifecycle('Claim Verified'), 500);
    setTimeout(() => setClaimLifecycle('Claim Approved'), 900);
    setTimeout(() => setClaimLifecycle('Payout Executed'), 1200);
  }

  return triggers;
}

function updateAiStatusBadges() {
  document.getElementById('aiEngineBadge')?.classList.add('bg-emerald-200', 'text-emerald-900');
  document.getElementById('predictiveWeatherBadge')?.classList.add('bg-sky-200', 'text-sky-900');
  document.getElementById('triggerSystemBadge')?.classList.add('bg-amber-200', 'text-amber-900');
}


function setupSimulationControls() {
  document.getElementById('startSimulationBtn')?.addEventListener('click', startSimulation);
  document.getElementById('pauseSimulationBtn')?.addEventListener('click', pauseSimulation);

  document.getElementById('triggerRainBtn')?.addEventListener('click', () => {
    simulationState.forcedEvent = 'rain';
    runAutoInsuranceLoop();
  });
  document.getElementById('triggerHeatwaveBtn')?.addEventListener('click', () => {
    simulationState.forcedEvent = 'heatwave';
    runAutoInsuranceLoop();
  });
  document.getElementById('triggerPollutionBtn')?.addEventListener('click', () => {
    simulationState.forcedEvent = 'pollution';
    runAutoInsuranceLoop();
  });
}

function getPremiumTransactions() {
  const user = JSON.parse(localStorage.getItem('shieldrider_current_user') || '{}');
  const txns = Array.isArray(user.transactions) ? user.transactions : [];
  return txns
    .filter((t) => t.type === 'Premium')
    .sort((a, b) => b.date - a.date)
    .slice(0, 6)
    .reverse();
}

function renderPremiumTrend() {
  const chart = document.getElementById('premiumTrendChart');
  if (!chart || !chart.getContext) return;

  const ctx = chart.getContext('2d');
  const premiums = getPremiumTransactions();
  const width = chart.width;
  const height = chart.height;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);

  if (premiums.length === 0) {
    ctx.fillStyle = '#334155';
    ctx.font = '14px sans-serif';
    ctx.fillText('No premium data yet', 14, 22);
    return;
  }

  const values = premiums.map((p) => Number(p.amount) || 0);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const padding = 20;
  const xStep = (width - padding * 2) / Math.max(values.length - 1, 1);

  ctx.strokeStyle = '#0ea5e9';
  ctx.lineWidth = 2;
  ctx.beginPath();

  values.forEach((val, index) => {
    const x = padding + index * xStep;
    const y = height - padding - ((val - min) / (max - min + 0.001)) * (height - padding * 2);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.fillStyle = '#0284c7';
  values.forEach((val, index) => {
    const x = padding + index * xStep;
    const y = height - padding - ((val - min) / (max - min + 0.001)) * (height - padding * 2);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = '#475569';
  ctx.font = '12px sans-serif';
  values.forEach((val, index) => {
    const x = padding + index * xStep;
    const y = height - padding + 16;
    ctx.fillText(`₹${Number(val).toFixed(0)}`, x - 14, y);
  });
}

function renderEventTimeline() {
  const user = JSON.parse(localStorage.getItem('shieldrider_current_user') || '{}');
  const txns = Array.isArray(user.transactions) ? user.transactions : [];
  const events = txns
    .filter((t) => t.type === 'Payout')
    .sort((a, b) => b.date - a.date)
    .slice(0, 5);

  const eventTimeline = document.getElementById('eventTimeline');
  const numEventsEl = document.getElementById('numEvents');
  if (numEventsEl) numEventsEl.textContent = `${events.length} events`;
  if (!eventTimeline) return;

  if (events.length === 0) {
    eventTimeline.innerHTML = '<li class="text-slate-500">No payout events yet.</li>';
    return;
  }

  eventTimeline.innerHTML = events
    .map((event) => {
      const ts = event.dateFormatted || (event.date ? new Date(event.date).toLocaleString() : '--');
      const type = event.event || 'Payout';
      const severity = event.severity || 'unknown';
      return `<li class="rounded-lg border border-slate-200 bg-slate-50 p-2">
          <div class="flex justify-between text-xs font-semibold text-slate-700"><span>${type}</span><span>₹${Number(event.amount || 0).toLocaleString()}</span></div>
          <div class="text-xs text-slate-500">${severity} | ${ts}</div>
        </li>`;
    })
    .join('');
}

function renderAIInsights(result, pricingResult, user) {
  const insightList = document.getElementById('aiInsightsList');
  if (!insightList) return;

  const insights = [];
  const env = result.environment || {};
  const comp = pricingResult.components || {};

  if (env.factor >= 1.5) insights.push('Your premium increased due to high environmental risk.');
  else if (env.factor >= 1.2) insights.push('Moderate environmental risk detected.');
  else insights.push('Low environment risk, good conditions.');

  if ((user.riskZone || 'Medium') === 'High') insights.push('You are in a high-risk zone; expect higher premiums.');
  else if ((user.riskZone || 'Medium') === 'Medium') insights.push('Medium risk zone; keep monitoring conditions.');
  else insights.push('Low risk zone, well protected.');

  if ((user.behavior || 'normal').toLowerCase() === 'safe') insights.push('Safe behavior is reducing your premium.');
  if ((user.behavior || 'normal').toLowerCase() === 'risky') insights.push('Risky behavior added to premium. Consider safer habits.');

  if (comp.riskZoneMultiplier > 1.2) insights.push('Risk zone multiplier is elevated in your current profile.');
  if (comp.environmentalFactor > 1.1) insights.push('Weather factor is adding to the premium calculation.');

  insightList.innerHTML = insights.map((s) => `<li>${s}</li>`).join('');
}

function renderProfileImpact(pricingResult, user) {
  const profileImpact = document.getElementById('profileImpact');
  if (!profileImpact) return;

  const comp = pricingResult.components || {};
  profileImpact.innerHTML = `
    <li>Income: ₹${Number(comp.income || user.income || 0).toLocaleString()}</li>
    <li>Plan base rate: ${(Number(comp.baseRate || 0) * 100).toFixed(2)}%</li>
    <li>Risk zone multiplier: ${Number(comp.riskZoneMultiplier || 0).toFixed(2)}x</li>
    <li>Environmental factor: ${Number(comp.environmentalFactor || 0).toFixed(2)}x</li>
    <li>Behavior score: ${Number(comp.behaviorScore || 0).toFixed(2)}x</li>
    <li>Stability factor: ${Number(comp.stabilityFactor || 0).toFixed(2)}x</li>
  `;
}

function updateAllWidgets(result, pricingResult, user) {
  renderPremiumTrend();
  renderEventTimeline();
  renderAIInsights(result, pricingResult, user);
  renderProfileImpact(pricingResult, user);
}

// Auto-run insurance cycle on supported pages
async function runAutoInsuranceLoop() {
  if (!simulationState.active) return;

  const user = JSON.parse(localStorage.getItem('shieldrider_current_user'));
  if (!user) return;

  // ensure plan is normalized for engine (BASIC, PRO, ELITE)
  const planName = (user.plan || '').toString().toUpperCase();
  if (planName === 'PREMIUM') {
    user.plan = 'ELITE';
  } else if (['BASIC', 'PRO', 'ELITE'].includes(planName)) {
    user.plan = planName;
  } else {
    user.plan = 'PRO';
  }

  let result = runInsuranceCycle(user);

  if (simulationState.forcedEvent) {
    const forced = simulationState.forcedEvent;
    result.event = { type: forced, severity: 'severe', duration: 1.5 };
    result.payout = calculatePayout(result.event, user);
    simulationState.forcedEvent = null;
    logAutomatedTrigger(`Manual trigger: ${forced}`);
  }

  // Automated mock API triggers
  const triggeredSources = evaluateAutomatedTriggers(user, result);
  if (triggeredSources.length === 0) {
    logAutomatedTrigger('No automated triggers this cycle');
  }

  const pricingResult = calculatePremium(user, result.environment);

  const premiumEl = document.getElementById('currentPremium');
  if (premiumEl) premiumEl.textContent = `₹${result.premium.toLocaleString()}`;

  const mlAdjust = computeMlPremiumAdjustment(user, result);
  const predictivePremiumEl = document.getElementById('predictivePremiumValue');
  if (predictivePremiumEl) predictivePremiumEl.textContent = `₹${mlAdjust.predictivePremium.toLocaleString()}`;

  const mlFactorEl = document.getElementById('mlRiskFactor');
  if (mlFactorEl) mlFactorEl.textContent = `ML risk adjustment: ${Number(mlAdjust.adjustmentFactor).toFixed(3)}x`;

  const planNameEl = document.getElementById('currentPlanName');
  if (planNameEl) planNameEl.textContent = user.plan || 'PRO';

  const incomeEl = document.getElementById('currentIncome');
  if (incomeEl) incomeEl.textContent = `₹${Number(user.income || 0).toLocaleString()}`;

  const riskZoneEl = document.getElementById('currentRiskZone');
  if (riskZoneEl) riskZoneEl.textContent = user.riskZone || 'Medium';

  const riskLevelEl = document.getElementById('riskLevelDisplay');
  if (riskLevelEl) riskLevelEl.textContent = result.environment?.level ?? user.riskZone;

  // Live status panel updates
  const lastUpdatedEl = document.getElementById('liveLastUpdated');
  const envFactorEl = document.getElementById('liveEnvFactor');
  const premiumChangeEl = document.getElementById('livePremiumChange');
  const riskBadgeEl = document.getElementById('riskBadge');
  const whyPremiumListEl = document.getElementById('whyPremiumList');
  const eventAlertEl = document.getElementById('eventAlert');
  const liveEventInfoEl = document.getElementById('liveEventInfo');

  const liveNow = Date.now();
  const nowLabel = new Date(liveNow).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  if (lastUpdatedEl) lastUpdatedEl.textContent = `Last updated: ${nowLabel}`;
  if (envFactorEl) envFactorEl.textContent = `Environmental factor: ${Number(result.environment?.factor || 0).toFixed(2)}`;

  const premiumMetaBaseline = user.lastPremiumMeta || { value: 0, timestamp: 0 };
  const lastPremiumVal = Number(premiumMetaBaseline.value) || 0;
  const premiumChangePct = lastPremiumVal > 0 ? ((result.premium - lastPremiumVal) / lastPremiumVal) * 100 : 0;
  const premiumChangeLabel = lastPremiumVal === 0 ? 'N/A' : `${premiumChangePct >= 0 ? '+' : ''}${premiumChangePct.toFixed(1)}%`;
  if (premiumChangeEl) premiumChangeEl.textContent = `Premium change: ${premiumChangeLabel}`;

  if (riskBadgeEl) {
    const level = result.environment?.level || 'Safe';
    riskBadgeEl.textContent = level;
    riskBadgeEl.className = 'rounded-full px-3 py-1 text-xs font-semibold';
    if (level === 'Safe') riskBadgeEl.classList.add('bg-green-100', 'text-green-800');
    else if (level === 'Normal') riskBadgeEl.classList.add('bg-yellow-100', 'text-yellow-800');
    else if (level === 'Hazardous') riskBadgeEl.classList.add('bg-red-100', 'text-red-800');
    else riskBadgeEl.classList.add('bg-slate-100', 'text-slate-700');
  }

  if (whyPremiumListEl) {
    const components = pricingResult.components || {};
    const map = {
      income: Number(components.income || 0).toLocaleString(),
      baseRate: (Number(components.baseRate || 0) * 100).toFixed(2) + '%',
      riskZoneMultiplier: Number(components.riskZoneMultiplier || 0).toFixed(2),
      environmentalFactor: Number(components.environmentalFactor || 0).toFixed(2),
      behaviorScore: Number(components.behaviorScore || 0).toFixed(2),
      stabilityFactor: Number(components.stabilityFactor || 0).toFixed(2),
    };
    whyPremiumListEl.innerHTML = `
      <li>Environment Risk: ${map.environmentalFactor}</li>
      <li>Zone Risk: ${map.riskZoneMultiplier}</li>
      <li>Driving Behavior: ${map.behaviorScore}</li>
      <li>Stability Factor: ${map.stabilityFactor}</li>
      <li>Base Rate: ${map.baseRate}</li>
      <li>Income: ₹${map.income}</li>
    `;
  }

  if (result.event) {
    const eventLabel = `${result.event.type} (${result.event.severity})`;
    if (eventAlertEl) {
      eventAlertEl.classList.remove('hidden');
      eventAlertEl.textContent = `⚠️ ${result.event.severity.charAt(0).toUpperCase() + result.event.severity.slice(1)} ${result.event.type} Detected → Payout Triggered: ₹${Number(result.payout || 0).toLocaleString()}`;
    }
    if (liveEventInfoEl) liveEventInfoEl.textContent = `Last event: ${eventLabel}`;
  } else {
    if (eventAlertEl) {
      eventAlertEl.classList.add('hidden');
      eventAlertEl.textContent = '';
    }
    if (liveEventInfoEl) liveEventInfoEl.textContent = 'No event currently.';
  }

  // Controlled premium logging:
  // - log when meaningful change (>= 10%)
  // - or when 6 hours elapsed
  const now = Date.now();
  const lastPremiumValue = Number(user.lastPremiumMeta?.value || 0) || 0;
  const lastPremiumTime = Number(user.lastPremiumMeta?.timestamp || 0) || 0;
  const premiumChange = lastPremiumValue > 0 ? Math.abs(result.premium - lastPremiumValue) / lastPremiumValue : 1;
  const timeElapsed = now - lastPremiumTime;
  const THRESHOLD_CHANGE = 0.1; // 10%
  const THRESHOLD_TIME = 6 * 60 * 60 * 1000; // 6 hours

  if (lastPremiumTime === 0 || premiumChange >= THRESHOLD_CHANGE || timeElapsed >= THRESHOLD_TIME) {
    await persistTransaction(state.currentUser?.uid || user.uid || null, {
      type: 'Premium',
      amount: result.premium,
      plan: user.plan,
      coverage: user.activePlan || null,
      event: null,
      status: 'Billed',
    });

    user.lastPremiumMeta = {
      value: result.premium,
      timestamp: now,
    };
    localStorage.setItem('shieldrider_current_user', JSON.stringify(user));
  }

  if (result.payout > 0 && result.event) {
    const eventKey = `${result.event.type}|${result.event.severity}|${result.event.duration}`;
    const lastPayoutKey = user.lastPayoutKey || '';
    const lastPayoutTS = Number(user.lastPayoutTimestamp) || 0;
    const PAYOUT_LOCK_TIME = 60 * 60 * 1000; // 1 hour

    if (eventKey !== lastPayoutKey || now - lastPayoutTS >= PAYOUT_LOCK_TIME) {
      const payoutTx = {
        type: 'Payout',
        amount: result.payout,
        plan: user.plan,
        coverage: user.activePlan || null,
        event: result.event.type,
        status: 'Credited',
      };

      await persistTransaction(state.currentUser?.uid || user.uid || null, payoutTx);
      user.lastPayoutKey = eventKey;
      user.lastPayoutTimestamp = now;
      localStorage.setItem('shieldrider_current_user', JSON.stringify(user));
      alert(`🔔 Auto payout triggered: ₹${payoutTx.amount} for ${payoutTx.event} event.`);
    }
  }

  if (result.claim) {
    await persistClaim(state.currentUser?.uid || user.uid || null, result.claim);
    logAutomatedTrigger(`Claim ${result.claim.id} ${result.claim.status} for ₹${result.claim.payoutAmount}`);
    if (result.claim.status === 'Rejected') {
      setClaimLifecycle('Claim Rejected - Manual Review Needed');
    } else {
      setClaimLifecycle('Claim Processed');
    }
  }

  updateAllWidgets(result, pricingResult, user);
}

window.addEventListener('DOMContentLoaded', () => {
  const isDashboardPage = !!document.getElementById('overview'); // Dashboard has 'overview' section

  init();

  if (isDashboardPage) {
    setupSimulationControls();
    runAutoInsuranceLoop();
    startSimulation();
  }
});
