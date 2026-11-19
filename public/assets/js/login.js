/**
 * Catetin - Login UI JavaScript
 * Handles password visibility toggle and client-side empty field validation.
 */
(() => {
  const form = document.getElementById("loginForm");
  const username = document.getElementById("username");
  const password = document.getElementById("password");
  const toggle = document.getElementById("passwordToggle");
  const eyeIcon = document.getElementById("eyeIcon");

  // SVG Paths for Password Visibility Icons
  const ICON_EYE_OFF =
    '<path d="M3 3l18 18"></path><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"></path><path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5.2 0 8.7 4.5 9.7 6.2a1.5 1.5 0 0 1 0 1.6 15 15 0 0 1-3.1 3.5"></path><path d="M6.2 6.2A15.8 15.8 0 0 0 2.3 11.2a1.5 1.5 0 0 0 0 1.6C3.3 14.5 6.8 19 12 19c1.2 0 2.3-.2 3.3-.7"></path>';
  const ICON_EYE_ON =
    '<path d="M2.3 12s3.5-7 9.7-7 9.7 7 9.7 7-3.5 7-9.7 7-9.7-7Z"></path><circle cx="12" cy="12" r="3"></circle>';

  [username, password].forEach((field) => {
    if (!field) return;
    field.addEventListener("input", () => {
      if (field.value.trim()) {
        field.classList.remove("is-invalid");
        field.setAttribute("aria-invalid", "false");
      }
    });
  });

  const markInvalid = (field, invalid) => {
    field.classList.toggle("is-invalid", invalid);
    field.setAttribute("aria-invalid", String(invalid));
  };

  // Toggle Password Visibility
  if (toggle && password && eyeIcon) {
    toggle.addEventListener("click", () => {
      const isVisible = password.type === "text";
      password.type = isVisible ? "password" : "text";
      toggle.setAttribute("aria-pressed", String(!isVisible));
      toggle.setAttribute(
        "aria-label",
        isVisible ? "Tampilkan password" : "Sembunyikan password",
      );
      eyeIcon.innerHTML = isVisible ? ICON_EYE_OFF : ICON_EYE_ON;
    });
  }

  // Form Submission Validation
  if (form && username && password) {
    form.addEventListener("submit", (event) => {
      const trimmedUser = username.value.trim();
      const pass = password.value;

      if (!trimmedUser || !pass) {
        event.preventDefault();
        markInvalid(username, !trimmedUser);
        markInvalid(password, !pass);
        if (!trimmedUser) {
          username.focus();
        } else {
          password.focus();
        }
        return;
      }

      // If valid, allow natural submission to POST /login for backend authentication
    });
  }
})();
