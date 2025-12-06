// ------------------- Firebase Setup -------------------
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();

// ------------------- Detectar usuario logueado -------------------
onAuthStateChanged(auth, user => {
    if(!user){
        // Si no hay usuario logueado, redirige al login
        window.location.href = "login-register.html";
        return;
    }

    // Usuario logueado
    const isAdmin = user.email === "marcosc3010@gmail.com";
    initApp(user, isAdmin);
});

// ------------------- Inicialización de la app -------------------
function initApp(loggedUser, isAdmin){

    // ------------------- LOGOUT -------------------
    const logoutBtn = document.getElementById('logoutBtn');
    if(logoutBtn){
        logoutBtn.addEventListener('click', async () => {
            await signOut(auth);
            window.location.href = "login-register.html";
        });
    }

    // ------------------- CHAT -------------------
    const chatContainer = document.getElementById('chatContainer');
    const chatMessage = document.getElementById('chatMessage');
    const sendBtn = document.getElementById('sendBtn');
    const chatCol = collection(db, "chat");

    if(chatContainer){
        // Escucha mensajes en tiempo real
        onSnapshot(chatCol, snapshot => {
            chatContainer.innerHTML = "";
            snapshot.docs.forEach(docSnap => {
                const msg = docSnap.data();
                const div = document.createElement('div');
                div.textContent = `${msg.user}: ${msg.text}`;
                chatContainer.appendChild(div);
            });
            chatContainer.scrollTop = chatContainer.scrollHeight;
        });

        if(sendBtn){
            sendBtn.addEventListener('click', async () => {
                const text = chatMessage.value.trim();
                if(!text) return;
                await addDoc(chatCol, { user: loggedUser.email, text });
                chatMessage.value = "";
            });
        }
    }

    // ------------------- TAREAS -------------------
    const tareasContainer = document.getElementById('tareasContainer');
    const publicarTareaBtn = document.getElementById('publicarTareaBtn');
    const tareaTitulo = document.getElementById('tareaTitulo');
    const tareaDescripcion = document.getElementById('tareaDescripcion');
    const tareaAdjunto = document.getElementById('tareaAdjunto');
    const tareaFecha = document.getElementById('tareaFecha');
    const tareasCol = collection(db, "tareas");

    async function renderTareas(){
        if(!tareasContainer) return;
        tareasContainer.innerHTML = "";
        const snapshot = await getDocs(tareasCol);
        snapshot.docs.forEach(docSnap => {
            const tarea = { id: docSnap.id, ...docSnap.data() };
            const div = document.createElement('div');
            div.classList.add('tarea');

            let imgHTML = tarea.adjunto ? `<img src="${tarea.adjunto}" alt="Imagen tarea">` : '';
            div.innerHTML = `
                <strong>${tarea.titulo}</strong> (Entrega: ${tarea.fecha})<br>
                ${tarea.descripcion}<br>
                ${imgHTML}
                <div class="comentarios" id="comentarios-${tarea.id}">
                ${tarea.comentarios ? tarea.comentarios.map(c => `<div>${c.user}: ${c.text}</div>`).join('') : ''}
                </div>
                <input type="text" id="inputComentario-${tarea.id}" placeholder="Añadir comentario">
                <button onclick="agregarComentario('${tarea.id}')">Comentar</button>
            `;

            if(isAdmin){
                const delBtn = document.createElement('button');
                delBtn.textContent = "Eliminar";
                delBtn.addEventListener('click', async () => {
                    await deleteDoc(doc(tareasCol, tarea.id));
                    renderTareas();
                });
                div.appendChild(delBtn);
            }

            tareasContainer.appendChild(div);
        });
    }

    // Publicar tarea
    if(publicarTareaBtn){
        publicarTareaBtn.addEventListener('click', async () => {
            const titulo = tareaTitulo.value.trim();
            const descripcion = tareaDescripcion.value.trim();
            const fecha = tareaFecha.value;
            if(!titulo || !descripcion || !fecha) return alert("Completa todos los campos");

            let adjuntoData = "";
            if(tareaAdjunto.files.length > 0){
                const file = tareaAdjunto.files[0];
                const reader = new FileReader();
                reader.onload = async function(e){
                    adjuntoData = e.target.result;
                    await addDoc(tareasCol, {
                        titulo,
                        descripcion,
                        fecha,
                        adjunto: adjuntoData,
                        autor: loggedUser.email,
                        comentarios: []
                    });
                    renderTareas();
                }
                reader.readAsDataURL(file);
            } else {
                await addDoc(tareasCol, {
                    titulo,
                    descripcion,
                    fecha,
                    adjunto: "",
                    autor: loggedUser.email,
                    comentarios: []
                });
                renderTareas();
            }

            // Limpiar inputs
            tareaTitulo.value = "";
            tareaDescripcion.value = "";
            tareaFecha.value = "";
            tareaAdjunto.value = "";
        });
    }

    // Agregar comentario
    window.agregarComentario = async function(id){
        const input = document.getElementById(`inputComentario-${id}`);
        if(!input.value.trim()) return;

        const tareaRef = doc(tareasCol, id);
        const snapshot = await getDocs(tareasCol);
        const tareaSnap = snapshot.docs.find(d => d.id === id);
        const tareaData = tareaSnap.data();
        const comentarios = tareaData.comentarios || [];
        comentarios.push({ user: loggedUser.email, text: input.value.trim() });
        await updateDoc(tareaRef, { comentarios });
        renderTareas();
    }

    renderTareas();

    // ------------------- PANEL ADMIN -------------------
    const alumnosContainer = document.getElementById('alumnosContainer');
    const usersCol = collection(db, "users");

    if(alumnosContainer && isAdmin){
        async function renderUsers(){
            alumnosContainer.innerHTML = "";
            const snapshot = await getDocs(usersCol);
            snapshot.docs.forEach(docSnap => {
                const u = docSnap.data();
                const div = document.createElement('div');
                div.textContent = u.email;
                const delBtn = document.createElement('button');
                delBtn.textContent = "Eliminar";
                delBtn.addEventListener('click', async () => {
                    await deleteDoc(doc(usersCol, docSnap.id));
                    renderUsers();
                });
                div.appendChild(delBtn);
                alumnosContainer.appendChild(div);
            });
        }
        renderUsers();
    }
}
