// Password Toggle Functionality
const passwordInput = document.getElementById('password');
const passwordToggle = document.getElementById('passwordToggle');
const eyeIcon = document.getElementById('eyeIcon');
const eyeOffIcon = document.getElementById('eyeOffIcon');

passwordToggle.addEventListener('click', () => {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;

    if (type === 'text') {
        eyeIcon.style.display = 'none';
        eyeOffIcon.style.display = 'block';
    } else {
        eyeIcon.style.display = 'block';
        eyeOffIcon.style.display = 'none';
    }
});

// Role Selection Functionality
const roleButtons = document.querySelectorAll('.role-button');
const roleInput = document.getElementById('roleInput');

roleButtons.forEach(button => {
    button.addEventListener('click', () => {
        roleButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        roleInput.value = button.dataset.role;
    });
});

// Form Validation and Submission
const form = document.getElementById('registrationForm');
const fullNameInput = document.getElementById('fullName');
const emailInput = document.getElementById('email');
const submitButton = document.getElementById('submitButton');

function showError(input, message) {
    const formGroup = input.closest('.form-group');
    const error = formGroup.querySelector('.error-message');
    error.innerText = message;
    input.classList.add('input-error');
}

function clearAllErrors() {
    document.querySelectorAll('.error-message').forEach(el => el.innerText = '');
    document.querySelectorAll('.form-input').forEach(el => el.classList.remove('input-error'));
}

// Message Box Function
function showMessage(message, type = 'success') {
    const box = document.getElementById('messageBox');
    box.textContent = message;
    box.className = `message-box ${type} show`;

    setTimeout(() => {
        box.classList.remove('show');
    }, 3000);
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    clearAllErrors();
    let isValid = true;

    // Full name
    if (!fullNameInput.value.trim()) {
        showError(fullNameInput, 'Full name is required');
        isValid = false;
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailInput.value.trim()) {
        showError(emailInput, 'Email is required');
        isValid = false;
    } else if (!emailRegex.test(emailInput.value)) {
        showError(emailInput, 'Enter a valid email address');
        isValid = false;
    }

    // Password
    if (!passwordInput.value) {
        showError(passwordInput, 'Password is required');
        isValid = false;
    } else if (passwordInput.value.length < 8) {
        showError(passwordInput, 'Password must be at least 8 characters');
        isValid = false;
    }

    if (!isValid) return;

    // Show loading state
    submitButton.disabled = true;
    submitButton.textContent = 'Creating Account...';

    const formData = {
        fullName: fullNameInput.value,
        email: emailInput.value,
        password: passwordInput.value,
        role: roleInput.value
    };

    try {
        const response = await fetch("http://localhost:5000/api/students/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Registration failed");
        }

        // Show success
        submitButton.textContent = 'Account Created!';
        submitButton.style.backgroundColor = '#10b981';

        showMessage('Welcome to InternHub! Your account has been created successfully.', 'success');

        setTimeout(() => {
            form.reset();
            submitButton.disabled = false;
            submitButton.textContent = 'Create Account';
            submitButton.style.backgroundColor = '';

            roleButtons.forEach(btn => btn.classList.remove('active'));
            document.getElementById('studentRole').classList.add('active');
            roleInput.value = 'student';
        }, 2000);

    } catch (error) {
        showMessage(error.message, 'error');
        submitButton.disabled = false;
        submitButton.textContent = 'Create Account';
    }

    // Reset after delay
    setTimeout(() => {
        showMessage('Welcome to InternHub! Your account has been created successfully.', 'success');
        form.reset();
        submitButton.disabled = false;
        submitButton.textContent = 'Create Account';
        submitButton.style.backgroundColor = '';

        roleButtons.forEach(btn => btn.classList.remove('active'));
        document.getElementById('studentRole').classList.add('active');
        roleInput.value = 'student';
    }, 2000);
});

// Auto-focus first input
window.addEventListener('load', () => {
    fullNameInput.focus();
});
