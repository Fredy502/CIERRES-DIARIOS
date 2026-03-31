// --- IMPORTACIÓN DE LA API DE FIREBASE (VÍA CDN PARA WEB PURA) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Tu configuración real de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBxH5JTpBLYeOSNpemn0WFPtXI-2SZT7NA",
  authDomain: "estuconta.firebaseapp.com",
  projectId: "estuconta",
  storageBucket: "estuconta.firebasestorage.app",
  messagingSenderId: "970697915736",
  appId: "1:970697915736:web:338b1f39d5576c5b99b92d",
  measurementId: "G-2E65817EQ6"
};

// Inicializar Firebase y la Base de Datos
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- FUNCIONES ENVOLTORIO PARA LA BASE DE DATOS (Reemplazo de localStorage) ---
async function obtenerDatosBD(key) {
    try {
        const docRef = doc(db, "appData", key);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data().value;
        } else {
            return null;
        }
    } catch (e) {
        console.error("Error al obtener datos de la BD", e);
        return null;
    }
}

async function guardarDatosBD(key, value) {
    try {
        await setDoc(doc(db, "appData", key), { value: value });
    } catch (e) {
        console.error("Error al guardar datos en la BD", e);
    }
}

document.addEventListener('DOMContentLoaded', async () => {

    // --- 1. BASE DE DATOS DE USUARIOS (DINÁMICA) ---
    const defaultUsersDB = {
        "GD.user01": { pass: "Ax7#Pq29Lm", role: "master" },
        "GD.user02": { pass: "R8v$Kp41Tx", role: "master" },
        "GD.user03": { pass: "Mq5!Zr82Bd", role: "regular" },
        "GD.user04": { pass: "L9x@Wc73Fp", role: "regular" },
        "GD.user05": { pass: "D4#Ny56Qa", role: "regular" },
        "GD.user06": { pass: "J8p$Rt39Ls", role: "regular" },
        "GD.user07": { pass: "Q7!Mb28Xv", role: "regular" },
        "GD.user08": { pass: "Z3@Fd94Kt", role: "regular" },
        "GD.user09": { pass: "T6#Lp51Hw", role: "regular" },
        "GD.user10": { pass: "V2$Xq78Ns", role: "regular" },
        "GD.user11": { pass: "C5!Jt63Wr", role: "regular" },
        "GD.user12": { pass: "K9@Sb20Px", role: "regular" },
        "GD.user13": { pass: "P4#Zd85Lm", role: "regular" },
        "GD.user14": { pass: "N7$Qr46Hv", role: "regular" },
        "GD.user15": { pass: "B8!Yx71Kt", role: "regular" },
        "GD.user16": { pass: "F3@Lm92Qp", role: "regular" },
        "GD.user17": { pass: "R6#Vc38Wd", role: "regular" },
        "GD.user18": { pass: "W5$Xp47Nr", role: "sucursal", sucursal: "CHIQUIMULA" },
        "GD.user19": { pass: "H9!Qt62Lb", role: "sucursal", sucursal: "SAN NICOLAS 1" },
        "GD.user20": { pass: "S2@Zk53Mv", role: "sucursal", sucursal: "SIXTINO" },
        "GD.user21": { pass: "U7#Tr84Px", role: "sucursal", sucursal: "FRUTAL" },
        "GD.user22": { pass: "Y4$Mn26Qk", role: "sucursal", sucursal: "METRONORTE" },
        "GD.user23": { pass: "X9!Lp63Hd", role: "sucursal", sucursal: "NARANJO" },
        "GD.user24": { pass: "E6@Vr45Tb", role: "sucursal", sucursal: "SAN NICOLAS 2" },
        "GD.user25": { pass: "A3#Wq78Ks", role: "sucursal", sucursal: "PERI ROOSEVELT" }
    };

    let usersDB = await obtenerDatosBD('estucontaUsersDB');
    if (!usersDB) {
        usersDB = defaultUsersDB;
        await guardarDatosBD('estucontaUsersDB', usersDB);
    }

    let currentUser = null;

    // --- POBLAR FILTRO DE USUARIOS DE AUDITORÍA AUTOMÁTICAMENTE ---
    const selectUserAuditoria = document.getElementById('filtroUsuarioAuditoria');
    if (selectUserAuditoria) {
        for(let i=1; i<=25; i++) {
            let userNum = i < 10 ? '0'+i : i;
            let opt = document.createElement('option');
            opt.value = `GD.user${userNum}`;
            opt.textContent = `GD.user${userNum}`;
            selectUserAuditoria.appendChild(opt);
        }
    }

    // --- REFERENCIAS DOM ---
    const loginOverlay = document.getElementById('loginOverlay');
    const appContent = document.getElementById('appContent');
    const displayUserLogueado = document.getElementById('displayUserLogueado');
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    // --- INICIALIZAR GRÁFICO TIPO ANILLO (NUEVO) ---
    let chartCierre = null;
    function initChartCierre() {
        const ctx = document.getElementById('cierreChart');
        if(!ctx) return;
        chartCierre = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Monto Cuadrado', 'Diferencia Absoluta'],
                datasets: [{
                    data: [100, 0],
                    backgroundColor: ['#059669', '#dc2626'],
                    borderWidth: 0,
                    cutout: '72%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: true } }
            }
        });
    }
    initChartCierre(); 

    // --- 2. SISTEMA DE LOGIN ---
    async function ejecutarLogin() {
        Swal.fire({title: 'Autenticando...', allowOutsideClick: false, didOpen: () => {Swal.showLoading()}});
        usersDB = await obtenerDatosBD('estucontaUsersDB') || defaultUsersDB; 
        
        const userRaw = document.getElementById('loginUser').value.trim();
        const pass = document.getElementById('loginPass').value;
        const userKey = Object.keys(usersDB).find(k => k.toLowerCase() === userRaw.toLowerCase());
        
        if (userKey && usersDB[userKey].pass === pass) {
            currentUser = { user: userKey, ...usersDB[userKey] };
            loginOverlay.classList.add('hidden');
            appContent.classList.remove('hidden');
            displayUserLogueado.innerHTML = `<i class="fas fa-user-circle"></i> ${currentUser.user} (${currentUser.sucursal ? currentUser.sucursal.toUpperCase() : currentUser.role.toUpperCase()})`;
            
            await registrarAuditoria("INICIO SESIÓN", "El usuario accedió al sistema");
            configurarMenuPorRol();
            await revisarAtrasosSucursales();
            await renderizarNotificaciones();
            
            actualizarUsuarios();
            cargarDatosDiaActual();
            await cargarHistorialBD();
            if(currentUser.role === 'master') { 
                await cargarTablaAuditoria(); 
                await renderizarUsuariosTab();
            }
            Swal.close();
        } else {
            Swal.close();
            document.getElementById('loginError').classList.remove('hidden');
            await registrarAuditoria("ERROR SESIÓN", `Intento fallido de acceso con el usuario: "${userRaw}"`);
        }
    }

    document.getElementById('btnLogin').addEventListener('click', ejecutarLogin);
    document.getElementById('loginPass').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') ejecutarLogin();
    });

    document.getElementById('btnCerrarSesion')?.addEventListener('click', async () => {
        const result = await Swal.fire({
            title: '¿Cerrar Sesión?',
            text: 'Tus datos no guardados se perderán.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, salir',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            await registrarAuditoria("CIERRE SESIÓN", "El usuario salió del sistema");
            currentUser = null;
            appContent.classList.add('hidden');
            loginOverlay.classList.remove('hidden');
            document.getElementById('loginPass').value = '';
            document.getElementById('loginError').classList.add('hidden');
            document.getElementById('notifDropdown').style.display = 'none';
        }
    });

    function configurarMenuPorRol() {
        navItems.forEach(item => item.classList.add('hidden'));
        if (currentUser.role === 'master') {
            document.getElementById('navCaptura').classList.remove('hidden');
            document.getElementById('navDatabase').classList.remove('hidden');
            document.getElementById('navResumen').classList.remove('hidden'); 
            document.getElementById('navAuditoria').classList.remove('hidden');
            document.getElementById('navRepositorio').classList.remove('hidden');
            document.getElementById('navSolicitudes').classList.remove('hidden');
            document.getElementById('textNavSolicitudes').textContent = "Gestión Solicitudes";
            document.getElementById('navConfigNotif').classList.remove('hidden');
            document.getElementById('navUsuarios').classList.remove('hidden'); 
            document.getElementById('btnCampanaNotif').classList.remove('hidden');
            activarTab('tab-captura', 'navCaptura');
            document.getElementById('filtroSucursalReqContainer').classList.remove('hidden');
            document.getElementById('filtroUsuarioReqContainer').classList.remove('hidden');
            document.getElementById('colAccionesReq').classList.remove('hidden');
        } 
        else if (currentUser.role === 'regular') {
            document.getElementById('navCaptura').classList.remove('hidden');
            document.getElementById('navDatabase').classList.remove('hidden');
            document.getElementById('navResumen').classList.remove('hidden'); 
            document.getElementById('navRepositorio').classList.remove('hidden');
            document.getElementById('navSolicitudes').classList.remove('hidden');
            document.getElementById('textNavSolicitudes').textContent = "Mis Solicitudes";
            document.getElementById('btnCampanaNotif').classList.remove('hidden');
            activarTab('tab-captura', 'navCaptura');
            document.getElementById('filtroSucursalReqContainer').classList.add('hidden');
            document.getElementById('filtroUsuarioReqContainer').classList.add('hidden');
            document.getElementById('colAccionesReq').classList.add('hidden');
        }
        else if (currentUser.role === 'sucursal') {
            document.getElementById('navCarga').classList.remove('hidden');
            document.getElementById('navRepositorio').classList.remove('hidden');
            document.getElementById('navSolicitudes').classList.remove('hidden');
            document.getElementById('textNavSolicitudes').textContent = "Mis Solicitudes";
            document.getElementById('btnCampanaNotif').classList.remove('hidden');
            activarTab('tab-carga', 'navCarga');
            document.getElementById('fechaCargaPdf').value = new Date().toISOString().split('T')[0];
            document.getElementById('filtroSucursalReqContainer').classList.add('hidden');
            document.getElementById('filtroUsuarioReqContainer').classList.add('hidden');
            document.getElementById('colAccionesReq').classList.add('hidden');
        }
    }

    async function activarTab(tabId, navId) {
        navItems.forEach(nav => nav.classList.remove('active'));
        tabContents.forEach(tab => tab.classList.add('hidden'));
        document.getElementById(navId).classList.add('active');
        document.getElementById(tabId).classList.remove('hidden');
        
        if(tabId === 'tab-repositorio') await renderizarRepositorio();
        if(tabId === 'tab-config') await renderizarExcepciones();
        if(tabId === 'tab-resumen') await generarResumenMensual();
        if(tabId === 'tab-solicitudes') await renderizarSolicitudes();
        if(tabId === 'tab-usuarios') await renderizarUsuariosTab();
        if(tabId === 'tab-database') await cargarHistorialBD();
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if(!item.classList.contains('hidden')){
                activarTab(item.getAttribute('data-tab'), item.id);
            }
        });
    });

    // --- MÓDULO GESTIÓN DE USUARIOS Y CONTRASEÑAS ---
    function validarPasswordRegex(pwd) {
        if (!pwd) return "La contraseña no puede estar vacía.";
        if (pwd.length > 10) return "La contraseña debe tener máximo 10 caracteres.";
        if (!/[A-Z]/.test(pwd)) return "Debe contener al menos 1 letra mayúscula.";
        if (!/\d/.test(pwd)) return "Debe contener al menos 1 número.";
        if (!/[^A-Za-z0-9]/.test(pwd)) return "Debe contener al menos 1 carácter especial.";
        return null;
    }

    document.getElementById('btnSolicitarCambioPass')?.addEventListener('click', async (e) => {
        e.preventDefault(); 

        const { value: formValues } = await Swal.fire({
            title: 'Recuperación de Acceso',
            html: `
                <p style="font-size:0.85rem; color:#64748b; margin-bottom:15px;">Ingresa los datos que recuerdes. Un maestro revisará tu solicitud.</p>
                <select id="swal-tipo-olvido" class="modern-select swal2-input" style="margin-bottom: 10px; width: 90%;">
                    <option value="contraseña">Olvidé mi contraseña</option>
                    <option value="usuario">Olvidé mi usuario</option>
                    <option value="ambos">Olvidé ambos</option>
                </select>
                <input id="swal-sucursal-rec" class="modern-input swal2-input" placeholder="Sucursal a la que perteneces" style="margin-bottom: 10px;">
                <input id="swal-user" class="modern-input swal2-input" placeholder="Usuario actual (si lo sabes)" style="margin-bottom: 10px;">
                <div style="position: relative; width: 90%; margin: 0 auto 10px auto;">
                    <input id="swal-pass-new" type="password" class="modern-input swal2-input" placeholder="Nueva contraseña deseada" style="margin-bottom: 0px; width: 100%;">
                    <span id="swal-pass-new-toggle" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); cursor: pointer; color: #64748b; font-size: 1rem;">
                        <i class="fas fa-eye"></i>
                    </span>
                </div>
                <p style="font-size:0.75rem; color:#64748b; margin-top:10px;">Requisito: Máx 10 caracteres, 1 mayúscula, 1 número y 1 especial.</p>
            `,
            didOpen: () => {
                const passwordInput = document.getElementById('swal-pass-new');
                const toggleButton = document.getElementById('swal-pass-new-toggle');
                const toggleIcon = toggleButton.querySelector('i');

                toggleButton.addEventListener('click', function() {
                    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                    passwordInput.setAttribute('type', type);
                    
                    if (type === 'password') {
                        toggleIcon.classList.add('fa-eye');
                        toggleIcon.classList.remove('fa-eye-slash');
                    } else {
                        toggleIcon.classList.add('fa-eye-slash');
                        toggleIcon.classList.remove('fa-eye');
                    }
                });
            },
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Enviar Solicitud',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                const tipo = document.getElementById('swal-tipo-olvido').value;
                const sucursal = document.getElementById('swal-sucursal-rec').value.trim();
                const u = document.getElementById('swal-user').value.trim();
                const pn = document.getElementById('swal-pass-new').value.trim();
                if (!sucursal || !pn) { 
                    Swal.showValidationMessage('La sucursal y la nueva contraseña son obligatorias');
                    return false;
                }
                const error = validarPasswordRegex(pn);
                if (error) { 
                    Swal.showValidationMessage(error);
                    return false;
                }
                const userKey = u ? u : `[Desconocido - ${sucursal}]`;
                return { user: userKey, newPass: pn, tipo: tipo, sucursal: sucursal };
            }
        });
        
        if (formValues) {
            Swal.fire({title: 'Enviando...', allowOutsideClick: false, didOpen: () => {Swal.showLoading()}});
            let reqs = await obtenerDatosBD('passRequests') || [];
            reqs = reqs.filter(r => r.user !== formValues.user); 
            reqs.push({ 
                user: formValues.user, 
                newPass: formValues.newPass, 
                date: new Date().toLocaleString(),
                nota: `Olvidó: ${formValues.tipo} (Sucursal: ${formValues.sucursal})` 
            });
            await guardarDatosBD('passRequests', reqs);
            await registrarAuditoria("SISTEMA", `Solicitud de recuperación enviada para: ${formValues.user}`);
            Swal.fire('Solicitud Enviada', 'Tu petición ha sido enviada. Revisa "Novedades de Cuenta" más tarde.', 'success');
        }
    });

    const consultarNovedades = async (e) => {
        if(e) e.preventDefault();
        const defaultUser = currentUser ? currentUser.user : '';
        const { value: user } = await Swal.fire({
            title: 'Novedades de Cuenta',
            text: 'Ingrese su usuario para revisar si el maestro autorizó algún cambio.',
            input: 'text',
            inputValue: defaultUser,
            inputPlaceholder: 'Usuario a consultar...',
            showCancelButton: true,
            confirmButtonText: 'Consultar'
        });
        if (user) {
            Swal.fire({title: 'Consultando...', allowOutsideClick: false, didOpen: () => {Swal.showLoading()}});
            let notifs = await obtenerDatosBD('loginNotifs') || [];
            const nIndex = notifs.findIndex(n => n.oldUser.toLowerCase() === user.trim().toLowerCase() || n.newUser.toLowerCase() === user.trim().toLowerCase());
            if (nIndex > -1) {
                const n = notifs[nIndex];
                notifs.splice(nIndex, 1);
                await guardarDatosBD('loginNotifs', notifs);
                Swal.fire({
                    title: '¡Credenciales Actualizadas!',
                    html: `El usuario Maestro ha procesado tu acceso.<br><br><b>Usuario Válido:</b> ${n.newUser}<br><b>Nueva Contraseña:</b> ${n.newPass}`,
                    icon: 'info',
                    confirmButtonText: 'Entendido'
                });
            } else {
                Swal.fire('Sin novedades', 'No se encontraron cambios pendientes para este usuario.', 'info');
            }
        }
    };

    document.getElementById('btnConsultarCambios')?.addEventListener('click', consultarNovedades);
    document.getElementById('btnConsultarCambiosInterno')?.addEventListener('click', consultarNovedades);

    async function renderizarUsuariosTab() {
        if (!currentUser || currentUser.role !== 'master') return;
        const tbodyReq = document.querySelector('#tablaSolicitudesPass tbody');
        let reqs = await obtenerDatosBD('passRequests') || [];
        tbodyReq.innerHTML = '';
        if (reqs.length === 0) {
            tbodyReq.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #64748b; padding:20px;">No hay solicitudes pendientes</td></tr>`;
        } else {
            reqs.forEach(req => {
                const tr = document.createElement('tr');
                const extraInfo = req.nota ? `<br><span style="font-size:0.75rem; color:#dc2626;">${req.nota}</span>` : '';
                tr.innerHTML = `
                    <td>${req.date}</td>
                    <td><strong>${req.user}</strong>${extraInfo}</td>
                    <td style="color:#2563eb; font-family: monospace; letter-spacing: 1px;">${req.newPass}</td>
                    <td class="action-buttons-cell">
                        <button class="btn-icon download" title="Aprobar Cambio" onclick="window.aprobarPassReq('${req.user}')"><i class="fas fa-check"></i></button>
                        <button class="btn-icon delete" title="Rechazar Cambio" onclick="window.rechazarPassReq('${req.user}')"><i class="fas fa-times"></i></button>
                    </td>
                `;
                tbodyReq.appendChild(tr);
            });
        }

        let currentDB = await obtenerDatosBD('estucontaUsersDB') || defaultUsersDB;
        const tbodyDir = document.querySelector('#tablaDirectorioUsuarios tbody');
        tbodyDir.innerHTML = '';
        
        Object.keys(currentDB).sort().forEach(uKey => {
            const user = currentDB[uKey];
            const isMaster = user.role === 'master';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${uKey}</strong></td>
                <td style="font-family: monospace; letter-spacing: 1px; color:#475569;">${user.pass}</td>
                <td><span class="badge-rol ${isMaster ? 'badge-master' : 'badge-regular'}">${user.role.toUpperCase()}</span></td>
                <td>${user.sucursal || '<span style="color:#94a3b8">Multisucursal</span>'}</td>
                <td class="action-buttons-cell">
                    <button class="btn-icon edit" title="Editar Credenciales" onclick="window.editarUsuarioDB('${uKey}')"><i class="fas fa-user-edit"></i></button>
                </td>
            `;
            tbodyDir.appendChild(tr);
        });
    }

    window.aprobarPassReq = async function(userKey) {
        Swal.fire({title: 'Aprobando...', allowOutsideClick: false, didOpen: () => {Swal.showLoading()}});
        let reqs = await obtenerDatosBD('passRequests') || [];
        const req = reqs.find(r => r.user === userKey);
        if(req) {
            let currentDB = await obtenerDatosBD('estucontaUsersDB') || defaultUsersDB;
            let finalUserKey = userKey;
            
            if(userKey.startsWith('[Desconocido')) {
                finalUserKey = `NUEVO.${Date.now().toString().slice(-4)}`;
            }
            
            if(currentDB[finalUserKey]) {
                currentDB[finalUserKey].pass = req.newPass;
            } else {
                 currentDB[finalUserKey] = { pass: req.newPass, role: "regular" };
            }
            
            let notifs = await obtenerDatosBD('loginNotifs') || [];
            notifs.push({ oldUser: userKey, newUser: finalUserKey, newPass: req.newPass });
            await guardarDatosBD('loginNotifs', notifs);
            
            await guardarDatosBD('estucontaUsersDB', currentDB);
            usersDB = currentDB;
            reqs = reqs.filter(r => r.user !== userKey);
            await guardarDatosBD('passRequests', reqs);
            
            await registrarAuditoria("EDITAR", `Maestro aprobó recuperación de cuenta ${finalUserKey}`);
            await renderizarUsuariosTab();
            Swal.fire('Aprobado', `Usuario Asignado: ${finalUserKey}`, 'success');
        }
    };

    window.rechazarPassReq = async function(userKey) {
        Swal.fire({title: 'Procesando...', allowOutsideClick: false, didOpen: () => {Swal.showLoading()}});
        let reqs = await obtenerDatosBD('passRequests') || [];
        reqs = reqs.filter(r => r.user !== userKey);
        await guardarDatosBD('passRequests', reqs);
        await registrarAuditoria("SISTEMA", `Maestro rechazó el cambio de usuario ${userKey}`);
        await renderizarUsuariosTab();
        Swal.fire('Rechazado', 'Solicitud eliminada.', 'info');
    };

    window.editarUsuarioDB = async function(oldUserKey) {
        let currentDB = await obtenerDatosBD('estucontaUsersDB') || defaultUsersDB;
        const u = currentDB[oldUserKey];
        
        const { value: formValues } = await Swal.fire({
            title: 'Modificar Usuario',
            html: `
                <input id="swal-e-user" class="modern-input swal2-input" value="${oldUserKey}" placeholder="Nuevo nombre de usuario" style="margin-bottom: 10px;">
                <input id="swal-e-pass" class="modern-input swal2-input" value="${u.pass}" placeholder="Nueva contraseña">
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Guardar Cambios',
            preConfirm: () => {
                const newUser = document.getElementById('swal-e-user').value.trim();
                const newPass = document.getElementById('swal-e-pass').value.trim();
                if(!newUser || !newPass) { Swal.showValidationMessage('Campos obligatorios'); return false; }
                const err = validarPasswordRegex(newPass);
                if(err) { Swal.showValidationMessage(err); return false; }
                return { newUser, newPass };
            }
        });
        
        if(formValues) {
            Swal.fire({title: 'Guardando...', allowOutsideClick: false, didOpen: () => {Swal.showLoading()}});
            const role = u.role;
            const sucursal = u.sucursal;
            
            let notifs = await obtenerDatosBD('loginNotifs') || [];
            notifs.push({ oldUser: oldUserKey, newUser: formValues.newUser, newPass: formValues.newPass });
            await guardarDatosBD('loginNotifs', notifs);

            delete currentDB[oldUserKey];
            currentDB[formValues.newUser] = { pass: formValues.newPass, role: role };
            if(sucursal) currentDB[formValues.newUser].sucursal = sucursal;
            
            await guardarDatosBD('estucontaUsersDB', currentDB);
            usersDB = currentDB; 
            await renderizarUsuariosTab();
            Swal.fire('Guardado', 'Datos modificados.', 'success');
        }
    };

    // --- 3. NOTIFICACIONES Y EXCEPCIONES ---
    document.getElementById('btnCampanaNotif')?.addEventListener('click', async () => {
        const dropdown = document.getElementById('notifDropdown');
        dropdown.style.display = dropdown.style.display === 'flex' ? 'none' : 'flex';
        const notifs = await obtenerDatosBD('notifsEstuconta') || [];
        notifs.forEach(n => { 
            if(n.destinatarios.includes(currentUser.role) || n.destinatarios.includes(currentUser.user) || (currentUser.role === 'sucursal' && n.destinatarios.includes(currentUser.sucursal))) {
                n.leida = true; 
            }
        });
        await guardarDatosBD('notifsEstuconta', notifs);
        await renderizarNotificaciones();
    });

    document.getElementById('btnCloseNotifDropdown')?.addEventListener('click', () => {
        document.getElementById('notifDropdown').style.display='none';
    });

    async function agregarNotificacion(mensaje, rolesDestino) {
        const notifs = await obtenerDatosBD('notifsEstuconta') || [];
        notifs.unshift({ id: Date.now(), fecha: new Date().toLocaleString(), mensaje: mensaje, destinatarios: rolesDestino, leida: false });
        await guardarDatosBD('notifsEstuconta', notifs);
        await renderizarNotificaciones();
    }

    async function renderizarNotificaciones() {
        if(!currentUser) return;
        const notifs = await obtenerDatosBD('notifsEstuconta') || [];
        const misNotifs = notifs.filter(n => n.destinatarios.includes(currentUser.role) || n.destinatarios.includes(currentUser.user) || (currentUser.role === 'sucursal' && n.destinatarios.includes(currentUser.sucursal)));
        
        const badge = document.getElementById('notifBadge');
        const unreadCount = misNotifs.filter(n => !n.leida).length;
        if (unreadCount > 0) { 
            badge.style.display = 'flex';
            badge.textContent = unreadCount; 
        } else { 
            badge.style.display = 'none'; 
        }

        const list = document.getElementById('notifList');
        list.innerHTML = '';
        if (misNotifs.length === 0) {
            list.innerHTML = '<li class="notif-item" style="text-align:center; color:#94a3b8;">No hay notificaciones nuevas.</li>';
            return;
        }

        misNotifs.forEach(n => {
            const li = document.createElement('li');
            li.className = `notif-item ${n.leida ? '' : 'unread'}`;
            li.innerHTML = `${n.mensaje} <span class="time">${n.fecha}</span>`;
            list.appendChild(li);
        });
    }

    document.getElementById('btnAgregarExcepcion')?.addEventListener('click', async () => {
        const suc = document.getElementById('configSucursal').value;
        const fec = document.getElementById('configFechaExcepcion').value;
        if(!fec) return Swal.fire('Atención', 'Seleccione una fecha válida', 'warning');

        Swal.fire({title: 'Guardando...', allowOutsideClick: false, didOpen: () => {Swal.showLoading()}});
        const excepciones = await obtenerDatosBD('excepcionesAtrasos') || [];
        excepciones.push({ sucursal: suc, fecha: fec });
        await guardarDatosBD('excepcionesAtrasos', excepciones);
        Swal.fire('Guardado', 'Excepción agregada exitosamente', 'success');
        await renderizarExcepciones();
    });

    async function renderizarExcepciones() {
        const list = document.getElementById('listaExcepciones');
        if(!list) return;
        list.innerHTML = '';
        const excepciones = await obtenerDatosBD('excepcionesAtrasos') || [];
        excepciones.forEach((e, idx) => {
            const li = document.createElement('li');
            li.style.cssText = "padding: 8px; border-bottom: 1px solid #e2e8f0; display:flex; justify-content:space-between;";
            li.innerHTML = `<span><strong>${e.sucursal}</strong> - Exceptuado el: ${e.fecha}</span> <button class="btn-del" onclick="window.borrarExcepcion(${idx})"><i class="fas fa-trash"></i></button>`;
            list.appendChild(li);
        });
    }

    window.borrarExcepcion = async function(idx) {
        Swal.fire({title: 'Borrando...', allowOutsideClick: false, didOpen: () => {Swal.showLoading()}});
        const excepciones = await obtenerDatosBD('excepcionesAtrasos') || [];
        excepciones.splice(idx, 1);
        await guardarDatosBD('excepcionesAtrasos', excepciones);
        await renderizarExcepciones();
        Swal.close();
    };

    async function revisarAtrasosSucursales() {
        const ayer = new Date();
        ayer.setDate(ayer.getDate() - 1);
        const fechaAyer = ayer.toISOString().split('T')[0];
        const repo = await obtenerDatosBD('repoArchivos') || [];
        const excepciones = await obtenerDatosBD('excepcionesAtrasos') || [];
        const sucursales = ["CHIQUIMULA", "SAN NICOLAS 1", "SIXTINO", "FRUTAL", "METRONORTE", "NARANJO", "SAN NICOLAS 2", "PERI ROOSEVELT"];
        
        sucursales.forEach(async sucursal => {
            const esExcepcion = excepciones.some(e => e.sucursal === sucursal && e.fecha === fechaAyer);
            if (esExcepcion) return; 

            const subioArchivo = repo.some(r => r.sucursal === sucursal && r.fecha === fechaAyer);
            if (!subioArchivo) {
                const claveAtraso = `atraso_${sucursal}_${fechaAyer}`;
                const historialAtrasos = await obtenerDatosBD('historialAtrasosVistos') || [];
                
                if (!historialAtrasos.includes(claveAtraso)) {
                    await agregarNotificacion(`⚠️ ALERTA: La sucursal ${sucursal} NO ha subido la documentación del día ${fechaAyer}.`, ['master', 'regular', sucursal]);
                    historialAtrasos.push(claveAtraso);
                    await guardarDatosBD('historialAtrasosVistos', historialAtrasos);
                }
            }
        });
    }

    // --- 4. CARGA PDF Y REPOSITORIO ---
    let tempFileDataUrl = null;
    let tempFileName = "";

    const archivoPdf = document.getElementById('archivoPdf');
    const dropzone = document.getElementById('dropzonePdf');
    const fileInfo = document.getElementById('fileInfoDisplay');
    const fileNameDisp = document.getElementById('fileNameDisplay');
    const btnRemove = document.getElementById('btnRemoveFile');
    const btnPreview = document.getElementById('btnPrevisualizarPdf');
    const btnSubir = document.getElementById('btnSubirPdf');

    document.getElementById('dropzonePdf')?.addEventListener('click', () => document.getElementById('archivoPdf').click());

    dropzone?.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.style.borderColor = "var(--accent)"; dropzone.style.background = "#eff6ff"; });
    dropzone?.addEventListener('dragleave', (e) => { e.preventDefault(); dropzone.style.borderColor = "#cbd5e1"; dropzone.style.background = "#f8fafc"; });
    dropzone?.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = "#cbd5e1"; dropzone.style.background = "#f8fafc";
        if(e.dataTransfer.files.length) { archivoPdf.files = e.dataTransfer.files; archivoPdf.dispatchEvent(new Event('change')); }
    });

    archivoPdf?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if(file) {
            if (file.type !== 'application/pdf') { Swal.fire('Formato incorrecto', 'PDF únicamente.', 'warning'); archivoPdf.value = ''; return; }
            tempFileName = file.name; fileNameDisp.textContent = tempFileName; dropzone.classList.add('hidden'); fileInfo.classList.remove('hidden');
            const reader = new FileReader();
            reader.onload = (ev) => { 
                tempFileDataUrl = ev.target.result; 
                btnPreview.style.display = 'flex'; 
                btnSubir.style.width = '48%'; 
            };
            reader.readAsDataURL(file);
        }
    });

    btnRemove?.addEventListener('click', () => {
        archivoPdf.value = ''; tempFileDataUrl = null;
        dropzone.classList.remove('hidden'); fileInfo.classList.add('hidden');
        btnPreview.style.display = 'none'; btnSubir.style.width = '100%';
    });

    btnPreview?.addEventListener('click', () => {
        if(tempFileDataUrl) { 
            window.verDocumentoRepositorio(tempFileDataUrl); 
        }
    });

    document.getElementById('btnCerrarPreview')?.addEventListener('click', () => {
        document.getElementById('modalPreview').classList.add('hidden');
        document.getElementById('pdfPreviewFrame').src = ''; 
    });

    btnSubir?.addEventListener('click', async () => {
        const fecha = document.getElementById('fechaCargaPdf').value;
        if(!fecha || !archivoPdf.files[0]) return Swal.fire('Atención', 'Fecha y archivo requeridos.', 'warning');

        Swal.fire({title: 'Subiendo a la nube...', allowOutsideClick: false, didOpen: () => {Swal.showLoading()}});
        const file = archivoPdf.files[0];
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            try {
                const repositorio = await obtenerDatosBD('repoArchivos') || [];
                repositorio.push({ 
                    sucursal: currentUser.sucursal, fecha: fecha, 
                    archivo: file.name, fileData: e.target.result, 
                    usuarioCarga: currentUser.user, fechaSubida: new Date().toLocaleString() 
                });
                await guardarDatosBD('repoArchivos', repositorio);
                await agregarNotificacion(`✅ Sucursal ${currentUser.sucursal} subió el archivo del día ${fecha}.`, ['master']);
                Swal.fire('Completado', 'Archivo guardado en el servidor.', 'success');
                btnRemove.click();
                await cargarHistorialBD(); 
            } catch(error) {
                console.error(error);
                Swal.fire('Error', 'El archivo podría ser muy grande para la capa gratuita. Considera comprimir el PDF.', 'error');
            }
        };
        reader.readAsDataURL(file);
    });

    async function renderizarRepositorio() {
        const repo = await obtenerDatosBD('repoArchivos') || [];
        const container = document.getElementById('treeViewContainer');
        if(!container) return; container.innerHTML = '';
        
        const sucursalesPermitidas = (currentUser.role === 'sucursal') ? [currentUser.sucursal] : ["CHIQUIMULA", "SAN NICOLAS 1", "SIXTINO", "FRUTAL", "METRONORTE", "NARANJO", "SAN NICOLAS 2", "PERI ROOSEVELT"];
        
        sucursalesPermitidas.forEach(sucursal => {
            const detSucursal = document.createElement('details'); detSucursal.className = 'folder folder-root';
            detSucursal.innerHTML = `<summary>${sucursal}</summary>`;
            const archivos = repo.filter(r => r.sucursal === sucursal);
            archivos.forEach(archivo => {
                const divFile = document.createElement('div'); divFile.className = 'file-item';
                divFile.innerHTML = `
                    <div class="file-item-info"><i class="fas fa-file-pdf"></i> <strong>${archivo.archivo}</strong> (${archivo.fecha})</div>
                    <button class="btn-download" onclick="window.descargarDocumentoReal('${archivo.archivo}', '${archivo.fileData}')"><i class="fas fa-download"></i></button>
                `;
                detSucursal.appendChild(divFile);
            });
            container.appendChild(detSucursal);
        });
    }

    window.descargarDocumentoReal = function(name, data) {
        const link = document.createElement('a');
        link.href = data; link.download = name; link.click();
    };

    window.verDocumentoRepositorio = function(base64) {
        let srcUrl = base64;
        if (!srcUrl.includes('#toolbar=0')) {
            srcUrl += '#toolbar=0';
        }
        document.getElementById('pdfPreviewFrame').src = srcUrl;
        document.getElementById('modalPreview').classList.remove('hidden');
    }

    // --- 5. AUDITORÍA Y PERMISOS ---
    async function registrarAuditoria(accion, detalle) {
        if (!currentUser && accion !== "ERROR SESIÓN") return;
        const auditoria = await obtenerDatosBD('auditoriaEstuconta') || [];
        auditoria.unshift({
            fecha: new Date().toLocaleString(),
            usuario: currentUser ? currentUser.user : 'SISTEMA', 
            rol: currentUser ? currentUser.role : 'sistema', 
            accion: accion, detalle: detalle
        });
        await guardarDatosBD('auditoriaEstuconta', auditoria);
    }

    async function cargarTablaAuditoria(filtros = {}) {
        const auditoria = await obtenerDatosBD('auditoriaEstuconta') || [];
        const tbody = document.querySelector('#tablaAuditoria tbody');
        if(!tbody) return; tbody.innerHTML = '';
        
        let datosFiltrados = auditoria;
        if (filtros.texto) {
            const txt = filtros.texto.toLowerCase();
            datosFiltrados = datosFiltrados.filter(a => a.detalle.toLowerCase().includes(txt) || a.usuario.toLowerCase().includes(txt));
        }
        if (filtros.accion) {
            datosFiltrados = datosFiltrados.filter(a => a.accion === filtros.accion);
        }
        if (filtros.usuario) {
            datosFiltrados = datosFiltrados.filter(a => a.usuario === filtros.usuario);
        }

        datosFiltrados.slice(0, 50).forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${item.fecha}</td><td>${item.usuario}</td><td>${item.accion}</td><td>${item.detalle}</td>`;
            tbody.appendChild(tr);
        });
    }

    document.getElementById('btnBuscarAuditoria')?.addEventListener('click', () => {
        const texto = document.getElementById('filtroTextoAuditoria').value;
        const accion = document.getElementById('filtroAccionAuditoria').value;
        const usuario = document.getElementById('filtroUsuarioAuditoria').value;
        cargarTablaAuditoria({ texto, accion, usuario });
    });

    // --- 6. PANEL CIERRE DIARIO ---
    const formasPago = ["EFECTIVO", "CHEQUE", "TRANSFERENCIA", "DEPÓSITOS", "POS BAC", "COMPRA CLICK", "POS MÓVIL BAC", "POS VISA", "VISALINK", "CRÉDITOS EMPRESAS", "CXC NÓMINA", "GIFTCARD"];
    const bancosList = ["N/A", "Banco Industrial", "Banrural", "BAC Credomatic", "G&T Continental", "BAM", "Promerica", "Interbanco", "Ficohsa", "Vivibanco", "Citibank", "Banco Azteca"];
    
    const sucursalSelect = document.getElementById('sucursalSelect');
    const turnoSelect = document.getElementById('turnoSelect');
    const fechaInput = document.getElementById('fechaInput');
    const tablaPagosBody = document.querySelector('#tablaPagos tbody');
    
    const datosUsuarios = {
        "1": { "ICALDERO01": "CH1-", "USUARIO PROVISIONAL": "CN3-" },
        "2": { "RSNXAMXX01": "SN17-", "RSNXPMXX01": "SN18-", "RELIASXX01": "SN19-", "UPROVISI02": "SN13-" },
        "3": { "RSIXTINO01": "SX6-", "CSXXXXXX01": "SX8-", "USUARIO PROVISIONAL": "SX4-" },
        "4": { "RFRXAMXX01": "FT17-", "RFRXPMXX01": "FT18-", "LRIVERAX01": "FT19-", "CFRXXXXX01": "FT27-", "DMORALES01": "FT12-" },
        "5": { "RMETRONO01": "MN12-", "CMNXXXXX01": "MN14-", "ASISTENTE MN": "MN13-", "USUARIO PROVISIONAL": "MN1-" },
        "6": { "RNRXAMXX01": "NR1-", "RNRXPMXX01": "NR2-", "ASISTENTE NR": "NR4-", "USUARIO PROFESIONAL": "NR3-" },
        "7": { "RNIXAMXX01": "NI1-", "RNIXPMXX01": "NI2-", "UPROVISI07": "NI3-" },
        "8": { "RPEXAMXX01": "PR1-", "RPEXPMXX01": "PR2-", "USUARIO PROVISIONAL": "PR3-" }
    };

    function actualizarUsuarios() {
        const idSucursal = sucursalSelect?.value;
        const usuarios = Object.keys(datosUsuarios[idSucursal] || {});
        if(turnoSelect){
            turnoSelect.innerHTML = '';
            usuarios.forEach(u => { const op = document.createElement('option'); op.value = u; op.textContent = u; turnoSelect.appendChild(op); });
        }
    }
    sucursalSelect?.addEventListener('change', actualizarUsuarios);

    const filtroSucursalResumen = document.getElementById('filtroSucursalResumen');
    const filtroUsuarioResumen = document.getElementById('filtroUsuarioResumen');
    
    filtroSucursalResumen?.addEventListener('change', () => {
        if(!filtroUsuarioResumen) return;
        filtroUsuarioResumen.innerHTML = '<option value="">TODOS LOS USUARIOS</option>';
        
        const sucursalMap = {
            "CHIQUIMULA": "1", "SAN NICOLAS 1": "2", "SIXTINO": "3",
            "FRUTAL": "4", "METRONORTE": "5", "NARANJO": "6",
            "SAN NICOLAS 2": "7", "PERI ROOSEVELT": "8"
        };
        const sucursalVal = filtroSucursalResumen.value;
        if(sucursalVal && sucursalMap[sucursalVal]) {
            const usuarios = Object.keys(datosUsuarios[sucursalMap[sucursalVal]] || {});
            usuarios.forEach(u => {
                const op = document.createElement('option');
                op.value = u; op.textContent = u;
                filtroUsuarioResumen.appendChild(op);
            });
        }
    });

    function crearFilaPago(data = null) {
        if(!tablaPagosBody) return;
        const row = document.createElement('tr');
        
        const formaPago = data?.formaPago || 'EFECTIVO';
        const banco = data?.banco || 'N/A';
        const montoCierre = data && data.montoCierre !== undefined ? data.montoCierre : '';
        const montoFisico = data && data.montoFisico !== undefined ? data.montoFisico : '';
        const documento = data?.documento || '';
        const fechaDoc = data?.fechaDoc || '';

        row.innerHTML = `
            <td style="text-align: center;"><button class="btn-del" title="Eliminar fila"><i class="fas fa-trash-alt"></i></button></td>
            <td><select class="table-select m-forma">${formasPago.map(f => `<option ${formaPago === f ? 'selected' : ''}>${f}</option>`).join('')}</select></td>
            <td><select class="table-select m-banco">${bancosList.map(b => `<option ${banco === b ? 'selected' : ''}>${b}</option>`).join('')}</select></td>
            <td><input type="number" class="table-input m-cierre" value="${montoCierre}" step="0.01"></td>
            <td><input type="number" class="table-input m-fisico" value="${montoFisico}" step="0.01"></td>
            <td><input type="text" class="table-input m-doc" value="${documento}"></td>
            <td><input type="date" class="table-input m-fecha" value="${fechaDoc}"></td>
            <td class="m-diff" style="text-align: right; font-weight:bold;">0.00</td>
        `;
        row.querySelector('.btn-del').onclick = () => { row.remove(); calcularTotales(); };
        row.querySelectorAll('input, select').forEach(el => el.addEventListener('input', calcularTotales));
        tablaPagosBody.appendChild(row); calcularTotales();
    }

    document.getElementById('addFilaBtn')?.addEventListener('click', () => crearFilaPago());

    function calcularTotales() {
        let tC = 0, tF = 0;
        document.querySelectorAll('#tablaPagos tbody tr').forEach(row => {
            const c = parseFloat(row.querySelector('.m-cierre').value) || 0;
            const f = parseFloat(row.querySelector('.m-fisico').value) || 0;
            const d = c - f; row.querySelector('.m-diff').textContent = d.toFixed(2);
            tC += c; tF += f;
        });
        document.getElementById('totalCierre').textContent = tC.toFixed(2);
        document.getElementById('totalFisico').textContent = tF.toFixed(2);
        document.getElementById('totalDiferencia').textContent = (tC - tF).toFixed(2);

        const displayCierre = document.getElementById('displayTotalCierre');
        const displayDiff = document.getElementById('displayTotalDiff');
        if (displayCierre) displayCierre.textContent = 'Q ' + tC.toFixed(2);
        let diffAbs = Math.abs(tC - tF);
        if (displayDiff) displayDiff.textContent = 'Q ' + diffAbs.toFixed(2);

        if (chartCierre) {
            let proporcionCuadrada = tF;
            let proporcionDiferencia = diffAbs;
            if (tC === 0 && tF === 0) { proporcionCuadrada = 100; proporcionDiferencia = 0; }
            chartCierre.data.datasets[0].data = [proporcionCuadrada, proporcionDiferencia];
            chartCierre.update();
        }
    }

    function cargarDatosDiaActual() { if(tablaPagosBody) { tablaPagosBody.innerHTML = ''; for(let i=0; i<3; i++) crearFilaPago(); } }

    document.getElementById('btnGuardarCierre')?.addEventListener('click', async () => {
        Swal.fire({title: 'Guardando registro...', allowOutsideClick: false, didOpen: () => {Swal.showLoading()}});
        const selectElement = document.getElementById('sucursalSelect');
        const sucursalNombre = selectElement.options[selectElement.selectedIndex].text;
        let historial = await obtenerDatosBD('historialCierresEstuconta') || [];
        
        const detalles = [];
        document.querySelectorAll('#tablaPagos tbody tr').forEach(row => {
            detalles.push({
                formaPago: row.querySelector('.m-forma').value,
                banco: row.querySelector('.m-banco').value,
                montoCierre: row.querySelector('.m-cierre').value || '0',
                montoFisico: row.querySelector('.m-fisico').value || '0',
                documento: row.querySelector('.m-doc').value,
                fechaDoc: row.querySelector('.m-fecha').value,
                diferencia: row.querySelector('.m-diff').textContent
            });
        });

        let alertaDuplicado = null;
        for (let d of detalles) {
            if (d.documento.trim() !== '' && d.montoFisico !== '' && d.fechaDoc !== '') {
                for (let c of historial) {
                    if (window.cierreEnEdicionId && c.id === window.cierreEnEdicionId) continue;
                    for (let cd of (c.detalles || [])) {
                        if (cd.formaPago === d.formaPago &&
                            cd.banco === d.banco &&
                            parseFloat(cd.montoFisico) === parseFloat(d.montoFisico) &&
                            cd.documento.trim().toLowerCase() === d.documento.trim().toLowerCase() &&
                            cd.fechaDoc === d.fechaDoc) {
                            alertaDuplicado = `<b>Forma de Pago:</b> ${d.formaPago}<br><b>Banco:</b> ${d.banco}<br><b>Monto:</b> Q${parseFloat(d.montoFisico).toFixed(2)}<br><b>Documento:</b> ${d.documento}<br><b>Fecha Doc:</b> ${d.fechaDoc}<br><br><span style="color:var(--danger)"><b>Registrado anteriormente en:</b></span><br><b>Sucursal:</b> ${c.sucursal}<br><b>Fecha del Cierre:</b> ${c.fechaCierre}<br><b>Usuario:</b> ${c.usuario}<br><b>ID Cierre:</b> ${c.id}`;
                            break;
                        }
                    }
                    if (alertaDuplicado) break;
                }
            }
            if (alertaDuplicado) break;
        }

        if (alertaDuplicado) {
            return Swal.fire({
                title: '¡Alerta de Documento Duplicado!',
                html: `Se ha detectado que la información ingresada ya existe en otro cierre de la base de datos:<br><br>${alertaDuplicado}<br><br><b>Por favor, verifique la información.</b>`,
                icon: 'warning',
                confirmButtonText: 'Entendido'
            });
        }

        if (window.cierreEnEdicionId) {
            const index = historial.findIndex(x => x.id === window.cierreEnEdicionId);
            if(index !== -1) {
                historial[index].usuario = document.getElementById('turnoSelect').value;
                historial[index].fechaCierre = document.getElementById('fechaInput').value;
                historial[index].fechaRecibido = document.getElementById('fechaRecibido').value;
                historial[index].notas = document.getElementById('notas').value;
                historial[index].totalCierre = document.getElementById('totalCierre').textContent;
                historial[index].totalFisico = document.getElementById('totalFisico').textContent;
                historial[index].totalDiferencia = document.getElementById('totalDiferencia').textContent;
                historial[index].detalles = detalles;
                historial[index].ediciones = (historial[index].ediciones || 0) + 1;
            }
            window.cierreEnEdicionId = null;
            await registrarAuditoria("EDITAR", `Cierre editado en ${sucursalNombre}`);
        } else {
            const nuevoCierre = {
                id: Date.now(), 
                sucursal: sucursalNombre,
                usuario: document.getElementById('turnoSelect').value,
                fechaCierre: document.getElementById('fechaInput').value,
                fechaRecibido: document.getElementById('fechaRecibido').value,
                notas: document.getElementById('notas').value,
                totalCierre: document.getElementById('totalCierre').textContent,
                totalFisico: document.getElementById('totalFisico').textContent,
                totalDiferencia: document.getElementById('totalDiferencia').textContent,
                ediciones: 0,
                detalles: detalles
            };
            historial.push(nuevoCierre);
            await registrarAuditoria("AGREGAR", `Cierre guardado en ${sucursalNombre}`);
        }

        await guardarDatosBD('historialCierresEstuconta', historial);
        Swal.fire('Guardado', 'Cierre guardado exitosamente en la BD.', 'success');
        cargarDatosDiaActual();
        
        document.getElementById('fechaRecibido').value = '';
        document.getElementById('notas').value = '';
        
        await cargarHistorialBD(); 
    });

    // --- 7. HISTORIAL BASE DE DATOS ---
    async function cargarHistorialBD() {
        const historial = await obtenerDatosBD('historialCierresEstuconta') || [];
        const tbody = document.querySelector('#tablaHistorial tbody');
        if(!tbody) return; tbody.innerHTML = '';
        if (historial.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center;">No hay registros disponibles.</td></tr>`;
            return;
        }

        historial.sort((a,b) => b.id - a.id).forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${c.fechaRecibido || '-'}</td>
                <td>${c.fechaCierre}</td>
                <td>${c.sucursal}</td>
                <td>${c.usuario}</td>
                <td>Q${c.totalCierre}</td>
                <td>Q${c.totalFisico}</td>
                <td>${c.totalDiferencia || '-'}</td>
                <td class="action-buttons-cell">
                    <button class="btn-icon" title="Ver Detalles" onclick="window.verDetalleCierre(${c.id})"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon" title="Descargar" onclick="window.descargarOpcionesCierre(${c.id})"><i class="fas fa-download"></i></button>
                    <button class="btn-icon" title="Editar" onclick="window.editarCierre(${c.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon" title="Eliminar" style="color:var(--danger);" onclick="window.solicitarEliminarCierre(${c.id})"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    document.getElementById('btnActualizarHistorial')?.addEventListener('click', cargarHistorialBD);

    window.verDetalleCierre = async function(id) {
        Swal.fire({title: 'Cargando...', allowOutsideClick: false, didOpen: () => {Swal.showLoading()}});
        const historial = await obtenerDatosBD('historialCierresEstuconta') || [];
        const repo = await obtenerDatosBD('repoArchivos') || [];
        const c = historial.find(x => x.id === id);
        if(!c) return;

        const matchPdf = repo.find(r => r.sucursal.toUpperCase() === c.sucursal.toUpperCase() && r.fecha === c.fechaCierre);
        let pdfSection = '';
        if (matchPdf) {
            pdfSection = `
                <div style="margin-top: 25px; text-align: center; background: rgba(5, 150, 105, 0.08); padding: 15px; border-radius: 8px; border: 1px dashed var(--success);">
                    <p style="margin: 0 0 12px 0; color: var(--success); font-weight: 600;"><i class="fas fa-check-circle"></i> Documento PDF adjunto disponible en el Repositorio (${c.fechaCierre})</p>
                    <button class="btn btn-verde" style="margin: 0 auto; justify-content: center; font-size: 0.95rem; padding: 12px 25px;"
onclick="window.verDocumentoRepositorio('${matchPdf.fileData}')">
                        <i class="fas fa-file-pdf"></i> Visualizar Archivo
                    </button>
                </div>
            `;
        } else {
             pdfSection = `
                <div style="margin-top: 25px; text-align: center; background: rgba(220, 38, 38, 0.05); padding: 15px; border-radius: 8px; border: 1px dashed rgba(220, 38, 38, 0.4);">
                    <p style="margin: 0; color: var(--danger); font-size: 0.9rem;"><i class="fas fa-exclamation-triangle"></i> No hay un documento PDF consolidado cargado en el repositorio para la fecha y sucursal indicadas.</p>
                </div>
            `;
        }

        let html = `
            <div style="margin-bottom: 20px; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid var(--border);">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <p style="margin: 0;"><strong><i class="fas fa-store text-accent"></i> Sucursal:</strong><br> <span style="font-size: 1.1rem; color: var(--primary);">${c.sucursal}</span></p>
                    <p style="margin: 0;"><strong><i class="fas fa-calendar-day text-accent"></i> Fecha Cierre:</strong><br> <span style="font-size: 1.1rem; color: var(--primary);">${c.fechaCierre}</span></p>
                    <p style="margin: 0;"><strong><i class="fas fa-user-circle text-accent"></i> Usuario / Turno:</strong><br> <span style="font-size: 1.1rem; color: var(--primary);">${c.usuario}</span></p>
                    <p style="margin: 0;"><strong><i class="fas fa-inbox text-accent"></i> Fecha Recibido:</strong><br> <span style="font-size: 1.1rem; color: var(--primary);">${c.fechaRecibido || '<em style="color:#94a3b8;">No especificada</em>'}</span></p>
                </div>
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--border);">
                    <p style="margin: 0;"><strong><i class="fas fa-comment-dots text-accent"></i> Notas de Observación:</strong><br> <span style="color: var(--secondary);">${c.notas || '<em style="color:#94a3b8;">Ninguna observación registrada</em>'}</span></p>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-top: 20px; padding: 15px; background: white; border-radius: 10px; border: 1px solid var(--border); box-shadow: var(--shadow-sm);">
                    <div style="text-align: center; border-right: 1px solid var(--border);">
                        <span style="font-size: 0.75rem; color: var(--secondary); font-weight: 700;">TOTAL SISTEMA</span><br>
                        <strong style="font-size: 1.4rem; color: var(--primary);">Q ${c.totalCierre || '0.00'}</strong>
                    </div>
                    <div style="text-align: center; border-right: 1px solid var(--border);">
                        <span style="font-size: 0.75rem; color: var(--secondary); font-weight: 700;">TOTAL FÍSICO</span><br>
                        <strong style="font-size: 1.4rem; color: var(--success);">Q ${c.totalFisico || '0.00'}</strong>
                    </div>
                    <div style="text-align: center;">
                        <span style="font-size: 0.75rem; color: var(--secondary); font-weight: 700;">DIFERENCIA TOTAL</span><br>
                        <strong style="font-size: 1.4rem; color: var(--danger);">Q ${c.totalDiferencia || '0.00'}</strong>
                    </div>
                </div>
                
                <p style="margin: 15px 0 0 0; font-size: 0.8rem; color: #64748b; text-align: right;"><strong>Ediciones Realizadas:</strong> ${c.ediciones || 0} / 2</p>
            </div>
            
            <h3 style="font-size: 1.1rem; margin-bottom: 10px; color: var(--primary);"><i class="fas fa-list-alt text-accent"></i> Detalle Desglosado de Documentación</h3>
            <div style="overflow-x: auto; border: 1px solid var(--border); border-radius: 8px;">
                <table class="modern-table" style="width: 100%; font-size: 0.85rem; margin: 0;">
                    <thead style="background: var(--primary); color: white;">
                        <tr>
                            <th style="color: white; border-right: 1px solid rgba(255,255,255,0.1);">Forma Pago</th>
                            <th style="color: white; border-right: 1px solid rgba(255,255,255,0.1);">Banco</th>
                            <th style="color: white; border-right: 1px solid rgba(255,255,255,0.1);">Documento</th>
                            <th style="color: white; border-right: 1px solid rgba(255,255,255,0.1);">Fecha Doc</th>
                            <th style="color: white; text-align: right; border-right: 1px solid rgba(255,255,255,0.1);">Cierre (Q)</th>
                            <th style="color: white; text-align: right; border-right: 1px solid rgba(255,255,255,0.1);">Físico (Q)</th>
                            <th style="color: white; text-align: right;">Diferencia (Q)</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        (c.detalles || []).forEach(d => {
            html += `
                <tr>
                    <td style="font-weight: 600;">${d.formaPago}</td>
                    <td>${d.banco}</td>
                    <td>${d.documento || '-'}</td>
                    <td>${d.fechaDoc || '-'}</td>
                    <td style="text-align: right; color: var(--primary);">Q ${parseFloat(d.montoCierre || 0).toFixed(2)}</td>
                    <td style="text-align: right; color: var(--success);">Q ${parseFloat(d.montoFisico || 0).toFixed(2)}</td>
                    <td style="text-align: right; color: var(--danger); font-weight: bold;">Q ${parseFloat(d.diferencia || 0).toFixed(2)}</td>
                </tr>
            `;
        });
        html += `</tbody></table></div>`;
        html += pdfSection;
        
        Swal.close();
        document.getElementById('modalDetallesBody').innerHTML = html;
        document.getElementById('modalDetalles').classList.remove('hidden');
    }

    document.getElementById('btnCerrarModal')?.addEventListener('click', () => {
        document.getElementById('modalDetalles').classList.add('hidden');
    });

    window.descargarOpcionesCierre = function(id) {
        Swal.fire({
            title: 'Seleccione formato',
            input: 'select',
            inputOptions: { 'pdf': 'PDF', 'excel': 'Excel', 'jpg': 'JPG' },
            showCancelButton: true,
            confirmButtonText: 'Descargar'
        }).then(res => {
            if(res.isConfirmed) {
                Swal.fire('Descargando', `Generando archivo en formato ${res.value.toUpperCase()}...`, 'success');
            }
        });
    }

    window.editarCierre = async function(id) {
        const historial = await obtenerDatosBD('historialCierresEstuconta') || [];
        const c = historial.find(x => x.id === id);
        if(!c) return;
        if((c.ediciones || 0) >= 2) {
            return Swal.fire('Límite alcanzado', 'Este cierre ya ha sido editado el máximo de 2 veces.', 'error');
        }
        
        const sucursalMap = {
            "CHIQUIMULA": "1", "SAN NICOLAS 1": "2", "SIXTINO": "3",
            "FRUTAL": "4", "METRONORTE": "5", "NARANJO": "6",
            "SAN NICOLAS 2": "7", "PERI ROOSEVELT": "8"
        };
        if (sucursalSelect && sucursalMap[c.sucursal.toUpperCase()]) {
            sucursalSelect.value = sucursalMap[c.sucursal.toUpperCase()];
            actualizarUsuarios();
        }

        setTimeout(() => {
            document.getElementById('fechaInput').value = c.fechaCierre || '';
            const turnoSel = document.getElementById('turnoSelect');
            if (turnoSel) {
                let userExists = Array.from(turnoSel.options).some(opt => opt.value === c.usuario);
                if(!userExists) {
                    const opt = document.createElement('option');
                    opt.value = c.usuario;
                    opt.textContent = c.usuario;
                    turnoSel.appendChild(opt);
                }
                turnoSel.value = c.usuario;
            }

            document.getElementById('fechaRecibido').value = c.fechaRecibido || '';
            document.getElementById('notas').value = c.notas || '';
            if (tablaPagosBody) {
                tablaPagosBody.innerHTML = '';
                if (c.detalles && c.detalles.length > 0) {
                    c.detalles.forEach(d => crearFilaPago(d));
                } else {
                    for(let i=0; i<3; i++) crearFilaPago();
                }
            }
            
            window.cierreEnEdicionId = id;
            activarTab('tab-captura', 'navCaptura'); 
        }, 50);
    }

    window.solicitarEliminarCierre = async function(id) {
        const {value: motivo} = await Swal.fire({
            title: 'Solicitar Eliminación',
            input: 'textarea',
            inputPlaceholder: 'Especifique el motivo para el Maestro...',
            showCancelButton: true,
            confirmButtonText: 'Enviar Solicitud'
        });
        
        if(motivo) {
            Swal.fire({title: 'Enviando...', allowOutsideClick: false, didOpen: () => {Swal.showLoading()}});
            const reqs = await obtenerDatosBD('solicitudesEliminacion') || [];
            reqs.push({
                id: Date.now(), 
                fecha: new Date().toLocaleDateString(),
                sucursal: currentUser ? (currentUser.sucursal || "Central") : "Desconocida",
                usuario: currentUser ? currentUser.user : "Sistema",
                tipo: "ELIMINAR",
                archivo: `Cierre ID: ${id}`,
                descripcion: motivo,
                estado: "Pendiente"
            });
            await guardarDatosBD('solicitudesEliminacion', reqs);
            Swal.fire('Enviado', 'Solicitud de eliminación enviada al Maestro.', 'success');
        }
    }

    async function generarResumenMensual() {
        const tbody = document.querySelector('#tablaResumenMensual tbody');
        const tfoot = document.getElementById('tfootResumenMensual');
        if(!tbody) return;

        const fechaInicio = document.getElementById('filtroResumenInicio').value;
        const fechaFin = document.getElementById('filtroResumenFin').value;
        const sucursal = document.getElementById('filtroSucursalResumen').value;
        const usuario = document.getElementById('filtroUsuarioResumen').value;

        let historial = await obtenerDatosBD('historialCierresEstuconta') || [];
        
        let filtrado = historial.filter(c => {
            let pasa = true;
            if (fechaInicio && c.fechaCierre < fechaInicio) pasa = false;
            if (fechaFin && c.fechaCierre > fechaFin) pasa = false;
            if (sucursal && c.sucursal.toUpperCase() !== sucursal.toUpperCase()) pasa = false;
            if (usuario && c.usuario !== usuario) pasa = false;
            return pasa;
        });
        if(filtrado.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #64748b; padding:40px;">No se encontraron datos para los filtros seleccionados.</td></tr>`;
            tfoot.innerHTML = '';
            return;
        }

        let agrupado = {};
        filtrado.forEach(c => {
            (c.detalles || []).forEach(d => {
                let key = `${c.sucursal}_${d.formaPago}`;
                if(!agrupado[key]) {
                    agrupado[key] = {
                        sucursal: c.sucursal,
                        formaPago: d.formaPago,
                        sistema: 0,
                        fisico: 0
                    };
                }
                agrupado[key].sistema += parseFloat(d.montoCierre || 0);
                agrupado[key].fisico += parseFloat(d.montoFisico || 0);
            });
        });

        tbody.innerHTML = '';
        let totalSis = 0, totalFis = 0, totalDif = 0;
        Object.values(agrupado).sort((a,b) => a.sucursal.localeCompare(b.sucursal)).forEach(item => {
            let diff = item.sistema - item.fisico;
            totalSis += item.sistema;
            totalFis += item.fisico;
            totalDif += diff;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.sucursal}</td>
                <td>${item.formaPago}</td>
                <td>Q ${item.sistema.toFixed(2)}</td>
                <td>Q ${item.fisico.toFixed(2)}</td>
                <td style="color: ${diff > 0 ? 'var(--danger)' : (diff < 0 ? 'var(--warning)' : 'inherit')}; font-weight:bold;">Q ${diff.toFixed(2)}</td>
            `;
            tbody.appendChild(tr);
        });
        tfoot.innerHTML = `
            <tr style="background: #f8fafc; font-weight: bold;">
                <td colspan="2" style="text-align: right;">TOTALES GENERALES:</td>
                <td style="color: var(--primary);">Q ${totalSis.toFixed(2)}</td>
                <td style="color: var(--success);">Q ${totalFis.toFixed(2)}</td>
                <td style="color: var(--danger);">Q ${totalDif.toFixed(2)}</td>
            </tr>
        `;
    }

    document.getElementById('btnGenerarResumen')?.addEventListener('click', generarResumenMensual);

    window.renderizarSolicitudes = async function() {
        const tbody = document.querySelector('#tablaSolicitudes tbody');
        if(!tbody) return;
        tbody.innerHTML = '';

        let solicitudes = await obtenerDatosBD('solicitudesEliminacion') || [];

        const fSucursal = document.getElementById('filtroSucursalReq')?.value.toUpperCase();
        const fUsuario = document.getElementById('filtroUsuarioReq')?.value.toLowerCase();
        const fTipo = document.getElementById('filtroTipoReq')?.value;

        if (currentUser && currentUser.role !== 'master') {
            if (currentUser.role === 'sucursal') {
                solicitudes = solicitudes.filter(s => s.sucursal.toUpperCase() === currentUser.sucursal.toUpperCase());
            } else {
                solicitudes = solicitudes.filter(s => s.usuario === currentUser.user);
            }
        }

        let filtrado = solicitudes.filter(s => {
            let pasa = true;
            if (fSucursal && s.sucursal.toUpperCase() !== fSucursal) pasa = false;
            if (fUsuario && s.usuario.toLowerCase().includes(fUsuario) === false) pasa = false;
            if (fTipo && s.tipo !== fTipo) pasa = false;
            return pasa;
        });

        if(filtrado.length === 0) {
            const colSpan = (currentUser && currentUser.role === 'master') ? 9 : 8;
            tbody.innerHTML = `<tr><td colspan="${colSpan}" style="text-align: center; color: #64748b; padding:20px;">No hay solicitudes registradas en esta vista.</td></tr>`;
            return;
        }

        filtrado.reverse().forEach(s => {
            const tr = document.createElement('tr');
            let estadoBadge = `<span style="color: #d97706; font-weight:bold;">${s.estado}</span>`;
            if(s.estado === 'Aprobada') estadoBadge = `<span style="color: var(--success); font-weight:bold;">${s.estado}</span>`;
            if(s.estado === 'Rechazada') estadoBadge = `<span style="color: var(--danger); font-weight:bold;">${s.estado}</span>`;

            let accionesHTML = '';
            if (currentUser && currentUser.role === 'master') {
                accionesHTML = `
                    <td class="action-buttons-cell">
                        <button class="btn-icon" style="color:var(--success);" title="Aprobar" onclick="window.procesarSolicitud(${s.id}, 'Aprobada')"><i class="fas fa-check"></i></button>
                        <button class="btn-icon" style="color:var(--danger);" title="Rechazar" onclick="window.procesarSolicitud(${s.id}, 'Rechazada')"><i class="fas fa-times"></i></button>
                    </td>
                `;
            }

            tr.innerHTML = `
                <td>${s.fecha}</td>
                <td>${s.sucursal}</td>
                <td>${s.usuario}</td>
                <td><span class="badge-rol badge-regular">${s.tipo}</span></td>
                <td>${s.archivo}</td>
                <td>${s.descripcion}</td>
                <td>${estadoBadge}</td>
                <td>${s.mensajeAutorizador || '-'}</td>
                ${accionesHTML}
            `;
            tbody.appendChild(tr);
        });
    };

    window.procesarSolicitud = async function(id, nuevoEstado) {
         const { value: mensaje } = await Swal.fire({
            title: `${nuevoEstado} Solicitud`,
            input: 'text',
            inputPlaceholder: 'Mensaje o nota para el solicitante (opcional)...',
            showCancelButton: true,
            confirmButtonText: 'Confirmar'
        });

        if(mensaje !== undefined) {
            Swal.fire({title: 'Procesando...', allowOutsideClick: false, didOpen: () => {Swal.showLoading()}});
            let reqs = await obtenerDatosBD('solicitudesEliminacion') || [];
            let idx = reqs.findIndex(r => r.id === id);
            if(idx !== -1) {
                reqs[idx].estado = nuevoEstado;
                reqs[idx].mensajeAutorizador = mensaje || (nuevoEstado === 'Aprobada' ? 'Autorizado' : 'Denegado');
                await guardarDatosBD('solicitudesEliminacion', reqs);
                await renderizarSolicitudes();
                Swal.fire('Procesado', `La solicitud ha sido ${nuevoEstado.toLowerCase()}.`, 'success');
            }
        }
    };
    
    document.getElementById('btnFiltrarReq')?.addEventListener('click', renderizarSolicitudes);

});