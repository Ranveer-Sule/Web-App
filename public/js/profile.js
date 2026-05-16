const signupBtn = document.getElementById('signup-btn');
const loginBtn = document.getElementById('login-btn');
const authForm = document.getElementById('auth-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const authSubmit = document.getElementById('auth-submit');
const authMessage = document.getElementById('auth-message');
const profileActions = document.getElementById('profile-actions');
const profileDashboard = document.getElementById('profile-dashboard');
const profileAvatar = document.getElementById('profile-avatar');
const profileUsername = document.getElementById('profile-username');
const logoutBtn = document.getElementById('logout-btn');
const editForm = document.getElementById('edit-form');
const newUsernameInput = document.getElementById('new-username');
const newPasswordInput = document.getElementById('new-password');
const editMessage = document.getElementById('edit-message');

let currentMode = '';

function setAuthMode(mode) {
    currentMode = mode;
    authForm.hidden = false;

    signupBtn.classList.toggle('active-auth', mode === 'signup');
    loginBtn.classList.toggle('active-auth', mode === 'login');

    authSubmit.textContent = mode === 'signup' ? 'Sign Up' : 'Log In';
    passwordInput.autocomplete = mode === 'signup' ? 'new-password' : 'current-password';

    authMessage.textContent = `Ready to ${mode === 'signup' ? 'sign up' : 'log in'}.`;
    usernameInput.focus();
}

function showProfileDashboard(username) {
    profileActions.hidden = true;
    profileDashboard.hidden = false;
    profileAvatar.textContent = username.charAt(0).toUpperCase();
    profileUsername.textContent = username;
    newUsernameInput.value = username;
}

function showAuthSection() {
    profileDashboard.hidden = true;
    profileActions.hidden = false;
    authForm.hidden = true;
    authMessage.textContent = '';
    usernameInput.value = '';
    passwordInput.value = '';
    setAuthMode('login');
}

function handleLogout() {
    localStorage.removeItem('loggedInUser');
    showAuthSection();
}

function handleAuthSubmit(event) {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!currentMode) {
        authMessage.textContent = 'Select Sign Up or Log In first.';
        return;
    }

    if (!username || !password) {
        authMessage.textContent = 'Please enter both username and password.';
        return;
    }

    fetch('/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, buttonPressed: currentMode })
    })
    .then(res => res.json())
    .then(data => {
        authMessage.textContent = data.message;
        if (data.success) {
            localStorage.setItem('loggedInUser', username);
            showProfileDashboard(username);
        }
    })
    .catch(err => console.error(err));

    passwordInput.value = '';
}

function handleEditProfile(event) {
    event.preventDefault();

    const newUsername = newUsernameInput.value.trim();
    const newPassword = newPasswordInput.value.trim();
    const currentUsername = localStorage.getItem('loggedInUser');

    if (!newUsername) {
        editMessage.textContent = 'Username cannot be empty.';
        return;
    }

    fetch('/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUsername, newUsername, newPassword })
    })
    .then(res => res.json())
    .then(data => {
        editMessage.textContent = data.message;
        if (data.success) {
            localStorage.setItem('loggedInUser', newUsername);
            profileAvatar.textContent = newUsername.charAt(0).toUpperCase();
            profileUsername.textContent = newUsername;
            newPasswordInput.value = '';
        }
    })
    .catch(err => console.error(err));
}

signupBtn.addEventListener('click', () => setAuthMode('signup'));
loginBtn.addEventListener('click', () => setAuthMode('login'));
authForm.addEventListener('submit', handleAuthSubmit);
logoutBtn.addEventListener('click', handleLogout);
editForm.addEventListener('submit', handleEditProfile);

const savedUser = localStorage.getItem('loggedInUser');
if (savedUser) {
    showProfileDashboard(savedUser);
} else {
    setAuthMode('login');
}
