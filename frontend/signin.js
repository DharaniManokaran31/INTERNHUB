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

// Form Validation and Submission
const form = document.getElementById('signInForm');
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

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    clearAllErrors();
    let isValid = true;

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailInput.value.trim()) {
        showError(emailInput, 'Email is required');
        isValid = false;
    } else if (!emailRegex.test(emailInput.value)) {
        showError(emailInput, 'Enter a valid email address');
        isValid = false;
    }

    // Password validation
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
    submitButton.textContent = 'Signing In...';

    // Prepare form data
    const formData = {
        email: emailInput.value,
        password: passwordInput.value
    };

    try {
        const response = await fetch("http://localhost:5000/api/students/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Login failed");
        }

        // Store token
        localStorage.setItem("token", data.token);

        // Show success state
        submitButton.textContent = 'Login Successful!';
        submitButton.style.backgroundColor = '#10b981';

        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = "student-dashboard.html";
        }, 1500);

    } catch (error) {
        showMessage(error.message, "error");
        submitButton.disabled = false;
        submitButton.textContent = 'Sign In';
    }


    // Auto-focus first input
    window.addEventListener('load', () => {
        emailInput.focus();
    });

    // Add input validation on blur
    const inputs = document.querySelectorAll('.form-input');
    inputs.forEach(input => {
        input.addEventListener('blur', function () {
            const formGroup = this.closest('.form-group');
            const error = formGroup.querySelector('.error-message');

            if (!this.value.trim()) {
                const label = formGroup.querySelector('.form-label').textContent;
                showError(this, `${label} is required`);
            } else if (this.type === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(this.value)) {
                    showError(this, 'Enter a valid email address');
                } else {
                    error.innerText = '';
                    this.classList.remove('input-error');
                }
            } else if (this.id === 'password' && this.value.length < 8) {
                showError(this, 'Password must be at least 8 characters');
            } else {
                error.innerText = '';
                this.classList.remove('input-error');
            }
        });

        // Clear error on input
        input.addEventListener('input', function () {
            if (this.classList.contains('input-error')) {
                const formGroup = this.closest('.form-group');
                const error = formGroup.querySelector('.error-message');
                error.innerText = '';
                this.classList.remove('input-error');
            }
        });
    });

    // Handle form submission with Enter key
    form.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            form.dispatchEvent(new Event('submit'));
        }
    });
});