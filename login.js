// Dummy users (you can change later)
const users = {
    admin: {
        username: "admin",
        password: "admin123"
    },
    faculty: {
        username: "faculty",
        password: "faculty123"
    }
};

function login() {
    let role = document.getElementById("role").value;
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    // STUDENT → no login required
    if (role === "student") {
        localStorage.setItem("role", "student");
        window.location.href = "student.html";
        return;
    }

    // ADMIN / FACULTY check
    if (users[role] && 
        username === users[role].username && 
        password === users[role].password) {

        localStorage.setItem("role", role);
        window.location.href = "index.html";

    } else {
        alert("Invalid credentials!");
    }
}
