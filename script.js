document.addEventListener('DOMContentLoaded', () => {

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

    let usersDB = JSON.parse(localStorage.getItem('estucontaUsersDB'));
    if (!usersDB) {
        usersDB = defaultUsersDB;
        localStorage.setItem('estucontaUsersDB', JSON.stringify(usersDB));
    }

    let currentUser = null;

    // --- REFERENCIAS DOM ---
    const loginOverlay = document.getElementById('loginOverlay');
    const appContent = document.getElementById('appContent');
    const displayUserLogueado = document.getElementById('displayUserLogueado');
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    // --- 2. SISTEMA DE LOGIN ---
    function ejecutarLogin() {
        usersDB = JSON.parse(localStorage.getItem('estucontaUsersDB')) || defaultUsersDB; // Refrescar en cada intento
        
        const userRaw = document.getElementById('loginUser').value.trim();
        const pass = document.getElementById('loginPass').value;
        const userKey = Object.keys(usersDB).find(k => k.toLowerCase() === userRaw.toLowerCase());

        if (userKey && usersDB[userKey].pass === pass) {
            currentUser = { user: userKey, ...usersDB[userKey] };
            loginOverlay.classList.add('hidden');
            appContent.classList.remove('hidden');
            displayUserLogueado.innerHTML = `<i class="fas fa-user-circle"></i> ${currentUser.user} (${currentUser.role.toUpperCase()})`;
            
            registrarAuditoria("INICIO SESIÓN", "El usuario accedió al sistema");
            configurarMenuPorRol();
            revisarAtrasosSucursales();
            renderizarNotificaciones();
            
            actualizarUsuarios();
            cargarDatosDiaActual();
            poblarFiltroUsuariosDB(); 
            cargarHistorialBD();
            if(currentUser.role === 'master') { cargarTablaAuditoria(); renderizarUsuariosTab(); }
            
        } else {
            document.getElementById('loginError').classList.remove('hidden');
            registrarAuditoria("ERROR SESIÓN", `Intento fallido de acceso con el usuario: "${userRaw}"`);
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
            registrarAuditoria("CIERRE SESIÓN", "El usuario salió del sistema");
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

    function activarTab(tabId, navId) {
        navItems.forEach(nav => nav.classList.remove('active'));
        tabContents.forEach(tab => tab.classList.add('hidden'));
        document.getElementById(navId).classList.add('active');
        document.getElementById(tabId).classList.remove('hidden');
        
        if(tabId === 'tab-repositorio') renderizarRepositorio();
        if(tabId === 'tab-config') renderizarExcepciones();
        if(tabId === 'tab-resumen') generarResumenMensual(); 
        if(tabId === 'tab-solicitudes') renderizarSolicitudes();
        if(tabId === 'tab-usuarios') renderizarUsuariosTab();
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

    /* ============================================================================
       SECCIÓN UNIFICADA: RECUPERACIÓN Y NOVEDADES (CORREGIDO)
       ============================================================================ */

    // BOTÓN: ¿Olvidaste tu contraseña o usuario? (Ahora es abierto y funcional)
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
            let reqs = JSON.parse(localStorage.getItem('passRequests')) || [];
            reqs = reqs.filter(r => r.user !== formValues.user); // Evitar duplicados
            reqs.push({ 
                user: formValues.user, 
                newPass: formValues.newPass, 
                date: new Date().toLocaleString(),
                nota: `Olvidó: ${formValues.tipo} (Sucursal: ${formValues.sucursal})` 
            });
            localStorage.setItem('passRequests', JSON.stringify(reqs));
            
            registrarAuditoria("SISTEMA", `Solicitud de recuperación enviada para: ${formValues.user}`);
            Swal.fire('Solicitud Enviada', 'Tu petición ha sido enviada. Revisa "Novedades de Cuenta" más tarde.', 'success');
        }
    });

    // BOTÓN: Novedades / Consultar Cambios
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
            let notifs = JSON.parse(localStorage.getItem('loginNotifs')) || [];
            const nIndex = notifs.findIndex(n => n.oldUser.toLowerCase() === user.trim().toLowerCase() || n.newUser.toLowerCase() === user.trim().toLowerCase());
            
            if (nIndex > -1) {
                const n = notifs[nIndex];
                Swal.fire({
                    title: '¡Credenciales Actualizadas!',
                    html: `El usuario Maestro ha procesado tu acceso.<br><br><b>Usuario Válido:</b> ${n.newUser}<br><b>Nueva Contraseña:</b> ${n.newPass}`,
                    icon: 'info',
                    confirmButtonText: 'Entendido'
                });
                notifs.splice(nIndex, 1);
                localStorage.setItem('loginNotifs', JSON.stringify(notifs));
            } else {
                Swal.fire('Sin novedades', 'No se encontraron cambios pendientes para este usuario.', 'info');
            }
        }
    };

    document.getElementById('btnConsultarCambios')?.addEventListener('click', consultarNovedades);
    document.getElementById('btnConsultarCambiosInterno')?.addEventListener('click', consultarNovedades);

    /* ============================================================================
       FIN DE SECCIÓN UNIFICADA (Continúa el código original de gestión Maestro)
       ============================================================================ */

    function renderizarUsuariosTab() {
        if (!currentUser || currentUser.role !== 'master') return;

        const tbodyReq = document.querySelector('#tablaSolicitudesPass tbody');
        let reqs = JSON.parse(localStorage.getItem('passRequests')) || [];
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
                        <button class="btn-icon download" title="Aprobar Cambio" onclick="aprobarPassReq('${req.user}')"><i class="fas fa-check"></i></button>
                        <button class="btn-icon delete" title="Rechazar Cambio" onclick="rechazarPassReq('${req.user}')"><i class="fas fa-times"></i></button>
                    </td>
                `;
                tbodyReq.appendChild(tr);
            });
        }

        let currentDB = JSON.parse(localStorage.getItem('estucontaUsersDB')) || defaultUsersDB;
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
                    <button class="btn-icon edit" title="Editar Credenciales" onclick="editarUsuarioDB('${uKey}')"><i class="fas fa-user-edit"></i></button>
                </td>
            `;
            tbodyDir.appendChild(tr);
        });
    }

    window.aprobarPassReq = function(userKey) {
        let reqs = JSON.parse(localStorage.getItem('passRequests')) || [];
        const req = reqs.find(r => r.user === userKey);
        if(req) {
            let currentDB = JSON.parse(localStorage.getItem('estucontaUsersDB')) || defaultUsersDB;
            let finalUserKey = userKey;
            
            if(userKey.startsWith('[Desconocido')) {
                finalUserKey = `NUEVO.${Date.now().toString().slice(-4)}`;
            }
            
            if(currentDB[finalUserKey]) {
                currentDB[finalUserKey].pass = req.newPass;
            } else {
                 currentDB[finalUserKey] = { pass: req.newPass, role: "regular" }; 
            }
            
            let notifs = JSON.parse(localStorage.getItem('loginNotifs')) || [];
            notifs.push({ oldUser: userKey, newUser: finalUserKey, newPass: req.newPass });
            localStorage.setItem('loginNotifs', JSON.stringify(notifs));
            
            localStorage.setItem('estucontaUsersDB', JSON.stringify(currentDB));
            usersDB = currentDB; 
            
            reqs = reqs.filter(r => r.user !== userKey);
            localStorage.setItem('passRequests', JSON.stringify(reqs));
            
            registrarAuditoria("EDITAR", `Maestro aprobó recuperación de cuenta ${finalUserKey}`);
            renderizarUsuariosTab();
            Swal.fire('Aprobado', `Usuario Asignado: ${finalUserKey}`, 'success');
        }
    };

    window.rechazarPassReq = function(userKey) {
        let reqs = JSON.parse(localStorage.getItem('passRequests')) || [];
        reqs = reqs.filter(r => r.user !== userKey);
        localStorage.setItem('passRequests', JSON.stringify(reqs));
        registrarAuditoria("SISTEMA", `Maestro rechazó el cambio de usuario ${userKey}`);
        renderizarUsuariosTab();
        Swal.fire('Rechazado', 'Solicitud eliminada.', 'info');
    };

    window.editarUsuarioDB = async function(oldUserKey) {
        let currentDB = JSON.parse(localStorage.getItem('estucontaUsersDB')) || defaultUsersDB;
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
            const role = u.role;
            const sucursal = u.sucursal;
            
            let notifs = JSON.parse(localStorage.getItem('loginNotifs')) || [];
            notifs.push({ oldUser: oldUserKey, newUser: formValues.newUser, newPass: formValues.newPass });
            localStorage.setItem('loginNotifs', JSON.stringify(notifs));

            delete currentDB[oldUserKey];
            currentDB[formValues.newUser] = { pass: formValues.newPass, role: role };
            if(sucursal) currentDB[formValues.newUser].sucursal = sucursal;
            
            localStorage.setItem('estucontaUsersDB', JSON.stringify(currentDB));
            usersDB = currentDB; 
            renderizarUsuariosTab();
            Swal.fire('Guardado', 'Datos modificados.', 'success');
        }
    };

    // --- 3. NOTIFICACIONES Y EXCEPCIONES ---
    document.getElementById('btnCampanaNotif')?.addEventListener('click', () => {
        const dropdown = document.getElementById('notifDropdown');
        dropdown.style.display = dropdown.style.display === 'flex' ? 'none' : 'flex';
        const notifs = JSON.parse(localStorage.getItem('notifsEstuconta')) || [];
        notifs.forEach(n => { 
            if(n.destinatarios.includes(currentUser.role) || n.destinatarios.includes(currentUser.user) || (currentUser.role === 'sucursal' && n.destinatarios.includes(currentUser.sucursal))) {
                n.leida = true; 
            }
        });
        localStorage.setItem('notifsEstuconta', JSON.stringify(notifs));
        renderizarNotificaciones();
    });

    function agregarNotificacion(mensaje, rolesDestino) {
        const notifs = JSON.parse(localStorage.getItem('notifsEstuconta')) || [];
        notifs.unshift({ id: Date.now(), fecha: new Date().toLocaleString(), mensaje: mensaje, destinatarios: rolesDestino, leida: false });
        localStorage.setItem('notifsEstuconta', JSON.stringify(notifs));
        renderizarNotificaciones();
    }

    function renderizarNotificaciones() {
        if(!currentUser) return;
        const notifs = JSON.parse(localStorage.getItem('notifsEstuconta')) || [];
        const misNotifs = notifs.filter(n => n.destinatarios.includes(currentUser.role) || n.destinatarios.includes(currentUser.user) || (currentUser.role === 'sucursal' && n.destinatarios.includes(currentUser.sucursal)));
        
        const badge = document.getElementById('notifBadge');
        const unreadCount = misNotifs.filter(n => !n.leida).length;
        if (unreadCount > 0) { badge.style.display = 'flex'; badge.textContent = unreadCount; } else { badge.style.display = 'none'; }

        const list = document.getElementById('notifList');
        list.innerHTML = '';
        if (misNotifs.length === 0) {
            list.innerHTML = '<li class="notif-item" style="text-align:center; color:#94a3b8;">No hay notificaciones nuevas.</li>'; return;
        }

        misNotifs.forEach(n => {
            const li = document.createElement('li');
            li.className = `notif-item ${n.leida ? '' : 'unread'}`;
            li.innerHTML = `${n.mensaje} <span class="time">${n.fecha}</span>`;
            list.appendChild(li);
        });
    }

    document.getElementById('btnAgregarExcepcion')?.addEventListener('click', () => {
        const suc = document.getElementById('configSucursal').value;
        const fec = document.getElementById('configFechaExcepcion').value;
        if(!fec) return Swal.fire('Atención', 'Seleccione una fecha válida', 'warning');

        const excepciones = JSON.parse(localStorage.getItem('excepcionesAtrasos')) || [];
        excepciones.push({ sucursal: suc, fecha: fec });
        localStorage.setItem('excepcionesAtrasos', JSON.stringify(excepciones));
        Swal.fire('Guardado', 'Excepción agregada exitosamente', 'success');
        renderizarExcepciones();
    });

    function renderizarExcepciones() {
        const list = document.getElementById('listaExcepciones');
        if(!list) return;
        list.innerHTML = '';
        const excepciones = JSON.parse(localStorage.getItem('excepcionesAtrasos')) || [];
        excepciones.forEach((e, idx) => {
            const li = document.createElement('li');
            li.style.cssText = "padding: 8px; border-bottom: 1px solid #e2e8f0; display:flex; justify-content:space-between;";
            li.innerHTML = `<span><strong>${e.sucursal}</strong> - Exceptuado el: ${e.fecha}</span> <button class="btn-del" onclick="borrarExcepcion(${idx})"><i class="fas fa-trash"></i></button>`;
            list.appendChild(li);
        });
    }

    window.borrarExcepcion = function(idx) {
        const excepciones = JSON.parse(localStorage.getItem('excepcionesAtrasos')) || [];
        excepciones.splice(idx, 1);
        localStorage.setItem('excepcionesAtrasos', JSON.stringify(excepciones));
        renderizarExcepciones();
    };

    function revisarAtrasosSucursales() {
        const ayer = new Date(); ayer.setDate(ayer.getDate() - 1);
        const fechaAyer = ayer.toISOString().split('T')[0];
        const repo = JSON.parse(localStorage.getItem('repoArchivos')) || [];
        const excepciones = JSON.parse(localStorage.getItem('excepcionesAtrasos')) || [];
        const sucursales = ["CHIQUIMULA", "SAN NICOLAS 1", "SIXTINO", "FRUTAL", "METRONORTE", "NARANJO", "SAN NICOLAS 2", "PERI ROOSEVELT"];

        sucursales.forEach(sucursal => {
            const esExcepcion = excepciones.some(e => e.sucursal === sucursal && e.fecha === fechaAyer);
            if (esExcepcion) return; 

            const subioArchivo = repo.some(r => r.sucursal === sucursal && r.fecha === fechaAyer);
            if (!subioArchivo) {
                const claveAtraso = `atraso_${sucursal}_${fechaAyer}`;
                const historialAtrasos = JSON.parse(localStorage.getItem('historialAtrasosVistos')) || [];
                
                if (!historialAtrasos.includes(claveAtraso)) {
                    agregarNotificacion(`⚠️ ALERTA: La sucursal ${sucursal} NO ha subido la documentación del día ${fechaAyer}.`, ['master', 'regular', sucursal]);
                    historialAtrasos.push(claveAtraso);
                    localStorage.setItem('historialAtrasosVistos', JSON.stringify(historialAtrasos));
                }
            }
        });
    }

    // --- 4. CARGA PDF Y REPOSITORIO ---
    let tempFileDataUrl = null; let tempFileName = "";

    const archivoPdf = document.getElementById('archivoPdf');
    const dropzone = document.getElementById('dropzonePdf');
    const fileInfo = document.getElementById('fileInfoDisplay');
    const fileNameDisp = document.getElementById('fileNameDisplay');
    const btnRemove = document.getElementById('btnRemoveFile');
    const btnPreview = document.getElementById('btnPrevisualizarPdf');
    const btnSubir = document.getElementById('btnSubirPdf');

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
            reader.onload = (ev) => { tempFileDataUrl = ev.target.result; btnPreview.style.display = 'flex'; btnSubir.style.width = '48%'; };
            reader.readAsDataURL(file);
        }
    });

    btnRemove?.addEventListener('click', () => {
        archivoPdf.value = ''; tempFileDataUrl = null;
        dropzone.classList.remove('hidden'); fileInfo.classList.add('hidden');
        btnPreview.style.display = 'none'; btnSubir.style.width = '100%';
    });

    btnPreview?.addEventListener('click', () => {
        if(tempFileDataUrl) { document.getElementById('pdfPreviewFrame').src = tempFileDataUrl; document.getElementById('modalPreview').classList.remove('hidden'); }
    });

    document.getElementById('btnCerrarPreview')?.addEventListener('click', () => {
        document.getElementById('modalPreview').classList.add('hidden');
    });

    btnSubir?.addEventListener('click', async () => {
        const fecha = document.getElementById('fechaCargaPdf').value;
        if(!fecha || !archivoPdf.files[0]) return Swal.fire('Atención', 'Fecha y archivo requeridos.', 'warning');

        const file = archivoPdf.files[0];
        const reader = new FileReader();
        reader.onload = async function(e) {
            const repositorio = JSON.parse(localStorage.getItem('repoArchivos')) || [];
            repositorio.push({ 
                sucursal: currentUser.sucursal, fecha: fecha, 
                archivo: file.name, fileData: e.target.result, 
                usuarioCarga: currentUser.user, fechaSubida: new Date().toLocaleString() 
            });
            localStorage.setItem('repoArchivos', JSON.stringify(repositorio));
            agregarNotificacion(`✅ Sucursal ${currentUser.sucursal} subió el archivo del día ${fecha}.`, ['master']);
            Swal.fire('Completado', 'Archivo subido.', 'success');
            btnRemove.click();
        };
        reader.readAsDataURL(file);
    });

    function renderizarRepositorio() {
        const repo = JSON.parse(localStorage.getItem('repoArchivos')) || [];
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
        const link = document.createElement('a'); link.href = data; link.download = name; link.click();
    };

    window.verDocumentoRepositorio = function(base64) {
        document.getElementById('pdfPreviewFrame').src = base64;
        document.getElementById('modalPreview').classList.remove('hidden');
    }

    // --- 5. AUDITORÍA Y PERMISOS ---
    async function pedirPermisoMaestro() {
        const { value: adminPass } = await Swal.fire({
            title: 'Permiso Maestro',
            input: 'password', showCancelButton: true, confirmButtonText: 'Autorizar'
        });
        if (!adminPass) return false;
        const isMasterValid = Object.values(usersDB).some(u => u.role === 'master' && u.pass === adminPass);
        if (isMasterValid) return true;
        Swal.fire('Denegado', 'Clave incorrecta.', 'error'); return false;
    }

    function registrarAuditoria(accion, detalle) {
        if (!currentUser && accion !== "ERROR SESIÓN") return;
        const auditoria = JSON.parse(localStorage.getItem('auditoriaEstuconta')) || [];
        auditoria.unshift({
            fecha: new Date().toLocaleString(),
            usuario: currentUser ? currentUser.user : 'SISTEMA', 
            rol: currentUser ? currentUser.role : 'sistema', 
            accion: accion, detalle: detalle
        });
        localStorage.setItem('auditoriaEstuconta', JSON.stringify(auditoria));
    }

    function cargarTablaAuditoria() {
        const auditoria = JSON.parse(localStorage.getItem('auditoriaEstuconta')) || [];
        const tbody = document.querySelector('#tablaAuditoria tbody');
        if(!tbody) return; tbody.innerHTML = '';
        auditoria.slice(0, 50).forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${item.fecha}</td><td>${item.usuario}</td><td>${item.accion}</td><td>${item.detalle}</td>`;
            tbody.appendChild(tr);
        });
    }

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

    function crearFilaPago(data = null) {
        if(!tablaPagosBody) return;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="text-align: center;"><button class="btn-del"><i class="fas fa-trash-alt"></i></button></td>
            <td><select class="table-select m-forma">${formasPago.map(f => `<option ${data?.formaPago === f ? 'selected' : ''}>${f}</option>`).join('')}</select></td>
            <td><select class="table-select m-banco">${bancosList.map(b => `<option ${data?.banco === b ? 'selected' : ''}>${b}</option>`).join('')}</select></td>
            <td><input type="number" class="table-input m-cierre" value="${data?.montoCierre || ''}" step="0.01"></td>
            <td><input type="number" class="table-input m-fisico" value="${data?.montoFisico || ''}" step="0.01"></td>
            <td><input type="text" class="table-input m-doc" value="${data?.documento || ''}"></td>
            <td><input type="date" class="table-input m-fecha" value="${data?.fechaDoc || ''}"></td>
            <td class="m-diff" style="text-align: right;">0.00</td>
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
    }

    function cargarDatosDiaActual() { if(tablaPagosBody) { tablaPagosBody.innerHTML = ''; for(let i=0; i<3; i++) crearFilaPago(); } }

    document.getElementById('btnGuardarCierre')?.addEventListener('click', async () => {
        const selectElement = document.getElementById('sucursalSelect');
        const sucursalNombre = selectElement.options[selectElement.selectedIndex].text;
        const historial = JSON.parse(localStorage.getItem('historialCierresEstuconta')) || [];
        
        const nuevoCierre = {
            id: Date.now(), sucursal: sucursalNombre,
            usuario: document.getElementById('turnoSelect').value,
            fechaCierre: document.getElementById('fechaInput').value,
            totalCierre: document.getElementById('totalCierre').textContent,
            totalFisico: document.getElementById('totalFisico').textContent,
            detalles: []
        };
        historial.push(nuevoCierre);
        localStorage.setItem('historialCierresEstuconta', JSON.stringify(historial));
        registrarAuditoria("AGREGAR", `Cierre guardado en ${sucursalNombre}`);
        Swal.fire('Guardado', 'Cierre guardado exitosamente.', 'success');
        cargarDatosDiaActual();
    });

    // --- 7. HISTORIAL BASE DE DATOS ---
    function cargarHistorialBD() {
        const historial = JSON.parse(localStorage.getItem('historialCierresEstuconta')) || [];
        const tbody = document.querySelector('#tablaHistorial tbody');
        if(!tbody) return; tbody.innerHTML = '';
        historial.sort((a,b) => b.id - a.id).forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>-</td><td>${c.fechaCierre}</td><td>${c.sucursal}</td><td>${c.usuario}</td><td>Q${c.totalCierre}</td><td>Q${c.totalFisico}</td><td>-</td><td>-</td>`;
            tbody.appendChild(tr);
        });
    }

    function poblarFiltroUsuariosDB() {}
    function generarResumenMensual() {}

});