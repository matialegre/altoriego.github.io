document.getElementById("login-btn").addEventListener("click", () => {
    const username = document.getElementById("username").value.trim().toLowerCase();
    const validUsers = ["mati", "chuba", "joako"];

    if (validUsers.includes(username)) {
        // Guardar el nombre de usuario en localStorage
        localStorage.setItem("username", username);
        // Redirigir al dashboard
        window.location.href = "dashboard.html";
    } else {
        document.getElementById("error-message").innerText = "Usuario no válido. Prueba con 'mati', 'chuba' o 'joako'.";
    }
});
