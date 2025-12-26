// Client-only Student Productivity Manager
// Stores users, profile, tasks in localStorage

const selectors = {
  loginSection: document.getElementById('login-section'),
  profileSection: document.getElementById('profile-section'),
  dashboardSection: document.getElementById('dashboard-section'),
  loginForm: document.getElementById('login-form'),
  loginUser: document.getElementById('login-username'),
  loginPass: document.getElementById('login-password'),
  profileForm: document.getElementById('profile-form'),
  profileName: document.getElementById('profile-name'),
  profileClass: document.getElementById('profile-class'),
  profileAge: document.getElementById('profile-age'),
  profileBio: document.getElementById('profile-bio'),
  btnSaveProfile: document.getElementById('btn-save-profile'),
  btnSkipProfile: document.getElementById('btn-skip-profile'),
  profileMsg: document.getElementById('profile-msg'),
  welcome: document.getElementById('welcome'),
  profileDisplay: document.getElementById('profile-display'),
  btnEditProfile: document.getElementById('btn-edit-profile'),
  btnLogout: document.getElementById('btn-logout'),
  taskForm: document.getElementById('task-form'),
  taskName: document.getElementById('task-name'),
  taskTime: document.getElementById('task-time'),
  taskDays: document.getElementById('task-days'),
  tasksList: document.getElementById('tasks-list'),
  reminderLog: document.getElementById('reminder-log')
};

// Simple user management (client-only)
function saveToLS(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
function readFromLS(key, fallback){ const v=localStorage.getItem(key); return v?JSON.parse(v):fallback; }

let currentUser = null;

function init(){
  // If a user is already logged (stored), auto-login
  const savedUser = readFromLS('spm_current_user', null);
  if(savedUser){
    currentUser = savedUser;
    showDashboard();
  }
}

// Navigation helpers
function show(el){ el.classList.remove('hidden'); }
function hide(el){ el.classList.add('hidden'); }

// --- LOGIN ---
selectors.loginForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const username = selectors.loginUser.value.trim();
  const password = selectors.loginPass.value; // this demo does not hash or send to server
  if(!username || !password) return alert('Enter username and password');
  currentUser = { username };
  saveToLS('spm_current_user', currentUser);
  // Ensure user data structures in localStorage
  const users = readFromLS('spm_users', {});
  if(!users[username]){
    users[username] = { profile: null, profileLastSaved: null, tasks: [] };
    saveToLS('spm_users', users);
  }
  selectors.loginUser.value = '';
  selectors.loginPass.value = '';
  showProfileSection();
});

function getUserData(){
  const users = readFromLS('spm_users', {});
  return users[currentUser.username] || { profile:null, profileLastSaved:null, tasks:[] };
}

function setUserData(data){
  const users = readFromLS('spm_users', {});
  users[currentUser.username] = data;
  saveToLS('spm_users', users);
}

// --- PROFILE ---
function showProfileSection(){
  hide(selectors.loginSection);
  show(selectors.profileSection);
  hide(selectors.dashboardSection);
  const data = getUserData();
  if(data.profile){
    selectors.profileName.value = data.profile.name || '';
    selectors.profileClass.value = data.profile.className || '';
    selectors.profileAge.value = data.profile.age || '';
    selectors.profileBio.value = data.profile.bio || '';
    const last = data.profileLastSaved ? new Date(data.profileLastSaved) : null;
    if(last){
      const daysSince = Math.floor((Date.now() - last.getTime())/(1000*60*60*24));
      if(daysSince < 7){
        const left = 7 - daysSince;
        selectors.profileMsg.textContent = `You can edit profile again in ${left} day(s).`;
        selectors.btnSaveProfile.disabled = true;
      } else {
        selectors.profileMsg.textContent = '';
        selectors.btnSaveProfile.disabled = false;
      }
    } else {
      selectors.profileMsg.textContent = '';
      selectors.btnSaveProfile.disabled = false;
    }
  } else {
    selectors.profileForm.reset();
    selectors.profileMsg.textContent = '';
    selectors.btnSaveProfile.disabled = false;
  }
}

selectors.btnSaveProfile.addEventListener('click', ()=>{
  // Validate
  const name = selectors.profileName.value.trim();
  const className = selectors.profileClass.value.trim();
  const age = Number(selectors.profileAge.value);
  const bio = selectors.profileBio.value.trim();
  if(!name || !className || !age) return alert('Fill name, class and age');

  const data = getUserData();
  const now = new Date();
  // Save profile and timestamp
  data.profile = { name, className, age, bio };
  data.profileLastSaved = now.toISOString();
  setUserData(data);
  alert('Profile saved. You can edit again after 7 days.');
  showDashboard();
});

selectors.btnSkipProfile.addEventListener('click', ()=>{ showDashboard(); });

// --- DASHBOARD ---
function showDashboard(){
  hide(selectors.loginSection);
  hide(selectors.profileSection);
  show(selectors.dashboardSection);
  selectors.loginUser.value = '';
  const data = getUserData();
  // Update welcome
  const name = data.profile ? data.profile.name : currentUser.username;
  selectors.welcome.textContent = `Hello, ${name}`;
  selectors.profileDisplay.textContent = data.profile ? `${data.profile.className} · Age ${data.profile.age} · ${data.profile.bio || ''}` : 'Profile not set';
  renderTasks();
}

selectors.btnLogout.addEventListener('click', ()=>{
  currentUser = null;
  localStorage.removeItem('spm_current_user');
  hide(selectors.profileSection);
  hide(selectors.dashboardSection);
  show(selectors.loginSection);
});

selectors.btnEditProfile.addEventListener('click', ()=>{
  // Allow edit only if 7 days passed
  const data = getUserData();
  const last = data.profileLastSaved ? new Date(data.profileLastSaved) : null;
  if(last){
    const daysSince = Math.floor((Date.now() - last.getTime())/(1000*60*60*24));
    if(daysSince < 7){
      const left = 7 - daysSince;
      return alert(`You can edit profile again in ${left} day(s).`);
    }
  }
  showProfileSection();
});

// --- TASKS ---
selectors.taskForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const name = selectors.taskName.value.trim();
  const time = selectors.taskTime.value; // HH:MM
  const days = Number(selectors.taskDays.value);
  if(!name || !time || !days) return alert('Fill all fields');
  const data = getUserData();
  const task = {
    id: 't_'+Date.now(),
    name,
    time, // string
    days,
    createdAt: new Date().toISOString(),
    completedDates: [], // ISO dates of days completed
    lastRemindedDate: null
  };
  data.tasks.push(task);
  setUserData(data);
  selectors.taskForm.reset();
  selectors.taskDays.value = 7;
  renderTasks();
});

function renderTasks(){
  const data = getUserData();
  const list = data.tasks || [];
  selectors.tasksList.innerHTML = '';
  if(list.length===0){ selectors.tasksList.innerHTML = '<p class="muted">No tasks yet. Add a task to get daily reminders.</p>'; return; }
  list.forEach(task=>{
    const item = document.createElement('div');
    item.className = 'task';

    const left = document.createElement('div');
    left.innerHTML = `<strong>${escapeHtml(task.name)}</strong><div class="meta">At ${task.time} • for ${task.days} day(s) • Created ${new Date(task.createdAt).toLocaleDateString()}</div>`;

    const right = document.createElement('div');
    right.className = 'actions';

    const progress = document.createElement('div');
    progress.className = 'small';
    const completedCount = task.completedDates ? task.completedDates.length : 0;
    progress.innerHTML = `<div class="meta">Progress: ${completedCount}/${task.days} days</div>`;

    const btnComplete = document.createElement('button');
    btnComplete.className = 'btn small';
    btnComplete.textContent = 'Completed Today';
    btnComplete.addEventListener('click', ()=>markCompleted(task.id));

    const status = document.createElement('div');
    if(completedCount>=task.days) status.innerHTML = '<span class="completed-badge">Completed</span>';

    right.appendChild(progress);
    right.appendChild(btnComplete);
    right.appendChild(status);

    item.appendChild(left);
    item.appendChild(right);

    selectors.tasksList.appendChild(item);
  });
}

function markCompleted(taskId){
  const data = getUserData();
  const t = data.tasks.find(x=>x.id===taskId);
  if(!t) return;
  const todayISO = (new Date()).toISOString().slice(0,10); // YYYY-MM-DD
  if(!t.completedDates) t.completedDates = [];
  if(t.completedDates.includes(todayISO)) return alert('You already marked this task completed for today.');
  t.completedDates.push(todayISO);
  setUserData(data);
  renderTasks();
}

// --- REMINDERS ---
function checkReminders(){
  if(!currentUser) return;
  const data = getUserData();
  const now = new Date();
  const nowHM = now.toTimeString().slice(0,5); // HH:MM
  const todayISO = now.toISOString().slice(0,10);
  let logLines = [];
  data.tasks.forEach(task=>{
    // Check if still in the reminder period
    const created = new Date(task.createdAt);
    const daysPassed = Math.floor((now - created)/(1000*60*60*24));
    if(daysPassed >= task.days) return; // expired
    // If time matches and not reminded today
    if(task.time === nowHM){
      if(task.lastRemindedDate !== todayISO){
        // If user already completed today, skip reminding
        const already = task.completedDates && task.completedDates.includes(todayISO);
        if(!already){
          alert(`Reminder: ${task.name} (scheduled at ${task.time})`);
          task.lastRemindedDate = todayISO;
          logLines.push(`Reminded ${task.name} at ${nowHM}`);
        }
      }
    }
  });
  if(logLines.length) selectors.reminderLog.textContent = logLines.join('\n');
  setUserData(data);
}

// Utility: escape HTML for safety in innerHTML usage
function escapeHtml(unsafe) {
  return unsafe.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
}

// Init
init();
renderTasks();
// Check reminders every 30 seconds
setInterval(checkReminders, 30*1000);
// Also check once immediately in case time matches
setTimeout(checkReminders, 1000);

// For debugging convenience, expose some helpers
window.spm = { readFromLS, saveToLS, getUserData, setUserData };
