// ------------------- Firebase Setup -------------------
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const auth = getAuth();
const db = getFirestore();
const usersCol = collection(db, "users");

// ------------------- Elementos HTML -------------------
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const submitBtn = document.getElementById('submitBtn');
const toggleForm = document.getElementById('toggleForm');
const formTitle = document.getElementById('form-title');

let isLogin = true; // true = login, false = registro

// ------------------- Toggle Login/Registro -------------------
toggleForm.addEventListener('click', () => {
    isLogin = !isLogin;
    formTitle.innerText = isLogin ? "Iniciar Sesión" : "Registrarse";
    submitBtn.innerText = isLogin ? "Iniciar Sesión" : "Registrarse";
    toggleForm.innerText = isLogin ? "Regístrate" : "Inicia sesión";
});

// ------------------- Botón Enviar -------------------
submitBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const pass = passwordInput.value.trim();
    if(!email || !pass) return alert("Completa todos los campos");

    try {
        if(isLogin){
            // LOGIN
            await signInWithEmailAndPassword(auth, email, pass);
            window.location.href = "index.html";
        } else {
            // REGISTRO
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);

            // Guardar usuario en Firestore
            await addDoc(usersCol, {
                uid: userCredential.user.uid,
                email: email,
                isAdmin: false
            });

            alert("Registrado correctamente, ahora inicia sesión");
            isLogin = true;
            formTitle.innerText = "Iniciar Sesión";
            submitBtn.innerText = "Iniciar Sesión";
            toggleForm.innerText = "Regístrate";
        }
    } catch(err) {
        alert(err.message);
    }
});
