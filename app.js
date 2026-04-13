// URL de tu nuevo servidor Backend (Local por ahora)
const BACKEND_URL = 'https://cierres-diarios.onrender.com/api/sync';

// --- NUEVA FUNCIÓN PUENTE HACIA EL BACKEND ---
async function guardarEnFirebase(key, data) {
    const payloadString = JSON.stringify(data);
    localStorage.setItem(key, payloadString); 
    
    try {
        await fetch(`${BACKEND_URL}/${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payload: payloadString })
        });
    } catch (error) {
        console.error(`Error de conexión con el Backend guardando ${key}:`, error);
    }
}

document.addEventListener('DOMContentLoaded', async () => {

    // --- NUEVO: Control del menú móvil ---
    const btnMobileMenu = document.getElementById('btnMobileMenu');
    const sidebarMenu = document.getElementById('sidebarMenu');
    if (btnMobileMenu && sidebarMenu) {
        btnMobileMenu.addEventListener('click', () => {
            sidebarMenu.classList.toggle('open');
        });
    }

    // --- 0. SINCRONIZACIÓN INICIAL CON EL BACKEND ---
    async function sincronizarDesdeFirebase() {
        const btnLogin = document.getElementById('btnLogin');
        if(btnLogin) {
            btnLogin.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Conectando al servidor...';
            btnLogin.disabled = true;
        }

        const colecciones = [
            'estucontaUsersDB', 'notificacionesEstuconta', 'repoArchivos', 
            'auditoriaEstuconta', 'historialCierresEstuconta', 
            'solicitudesEstuconta', 'excepcionesEstuconta'
        ];

        for (const key of colecciones) {
            try {
                const response = await fetch(`${BACKEND_URL}/${key}`);
                const result = await response.json();
                
                if (result.success && result.data) {
                    localStorage.setItem(key, result.data);
                }
            } catch (error) {
                console.error(`Error cargando ${key} desde el Backend:`, error);
            }
        }

        if(btnLogin) {
            btnLogin.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
            btnLogin.disabled = false;
        }
    }

    await sincronizarDesdeFirebase();

    // --- 1. BASE DE DATOS DE USUARIOS Y MAPEOS ---
    const defaultUsersDB = {
        "GD.user01": { pass: "Ax7#Pq29Lm", role: "master" },
        "GD.user02": { pass: "R8v$Kp41Tx", role: "master" },
        "GD.user03": { pass: "Mq5!Zr82Bd", role: "regular" },
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
        guardarEnFirebase('estucontaUsersDB', usersDB);
    }

    let currentUser = null;

    const datosUsuarios = {
        "1": { "ICALDERO01": "CH1-", "USUARIO PROVISIONAL": "CN3-" },
        "2": { "RSNXAMXX01": "SN17-", "RSNXPMXX01": "SN18-", "RELIASXX01": "SN19-", "USUARIO PROVISIONAL": "SN13-" },
        "3": { "RSIXTINO01": "SX6-", "CSXXXXXX01": "SX8-", "USUARIO PROVISIONAL": "SX4-" },
        "4": { "RFRXAMXX01": "FT17-", "RFRXPMXX01": "FT18-", "LRIVERAX01": "FT19-", "CFRXXXXX01": "FT27-", "DMORALES01": "FT12-" },
        "5": { "RMETRONO01": "MN12-", "CMNXXXXX01": "MN14-", "ASISTENTE MN": "MN13-", "USUARIO PROVISIONAL": "MN1-" },
        "6": { "RNRXAMXX01": "NR1-", "RNRXPMXX01": "NR2-", "ASISTENTE NR": "NR4-", "USUARIO PROVISIONAL": "NR3-" },
        "7": { "RNIXAMXX01": "NI1-", "RNIXPMXX01": "NI2-", "USUARIO PROVISIONAL": "NI3-" },
        "8": { "RPEXAMXX01": "PR1-", "RPEXPMXX01": "PR2-", "USUARIO PROVISIONAL": "PR3-" }
    };

    const sucursalMapInv = {
        "CHIQUIMULA": "1", "SAN NICOLAS 1": "2", "SIXTINO": "3",
        "FRUTAL": "4", "METRONORTE": "5", "NARANJO": "6",
        "SAN NICOLAS 2": "7", "PERI ROOSEVELT": "8"
    };

    // --- REFERENCIAS DOM ---
    const loginOverlay = document.getElementById('loginOverlay');
    const appContent = document.getElementById('appContent');
    const displayUserLogueado = document.getElementById('displayUserLogueado');
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    // --- INICIALIZAR GRÁFICO TIPO ANILLO ---
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
    function ejecutarLogin() {
        usersDB = JSON.parse(localStorage.getItem('estucontaUsersDB')) || defaultUsersDB; 
        const userRaw = document.getElementById('loginUser').value.trim();
        const pass = document.getElementById('loginPass').value;
        const userKey = Object.keys(usersDB).find(k => k.toLowerCase() === userRaw.toLowerCase());

        if (userKey && usersDB[userKey].pass === pass) {
            currentUser = { user: userKey, ...usersDB[userKey] };
            loginOverlay.classList.add('hidden');
            appContent.classList.remove('hidden');
            displayUserLogueado.innerHTML = `<i class="fas fa-user-circle"></i> ${currentUser.user} (${currentUser.sucursal ? currentUser.sucursal.toUpperCase() : currentUser.role.toUpperCase()})`;
            
            registrarAuditoria("INICIO DE SESIÓN", `El usuario ${currentUser.user} accedió al sistema exitosamente.`);
            configurarMenuPorRol();
            cargarDatosDiaActual();
            cargarHistorialBD();
            actualizarNotificaciones();
            cargarDirectorioUsuarios();
        } else {
            document.getElementById('loginError').classList.remove('hidden');
            registrarAuditoria("INTENTO FALLIDO", `Intento de acceso rechazado con el usuario: "${userRaw}"`);
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
            confirmButtonText: 'Sí, salir'
        });
        if (result.isConfirmed) {
            registrarAuditoria("CIERRE DE SESIÓN", `El usuario ${currentUser.user} cerró sesión en el sistema.`);
            currentUser = null;
            appContent.classList.add('hidden');
            loginOverlay.classList.remove('hidden');
            document.getElementById('loginPass').value = '';
        }
    });

    function configurarMenuPorRol() {
        navItems.forEach(item => item.classList.add('hidden'));

        if (currentUser.role === 'master' || currentUser.role === 'regular') {
            document.getElementById('navCaptura').classList.remove('hidden');
            document.getElementById('navDatabase').classList.remove('hidden');
            document.getElementById('navResumen').classList.remove('hidden'); 
            document.getElementById('navRepositorio').classList.remove('hidden');
            document.getElementById('navSolicitudes').classList.remove('hidden');
            document.getElementById('btnCampanaNotif').classList.remove('hidden');
            activarTab('tab-captura', 'navCaptura');
            
            if(currentUser.role === 'master') {
                 document.getElementById('navAuditoria').classList.remove('hidden');
                 document.getElementById('navConfigNotif').classList.remove('hidden');
                 document.getElementById('navUsuarios').classList.remove('hidden'); 
            }
        } 
        else if (currentUser.role === 'sucursal') {
            document.getElementById('navCarga').classList.remove('hidden');
            document.getElementById('navRepositorio').classList.remove('hidden');
            document.getElementById('navSolicitudes').classList.remove('hidden');
            document.getElementById('btnCampanaNotif').classList.remove('hidden'); 
            activarTab('tab-carga', 'navCarga');
            document.getElementById('fechaCargaPdf').value = new Date().toISOString().split('T')[0];

            const turnoCargaPdf = document.getElementById('turnoCargaPdf');
            if (turnoCargaPdf && currentUser.sucursal) {
                turnoCargaPdf.innerHTML = '';
                const idSuc = sucursalMapInv[currentUser.sucursal.toUpperCase()];
                if (idSuc && datosUsuarios[idSuc]) {
                    Object.keys(datosUsuarios[idSuc]).forEach(u => {
                        turnoCargaPdf.innerHTML += `<option value="${u}">${u}</option>`;
                    });
                }
                turnoCargaPdf.dispatchEvent(new Event('change'));
            }
        }
    }

    function activarTab(tabId, navId) {
        navItems.forEach(nav => nav.classList.remove('active'));
        tabContents.forEach(tab => tab.classList.add('hidden'));
        document.getElementById(navId).classList.add('active');
        document.getElementById(tabId).classList.remove('hidden');
        
        // Cerrar sidebar en móviles al clickear un tab
        if(sidebarMenu) sidebarMenu.classList.remove('open');
        
        registrarAuditoria("NAVEGACIÓN", `El usuario accedió a la pestaña: ${document.getElementById(navId).innerText.trim()}`);
        
        if(tabId === 'tab-database') cargarHistorialBD(); 
        if(tabId === 'tab-auditoria') window.cargarAuditoria();
        if(tabId === 'tab-repositorio') renderizarArbolRepositorio();
        if(tabId === 'tab-config') cargarExcepciones();
        if(tabId === 'tab-solicitudes') cargarSolicitudes();
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if(!item.classList.contains('hidden')){
                activarTab(item.getAttribute('data-tab'), item.id);
            }
        });
    });

    // --- 3. NOTIFICACIONES INTELIGENTES ---
    const notifDropdown = document.getElementById('notifDropdown');
    const notifBadge = document.getElementById('notifBadge');
    const notifList = document.getElementById('notifList');
    const notifEmpty = document.getElementById('notifEmpty');
    
    document.getElementById('btnCampanaNotif')?.addEventListener('click', () => {
        notifDropdown.style.display = notifDropdown.style.display === 'block' ? 'none' : 'block';
    });
    
    document.getElementById('btnCloseNotif')?.addEventListener('click', () => {
        notifDropdown.style.display = 'none';
    });
    
    document.getElementById('btnMarcarLeidas')?.addEventListener('click', () => {
        let notifs = JSON.parse(localStorage.getItem('notificacionesEstuconta')) || [];
        notifs.forEach(n => {
             if (currentUser.role === 'master' || n.target === currentUser.user || n.usuarioActor === currentUser.user) {
                 n.leido = true;
             }
        });
        guardarEnFirebase('notificacionesEstuconta', notifs);
        actualizarNotificaciones();
        registrarAuditoria("NOTIFICACIONES", "Marcó sus notificaciones como leídas.");
    });

    function agregarNotificacion(mensaje, tipo = 'info', target = 'master') {
        const notifs = JSON.parse(localStorage.getItem('notificacionesEstuconta')) || [];
        const usuarioActor = currentUser ? currentUser.user : 'SISTEMA';
        notifs.unshift({ id: Date.now(), mensaje, tipo, leido: false, fecha: new Date().toLocaleString(), target, usuarioActor });
        guardarEnFirebase('notificacionesEstuconta', notifs);
        actualizarNotificaciones();
    }

    function actualizarNotificaciones() {
        if(!currentUser) return;
        const notifs = JSON.parse(localStorage.getItem('notificacionesEstuconta')) || [];
        
        const misNotifs = notifs.filter(n => {
            if (currentUser.role === 'master') return true; 
            if (n.target === currentUser.user || n.usuarioActor === currentUser.user) return true;
            return false;
        });

        const noLeidas = misNotifs.filter(n => !n.leido).length;
        
        if (notifBadge) {
            notifBadge.textContent = noLeidas;
            notifBadge.style.display = noLeidas > 0 ? 'flex' : 'none';
        }
        
        if (notifList && notifEmpty) {
            notifList.innerHTML = '';
            if (misNotifs.length === 0) {
                notifList.style.display = 'none';
                notifEmpty.style.display = 'block';
            } else {
                notifList.style.display = 'block';
                notifEmpty.style.display = 'none';
                
                misNotifs.slice(0, 15).forEach(n => {
                    const li = document.createElement('li');
                    let icon = n.tipo === 'alerta' ? 'fa-exclamation-triangle text-warning' : (n.tipo === 'peligro' ? 'fa-times-circle text-danger' : 'fa-info-circle text-accent');
                    li.innerHTML = `
                        <div style="background: ${n.leido ? 'transparent' : 'rgba(0,97,255,0.05)'}; display:flex; gap:15px; padding:15px; border-bottom:1px solid var(--border); transition:0.2s;">
                            <i class="fas ${icon}" style="font-size:1.4rem; padding-top:2px;"></i>
                            <div style="flex:1;">
                                <p style="margin:0 0 5px 0; font-size:0.85rem; color: var(--primary); font-weight:${n.leido?'400':'600'};">${n.mensaje}</p>
                                <span style="font-size:0.7rem; color: var(--secondary);"><i class="far fa-clock"></i> ${n.fecha}</span>
                            </div>
                            ${!n.leido ? `<div style="width:8px; height:8px; background:var(--accent); border-radius:50%; margin-top:5px;"></div>` : ''}
                        </div>
                    `;
                    li.onclick = () => {
                        n.leido = true;
                        const idx = notifs.findIndex(not => not.id === n.id);
                        if(idx !== -1) notifs[idx].leido = true;
                        guardarEnFirebase('notificacionesEstuconta', notifs);
                        actualizarNotificaciones();
                    };
                    notifList.appendChild(li);
                });
            }
        }
    }


    // --- 4. CARGA PDF Y PREVISUALIZADOR ---
    const archivoPdf = document.getElementById('archivoPdf');
    const fileInfoDisplay = document.getElementById('fileInfoDisplay');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const btnRemoveFile = document.getElementById('btnRemoveFile');
    const dropzonePdf = document.getElementById('dropzonePdf');
    let archivoSeleccionadoData = null; 

    document.getElementById('turnoCargaPdf')?.addEventListener('change', (e) => {
        const responsableInput = document.getElementById('responsableCargaPdf');
        if (responsableInput) responsableInput.value = e.target.value; 
    });

    function procesarArchivoPdf(file) {
        if (file && file.type === "application/pdf") {
            const reader = new FileReader();
            reader.onload = function(event) {
                archivoSeleccionadoData = event.target.result;
                fileNameDisplay.textContent = file.name;
                dropzonePdf.classList.add('hidden');
                fileInfoDisplay.classList.remove('hidden');
                
                const previewCargaCard = document.getElementById('previewCargaCard');
                const iframePreviewCarga = document.getElementById('iframePreviewCarga');
                if(previewCargaCard && iframePreviewCarga) {
                    iframePreviewCarga.src = archivoSeleccionadoData + "#toolbar=1&navpanes=0"; 
                    previewCargaCard.classList.remove('hidden');
                }
                registrarAuditoria("CARGA ARCHIVO", `El usuario seleccionó y previsualizó el archivo: ${file.name}`);
            };
            reader.readAsDataURL(file);
        } else {
            Swal.fire('Error', 'Por favor selecciona un archivo PDF válido.', 'error');
        }
    }

    archivoPdf?.addEventListener('change', (e) => procesarArchivoPdf(e.target.files[0]));

    dropzonePdf?.addEventListener('dragover', (e) => { 
        e.preventDefault(); 
        dropzonePdf.classList.add('dragover'); 
    });
    dropzonePdf?.addEventListener('dragleave', (e) => { 
        e.preventDefault(); 
        dropzonePdf.classList.remove('dragover'); 
    });
    dropzonePdf?.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzonePdf.classList.remove('dragover');
        if(e.dataTransfer.files.length > 0) procesarArchivoPdf(e.dataTransfer.files[0]);
    });

    btnRemoveFile?.addEventListener('click', () => {
        archivoPdf.value = '';
        archivoSeleccionadoData = null;
        fileInfoDisplay.classList.add('hidden');
        dropzonePdf.classList.remove('hidden');
        const previewCargaCard = document.getElementById('previewCargaCard');
        if(previewCargaCard) {
            previewCargaCard.classList.add('hidden');
            document.getElementById('iframePreviewCarga').src = '';
        }
    });

    document.getElementById('btnSubirPdf')?.addEventListener('click', () => {
        if (!archivoSeleccionadoData) return Swal.fire('Error', 'Debes adjuntar un archivo PDF', 'error');
        const fecha = document.getElementById('fechaCargaPdf').value;
        if (!fecha) return Swal.fire('Error', 'Debes indicar la fecha del cierre', 'error');
        const turnoSel = document.getElementById('turnoCargaPdf');
        if (turnoSel && !turnoSel.value) return Swal.fire('Error', 'Debes seleccionar el turno', 'error');
        
        // NUEVO: Rescatar el tipo de documento para separarlos en la DB
        const tipoDocSel = document.getElementById('tipoDocCarga');
        const tipoDocVal = tipoDocSel ? tipoDocSel.value : 'completo';
        
        let nombreDocDisplay = 'Cierre Completo';
        if(tipoDocVal === 'incompleto') nombreDocDisplay = 'Cierre Incompleto';
        if(tipoDocVal === 'faltante') nombreDocDisplay = 'Comprobantes Faltantes';

        const repo = JSON.parse(localStorage.getItem('repoArchivos')) || [];
        const isoHoy = new Date().toISOString().split('T')[0];

        repo.push({
            id: Date.now(),
            sucursal: currentUser.sucursal,
            turno: turnoSel ? turnoSel.value : 'N/A', 
            fecha: fecha,
            tipoDoc: tipoDocVal, // Guardamos la bandera: completo, incompleto, faltante
            fechaSubida: new Date().toLocaleString(),
            fechaCargaISO: isoHoy,
            fileData: archivoSeleccionadoData
        });

        guardarEnFirebase('repoArchivos', repo);
        
        registrarAuditoria("SUBIDA EXITOSA", `Sucursal ${currentUser.sucursal} cargó PDF de ${nombreDocDisplay} (Turno: ${turnoSel?turnoSel.value:''}) para el ${fecha}`);
        agregarNotificacion(`Sucursal ${currentUser.sucursal.toUpperCase()} cargó ${nombreDocDisplay} del ${fecha} (Turno: ${turnoSel?turnoSel.value:''})`, 'info', 'master');

        Swal.fire('Éxito', `${nombreDocDisplay} subido correctamente al repositorio.`, 'success');
        
        archivoPdf.value = '';
        archivoSeleccionadoData = null;
        fileInfoDisplay.classList.add('hidden');
        dropzonePdf.classList.remove('hidden');
        document.getElementById('fechaCargaPdf').value = '';
        const previewCargaCard = document.getElementById('previewCargaCard');
        if(previewCargaCard) {
            previewCargaCard.classList.add('hidden');
            document.getElementById('iframePreviewCarga').src = '';
        }
    });

    window.verDocumentoRepositorio = function(base64, noToolbar = false) {
        let srcUrl = base64;
        if (!srcUrl.includes('#toolbar=')) {
            srcUrl += noToolbar ? '#toolbar=0' : '#toolbar=1&navpanes=0'; 
        } else if (!noToolbar) {
            srcUrl = srcUrl.replace('#toolbar=0', '#toolbar=1&navpanes=0');
        }
        document.getElementById('pdfPreviewFrame').src = srcUrl;
        document.getElementById('modalPreview').classList.remove('hidden');
        registrarAuditoria("VISUALIZADOR PDF", `Visualizó archivo PDF extendido.`);
    }

    document.getElementById('btnCerrarPreview')?.addEventListener('click', () => {
        document.getElementById('modalPreview').classList.add('hidden');
        document.getElementById('pdfPreviewFrame').src = ''; 
    });


    // --- 5. REPOSITORIO DE ARCHIVOS ---
    const todasLasSucursales = [
        "CHIQUIMULA", "SAN NICOLAS 1", "SIXTINO", "FRUTAL", 
        "METRONORTE", "NARANJO", "SAN NICOLAS 2", "PERI ROOSEVELT"
    ];

    function renderizarArbolRepositorio() {
        const repo = JSON.parse(localStorage.getItem('repoArchivos')) || [];
        const container = document.getElementById('treeViewContainer');
        if(!container) return;
        
        container.innerHTML = '';
        
        const agrupado = {};
        todasLasSucursales.forEach(s => agrupado[s] = {});
        
        repo.forEach(item => {
            if(item.sucursal) {
                let sName = item.sucursal.toUpperCase();
                let datePart = item.fecha || 'Sin Fecha';
                let dObj = new Date(datePart);
                let mesAnio = isNaN(dObj) ? 'Otros' : dObj.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
                
                if(agrupado[sName]) {
                    if(!agrupado[sName][mesAnio]) agrupado[sName][mesAnio] = [];
                    agrupado[sName][mesAnio].push(item);
                }
            }
        });

        todasLasSucursales.forEach(suc => {
            if(currentUser.role === 'sucursal' && currentUser.sucursal.toUpperCase() !== suc) return;

            const sucDiv = document.createElement('div');
            sucDiv.className = "repo-folder-card";
            sucDiv.style.cssText = "background: #f8fafc; border: 1px solid var(--border); border-radius: 12px; overflow: hidden;";
            
            const mesesKeys = Object.keys(agrupado[suc]);
            let totalArchivos = 0;
            mesesKeys.forEach(m => totalArchivos += agrupado[suc][m].length);
            
            const isEmpty = totalArchivos === 0;

            sucDiv.innerHTML = `
                <div style="background: var(--primary); color: white; padding: 12px 15px; display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="this.nextElementSibling.classList.toggle('hidden')">
                    <h3 style="margin:0; font-size: 1rem;"><i class="fas ${isEmpty ? 'fa-folder' : 'fa-folder-open'} text-accent"></i> ${suc}</h3>
                    <span style="background: rgba(255,255,255,0.2); font-size: 0.75rem; padding: 3px 8px; border-radius: 10px;">${totalArchivos} archivos</span>
                </div>
                <div class="${isEmpty ? 'hidden' : ''} repo-content-body" style="padding: 10px;">
                    ${isEmpty ? `<p style="text-align:center; color: var(--secondary); font-size: 0.85rem; margin: 15px 0;">Carpeta vacía</p>` : ``}
                </div>
            `;
            
            if(!isEmpty) {
                const bodyDiv = sucDiv.querySelector('.repo-content-body');
                mesesKeys.sort().reverse().forEach(mes => {
                    const mesDiv = document.createElement('div');
                    mesDiv.innerHTML = `<h4 style="font-size:0.85rem; color:var(--secondary); border-bottom:1px solid var(--border); padding-bottom:4px; margin:10px 0 5px 0;"><i class="fas fa-calendar-alt"></i> ${mes}</h4><ul style="list-style: none; padding: 0; margin: 0;"></ul>`;
                    
                    const ul = mesDiv.querySelector('ul');
                    agrupado[suc][mes].sort((a,b) => new Date(b.fecha) - new Date(a.fecha)).forEach(file => {
                        const li = document.createElement('li');
                        li.style.cssText = "padding: 10px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: white; margin-bottom: 5px; border-radius: 8px; flex-wrap: wrap; gap: 10px;";
                        
                        let botonesHTML = '';
                        if(currentUser.role === 'master') {
                            botonesHTML = `
                                <button class="btn-icon" title="Ver" onclick="window.verDocumentoRepositorio('${file.fileData}', false)"><i class="fas fa-eye text-accent"></i></button>
                                <button class="btn-icon" title="Descargar" onclick="window.descargarArchivoBase64('${file.fileData}', 'Doc_${file.fecha}_${suc}.pdf')"><i class="fas fa-download text-success"></i></button>
                                <button class="btn-icon" title="Reemplazar" onclick="window.reemplazarArchivoMaster(${file.id})"><i class="fas fa-sync-alt text-warning"></i></button>
                                <button class="btn-icon" title="Eliminar" onclick="window.eliminarArchivoMaster(${file.id})"><i class="fas fa-trash text-danger"></i></button>
                            `;
                        } else if (currentUser.role === 'regular') {
                            botonesHTML = `
                                <button class="btn-icon" title="Ver" onclick="window.verDocumentoRepositorio('${file.fileData}', false)"><i class="fas fa-eye text-accent"></i></button>
                                <button class="btn-icon" title="Descargar" onclick="window.descargarArchivoBase64('${file.fileData}', 'Doc_${file.fecha}_${suc}.pdf')"><i class="fas fa-download text-success"></i></button>
                            `;
                        } else if (currentUser.role === 'sucursal') {
                            botonesHTML = `
                                <button class="btn-icon" title="Ver (Solo lectura)" onclick="window.verDocumentoRepositorio('${file.fileData}', true)"><i class="fas fa-eye text-accent"></i></button>
                                <button class="btn-icon" title="Solicitar Eliminar" onclick="window.solicitarEliminarArchivo(${file.id}, '${file.fecha}')"><i class="fas fa-times-circle text-danger"></i></button>
                            `;
                        }

                        // Diferenciar visualmente
                        let labelPdf = 'CIERRE_COMPLETO';
                        let colorIcon = 'text-danger';
                        
                        if (file.tipoDoc === 'faltante' || file.tipoDoc === 'deposito') {
                            labelPdf = 'COMPROBANTES';
                            colorIcon = 'text-success';
                        } else if (file.tipoDoc === 'incompleto') {
                            labelPdf = 'CIERRE_INCOMPLETO';
                            colorIcon = 'text-warning';
                        } else if (file.tipoDoc === 'cierre') {
                            labelPdf = 'CIERRE_DIARIO';
                            colorIcon = 'text-danger';
                        }

                        li.innerHTML = `
                            <div style="flex:1;">
                                <span style="font-size:0.85rem; font-weight:600; color:var(--primary); display:block;"><i class="fas fa-file-pdf ${colorIcon}"></i> ${labelPdf}_${file.fecha} (${file.turno || 'N/A'}).pdf</span>
                                <span style="font-size:0.7rem; color:var(--secondary);"><i class="far fa-clock"></i> Subido: ${file.fechaSubida}</span>
                            </div>
                            <div style="display:flex; gap:5px;">
                                ${botonesHTML}
                            </div>
                        `;
                        ul.appendChild(li);
                    });
                    bodyDiv.appendChild(mesDiv);
                });
            }
            container.appendChild(sucDiv);
        });
    }

    window.descargarArchivoBase64 = function(base64, filename) {
        const link = document.createElement("a");
        link.href = base64;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        registrarAuditoria("DESCARGA ARCHIVO", `Descargó el archivo: ${filename}`);
    };

    window.reemplazarArchivoMaster = async function(id) {
        const { value: pass } = await Swal.fire({ title: 'Autorización Master Requerida', input: 'password', inputPlaceholder: 'Clave de acceso', showCancelButton: true });
        if(pass !== currentUser.pass) return Swal.fire('Error', 'Clave incorrecta. Operación cancelada.', 'error');
        
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/pdf';
        input.onchange = e => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = ev => {
                let repo = JSON.parse(localStorage.getItem('repoArchivos')) || [];
                const index = repo.findIndex(r => r.id === id);
                if(index !== -1) {
                    repo[index].fileData = ev.target.result;
                    repo[index].fechaSubida = new Date().toLocaleString() + ' (Modificado por Master)';
                    guardarEnFirebase('repoArchivos', repo);
                    renderizarArbolRepositorio();
                    registrarAuditoria("REEMPLAZO ARCHIVO", `El Master reemplazó el archivo PDF con ID: ${id}`);
                    agregarNotificacion(`El usuario ${currentUser.user} reemplazó un documento del repositorio.`, 'alerta', 'master');
                    Swal.fire('Éxito', 'Archivo reemplazado correctamente', 'success');
                }
            };
            reader.readAsDataURL(file);
        };
        input.click();
    };

    window.eliminarArchivoMaster = async function(id) {
        const { value: pass } = await Swal.fire({ title: 'Autorización Master Requerida', text: 'Confirmar eliminación permanente.', input: 'password', showCancelButton: true });
        if(pass !== currentUser.pass) return Swal.fire('Error', 'Clave incorrecta.', 'error');
        
        let repo = JSON.parse(localStorage.getItem('repoArchivos')) || [];
        repo = repo.filter(r => r.id !== id);
        guardarEnFirebase('repoArchivos', repo);
        renderizarArbolRepositorio();
        registrarAuditoria("ELIMINACIÓN ARCHIVO", `El Master eliminó permanentemente el archivo PDF ID: ${id}`);
        Swal.fire('Eliminado', 'Archivo borrado del sistema.', 'success');
    };

    window.solicitarEliminarArchivo = async function(id, fecha) {
        const {value: motivo} = await Swal.fire({
            title: 'Solicitar Eliminación al Máster',
            text: `Justifique la eliminación del archivo del ${fecha}`,
            input: 'textarea',
            showCancelButton: true
        });
        if(motivo) {
            const reqs = JSON.parse(localStorage.getItem('solicitudesEstuconta')) || [];
            reqs.push({id: Date.now(), fecha: new Date().toLocaleDateString(), sucursal: currentUser.sucursal, usuario: currentUser.user, tipo: 'Eliminación Archivo PDF', archivoAfectado: `Doc_${fecha}.pdf`, descripcion: motivo, estado: 'Pendiente'});
            guardarEnFirebase('solicitudesEstuconta', reqs);
            registrarAuditoria("SOLICITUD CREADA", `Se solicitó la eliminación del PDF de fecha ${fecha}. Razón: ${motivo}`);
            agregarNotificacion(`La sucursal ${currentUser.sucursal} solicitó eliminar un PDF.`, 'alerta', 'master');
            Swal.fire('Enviado', 'Solicitud enviada al Master exitosamente.', 'success');
        }
    };

    // --- MEJORA AUDITORÍA ---
    function registrarAuditoria(accion, detalle) {
        if (!currentUser && accion !== "ERROR SESIÓN" && accion !== "INTENTO FALLIDO") return;
        const auditoria = JSON.parse(localStorage.getItem('auditoriaEstuconta')) || [];
        auditoria.unshift({
            fecha: new Date().toLocaleString(),
            isoDate: new Date().toISOString().split('T')[0], 
            usuario: currentUser ? currentUser.user : 'SISTEMA', 
            rol: currentUser ? currentUser.role : 'sistema', 
            accion: accion, 
            detalle: detalle
        });
        if(auditoria.length > 1000) auditoria.length = 1000;
        guardarEnFirebase('auditoriaEstuconta', auditoria);
    }
    
    window.cargarAuditoria = function() {
        const auditoria = JSON.parse(localStorage.getItem('auditoriaEstuconta')) || [];
        const tbody = document.querySelector('#tablaAuditoria tbody');
        if(!tbody) return;

        const fInicio = document.getElementById('filtroAuditoriaInicio')?.value;
        const fFin = document.getElementById('filtroAuditoriaFin')?.value;
        const fSucursal = document.getElementById('filtroAuditoriaSucursal')?.value.toLowerCase();
        const fDetalle = document.getElementById('filtroAuditoriaDetalle')?.value.toLowerCase();

        let filtrados = auditoria;

        if (fInicio || fFin) {
            filtrados = filtrados.filter(a => {
                let iso = a.isoDate;
                if (!iso) {
                    let datePart = a.fecha.split(',')[0].trim();
                    let parts = datePart.split('/');
                    if (parts.length === 3) {
                        iso = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                    } else {
                        try { iso = new Date(datePart).toISOString().split('T')[0]; } 
                        catch(e) { iso = '1970-01-01'; }
                    }
                }
                if (fInicio && iso < fInicio) return false;
                if (fFin && iso > fFin) return false;
                return true;
            });
        }

        if (fSucursal) {
            filtrados = filtrados.filter(a => 
                a.usuario.toLowerCase().includes(fSucursal) || 
                a.rol.toLowerCase().includes(fSucursal) || 
                a.detalle.toLowerCase().includes(fSucursal)
            );
        }

        if (fDetalle) {
            filtrados = filtrados.filter(a => 
                a.accion.toLowerCase().includes(fDetalle) || 
                a.detalle.toLowerCase().includes(fDetalle)
            );
        }

        tbody.innerHTML = '';

        if (filtrados.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--secondary); padding: 20px;">No se encontraron registros que coincidan con los filtros.</td></tr>`;
            return;
        }

        filtrados.forEach(a => {
            const tr = document.createElement('tr');
            let colorAccion = "var(--primary)";
            if(a.accion.includes('ERROR') || a.accion.includes('FALLIDO') || a.accion.includes('ELIMINA')) colorAccion = "var(--danger)";
            if(a.accion.includes('EXITOS') || a.accion.includes('AGREGAR') || a.accion.includes('FILTRO')) colorAccion = "var(--success)";
            
            tr.innerHTML = `
                <td style="font-size:0.8rem; color:var(--secondary);">${a.fecha}</td>
                <td><strong>${a.usuario}</strong> <br><span style="font-size:0.7rem; color:var(--accent); background:rgba(0,97,255,0.1); padding:2px 6px; border-radius:4px;">${a.rol.toUpperCase()}</span></td>
                <td style="font-weight:700; color:${colorAccion}; font-size:0.85rem;">${a.accion}</td>
                <td style="font-size:0.85rem;">${a.detalle}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    document.getElementById('btnFiltrarAuditoria')?.addEventListener('click', () => {
        window.cargarAuditoria();
        registrarAuditoria("FILTRO AUDITORÍA", "Aplicó filtros de búsqueda en la tabla de Auditoría");
    });
    
    document.getElementById('btnLimpiarAuditoria')?.addEventListener('click', () => {
        if(document.getElementById('filtroAuditoriaInicio')) document.getElementById('filtroAuditoriaInicio').value = '';
        if(document.getElementById('filtroAuditoriaFin')) document.getElementById('filtroAuditoriaFin').value = '';
        if(document.getElementById('filtroAuditoriaSucursal')) document.getElementById('filtroAuditoriaSucursal').value = '';
        if(document.getElementById('filtroAuditoriaDetalle')) document.getElementById('filtroAuditoriaDetalle').value = '';
        window.cargarAuditoria();
    });

    // --- 6. PANEL CIERRE DIARIO ---
    const formasPago = ["EFECTIVO", "CHEQUE", "TRANSFERENCIA", "DEPÓSITOS", "POS BAC", "COMPRA CLICK", "POS MÓVIL BAC", "POS VISA", "VISALINK", "CRÉDITOS EMPRESAS", "CXC NÓMINA", "GIFTCARD"];
    const bancosList = ["N/A", "Banco Industrial", "Banrural", "BAC Credomatic", "G&T Continental", "BAM", "Promerica", "Interbanco", "Ficohsa", "Vivibanco", "Citibank", "Banco Azteca"];

    const sucursalSelect = document.getElementById('sucursalSelect');
    const turnoSelect = document.getElementById('turnoSelect');
    const fechaInput = document.getElementById('fechaInput');
    const tablaPagosBody = document.querySelector('#tablaPagos tbody');

    function actualizarUsuarios() {
        const idSucursal = sucursalSelect?.value;
        const usuarios = Object.keys(datosUsuarios[idSucursal] || {});
        if(turnoSelect){
            turnoSelect.innerHTML = '';
            usuarios.forEach(u => { const op = document.createElement('option'); op.value = u; op.textContent = u; turnoSelect.appendChild(op); });
            
            const respSelect = document.getElementById('responsableSelect');
            if (respSelect) respSelect.value = turnoSelect.value;
        }
        verificarPdfRepositorio(); 
        registrarAuditoria("CAMBIO SUCURSAL", `Cambió filtro Cierre Diario a sucursal ID: ${idSucursal}`);
    }
    sucursalSelect?.addEventListener('change', actualizarUsuarios);

    // NUEVO: Variables para controlar PDFs Múltiples (Cierre y Depósito/Faltante)
    let urlPdfCierreActual = '';
    let urlPdfDepositoActual = '';

    document.getElementById('btnVerCierrePdf')?.addEventListener('click', (e) => {
        document.getElementById('btnVerCierrePdf').classList.add('active');
        document.getElementById('btnVerDepositoPdf').classList.remove('active');
        let srcUrl = urlPdfCierreActual;
        if (srcUrl) document.getElementById('inlinePdfFrame').src = srcUrl.includes('#toolbar=') ? srcUrl.replace('#toolbar=0', '#toolbar=1&navpanes=0') : srcUrl + '#toolbar=1&navpanes=0';
    });

    document.getElementById('btnVerDepositoPdf')?.addEventListener('click', (e) => {
        document.getElementById('btnVerDepositoPdf').classList.add('active');
        document.getElementById('btnVerCierrePdf').classList.remove('active');
        let srcUrl = urlPdfDepositoActual;
        if (srcUrl) document.getElementById('inlinePdfFrame').src = srcUrl.includes('#toolbar=') ? srcUrl.replace('#toolbar=0', '#toolbar=1&navpanes=0') : srcUrl + '#toolbar=1&navpanes=0';
    });

    function verificarPdfRepositorio() {
        const selectElement = document.getElementById('sucursalSelect');
        const fInput = document.getElementById('fechaInput');
        const statusDiv = document.getElementById('pdf-detection-status');
        const fRecibido = document.getElementById('fechaRecibido');
        const pdfContainer = document.getElementById('inlinePdfContainer');
        const pdfFrame = document.getElementById('inlinePdfFrame');
        const turnoSel = document.getElementById('turnoSelect');
        const pdfToggleContainer = document.getElementById('pdfToggleContainer');

        if (!selectElement || !fInput || !statusDiv) return;

        const sucursalNombre = selectElement.options[selectElement.selectedIndex].text;
        const fechaVal = fInput.value;
        const turnoVal = turnoSel ? turnoSel.value : '';

        // Reset UI
        pdfContainer.style.display = 'none';
        pdfFrame.src = '';
        fRecibido.removeAttribute('readonly');
        fRecibido.style.backgroundColor = '';
        fRecibido.style.cursor = '';
        fRecibido.value = '';
        pdfToggleContainer.classList.add('hidden');
        urlPdfCierreActual = '';
        urlPdfDepositoActual = '';

        if (!fechaVal || !sucursalNombre) {
            statusDiv.style.display = 'none';
            return;
        }

        const repo = JSON.parse(localStorage.getItem('repoArchivos')) || [];
        const matches = repo.filter(r => r.sucursal.toUpperCase() === sucursalNombre.toUpperCase() && r.fecha === fechaVal);

        statusDiv.style.display = 'flex';

        if (matches.length > 0) {
            let exactMatches = matches.filter(m => m.turno === turnoVal);
            
            if (exactMatches.length === 0 && matches.length > 0 && (!matches[0].turno || matches[0].turno === 'N/A')) {
                exactMatches = matches; 
            }

            if (exactMatches.length > 0) {
                // Separar Cierre y Comprobantes
                let docCierre = exactMatches.find(m => m.tipoDoc === 'completo' || m.tipoDoc === 'incompleto' || m.tipoDoc === 'cierre');
                let docComprobante = exactMatches.find(m => m.tipoDoc === 'faltante' || m.tipoDoc === 'deposito');

                let mensajeStatus = '';
                let statusClass = 'success'; // success, warning, danger

                if(docCierre) {
                    if(docCierre.tipoDoc === 'completo') {
                        mensajeStatus = `Cierre completo adjunto de la sucursal ${sucursalNombre} y dia ${fechaVal}`;
                        pdfToggleContainer.classList.add('hidden');
                        statusClass = 'success';
                    } else if (docCierre.tipoDoc === 'incompleto') {
                        if (docComprobante) {
                            mensajeStatus = `Se cargaron comprobantes fisicos faltante de la sucursal ${sucursalNombre} y dia ${fechaVal}, cierre completo`;
                            pdfToggleContainer.classList.remove('hidden');
                            document.getElementById('btnVerCierrePdf').textContent = "Cierre Incompleto";
                            document.getElementById('btnVerDepositoPdf').textContent = "Comprobantes";
                            statusClass = 'success';
                        } else {
                            mensajeStatus = `Cierre incompleto, falta adjuntar comprobantes fisicos de la sucursal ${sucursalNombre} y dia ${fechaVal}`;
                            pdfToggleContainer.classList.add('hidden');
                            statusClass = 'warning';
                        }
                    } else {
                        // Legacy support for 'cierre' and 'deposito'
                        if(docComprobante) {
                            mensajeStatus = `Documentos base y adicionales enlazados exitosamente (${fechaVal}).`;
                            pdfToggleContainer.classList.remove('hidden');
                            document.getElementById('btnVerCierrePdf').textContent = "Cierre Diario";
                            document.getElementById('btnVerDepositoPdf').textContent = "Boletas";
                            statusClass = 'success';
                        } else {
                            mensajeStatus = `Cierre base enlazado exitosamente (${fechaVal}).`;
                            pdfToggleContainer.classList.add('hidden');
                            statusClass = 'success';
                        }
                    }
                } else if (docComprobante) {
                    mensajeStatus = `ATENCIÓN: Solo se encontraron comprobantes cargados para (${fechaVal}). Faltante de cargar Cierre.`;
                    pdfToggleContainer.classList.add('hidden');
                    statusClass = 'warning';
                }

                if (statusClass === 'success') {
                    statusDiv.style.background = 'rgba(5, 150, 105, 0.08)';
                    statusDiv.style.border = '1px dashed var(--success)';
                    statusDiv.innerHTML = `<div><span style="color: var(--success); font-weight: 600;"><i class="fas fa-check-circle"></i> ${mensajeStatus}</span></div>`;
                } else {
                    statusDiv.style.background = 'rgba(245, 158, 11, 0.08)';
                    statusDiv.style.border = '1px dashed var(--warning)';
                    statusDiv.innerHTML = `<div><span style="color: #d97706; font-weight: 600;"><i class="fas fa-exclamation-triangle"></i> ${mensajeStatus}</span></div>`;
                }

                let docBaseParaFecha = docCierre || docComprobante;
                if (docBaseParaFecha.fechaCargaISO) {
                    fRecibido.value = docBaseParaFecha.fechaCargaISO;
                } else {
                    const parts = docBaseParaFecha.fechaSubida.split(',')[0].split('/');
                    if(parts.length === 3) {
                        const isoD = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                        fRecibido.value = isoD;
                    } else {
                        fRecibido.value = new Date().toISOString().split('T')[0];
                    }
                }
                fRecibido.setAttribute('readonly', 'true');
                fRecibido.style.backgroundColor = '#f1f5f9';
                fRecibido.style.cursor = 'not-allowed';

                pdfContainer.style.display = 'flex';
                
                if(docCierre) urlPdfCierreActual = docCierre.fileData;
                if(docComprobante) urlPdfDepositoActual = docComprobante.fileData;

                let srcUrl = urlPdfCierreActual || urlPdfDepositoActual;
                if (!srcUrl.includes('#toolbar=')) {
                    srcUrl += '#toolbar=1&navpanes=0'; 
                } else {
                    srcUrl = srcUrl.replace('#toolbar=0', '#toolbar=1&navpanes=0');
                }
                pdfFrame.src = srcUrl;

            } else {
                const turnosCargados = [...new Set(matches.map(m => m.turno || 'N/A'))].join(', ');
                statusDiv.style.background = 'rgba(245, 158, 11, 0.08)';
                statusDiv.style.border = '1px dashed var(--warning)';
                statusDiv.innerHTML = `
                    <div>
                        <span style="color: #d97706; font-weight: 600;"><i class="fas fa-info-circle"></i> Hay documento(s) en el sistema para los turnos: <strong>${turnosCargados}</strong>. Cambie el Selector de Turno para visualizarlo o cargue el faltante.</span>
                    </div>
                `;
            }
        } else {
            statusDiv.style.background = 'rgba(220, 38, 38, 0.05)';
            statusDiv.style.border = '1px dashed rgba(220, 38, 38, 0.4)';
            statusDiv.innerHTML = `
                <div>
                    <span style="color: var(--danger); font-size: 0.9rem;"><i class="fas fa-exclamation-triangle"></i> No se encontró cierre del día ${fechaVal} de la sucursal ${sucursalNombre} cargado en el sistema.</span>
                </div>
            `;
        }
    }

    document.getElementById('fechaInput')?.addEventListener('change', () => {
        verificarPdfRepositorio();
        registrarAuditoria("CAMBIO FECHA", `Cambió fecha del Cierre Diario a: ${document.getElementById('fechaInput').value}`);
    });

    document.getElementById('turnoSelect')?.addEventListener('change', (e) => {
        const responsableInput = document.getElementById('responsableSelect');
        if (responsableInput) responsableInput.value = e.target.value;
        verificarPdfRepositorio();
    });

    // --- PANEL FLOTANTE DE BOLETAS ---
    const panelBoletas = document.getElementById('panelBoletas');
    const panelBoletasHeader = document.getElementById('panelBoletasHeader');
    const panelBoletasBody = document.getElementById('panelBoletasBody');
    let isDragging = false, offsetX, offsetY;
    let currentRowForBoletas = null;

    panelBoletasHeader.addEventListener('mousedown', e => {
        isDragging = true;
        offsetX = e.clientX - panelBoletas.getBoundingClientRect().left;
        offsetY = e.clientY - panelBoletas.getBoundingClientRect().top;
    });
    document.addEventListener('mousemove', e => {
        if(isDragging) {
            panelBoletas.style.left = (e.clientX - offsetX) + 'px';
            panelBoletas.style.top = (e.clientY - offsetY) + 'px';
        }
    });
    document.addEventListener('mouseup', () => isDragging = false);

    document.getElementById('btnClosePanelBoletas')?.addEventListener('click', () => {
        panelBoletas.classList.add('hidden');
    });

    window.abrirPanelBoletas = function(btnElement) {
        const row = btnElement.closest('tr');
        const selectForma = row.querySelector('.m-forma').value;
        
        if(selectForma !== "TRANSFERENCIA" && selectForma !== "EFECTIVO") {
            Swal.fire({
                title: 'Información',
                text: 'Normalmente no se requiere detalle exhaustivo de boletas para ' + selectForma + ', ¿Desea continuar e ingresarlo?',
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: 'Sí, abrir detalle'
            }).then((result) => {
                if(result.isConfirmed) procesarAperturaPanel(row);
            });
        } else {
            procesarAperturaPanel(row);
        }
    };

    function procesarAperturaPanel(row) {
        currentRowForBoletas = row;
        let boletas = JSON.parse(row.dataset.boletas || '[]');
        document.getElementById('numBoletasInput').value = boletas.length > 0 ? boletas.length : 1;
        generarCamposBoletas(boletas);
        panelBoletas.classList.remove('hidden');
        registrarAuditoria("APERTURA DETALLES", `Abrió panel de desglose de boletas para ${row.querySelector('.m-forma').value}`);
    }

    document.getElementById('btnGenerarBoletas')?.addEventListener('click', () => {
        const num = parseInt(document.getElementById('numBoletasInput').value) || 1;
        let boletasActuales = obtenerDatosBoletasPanel();
        
        while (boletasActuales.length < num) { boletasActuales.push({}); }
        if (boletasActuales.length > num) { boletasActuales = boletasActuales.slice(0, num); }
        
        generarCamposBoletas(boletasActuales);
    });

    function generarCamposBoletas(boletasData) {
        panelBoletasBody.innerHTML = '';
        if (boletasData.length === 0) boletasData.push({});

        boletasData.forEach((b, index) => {
            const div = document.createElement('div');
            div.style.cssText = "padding: 15px; border: 1px solid var(--border); border-radius: 8px; margin-bottom: 10px; background: white;";
            div.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 10px; font-size: 0.9rem; color: var(--primary);">#${index + 1} Detalle de Transacción</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div class="form-group" style="gap: 4px;">
                        <label style="font-size: 0.75rem;">Banco:</label>
                        <select class="modern-select p-banco" style="padding: 6px 10px; font-size: 0.85rem;">
                            ${bancosList.map(banco => `<option ${b.banco === banco ? 'selected' : ''}>${banco}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group" style="gap: 4px;">
                        <label style="font-size: 0.75rem;">Monto (Q):</label>
                        <input type="number" step="0.01" class="modern-input p-monto" style="padding: 6px 10px; font-size: 0.85rem;" value="${b.monto || ''}">
                    </div>
                    <div class="form-group" style="gap: 4px;">
                        <label style="font-size: 0.75rem;">No. Documento / Boleta:</label>
                        <input type="text" class="modern-input p-doc" style="padding: 6px 10px; font-size: 0.85rem;" value="${b.documento || ''}">
                    </div>
                    <div class="form-group" style="gap: 4px;">
                        <label style="font-size: 0.75rem;">Fecha Documento:</label>
                        <input type="date" class="modern-input p-fecha" style="padding: 6px 10px; font-size: 0.85rem;" value="${b.fechaDoc || ''}">
                    </div>
                </div>
            `;
            div.querySelector('.p-monto').addEventListener('input', recalcularTotalPanelBoletas);
            panelBoletasBody.appendChild(div);
        });
        recalcularTotalPanelBoletas();
    }

    function obtenerDatosBoletasPanel() {
        const boletas = [];
        document.querySelectorAll('#panelBoletasBody > div').forEach(item => {
            boletas.push({
                banco: item.querySelector('.p-banco').value,
                monto: item.querySelector('.p-monto').value || '',
                documento: item.querySelector('.p-doc').value || '',
                fechaDoc: item.querySelector('.p-fecha').value || ''
            });
        });
        return boletas;
    }

    function recalcularTotalPanelBoletas() {
        let total = 0;
        document.querySelectorAll('.p-monto').forEach(input => {
            total += parseFloat(input.value) || 0;
        });
        document.getElementById('sumaBoletasTotal').textContent = `Q ${total.toFixed(2)}`;
    }

    document.getElementById('btnSaveBoletas')?.addEventListener('click', () => {
        if (!currentRowForBoletas) return;
        
        const boletasData = obtenerDatosBoletasPanel();
        currentRowForBoletas.dataset.boletas = JSON.stringify(boletasData);
        
        let sumFisico = 0;
        boletasData.forEach(b => sumFisico += parseFloat(b.monto) || 0);
        
        const fisicoInput = currentRowForBoletas.querySelector('.m-fisico');
        fisicoInput.value = sumFisico.toFixed(2);
        
        const countSpan = currentRowForBoletas.querySelector('.bol-count');
        countSpan.textContent = `Detalle (${boletasData.length})`;
        
        calcularTotales();
        panelBoletas.classList.add('hidden');
        registrarAuditoria("GUARDADO DETALLES", `Guardó ${boletasData.length} boletas sumando Q${sumFisico.toFixed(2)}`);
    });

    function crearFilaPago(data = null) {
        if(!tablaPagosBody) return;
        const row = document.createElement('tr');
        
        const formaPago = data?.formaPago || 'EFECTIVO';
        const montoCierre = data && data.montoCierre !== undefined ? data.montoCierre : '';
        const montoFisico = data && data.montoFisico !== undefined ? data.montoFisico : '';

        let boletasArr = data?.boletas || [];
        if (data && (!data.boletas || boletasArr.length === 0) && data.documento) {
             boletasArr = [{ banco: data.banco, documento: data.documento, fechaDoc: data.fechaDoc, monto: data.montoFisico }];
        }
        row.dataset.boletas = JSON.stringify(boletasArr);

        const textBtn = boletasArr.length > 0 ? `Detalle (${boletasArr.length})` : `Detalles`;

        row.innerHTML = `
            <td style="text-align: center;"><button class="btn-del" title="Eliminar fila"><i class="fas fa-trash-alt"></i></button></td>
            <td><select class="table-select m-forma" style="font-weight: 600;">${formasPago.map(f => `<option ${formaPago === f ? 'selected' : ''}>${f}</option>`).join('')}</select></td>
            <td><input type="number" class="table-input m-cierre" value="${montoCierre}" step="0.01"></td>
            <td><input type="number" class="table-input m-fisico" value="${montoFisico}" step="0.01"></td>
            <td style="text-align:center;"><button class="btn-add btn-detalle-trigger" style="width:100%; justify-content:center; padding: 6px 10px; font-size: 0.8rem;" onclick="window.abrirPanelBoletas(this)"><i class="fas fa-list-ul"></i> <span class="bol-count">${textBtn}</span></button></td>
            <td class="m-diff" style="text-align: right; font-weight:bold; color: var(--secondary);">0.00</td>
        `;
        row.querySelector('.btn-del').onclick = () => { row.remove(); calcularTotales(); };
        row.querySelectorAll('input, select').forEach(el => el.addEventListener('input', calcularTotales));
        tablaPagosBody.appendChild(row); calcularTotales();
    }

    document.getElementById('addFilaBtn')?.addEventListener('click', () => {
        crearFilaPago();
        registrarAuditoria("AGREGÓ FILA", "Añadió una nueva fila en el Cierre Diario");
    });

    // NUEVO: Cálculos Avanzados de Sobrante/Faltante
    function calcularTotales() {
        let tC = 0, tF = 0;
        let discrepancias = [];

        document.querySelectorAll('#tablaPagos tbody tr').forEach(row => {
            const formaPago = row.querySelector('.m-forma').value;
            const c = parseFloat(row.querySelector('.m-cierre').value) || 0;
            const f = parseFloat(row.querySelector('.m-fisico').value) || 0;
            const d = c - f; // Positivo: Faltante, Negativo: Sobrante
            
            const diffSpan = row.querySelector('.m-diff');
            diffSpan.textContent = d.toFixed(2);
            
            if (d > 0.001) {
                diffSpan.style.color = 'var(--danger)'; // Rojo Faltante
                discrepancias.push({ forma: formaPago, monto: Math.abs(d), tipo: 'FALTANTE', color: 'var(--danger)' });
            } else if (d < -0.001) {
                diffSpan.style.color = 'var(--success)'; // Verde Sobrante
                discrepancias.push({ forma: formaPago, monto: Math.abs(d), tipo: 'SOBRANTE', color: 'var(--success)' });
            } else {
                diffSpan.style.color = 'var(--secondary)'; // Gris Cuadrado
            }

            tC += c; tF += f;
        });
        
        document.getElementById('totalCierre').textContent = tC.toFixed(2);
        document.getElementById('totalFisico').textContent = tF.toFixed(2);
        
        const difTotalGlobal = tC - tF;
        const totalDifElement = document.getElementById('totalDiferencia');
        totalDifElement.textContent = difTotalGlobal.toFixed(2);

        // Desglose de discrepancias abajo
        const panelDisc = document.getElementById('discrepanciasList');
        if(panelDisc) {
            if(discrepancias.length > 0) {
                panelDisc.innerHTML = discrepancias.map(x => 
                    `<span style="font-size: 0.85rem; font-weight: 600; color: ${x.color};">
                        <i class="fas ${x.tipo==='FALTANTE'?'fa-exclamation-circle':'fa-arrow-up'}"></i> 
                        ${x.forma}: ${x.tipo} de Q${x.monto.toFixed(2)}
                    </span>`
                ).join('');
            } else {
                panelDisc.innerHTML = '';
            }
        }

        const displayCierre = document.getElementById('displayTotalCierre');
        const displayDiff = document.getElementById('displayTotalDiff');
        
        if (displayCierre) displayCierre.textContent = 'Q ' + tC.toFixed(2);
        
        let diffAbs = Math.abs(difTotalGlobal);
        if (displayDiff) {
            displayDiff.textContent = 'Q ' + diffAbs.toFixed(2);
            if(difTotalGlobal > 0.001) displayDiff.style.color = 'var(--danger)';
            else if(difTotalGlobal < -0.001) displayDiff.style.color = 'var(--success)';
            else displayDiff.style.color = 'var(--secondary)';
        }

        if (chartCierre) {
            let proporcionCuadrada = tF;
            let proporcionDiferencia = diffAbs;
            if (tC === 0 && tF === 0) { proporcionCuadrada = 100; proporcionDiferencia = 0; }
            chartCierre.data.datasets[0].data = [proporcionCuadrada, proporcionDiferencia];
            
            // Cambiar color del anillo si es sobrante o faltante global
            chartCierre.data.datasets[0].backgroundColor[1] = difTotalGlobal < 0 ? '#00875a' : '#de350b';
            chartCierre.update();
        }
    }

    function cargarDatosDiaActual() { if(tablaPagosBody) { tablaPagosBody.innerHTML = ''; for(let i=0; i<3; i++) crearFilaPago(); } }

    document.getElementById('btnGuardarCierre')?.addEventListener('click', async () => {
        const selectElement = document.getElementById('sucursalSelect');
        const sucursalNombre = selectElement.options[selectElement.selectedIndex].text;
        const fechaCierreInput = document.getElementById('fechaInput').value;
        const turnoActual = document.getElementById('turnoSelect').value;
        
        if(!fechaCierreInput) {
            return Swal.fire('Error', 'Debe seleccionar la fecha del cierre.', 'error');
        }

        let historial = JSON.parse(localStorage.getItem('historialCierresEstuconta')) || [];
        
        if (!window.cierreEnEdicionId) {
            const existeCierre = historial.find(c => c.sucursal.toUpperCase() === sucursalNombre.toUpperCase() && c.fechaCierre === fechaCierreInput && c.usuario === turnoActual);
            if (existeCierre) {
                return Swal.fire({
                    title: 'Cierre Duplicado Detectado',
                    html: `El sistema detectó que ya se ha guardado un cierre previo para <strong>${sucursalNombre}</strong> con fecha <strong>${fechaCierreInput}</strong> y Turno <strong>${turnoActual}</strong>.<br><br>No se permite duplicar información. Si necesita modificarlo, por favor hágalo desde el Historial.`,
                    icon: 'warning',
                    confirmButtonText: 'Entendido'
                });
            }
        }

        const detalles = [];
        let boletasAValidar = []; 

        document.querySelectorAll('#tablaPagos tbody tr').forEach(row => {
            const boletas = JSON.parse(row.dataset.boletas || '[]');
            const primerBol = boletas[0] || {};
            const formaPago = row.querySelector('.m-forma').value;

            detalles.push({
                formaPago: formaPago,
                banco: primerBol.banco || 'N/A', 
                montoCierre: row.querySelector('.m-cierre').value || '0',
                montoFisico: row.querySelector('.m-fisico').value || '0',
                documento: primerBol.documento || '', 
                fechaDoc: primerBol.fechaDoc || '',   
                diferencia: row.querySelector('.m-diff').textContent,
                boletas: boletas 
            });

            boletas.forEach(b => {
                if(b.banco && b.banco !== "N/A" && b.documento && b.documento.trim() !== "") {
                    boletasAValidar.push({ formaPago: formaPago, banco: b.banco, documento: b.documento, fechaDoc: b.fechaDoc, monto: b.monto });
                }
            });
        });

        let boletaDuplicada = null;
        let infoDuplicada = "";

        for (let c of historial) {
            if (window.cierreEnEdicionId && c.id === window.cierreEnEdicionId) continue; 
            
            for (let d of (c.detalles || [])) {
                let boletasHist = d.boletas || [];
                if (boletasHist.length === 0 && d.documento) {
                    boletasHist = [{ banco: d.banco, documento: d.documento, fechaDoc: d.fechaDoc, monto: d.montoFisico }];
                }

                for (let bh of boletasHist) {
                    if(!bh.banco || bh.banco === "N/A" || !bh.documento || bh.documento.trim() === "") continue;

                    for (let ba of boletasAValidar) {
                        if (bh.banco === ba.banco && 
                            bh.documento === ba.documento && 
                            bh.fechaDoc === ba.fechaDoc && 
                            parseFloat(bh.monto || 0) === parseFloat(ba.monto || 0)) {
                            
                            boletaDuplicada = ba;
                            infoDuplicada = `Sucursal: ${c.sucursal} | Fecha Cierre: ${c.fechaCierre}`;
                            break;
                        }
                    }
                    if(boletaDuplicada) break;
                }
                if(boletaDuplicada) break;
            }
            if(boletaDuplicada) break;
        }

        if (boletaDuplicada) {
            return Swal.fire({
                title: 'Boleta Duplicada Detectada',
                html: `Se detectó el intento de ingresar una boleta (<strong>${boletaDuplicada.formaPago}</strong>) que ya existe en nuestra base de datos:<br><br>
                       <div style="background:#f8fafc; padding:10px; border-radius:8px; border:1px solid #e2e8f0; text-align:left; font-size:0.9rem;">
                           <strong>Banco:</strong> ${boletaDuplicada.banco}<br>
                           <strong>No. Doc:</strong> ${boletaDuplicada.documento}<br>
                           <strong>Fecha Doc:</strong> ${boletaDuplicada.fechaDoc}<br>
                           <strong>Monto:</strong> Q ${parseFloat(boletaDuplicada.monto || 0).toFixed(2)}
                       </div><br>
                       Registrada previamente en el cierre de: <br><strong style="color:var(--danger);">${infoDuplicada}</strong><br><br>
                       <strong>Operación Cancelada.</strong> Por favor revise sus registros.`,
                icon: 'error'
            });
        }

        if (window.cierreEnEdicionId) {
            const index = historial.findIndex(x => x.id === window.cierreEnEdicionId);
            if(index !== -1) {
                agregarNotificacion(
                    `El usuario ${currentUser.user} modificó el cierre de ${sucursalNombre} (${fechaCierreInput}). Anterior: Q${historial[index].totalCierre} -> Nuevo: Q${document.getElementById('totalCierre').textContent}`, 
                    'alerta', 
                    'master'
                );

                historial[index].usuario = turnoActual;
                historial[index].fechaCierre = fechaCierreInput;
                historial[index].fechaRecibido = document.getElementById('fechaRecibido').value;
                historial[index].notas = document.getElementById('notas').value;
                historial[index].totalCierre = document.getElementById('totalCierre').textContent;
                historial[index].totalFisico = document.getElementById('totalFisico').textContent;
                historial[index].totalDiferencia = document.getElementById('totalDiferencia').textContent;
                historial[index].fechaGuardado = new Date().toLocaleString() + ' (Editado)';
                historial[index].detalles = detalles;
                historial[index].ediciones = (historial[index].ediciones || 0) + 1;
            }
            window.cierreEnEdicionId = null;
            registrarAuditoria("EDITAR CIERRE", `Modificó registro de cierre en ${sucursalNombre} para la fecha ${fechaCierreInput}`);
        } else {
            const nuevoCierre = {
                id: Date.now(), 
                fechaGuardado: new Date().toLocaleString(),
                sucursal: sucursalNombre,
                usuario: turnoActual,
                fechaCierre: fechaCierreInput,
                fechaRecibido: document.getElementById('fechaRecibido').value,
                notas: document.getElementById('notas').value,
                totalCierre: document.getElementById('totalCierre').textContent,
                totalFisico: document.getElementById('totalFisico').textContent,
                totalDiferencia: document.getElementById('totalDiferencia').textContent,
                ediciones: 0,
                detalles: detalles
            };
            historial.push(nuevoCierre);
            registrarAuditoria("AGREGAR CIERRE", `Guardó nuevo cierre en ${sucursalNombre} totalizando Q${nuevoCierre.totalCierre}`);
            agregarNotificacion(`Cierre registrado por ${currentUser.user} en ${sucursalNombre} (${fechaCierreInput})`, 'info', 'master');
        }

        guardarEnFirebase('historialCierresEstuconta', historial);
        Swal.fire('Guardado', 'Cierre guardado exitosamente.', 'success');
        cargarDatosDiaActual();
        document.getElementById('fechaRecibido').value = '';
        document.getElementById('notas').value = '';
        cargarHistorialBD(); 
    });


    // --- 7. HISTORIAL BASE DE DATOS ---
    document.getElementById('filtroSucursal')?.addEventListener('change', (e) => {
        const fUser = document.getElementById('filtroUsuario');
        if(!fUser) return;
        fUser.innerHTML = '<option value="">Todos</option>';
        const idSuc = sucursalMapInv[e.target.value.toUpperCase()];
        if(idSuc && datosUsuarios[idSuc]) {
            Object.keys(datosUsuarios[idSuc]).forEach(u => {
                fUser.innerHTML += `<option value="${u}">${u}</option>`;
            });
        }
    });

    document.getElementById('btnAplicarFiltros')?.addEventListener('click', () => { cargarHistorialBD(); });

    document.getElementById('btnLimpiarFiltrosBD')?.addEventListener('click', () => {
        document.getElementById('filtroSucursal').value = '';
        document.getElementById('filtroFecha').value = '';
        document.getElementById('filtroUsuario').innerHTML = '<option value="">Todos</option>';
        cargarHistorialBD();
    });

    function cargarHistorialBD() {
        const historial = JSON.parse(localStorage.getItem('historialCierresEstuconta')) || [];
        const tbody = document.querySelector('#tablaHistorial tbody');
        if(!tbody) return; 
        tbody.innerHTML = '';
        
        let filtrados = historial;
        const fSuc = document.getElementById('filtroSucursal')?.value;
        const fFec = document.getElementById('filtroFecha')?.value;
        const fUsu = document.getElementById('filtroUsuario')?.value;

        if (fSuc) filtrados = filtrados.filter(h => h.sucursal === fSuc);
        if (fFec) filtrados = filtrados.filter(h => h.fechaCierre === fFec);
        if (fUsu) filtrados = filtrados.filter(h => h.usuario === fUsu);

        if (filtrados.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center;">No hay registros disponibles.</td></tr>`;
            return;
        }

        filtrados.sort((a,b) => b.id - a.id).forEach(c => {
            const tr = document.createElement('tr');
            
            let btnEliminar = '';
            if (currentUser && currentUser.role === 'master') {
                btnEliminar = `<button class="btn-icon" title="Eliminar Permanente (Master)" style="color:var(--danger);" onclick="window.eliminarCierreMaster(${c.id})"><i class="fas fa-trash-alt"></i></button>`;
            } else {
                btnEliminar = `<button class="btn-icon" title="Solicitar Eliminar" style="color:var(--danger);" onclick="window.solicitarEliminarCierre(${c.id})"><i class="fas fa-trash-alt"></i></button>`;
            }

            tr.innerHTML = `
                <td>${c.fechaGuardado || '-'}</td>
                <td>${c.fechaCierre}</td>
                <td>${c.sucursal}</td>
                <td>${c.usuario}</td>
                <td>Q${c.totalCierre}</td>
                <td>Q${c.totalFisico}</td>
                <td>${c.totalDiferencia || '-'}</td>
                <td class="action-buttons-cell" style="flex-wrap: nowrap; display:flex;">
                    <button class="btn-icon" title="Ver Detalles" onclick="window.verDetalleCierre(${c.id})"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon" title="Editar" onclick="window.editarCierre(${c.id})"><i class="fas fa-edit"></i></button>
                    
                    <div style="display:flex; gap:2px; background: rgba(0,0,0,0.03); padding: 2px; border-radius: 6px; margin: 0 4px; border: 1px solid var(--border);">
                        <button class="btn-icon" title="Descargar PDF" style="width:26px; height:26px; background:transparent; border:none; color:var(--danger);" onclick="window.descargarFilaPDF(${c.id})"><i class="fas fa-file-pdf"></i></button>
                        <button class="btn-icon" title="Descargar Excel" style="width:26px; height:26px; background:transparent; border:none; color:var(--success);" onclick="window.descargarFilaExcel(${c.id})"><i class="fas fa-file-excel"></i></button>
                        <button class="btn-icon" title="Descargar JPG" style="width:26px; height:26px; background:transparent; border:none; color:var(--accent);" onclick="window.descargarFilaJPG(${c.id})"><i class="fas fa-image"></i></button>
                    </div>

                    ${btnEliminar}
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    document.getElementById('btnActualizarHistorial')?.addEventListener('click', () => {
        cargarHistorialBD();
        registrarAuditoria("REFRESCAR", "Actualizó la vista del Historial de Base de Datos");
    });

    window.verDetalleCierre = function(id) {
        const historial = JSON.parse(localStorage.getItem('historialCierresEstuconta')) || [];
        const repo = JSON.parse(localStorage.getItem('repoArchivos')) || [];
        const c = historial.find(x => x.id === id);
        if(!c) return;
        
        // Buscar PDFs en el repositorio
        const matchesPdf = repo.filter(r => r.sucursal.toUpperCase() === c.sucursal.toUpperCase() && r.fecha === c.fechaCierre && r.turno === c.usuario);
        
        let pdfSection = '';
        if (matchesPdf.length > 0) {
            let btnList = matchesPdf.map(m => {
                let textBtn = '';
                if (m.tipoDoc === 'faltante' || m.tipoDoc === 'deposito') textBtn = 'Ver Comprobantes Faltantes';
                else if (m.tipoDoc === 'incompleto') textBtn = 'Ver Cierre Incompleto';
                else textBtn = 'Ver Cierre Completo';
                
                return `<button class="btn btn-verde" style="margin: 5px; font-size: 0.85rem; padding: 10px 15px;" onclick="window.verDocumentoRepositorio('${m.fileData}', false)">
                            <i class="fas fa-file-pdf"></i> ${textBtn}
                        </button>`;
            }).join('');

            pdfSection = `
                <div style="margin-top: 25px; text-align: center; background: rgba(5, 150, 105, 0.08); padding: 15px; border-radius: 8px; border: 1px dashed var(--success);">
                    <p style="margin: 0 0 12px 0; color: var(--success); font-weight: 600;"><i class="fas fa-check-circle"></i> Documento(s) adjunto(s) disponibles en el Repositorio</p>
                    ${btnList}
                </div>
            `;
        } else {
             pdfSection = `
                <div style="margin-top: 25px; text-align: center; background: rgba(220, 38, 38, 0.05); padding: 15px; border-radius: 8px; border: 1px dashed rgba(220, 38, 38, 0.4);">
                    <p style="margin: 0; color: var(--danger); font-size: 0.9rem;"><i class="fas fa-exclamation-triangle"></i> No hay documentos PDF consolidados en el repositorio para este turno y fecha.</p>
                </div>
            `;
        }

        let html = `
            <div style="margin-bottom: 20px; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid var(--border);">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px;">
                    <p style="margin: 0;"><strong><i class="fas fa-save text-accent"></i> Guardado el:</strong><br> <span style="font-size: 1rem; color: var(--primary);">${c.fechaGuardado || '-'}</span></p>
                    <p style="margin: 0;"><strong><i class="fas fa-store text-accent"></i> Sucursal:</strong><br> <span style="font-size: 1rem; color: var(--primary);">${c.sucursal}</span></p>
                    <p style="margin: 0;"><strong><i class="fas fa-calendar-day text-accent"></i> Fecha Cierre:</strong><br> <span style="font-size: 1rem; color: var(--primary);">${c.fechaCierre}</span></p>
                    <p style="margin: 0;"><strong><i class="fas fa-user-circle text-accent"></i> Usuario:</strong><br> <span style="font-size: 1rem; color: var(--primary);">${c.usuario}</span></p>
                </div>
            </div>
            
            <h3 style="font-size: 1.1rem; margin-bottom: 10px; color: var(--primary);"><i class="fas fa-list-alt text-accent"></i> Detalle Desglosado de Documentación</h3>
            <div style="overflow-x: auto; border: 1px solid var(--border); border-radius: 8px;">
                <table class="modern-table" style="width: 100%; font-size: 0.85rem; margin: 0; min-width:600px;">
                    <thead style="background: var(--primary); color: white;">
                        <tr>
                            <th style="color: white; border-right: 1px solid rgba(255,255,255,0.1);">Forma Pago / Boletas</th>
                            <th style="color: white; text-align: right; border-right: 1px solid rgba(255,255,255,0.1);">Cierre (Q)</th>
                            <th style="color: white; text-align: right; border-right: 1px solid rgba(255,255,255,0.1);">Físico (Q)</th>
                            <th style="color: white; text-align: right;">Diferencia (Q)</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        (c.detalles || []).forEach(d => {
            let boletasHtml = '';
            let boletasArr = d.boletas || [];
            
            if(boletasArr.length === 0 && d.documento) {
                boletasArr = [{ banco: d.banco, documento: d.documento, fechaDoc: d.fechaDoc, monto: d.montoFisico }];
            }

            if(boletasArr.length > 0) {
                boletasHtml = boletasArr.map(b => 
                    `<div style="font-size:0.75rem; color:#475569; padding:4px 0 4px 10px; border-left:2px solid var(--accent); margin-top:5px; background: rgba(0,0,0,0.02);">
                        <strong>${b.banco || '-'}</strong> | Doc: ${b.documento || '-'} <span style="float:right; color:var(--primary); font-weight:bold;">Q${parseFloat(b.monto||0).toFixed(2)}</span>
                    </div>`
                ).join('');
            } else {
                boletasHtml = `<div style="font-size:0.75rem; color:#94a3b8; padding-left:10px; margin-top:4px;">Sin boletas registradas</div>`;
            }

            let diffVal = parseFloat(d.diferencia || 0);
            let tipoDiffText = '';
            let colorDiff = 'var(--secondary)';
            
            if(diffVal > 0.001) {
                colorDiff = 'var(--danger)';
                tipoDiffText = '<br><span style="font-size:0.7rem;">(FALTANTE)</span>';
            } else if(diffVal < -0.001) {
                colorDiff = 'var(--success)';
                tipoDiffText = '<br><span style="font-size:0.7rem;">(SOBRANTE)</span>';
            }

            html += `
                <tr>
                    <td style="font-weight: 600;">${d.formaPago}${boletasHtml}</td>
                    <td style="text-align: right; color: var(--primary); vertical-align:top;">Q ${parseFloat(d.montoCierre || 0).toFixed(2)}</td>
                    <td style="text-align: right; color: var(--success); vertical-align:top;">Q ${parseFloat(d.montoFisico || 0).toFixed(2)}</td>
                    <td style="text-align: right; color: ${colorDiff}; font-weight: bold; vertical-align:top;">Q ${Math.abs(diffVal).toFixed(2)} ${tipoDiffText}</td>
                </tr>
            `;
        });
        html += `</tbody></table></div>`;
        html += pdfSection;
        
        document.getElementById('modalDetallesBody').innerHTML = html;
        document.getElementById('modalDetalles').classList.remove('hidden');
        registrarAuditoria("VISTA DETALLES", `Visualizó detalles en DB del cierre ID: ${id}`);
    }

    window.editarCierre = function(id) {
        const historial = JSON.parse(localStorage.getItem('historialCierresEstuconta')) || [];
        const c = historial.find(x => x.id === id);
        if(!c) return;

        if((c.ediciones || 0) >= 2) {
            Swal.fire({
                title: 'Límite de ediciones alcanzado',
                text: 'Ha superado el límite de 2 modificaciones permitidas. ¿Desea enviar una solicitud al Máster para desbloquear la edición?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, enviar solicitud'
            }).then(res => {
                if(res.isConfirmed) {
                    const reqs = JSON.parse(localStorage.getItem('solicitudesEstuconta')) || [];
                    reqs.push({id: Date.now(), fecha: new Date().toLocaleDateString(), sucursal: c.sucursal, usuario: currentUser.user, tipo: 'Desbloqueo de Edición', archivoAfectado: `Cierre ID: ${id}`, descripcion: 'Se requiere modificación adicional tras superar el límite establecido.', estado: 'Pendiente'});
                    guardarEnFirebase('solicitudesEstuconta', reqs);
                    agregarNotificacion(`El usuario ${currentUser.user} solicita desbloquear la edición del cierre ID ${id}`, 'alerta', 'master');
                    registrarAuditoria("SOLICITUD CREADA", `Solicitó desbloqueo de edición para cierre ID ${id}.`);
                    Swal.fire('Enviado', 'Solicitud enviada al Máster exitosamente.', 'success');
                }
            });
            registrarAuditoria("ERROR EDICIÓN", `Intentó editar cierre ID ${id} pero superó el límite de ediciones.`);
            return;
        }
        
        if (sucursalSelect && sucursalMapInv[c.sucursal.toUpperCase()]) {
            sucursalSelect.value = sucursalMapInv[c.sucursal.toUpperCase()];
            actualizarUsuarios(); 
        }

        setTimeout(() => {
            document.getElementById('fechaInput').value = c.fechaCierre || '';
            const turnoSel = document.getElementById('turnoSelect');
            if (turnoSel) {
                let userExists = Array.from(turnoSel.options).some(opt => opt.value === c.usuario);
                if(!userExists) {
                    const opt = document.createElement('option');
                    opt.value = c.usuario; opt.textContent = c.usuario; turnoSel.appendChild(opt);
                }
                turnoSel.value = c.usuario;
                
                const respSelect = document.getElementById('responsableSelect');
                if (respSelect) respSelect.value = c.usuario;
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
            verificarPdfRepositorio(); 
            activarTab('tab-captura', 'navCaptura'); 
            registrarAuditoria("INICIAR EDICIÓN", `Cargó el cierre ID: ${id} en pantalla para edición.`);
        }, 50);
    }

    window.solicitarEliminarCierre = async function(id) {
        const {value: motivo} = await Swal.fire({
            title: 'Solicitar Eliminación del Cierre',
            input: 'textarea',
            inputPlaceholder: 'Especifique el motivo de eliminación...',
            showCancelButton: true,
            confirmButtonText: 'Enviar Solicitud'
        });
        if(motivo) {
            const reqs = JSON.parse(localStorage.getItem('solicitudesEstuconta')) || [];
            reqs.push({id: Date.now(), fecha: new Date().toLocaleDateString(), sucursal: currentUser.sucursal || 'Central', usuario: currentUser.user, tipo: 'Eliminación Cierre Diario DB', archivoAfectado: `Cierre ID: ${id}`, descripcion: motivo, estado: 'Pendiente'});
            guardarEnFirebase('solicitudesEstuconta', reqs);
            cargarSolicitudes();
            registrarAuditoria("SOLICITUD CREADA", `Solicitó eliminar cierre ID ${id}. Motivo: ${motivo}`);
            agregarNotificacion(`Nueva solicitud de eliminación de cierre de ${currentUser.user}`, 'alerta', 'master');
            Swal.fire('Enviado', 'Solicitud de eliminación enviada al Master.', 'success');
        }
    }
    
    // --- FUNCIÓN PARA ELIMINACIÓN DIRECTA DEL MASTER ---
    window.eliminarCierreMaster = async function(id) {
        const { value: pass } = await Swal.fire({
            title: 'Autorización Master Requerida',
            text: 'Confirme su clave para eliminar permanentemente este registro de la Base de Datos.',
            input: 'password',
            showCancelButton: true,
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar'
        });
        
        if (!pass) return; 
        if (pass !== currentUser.pass) return Swal.fire('Error', 'Clave incorrecta. Operación cancelada.', 'error');

        let historial = JSON.parse(localStorage.getItem('historialCierresEstuconta')) || [];
        historial = historial.filter(x => x.id !== id);
        guardarEnFirebase('historialCierresEstuconta', historial);
        
        cargarHistorialBD(); 
        registrarAuditoria("ELIMINACIÓN MASTER", `El Master eliminó permanentemente el registro de cierre ID: ${id}`);
        Swal.fire('Eliminado', 'El registro ha sido borrado del sistema.', 'success');
    };

    // --- 8. RESUMEN MENSUAL CONTABLE PROFESIONAL Y FILTRADO ---
    document.getElementById('btnGenerarResumen')?.addEventListener('click', () => {
        const fInicio = document.getElementById('filtroResumenInicio').value;
        const fFin = document.getElementById('filtroResumenFin').value;
        const suc = document.getElementById('filtroSucursalResumen').value;
        const historial = JSON.parse(localStorage.getItem('historialCierresEstuconta')) || [];
        
        let filtrados = historial;
        if(fInicio) filtrados = filtrados.filter(h => h.fechaCierre >= fInicio);
        if(fFin) filtrados = filtrados.filter(h => h.fechaCierre <= fFin);
        if(suc) filtrados = filtrados.filter(h => h.sucursal === suc);

        const agrupacion = {};
        filtrados.forEach(c => {
            (c.detalles || []).forEach(d => {
                const sys = parseFloat(d.montoCierre || 0);
                const fis = parseFloat(d.montoFisico || 0);
                if (sys === 0 && fis === 0) return;

                const llaveSucursal = c.sucursal;
                if(!agrupacion[llaveSucursal]) agrupacion[llaveSucursal] = [];

                let existente = agrupacion[llaveSucursal].find(x => x.formaPago === d.formaPago);
                if (!existente) {
                    existente = { formaPago: d.formaPago, sys: 0, fis: 0 };
                    agrupacion[llaveSucursal].push(existente);
                }
                existente.sys += sys;
                existente.fis += fis;
            });
        });

        const tbody = document.querySelector('#tablaResumenMensual tbody');
        const tfoot = document.getElementById('tfootResumenMensual');
        if(!tbody || !tfoot) return;
        tbody.innerHTML = ''; tfoot.innerHTML = '';
        
        const llavesSucursales = Object.keys(agrupacion).sort();
        if(llavesSucursales.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">No hay datos reales económicos para los filtros seleccionados</td></tr>`;
            return;
        }

        let totGlobalSys = 0, totGlobalFis = 0;
        
        llavesSucursales.forEach(sucursal => {
            tbody.innerHTML += `
                <tr class="group-header">
                    <td colspan="5" style="background:#e2e8f0; font-weight:bold; color:var(--primary); text-transform:uppercase; font-size:0.95rem; border-top:2px solid var(--border); padding: 12px 15px;">
                        <i class="fas fa-store text-accent"></i> SUCURSAL: ${sucursal}
                    </td>
                </tr>
            `;

            let tSucSys = 0, tSucFis = 0;
            agrupacion[sucursal].sort((a,b) => a.formaPago.localeCompare(b.formaPago)).forEach(r => {
                tSucSys += r.sys; tSucFis += r.fis;
                const diff = r.sys - r.fis;
                tbody.innerHTML += `
                    <tr>
                        <td style="text-align: center;"><i class="fas fa-chevron-right" style="color:#cbd5e1; font-size:0.7rem;"></i></td>
                        <td><strong style="color: var(--secondary);">${r.formaPago}</strong></td>
                        <td>Q ${r.sys.toFixed(2)}</td>
                        <td>Q ${r.fis.toFixed(2)}</td>
                        <td style="color:${diff===0?'var(--success)':'var(--danger)'}; font-weight:bold;">Q ${diff.toFixed(2)}</td>
                    </tr>
                `;
            });
            const diffSuc = tSucSys - tSucFis;
            tbody.innerHTML += `
                <tr style="background:#f8fafc; font-style:italic; font-size:0.9rem;">
                    <td colspan="2" style="text-align:right;">Subtotal ${sucursal}:</td>
                    <td style="font-weight:600;">Q ${tSucSys.toFixed(2)}</td>
                    <td style="font-weight:600;">Q ${tSucFis.toFixed(2)}</td>
                    <td style="color:${diffSuc===0?'var(--success)':'var(--danger)'}; font-weight:600;">Q ${diffSuc.toFixed(2)}</td>
                </tr>
            `;
            
            totGlobalSys += tSucSys; 
            totGlobalFis += tSucFis;
        });
        
        tfoot.innerHTML = `
            <tr style="background: var(--primary); color: white; font-weight: bold; font-size: 1.1rem;">
                <td colspan="2" style="text-align: right; border-radius: 0 0 0 8px;">TOTALES GLOBALES:</td>
                <td>Q ${totGlobalSys.toFixed(2)}</td>
                <td>Q ${totGlobalFis.toFixed(2)}</td>
                <td style="color:${(totGlobalSys-totGlobalFis)===0?'#34d399':'#f87171'}; border-radius: 0 0 8px 0;">Q ${(totGlobalSys-totGlobalFis).toFixed(2)}</td>
            </tr>
        `;
        registrarAuditoria("REPORTE MENSUAL", `Generó cuadre contable. Sucursal: ${suc||'Todas'}, Periodo: ${fInicio||'-'} a ${fFin||'-'}`);
    });


    // --- 9. CONFIGURACIÓN DE NOTIFICACIONES ---
    function cargarExcepciones() {
        const ul = document.getElementById('listaExcepciones');
        if(!ul) return;
        const exc = JSON.parse(localStorage.getItem('excepcionesEstuconta')) || [];
        ul.innerHTML = '';
        exc.forEach((e, idx) => {
            ul.innerHTML += `<li style="padding: 10px; background: #f8fafc; border: 1px solid var(--border); margin-bottom: 5px; border-radius: 8px; display: flex; justify-content: space-between;">
                <span><strong>${e.sucursal}</strong> - ${e.fecha}</span>
                <i class="fas fa-trash text-danger" style="cursor:pointer;" onclick="window.eliminarExcepcion(${idx})"></i>
            </li>`;
        });
    }

    document.getElementById('btnAgregarExcepcion')?.addEventListener('click', () => {
        const suc = document.getElementById('configSucursal').value;
        const fec = document.getElementById('configFechaExcepcion').value;
        if(!suc || !fec) return Swal.fire('Error', 'Llene todos los campos', 'error');
        const exc = JSON.parse(localStorage.getItem('excepcionesEstuconta')) || [];
        exc.push({sucursal: suc, fecha: fec});
        guardarEnFirebase('excepcionesEstuconta', exc);
        cargarExcepciones();
        registrarAuditoria("CONFIGURACIÓN", `Agregó excepción de atrasos para ${suc} en fecha ${fec}`);
    });

    window.eliminarExcepcion = function(idx) {
        const exc = JSON.parse(localStorage.getItem('excepcionesEstuconta')) || [];
        const eliminado = exc[idx];
        exc.splice(idx, 1);
        guardarEnFirebase('excepcionesEstuconta', exc);
        cargarExcepciones();
        registrarAuditoria("CONFIGURACIÓN", `Eliminó excepción de atrasos para ${eliminado.sucursal}`);
    }


    // --- 10. GESTIÓN DE SOLICITUDES PRIVADAS ---
    function cargarSolicitudes() {
        let reqs = JSON.parse(localStorage.getItem('solicitudesEstuconta')) || [];
        const tbody = document.querySelector('#tablaSolicitudes tbody');
        if(!tbody) return;
        tbody.innerHTML = '';
        
        if(currentUser.role !== 'master') {
            reqs = reqs.filter(r => r.usuario === currentUser.user);
        }

        reqs.forEach((r, idx) => {
            const tr = document.createElement('tr');
            let colorSt = r.estado==='Pendiente'?'var(--warning)':(r.estado==='Aprobado'?'var(--success)':'var(--danger)');
            
            tr.innerHTML = `
                <td>${r.fecha}</td><td>${r.sucursal}</td><td>${r.usuario}</td><td><strong>${r.tipo}</strong></td>
                <td>${r.archivoAfectado}</td><td>${r.descripcion}</td>
                <td style="color:${colorSt}; font-weight:bold;">${r.estado}</td>
                <td>${r.mensajeAutorizador || '-'}</td>
                <td>
                    ${r.estado==='Pendiente' && currentUser.role==='master' ? 
                        `<button class="btn btn-verde" title="Aprobar" style="padding:4px 8px; font-size:0.75rem;" onclick="window.resolverSol(${idx}, 'Aprobado')"><i class="fas fa-check"></i></button>
                         <button class="btn btn-rojo" title="Rechazar" style="padding:4px 8px; font-size:0.75rem;" onclick="window.resolverSol(${idx}, 'Rechazado')"><i class="fas fa-times"></i></button>` 
                    : '-'}
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.resolverSol = async function(idx, nuevoEstado) {
        let allReqs = JSON.parse(localStorage.getItem('solicitudesEstuconta')) || [];
        let reqsFiltradas = allReqs;
        if(currentUser.role !== 'master') reqsFiltradas = allReqs.filter(r => r.usuario === currentUser.user);
        const solicitud = reqsFiltradas[idx];
        const realIdx = allReqs.findIndex(r => r.id === solicitud.id);

        const {value: msg} = await Swal.fire({ title: `Resolver como ${nuevoEstado}`, input: 'text', inputPlaceholder: 'Comentario opcional...', showCancelButton: true });
        if (msg === undefined) return; 
        
        allReqs[realIdx].estado = nuevoEstado;
        allReqs[realIdx].mensajeAutorizador = msg || (nuevoEstado === 'Aprobado' ? 'Autorizado' : 'Denegado');
        guardarEnFirebase('solicitudesEstuconta', allReqs);
        cargarSolicitudes();
        registrarAuditoria("RESOLVER SOLICITUD", `El Master ${nuevoEstado.toLowerCase()} la solicitud de ${allReqs[realIdx].usuario}`);
        agregarNotificacion(`Su solicitud de ${allReqs[realIdx].tipo} fue ${nuevoEstado}`, nuevoEstado==='Aprobado'?'info':'alerta', allReqs[realIdx].usuario);
    }


    // --- 11. GESTIÓN DE USUARIOS CON EDICIÓN (MASTER ONLY) ---
    function cargarDirectorioUsuarios() {
        const tbody = document.querySelector('#tablaDirectorioUsuarios tbody');
        if(!tbody) return;
        tbody.innerHTML = '';
        
        for(let user in usersDB) {
            const u = usersDB[user];
            tbody.innerHTML += `
                <tr>
                    <td><strong>${user}</strong></td>
                    <td><input type="password" value="${u.pass}" class="modern-input" style="padding: 4px; width:120px;" readonly id="pass_${user}"></td>
                    <td><span style="background:var(--primary); color:white; padding:4px 8px; border-radius:12px; font-size:0.75rem;">${u.role.toUpperCase()}</span></td>
                    <td>${u.sucursal || 'N/A'}</td>
                    <td style="text-align:center;">
                        <button class="btn-icon" title="Ver Clave" onmousedown="document.getElementById('pass_${user}').type='text'" onmouseup="document.getElementById('pass_${user}').type='password'"><i class="fas fa-eye text-accent"></i></button>
                        <button class="btn-icon" title="Modificar Usuario / Clave" onclick="window.modificarUsuarioMaster('${user}')"><i class="fas fa-user-edit text-warning"></i></button>
                    </td>
                </tr>
            `;
        }
    }

    window.modificarUsuarioMaster = async function(oldUsername) {
        const { value: masterPass } = await Swal.fire({
            title: 'Autenticación Master Requerida',
            text: 'Para modificar usuarios, ingrese su clave actual:',
            input: 'password',
            inputPlaceholder: 'Ingrese su clave',
            showCancelButton: true
        });

        if(masterPass !== currentUser.pass) {
            registrarAuditoria("ERROR AUTENTICACIÓN", `Intento fallido de modificar el usuario ${oldUsername} (Clave Master incorrecta).`);
            return Swal.fire('Denegado', 'Clave Master incorrecta', 'error');
        }

        const userObj = usersDB[oldUsername];
        
        const { value: formValues } = await Swal.fire({
            title: `Modificar credenciales de: ${oldUsername}`,
            html:
                `<div style="text-align:left; margin-bottom:10px;">
                    <label style="font-size:0.85rem; font-weight:bold;">Nuevo nombre de usuario:</label>
                    <input id="swal-input1" class="swal2-input modern-input" value="${oldUsername}">
                </div>
                <div style="text-align:left;">
                    <label style="font-size:0.85rem; font-weight:bold;">Nueva contraseña:</label>
                    <input id="swal-input2" class="swal2-input modern-input" type="text" value="${userObj.pass}">
                </div>`,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Guardar Cambios',
            preConfirm: () => {
                return [
                    document.getElementById('swal-input1').value.trim(),
                    document.getElementById('swal-input2').value.trim()
                ]
            }
        });

        if (formValues) {
            const newUsername = formValues[0];
            const newPassword = formValues[1];

            if (!newUsername || !newPassword) return Swal.fire('Error', 'Los campos no pueden estar vacíos', 'error');

            if (newUsername !== oldUsername && usersDB[newUsername]) {
                return Swal.fire('Error', 'Ese nombre de usuario ya existe en el sistema.', 'error');
            }

            const userBackup = { ...usersDB[oldUsername] };
            userBackup.pass = newPassword;
            
            delete usersDB[oldUsername];
            usersDB[newUsername] = userBackup;
            
            if(oldUsername === currentUser.user) {
                currentUser.user = newUsername;
                currentUser.pass = newPassword;
                document.getElementById('displayUserLogueado').innerHTML = `<i class="fas fa-user-circle"></i> ${currentUser.user} (${currentUser.role.toUpperCase()})`;
            }

            guardarEnFirebase('estucontaUsersDB', usersDB);
            cargarDirectorioUsuarios();
            
            registrarAuditoria("MODIFICACIÓN USUARIO", `El Master modificó el usuario '${oldUsername}' -> Nuevo ID: '${newUsername}'`);
            Swal.fire('Actualizado', `Las credenciales de ${newUsername} fueron actualizadas sin perder sesión.`, 'success');
        }
    }

    document.getElementById('btnCerrarModal')?.addEventListener('click', () => {
        document.getElementById('modalDetalles').classList.add('hidden');
    });

    // --- 12. FUNCIONES DE DESCARGA POR FILA (PDF, EXCEL, JPG) ---
    window.descargarFilaExcel = function(id) {
        const historial = JSON.parse(localStorage.getItem('historialCierresEstuconta')) || [];
        const c = historial.find(x => x.id === id);
        if(!c) return;

        const datos = [];
        c.detalles.forEach(d => {
            let boletas = d.boletas || [];
            if(boletas.length === 0 && d.documento) boletas = [{banco: d.banco, documento: d.documento, fechaDoc: d.fechaDoc, monto: d.montoFisico}];
            
            if(boletas.length > 0) {
                boletas.forEach(b => {
                    datos.push({
                        "Sucursal": c.sucursal,
                        "Fecha Cierre": c.fechaCierre,
                        "Usuario": c.usuario,
                        "Forma Pago": d.formaPago,
                        "Banco": b.banco || 'N/A',
                        "No. Documento": b.documento || 'N/A',
                        "Fecha Doc": b.fechaDoc || 'N/A',
                        "Monto Cierre (Q)": parseFloat(d.montoCierre || 0),
                        "Monto Boleta (Q)": parseFloat(b.monto || 0),
                        "Diferencia (Q)": parseFloat(d.diferencia || 0)
                    });
                });
            } else {
                datos.push({
                    "Sucursal": c.sucursal,
                    "Fecha Cierre": c.fechaCierre,
                    "Usuario": c.usuario,
                    "Forma Pago": d.formaPago,
                    "Banco": "N/A",
                    "No. Documento": "N/A",
                    "Fecha Doc": "N/A",
                    "Monto Cierre (Q)": parseFloat(d.montoCierre || 0),
                    "Monto Boleta (Q)": parseFloat(d.montoFisico || 0),
                    "Diferencia (Q)": parseFloat(d.diferencia || 0)
                });
            }
        });

        const ws = XLSX.utils.json_to_sheet(datos);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Detalle_Cierre");
        XLSX.writeFile(wb, `Cierre_${c.sucursal.replace(/\s+/g, '_')}_${c.fechaCierre}.xlsx`);
        registrarAuditoria("DESCARGA EXCEL", `Descargó detalle en Excel del cierre ID: ${id}`);
    };

    window.descargarFilaPDF = function(id) {
        const historial = JSON.parse(localStorage.getItem('historialCierresEstuconta')) || [];
        const c = historial.find(x => x.id === id);
        if(!c) return;

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(16);
        doc.setTextColor(10, 37, 64);
        doc.text(`Reporte de Cierre Diario - ${c.sucursal}`, 14, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(79, 91, 118);
        doc.text(`Fecha Cierre: ${c.fechaCierre}`, 14, 28);
        doc.text(`Usuario Asignado: ${c.usuario}`, 14, 34);
        doc.text(`Registrado en Sistema: ${c.fechaGuardado}`, 14, 40);

        doc.setFontSize(12);
        doc.setTextColor(0, 97, 255);
        doc.text(`Resumen: Sistema Q${c.totalCierre} | Físico Q${c.totalFisico} | Diferencia Q${c.totalDiferencia}`, 14, 48);
        
        const bodyRows = [];
        c.detalles.forEach(d => {
            let boletas = d.boletas || [];
            if(boletas.length === 0 && d.documento) boletas = [{banco: d.banco, documento: d.documento, fechaDoc: d.fechaDoc, monto: d.montoFisico}];
            
            if(boletas.length > 0) {
                boletas.forEach(b => {
                    bodyRows.push([
                        d.formaPago, 
                        b.banco || 'N/A', 
                        b.documento || '-', 
                        b.fechaDoc || '-', 
                        `Q${parseFloat(d.montoCierre||0).toFixed(2)}`, 
                        `Q${parseFloat(b.monto||0).toFixed(2)}`, 
                        `Q${parseFloat(d.diferencia||0).toFixed(2)}`
                    ]);
                });
            } else {
                bodyRows.push([d.formaPago, 'N/A', '-', '-', `Q${parseFloat(d.montoCierre||0).toFixed(2)}`, `Q${parseFloat(d.montoFisico||0).toFixed(2)}`, `Q${parseFloat(d.diferencia||0).toFixed(2)}`]);
            }
        });
        
        doc.autoTable({
            startY: 55,
            head: [['Forma Pago', 'Banco', 'No. Doc', 'F. Doc', 'Cierre (Q)', 'Boleta (Q)', 'Diferencia (Q)']],
            body: bodyRows,
            theme: 'grid',
            headStyles: { fillColor: [10, 37, 64] },
            styles: { fontSize: 8 }
        });
        
        doc.save(`Cierre_${c.sucursal.replace(/\s+/g, '_')}_${c.fechaCierre}.pdf`);
        registrarAuditoria("DESCARGA PDF", `Descargó documento en PDF del cierre ID: ${id}`);
    };

    window.descargarFilaJPG = function(id) {
        const historial = JSON.parse(localStorage.getItem('historialCierresEstuconta')) || [];
        const c = historial.find(x => x.id === id);
        if(!c) return;

        Swal.fire({
            title: 'Generando Imagen...',
            text: 'Preparando la vista del documento, por favor espere.',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        window.verDetalleCierre(id);
        
        setTimeout(() => {
            const modalContent = document.querySelector('#modalDetalles .modal-content');
            
            html2canvas(modalContent, { 
                scale: 2, 
                backgroundColor: '#ffffff',
                logging: false
            }).then(canvas => {
                const link = document.createElement('a');
                link.download = `Cierre_${c.sucursal.replace(/\s+/g, '_')}_${c.fechaCierre}.jpg`;
                link.href = canvas.toDataURL('image/jpeg', 0.9);
                link.click();
                
                Swal.close();
                registrarAuditoria("DESCARGA JPG", `Descargó imagen (JPG) del cierre ID: ${id}`);
            }).catch(() => {
                Swal.fire('Error', 'No se pudo generar la imagen del cierre.', 'error');
            });
        }, 800);
    };

});