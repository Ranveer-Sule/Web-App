const signupBtn = document.getElementById('signup-btn');
const loginBtn = document.getElementById('login-btn');
const authForm = document.getElementById('auth-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const authSubmit = document.getElementById('auth-submit');
const authMessage = document.getElementById('auth-message');

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

signupBtn.addEventListener('click', () => {
    setAuthMode('signup');
});

loginBtn.addEventListener('click', () => {
    setAuthMode('login');
});

authForm.addEventListener('submit', (event) => {
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

    authMessage.textContent =
        currentMode === 'signup'
            ? `Signed up as ${username}.`
            : `Logged in as ${username}.`;
    
    // Send data to server
    fetch('/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, buttonPressed: currentMode })
    })
    .then(res => res.json())
    .then(data => {
        authMessage.textContent = data.message;
    })
    .catch(err => console.error(err));
    
    passwordInput.value = '';
});

setAuthMode('login');