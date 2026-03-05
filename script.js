document.addEventListener('DOMContentLoaded', () => {

    // --- 1. BASE DE DATOS DE USUARIOS ---
    const usersDB = {
        // Maestros
        "GD.user01": { pass: "Ax7#Pq29Lm", role: "master" },
        "GD.user02": { pass: "R8v$Kp41Tx", role: "master" },
        // Regulares (hasta el 17)
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
        // Sucursales
        "GD.user18": { pass: "W5$Xp47Nr", role: "sucursal", sucursal: "CHIQUIMULA" },
        "GD.user19": { pass: "H9!Qt62Lb", role: "sucursal", sucursal: "SAN NICOLAS 1" },
        "GD.user20": { pass: "S2@Zk53Mv", role: "sucursal", sucursal: "SIXTINO" },
        "GD.user21": { pass: "U7#Tr84Px", role: "sucursal", sucursal: "FRUTAL" },
        "GD.user22": { pass: "Y4$Mn26Qk", role: "sucursal", sucursal: "METRONORTE" },
        "GD.user23": { pass: "X9!Lp63Hd", role: "sucursal", sucursal: "NARANJO" },
        "GD.user24": { pass: "E6@Vr45Tb", role: "sucursal", sucursal: "SAN NICOLAS 2" },
        "GD.user25": { pass: "A3#Wq78Ks", role: "sucursal", sucursal: "PERI ROOSEVELT" }
    };

    let currentUser = null;

    // --- REFERENCIAS DOM ---
    const loginOverlay = document.getElementById('loginOverlay');
    const appContent = document.getElementById('appContent');
    const displayUserLogueado = document.getElementById('displayUserLogueado');
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    // --- 2. SISTEMA DE LOGIN ---
    function ejecutarLogin() {
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
            if(currentUser.role === 'master') cargarTablaAuditoria();
            
        } else {
            document.getElementById('loginError').classList.remove('hidden');
        }
    }

    document.getElementById('btnLogin').addEventListener('click', ejecutarLogin);
    document.getElementById('loginPass').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') ejecutarLogin();
    });

    document.getElementById('btnCerrarSesion')?.addEventListener('click', () => {
        registrarAuditoria("CIERRE SESIÓN", "El usuario salió del sistema");
        currentUser = null;
        appContent.classList.add('hidden');
        loginOverlay.classList.remove('hidden');
        document.getElementById('loginPass').value = '';
        document.getElementById('loginError').classList.add('hidden');
        document.getElementById('notifDropdown').style.display = 'none';
    });

    function configurarMenuPorRol() {
        navItems.forEach(item => item.classList.add('hidden'));

        if (currentUser.role === 'master') {
            document.getElementById('navCaptura').classList.remove('hidden');
            document.getElementById('navDatabase').classList.remove('hidden');
            document.getElementById('navAuditoria').classList.remove('hidden');
            document.getElementById('navRepositorio').classList.remove('hidden');
            document.getElementById('navConfigNotif').classList.remove('hidden');
            document.getElementById('btnCampanaNotif').classList.remove('hidden');
            activarTab('tab-captura', 'navCaptura');
        } 
        else if (currentUser.role === 'regular') {
            document.getElementById('navCaptura').classList.remove('hidden');
            document.getElementById('navDatabase').classList.remove('hidden');
            document.getElementById('navRepositorio').classList.remove('hidden');
            document.getElementById('btnCampanaNotif').classList.remove('hidden');
            activarTab('tab-captura', 'navCaptura');
        }
        else if (currentUser.role === 'sucursal') {
            document.getElementById('navCarga').classList.remove('hidden');
            document.getElementById('navRepositorio').classList.remove('hidden');
            document.getElementById('btnCampanaNotif').classList.remove('hidden');
            activarTab('tab-carga', 'navCarga');
            document.getElementById('fechaCargaPdf').value = new Date().toISOString().split('T')[0];
        }
    }

    function activarTab(tabId, navId) {
        navItems.forEach(nav => nav.classList.remove('active'));
        tabContents.forEach(tab => tab.classList.add('hidden'));
        document.getElementById(navId).classList.add('active');
        document.getElementById(tabId).classList.remove('hidden');
        
        if(tabId === 'tab-repositorio') renderizarRepositorio();
        if(tabId === 'tab-config') renderizarExcepciones();
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if(!item.classList.contains('hidden')){
                activarTab(item.getAttribute('data-tab'), item.id);
            }
        });
    });

    // --- 3. NOTIFICACIONES Y EXCEPCIONES ---
    document.getElementById('btnCampanaNotif')?.addEventListener('click', () => {
        const dropdown = document.getElementById('notifDropdown');
        dropdown.style.display = dropdown.style.display === 'flex' ? 'none' : 'flex';
        const notifs = JSON.parse(localStorage.getItem('notifsEstuconta')) || [];
        notifs.forEach(n => { 
            if(n.destinatarios.includes(currentUser.role) || (currentUser.role === 'sucursal' && n.destinatarios.includes(currentUser.sucursal))) {
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
        const misNotifs = notifs.filter(n => n.destinatarios.includes(currentUser.role) || (currentUser.role === 'sucursal' && n.destinatarios.includes(currentUser.sucursal)));
        
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
        if(!fec) return alert("Seleccione una fecha");

        const excepciones = JSON.parse(localStorage.getItem('excepcionesAtrasos')) || [];
        excepciones.push({ sucursal: suc, fecha: fec });
        localStorage.setItem('excepcionesAtrasos', JSON.stringify(excepciones));
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

    // --- 4. CARGA PDF Y REPOSITORIO (BASE 64) ---
    document.getElementById('btnSubirPdf')?.addEventListener('click', () => {
        const fecha = document.getElementById('fechaCargaPdf').value;
        const fileInput = document.getElementById('archivoPdf');
        
        if(!fecha || !fileInput.files[0]) { alert("⚠️ Por favor selecciona la fecha y el archivo PDF."); return; }

        const file = fileInput.files[0];
        const fileName = file.name;
        const sucursal = currentUser.sucursal;

        if (file.size > 2 * 1024 * 1024) { alert("⚠️ El archivo es muy pesado. Intenta comprimir el PDF a menos de 2MB."); return; }

        const reader = new FileReader();
        reader.onload = function(e) {
            const fileData = e.target.result;
            const repositorio = JSON.parse(localStorage.getItem('repoArchivos')) || [];
            const existente = repositorio.find(r => r.sucursal === sucursal && r.fecha === fecha);
            
            if (existente) {
                if(!confirm("Ya existe un archivo para esta fecha. ¿Deseas sobreescribirlo?")) return;
                existente.archivo = fileName; existente.fileData = fileData; existente.fechaSubida = new Date().toLocaleString();
            } else {
                repositorio.push({ sucursal: sucursal, fecha: fecha, archivo: fileName, fileData: fileData, usuarioCarga: currentUser.user, fechaSubida: new Date().toLocaleString() });
            }

            try {
                localStorage.setItem('repoArchivos', JSON.stringify(repositorio));
                agregarNotificacion(`✅ La sucursal ${sucursal} ha subido la documentación del día ${fecha}.`, ['master', 'regular']);
                alert("✅ Archivo subido exitosamente a la base de datos.");
                fileInput.value = "";
            } catch (error) { alert("❌ Error: Almacenamiento local lleno. Reduzca el tamaño de los PDFs."); }
        };
        reader.readAsDataURL(file);
    });

    window.descargarDocumentoReal = function(nombreArchivo, base64Data) {
        if (!base64Data) { alert("❌ Este archivo es antiguo y no tiene contenido real guardado. Vuelve a subir el PDF."); return; }
        const link = document.createElement('a'); link.href = base64Data; link.download = nombreArchivo;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };

    function renderizarRepositorio() {
        const repo = JSON.parse(localStorage.getItem('repoArchivos')) || [];
        const container = document.getElementById('treeViewContainer');
        if(!container) return;
        container.innerHTML = '';

        const arbolArchivos = {};
        const mesesStr = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

        repo.forEach(item => {
            const [year, month, day] = item.fecha.split('-');
            const mesNombre = mesesStr[parseInt(month)-1];
            if(!arbolArchivos[year]) arbolArchivos[year] = {};
            if(!arbolArchivos[year][mesNombre]) arbolArchivos[year][mesNombre] = {};
            if(!arbolArchivos[year][mesNombre][day]) arbolArchivos[year][mesNombre][day] = [];
            arbolArchivos[year][mesNombre][day].push(item);
        });

        const anioActual = new Date().getFullYear(); const anioMaximo = 2035;

        for(let anio = anioActual; anio <= anioMaximo; anio++) {
            const anioStr = anio.toString();
            const detAnio = document.createElement('details'); detAnio.className = 'folder';
            const tieneArchivosAnio = arbolArchivos[anioStr] !== undefined;
            if(!tieneArchivosAnio) detAnio.classList.add('empty-folder');

            detAnio.innerHTML = `<summary>Año ${anioStr} ${!tieneArchivosAnio ? '<span style="font-size:0.75rem; color:#94a3b8; font-weight:normal;">(Sin registros)</span>' : ''}</summary>`;
            
            if (tieneArchivosAnio) {
                for(let mes in arbolArchivos[anioStr]) {
                    const detMes = document.createElement('details'); detMes.className = 'folder';
                    detMes.innerHTML = `<summary>${mes}</summary>`;
                    Object.keys(arbolArchivos[anioStr][mes]).sort().forEach(dia => {
                        const detDia = document.createElement('details'); detDia.className = 'folder';
                        detDia.innerHTML = `<summary>Día ${dia}</summary>`;
                        
                        arbolArchivos[anioStr][mes][dia].forEach(archivo => {
                            const divFile = document.createElement('div'); divFile.className = 'file-item';
                            let btnDescargaHTML = '';
                            if (currentUser.role === 'master' || currentUser.role === 'regular') {
                                btnDescargaHTML = `<button class="btn-download" onclick="descargarDocumentoReal('${archivo.archivo}', '${archivo.fileData || ''}')"><i class="fas fa-download"></i> Descargar</button>`;
                            }
                            divFile.innerHTML = `
                                <div class="file-item-info">
                                    <i class="fas fa-file-pdf"></i>
                                    <div><strong>[${archivo.sucursal}]</strong> ${archivo.archivo} <br><span style="font-size:0.75rem; color:#94a3b8;">Subido por: ${archivo.usuarioCarga} (${archivo.fechaSubida})</span></div>
                                </div>
                                <div>${btnDescargaHTML}</div>
                            `;
                            detDia.appendChild(divFile);
                        });
                        detMes.appendChild(detDia);
                    });
                    detAnio.appendChild(detMes);
                }
            }
            container.appendChild(detAnio);
        }
    }

    // --- 5. AUDITORÍA ---
    function pedirPermisoMaestro() {
        const adminPass = prompt("⚠️ No tiene permisos para esta acción.\nSolicite a un Usuario Maestro que ingrese su contraseña:");
        if (!adminPass) return false;
        const isMasterValid = Object.values(usersDB).some(u => u.role === 'master' && u.pass === adminPass);
        if (isMasterValid) return true;
        alert("❌ Contraseña de maestro incorrecta. Permiso denegado.");
        return false;
    }

    function registrarAuditoria(accion, detalle) {
        if (!currentUser) return;
        const auditoria = JSON.parse(localStorage.getItem('auditoriaEstuconta')) || [];
        const now = new Date();
        auditoria.unshift({
            fecha: now.toLocaleDateString() + ' ' + now.toLocaleTimeString(),
            usuario: currentUser.user, rol: currentUser.role, accion: accion, detalle: detalle
        });
        localStorage.setItem('auditoriaEstuconta', JSON.stringify(auditoria));
        cargarTablaAuditoria();
    }

    let paginaActualAuditoria = 1; const registrosPorPaginaAuditoria = 15;
    
    function cargarTablaAuditoria() {
        const auditoria = JSON.parse(localStorage.getItem('auditoriaEstuconta')) || [];
        const tbody = document.querySelector('#tablaAuditoria tbody');
        if(!tbody) return;
        
        const textoFiltro = (document.getElementById('filtroTextoAuditoria')?.value || "").toLowerCase();
        const accionFiltro = document.getElementById('filtroAccionAuditoria')?.value || "";

        let datosFiltrados = auditoria;
        if (textoFiltro) datosFiltrados = datosFiltrados.filter(item => item.usuario.toLowerCase().includes(textoFiltro) || item.detalle.toLowerCase().includes(textoFiltro));
        if (accionFiltro) datosFiltrados = datosFiltrados.filter(item => item.accion === accionFiltro);

        const totalPaginas = Math.ceil(datosFiltrados.length / registrosPorPaginaAuditoria) || 1;
        if (paginaActualAuditoria > totalPaginas) paginaActualAuditoria = totalPaginas;
        const inicio = (paginaActualAuditoria - 1) * registrosPorPaginaAuditoria;
        const datosPaginados = datosFiltrados.slice(inicio, inicio + registrosPorPaginaAuditoria);

        const infoPagina = document.getElementById('infoPaginaAuditoria');
        if(infoPagina) infoPagina.textContent = `Página ${paginaActualAuditoria} de ${totalPaginas}`;

        tbody.innerHTML = '';
        if(datosFiltrados.length === 0){ 
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #64748b; padding:20px;">No se encontraron registros de auditoría</td></tr>'; 
            return; 
        }

        datosPaginados.forEach(item => {
            let colorClass = 'bg-system'; let icon = 'fa-cog';
            if (item.accion === 'INICIO SESIÓN') { colorClass = 'bg-login'; icon = 'fa-sign-in-alt'; }
            else if (item.accion === 'CIERRE SESIÓN') { colorClass = 'bg-logout'; icon = 'fa-sign-out-alt'; }
            else if (item.accion === 'AGREGAR') { colorClass = 'bg-add'; icon = 'fa-plus-circle'; }
            else if (item.accion === 'ELIMINAR') { colorClass = 'bg-delete'; icon = 'fa-trash-alt'; }
            else if (item.accion === 'IMPRESIÓN') { colorClass = 'bg-print'; icon = 'fa-print'; }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="color: #475569; font-size: 0.85rem; font-weight: 500;">${item.fecha}</td>
                <td>
                    <div class="auditoria-user-cell">
                        <div class="auditoria-avatar"><i class="fas fa-user-tie"></i></div>
                        <div>
                            <strong style="display: block; color: #1e293b; line-height: 1.2;">${item.usuario}</strong>
                            <span class="badge-rol ${item.rol === 'master' ? 'badge-master' : 'badge-regular'}">${item.rol.toUpperCase()}</span>
                        </div>
                    </div>
                </td>
                <td><span class="badge-accion ${colorClass}"><i class="fas ${icon}"></i> ${item.accion}</span></td>
                <td style="color: #334155; font-size: 0.9rem;">${item.detalle}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    document.getElementById('btnBuscarAuditoria')?.addEventListener('click', () => { paginaActualAuditoria = 1; cargarTablaAuditoria(); });
    document.getElementById('btnAnteriorAuditoria')?.addEventListener('click', () => { if(paginaActualAuditoria > 1) { paginaActualAuditoria--; cargarTablaAuditoria(); } });
    document.getElementById('btnSiguienteAuditoria')?.addEventListener('click', () => { paginaActualAuditoria++; cargarTablaAuditoria(); });
    
    document.getElementById('btnLimpiarAuditoria')?.addEventListener('click', () => {
        if (pedirPermisoMaestro()) {
            if(confirm("¿Estás seguro de eliminar todo el registro de auditoría? Esta acción no se puede deshacer.")) {
                localStorage.removeItem('auditoriaEstuconta');
                cargarTablaAuditoria();
                registrarAuditoria("ELIMINAR", "Se vació todo el historial de auditoría");
            }
        }
    });

    document.getElementById('btnExportarAuditoria')?.addEventListener('click', () => {
        const auditoria = JSON.parse(localStorage.getItem('auditoriaEstuconta')) || [];
        if(typeof XLSX === 'undefined') return alert("La librería para Excel no está cargada.");
        const rows = [["Fecha y Hora", "Usuario", "Rol", "Acción", "Detalle"]];
        auditoria.forEach(a => rows.push([a.fecha, a.usuario, a.rol, a.accion, a.detalle]));
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, "Auditoria");
        XLSX.writeFile(wb, "Registro_Auditoria_Estuconta.xlsx");
    });


    // --- 6. PANEL CIERRE DIARIO ---
    let windowIndiceEdicion = -1; // Usado para saber si estamos guardando uno nuevo o editando
    const formasPago = ["EFECTIVO", "CHEQUE", "TRANSFERENCIA", "DEPÓSITOS", "POS BAC", "COMPRA CLICK", "POS MÓVIL BAC", "POS VISA", "VISALINK", "CRÉDITOS EMPRESAS", "CXC NÓMINA", "GIFTCARD"];
    const sucursalSelect = document.getElementById('sucursalSelect');
    const turnoSelect = document.getElementById('turnoSelect');
    const fechaInput = document.getElementById('fechaInput');
    const tablaPagosBody = document.querySelector('#tablaPagos tbody');
    let chartInstance = null;

    const datosUsuarios = {
        "1": { "ICALDERO01": "CH1-", "USUARIO PROVISIONAL": "CN3-" },
        "2": { "RSNXAMXX01": "SN17-", "RSNXPMXX01": "SN18-", "RELIASXX01": "SN19-", "UPROVISI02": "SN13-" },
        "3": { "RSIXTINO01": "SX6-", "CSXXXXXX01": "SX8-", "USUARIO PROVISIONAL": "SX4-" },
        "4": { "RFRXAMXX01": "FT17-", "RFRXPMXX01": "FT18-", "LRIVERAX01": "FT19-", "CFRXXXXX01": "FT27-", "UPROVISI03": "FT1-", "DMORALES01": "FT12-" },
        "5": { "RMETRONO01": "MN12-", "CMNXXXXX01": "MN14-", "ASISTENTE MN": "MN13-", "USUARIO PROVISIONAL": "MN1-" },
        "6": { "RNRXAMXX01": "NR1-", "RNRXPMXX01": "NR2-", "ASISTENTE NR": "NR4-", "USUARIO PROFESIONAL": "NR3-" },
        "7": { "RNIXAMXX01": "NI1-", "RNIXPMXX01": "NI2-", "UPROVISI07": "NI3-" },
        "8": { "RPEXAMXX01": "PR1-", "RPEXPMXX01": "PR2-", "USUARIO PROVISIONAL": "PR3-" }
    };

    function obtenerPrefijo() {
        const idSuc = sucursalSelect?.value; const usu = turnoSelect?.value;
        if (!usu || !datosUsuarios[idSuc]) return ""; return datosUsuarios[idSuc][usu] || "";
    }

    function actualizarCorrelativo() {
        const prefijo = obtenerPrefijo(); if (!prefijo) return;
        const correlativos = JSON.parse(localStorage.getItem('correlativosEstuconta')) || {};
        document.getElementById('prefixInicio').textContent = prefijo;
        document.getElementById('prefixFinal').textContent = prefijo;
        // Solo actualizar si NO estamos editando
        if(windowIndiceEdicion === -1) {
            document.getElementById('reciboInicioNum').value = correlativos[prefijo] || 1;
            document.getElementById('reciboFinalNum').value = ""; 
        }
    }

    function actualizarUsuarios() {
        const idSucursal = sucursalSelect?.value;
        const usuarios = Object.keys(datosUsuarios[idSucursal] || {});
        if(turnoSelect){
            turnoSelect.innerHTML = '';
            usuarios.forEach(u => { const op = document.createElement('option'); op.value = u; op.textContent = u; turnoSelect.appendChild(op); });
            actualizarCorrelativo();
        }
    }

    if(fechaInput) fechaInput.value = new Date().toISOString().split('T')[0];
    sucursalSelect?.addEventListener('change', actualizarUsuarios);
    turnoSelect?.addEventListener('change', actualizarCorrelativo);

    function crearFilaPago(data = null) {
        if(!tablaPagosBody) return;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="text-align: center;"><button class="btn-del" title="Eliminar"><i class="fas fa-trash-alt"></i></button></td>
            <td><select class="table-select">${formasPago.map(f => `<option ${data?.formaPago === f ? 'selected' : ''}>${f}</option>`).join('')}</select></td>
            <td><input type="number" class="table-input m-cierre" value="${data?.montoCierre || ''}" step="0.01" placeholder="0.00"></td>
            <td><input type="number" class="table-input m-fisico" value="${data?.montoFisico || ''}" step="0.01" placeholder="0.00"></td>
            <td><input type="text" class="table-input m-doc" value="${data?.documento || ''}" placeholder="# Ref."></td>
            <td><input type="date" class="table-input m-fecha" value="${data?.fechaDoc || ''}"></td>
            <td class="m-diff" style="text-align: right; padding-right: 15px;">0.00</td>
        `;
        row.querySelector('.btn-del').onclick = () => { row.remove(); calcularTotales(); };
        row.querySelectorAll('input, select').forEach(el => el.addEventListener('input', calcularTotales));
        tablaPagosBody.appendChild(row);
        calcularTotales();
    }

    document.getElementById('addFilaBtn')?.addEventListener('click', () => crearFilaPago());

    function calcularTotales() {
        let tC = 0, tF = 0;
        document.querySelectorAll('#tablaPagos tbody tr').forEach(row => {
            const c = parseFloat(row.querySelector('.m-cierre').value) || 0;
            const f = parseFloat(row.querySelector('.m-fisico').value) || 0;
            const d = c - f;
            const cellDiff = row.querySelector('.m-diff');
            cellDiff.textContent = d.toFixed(2);
            if(Math.abs(d) > 0.01) cellDiff.classList.add('has-diff'); else cellDiff.classList.remove('has-diff');
            tC += c; tF += f;
        });
        document.getElementById('totalCierre').textContent = tC.toFixed(2);
        document.getElementById('totalFisico').textContent = tF.toFixed(2);
        document.getElementById('totalDiferencia').textContent = (tC - tF).toFixed(2);
        generarResumenDetallado();
    }

    function generarResumenDetallado() {
        const agrupar = {};
        document.querySelectorAll('#tablaPagos tbody tr').forEach(row => {
            const forma = row.querySelector('select').value;
            const c = parseFloat(row.querySelector('.m-cierre').value) || 0;
            const f = parseFloat(row.querySelector('.m-fisico').value) || 0;
            if(!agrupar[forma]) agrupar[forma] = {c:0, f:0};
            agrupar[forma].c += c; agrupar[forma].f += f;
        });
        const resumenContainer = document.getElementById('resumenConsolidadoContainer');
        if(!resumenContainer) return;
        resumenContainer.innerHTML = '';
        const labels = [], cData = [], fData = [];

        Object.keys(agrupar).forEach(f => {
            if(agrupar[f].c === 0 && agrupar[f].f === 0) return;
            const d = agrupar[f].c - agrupar[f].f;
            labels.push(f); cData.push(agrupar[f].c); fData.push(agrupar[f].f);
            let iconoEstado = Math.abs(d) < 0.01 ? '<i class="fas fa-check-circle" style="color: #10b981;"></i>' : '<i class="fas fa-exclamation-circle has-diff"></i>';
            let msgDiferencia = Math.abs(d) < 0.01 ? 'Cuadrado' : (d > 0 ? `Faltan Q${Math.abs(d).toFixed(2)}` : `Sobran Q${Math.abs(d).toFixed(2)}`);
            
            resumenContainer.innerHTML += `
                <div class="summary-item" style="padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 12px;">
                    <div class="summary-info"><span style="font-weight: 700;">${f}</span><span class="${Math.abs(d) > 0.01 ? 'has-diff' : ''}">${msgDiferencia} ${iconoEstado}</span></div>
                    <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 6px; display:flex; justify-content:space-between;"><span>Sistema: Q${agrupar[f].c.toFixed(2)}</span><span>Físico: Q${agrupar[f].f.toFixed(2)}</span></div>
                </div>`;
        });
        renderChart(labels, cData, fData);
    }

    function renderChart(labels, cData, fData) {
        if (typeof Chart === 'undefined') return;
        const canvas = document.getElementById('resumenGrafico'); if(!canvas) return;
        const ctx = canvas.getContext('2d');
        if(chartInstance) chartInstance.destroy();
        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: { labels: labels, datasets: [ { label: 'Sistema', data: cData, backgroundColor: '#3b82f6' }, { label: 'Físico', data: fData, backgroundColor: '#10b981' } ]},
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    function cargarDatosDiaActual() {
        if(tablaPagosBody) { tablaPagosBody.innerHTML = ''; for(let i=0; i<3; i++) crearFilaPago(); }
    }

    // --- GUARDADO DEL CIERRE DIARIO ---
    document.getElementById('btnGuardarCierre')?.addEventListener('click', () => {
        const selectElement = document.getElementById('sucursalSelect');
        const sucursalNombre = selectElement.options[selectElement.selectedIndex].text;
        
        const nuevoCierre = {
            id: windowIndiceEdicion !== -1 ? windowIndiceEdicion : Date.now(), // Mantiene ID si se está editando
            sucursal: sucursalNombre,
            usuario: document.getElementById('turnoSelect').value,
            fechaCierre: document.getElementById('fechaInput').value,
            fechaRecibido: document.getElementById('fechaRecibido').value,
            reciboInicio: document.getElementById('prefixInicio').textContent + document.getElementById('reciboInicioNum').value,
            reciboFinal: document.getElementById('prefixFinal').textContent + document.getElementById('reciboFinalNum').value,
            notas: document.getElementById('notas').value,
            totalCierre: document.getElementById('totalCierre').textContent,
            totalFisico: document.getElementById('totalFisico').textContent,
            diferencia: document.getElementById('totalDiferencia').textContent,
            detalles: []
        };

        document.querySelectorAll('#tablaPagos tbody tr').forEach(row => {
            nuevoCierre.detalles.push({
                formaPago: row.querySelector('select').value,
                montoCierre: row.querySelector('.m-cierre').value,
                montoFisico: row.querySelector('.m-fisico').value,
                documento: row.querySelector('.m-doc').value,
                fechaDoc: row.querySelector('.m-fecha').value,
                diferencia: row.querySelector('.m-diff').textContent
            });
        });

        let historial = JSON.parse(localStorage.getItem('historialCierresEstuconta')) || [];
        
        if (windowIndiceEdicion !== -1) {
            // Actualizar existente
            const idx = historial.findIndex(c => c.id === windowIndiceEdicion);
            if(idx > -1) {
                historial[idx] = nuevoCierre;
                registrarAuditoria("EDITAR", `Editó el cierre de sucursal ${sucursalNombre} del día ${nuevoCierre.fechaCierre}`);
                alert('✅ Cierre Diario actualizado correctamente.');
            }
            windowIndiceEdicion = -1; // Resetear estado de edición
        } else {
            // Guardar nuevo
            historial.push(nuevoCierre);
            registrarAuditoria("AGREGAR", `Guardó cierre de sucursal ${sucursalNombre} por Q${nuevoCierre.totalCierre}`);
            alert('✅ Cierre Diario guardado exitosamente en la base de datos.');
        }

        localStorage.setItem('historialCierresEstuconta', JSON.stringify(historial));

        // Limpiar formulario y recargar BD
        cargarDatosDiaActual();
        document.getElementById('notas').value = "";
        document.getElementById('reciboFinalNum').value = "";
        poblarFiltroUsuariosDB(); 
        paginaActualDB = 1;
        cargarHistorialBD();
    });


    // --- 7. HISTORIAL BASE DE DATOS (CON BOTONES DE ACCIÓN) ---
    let paginaActualDB = 1; const registrosPorPaginaDB = 10; let datosFiltradosDB = [];

    function poblarFiltroUsuariosDB() {
        const historial = JSON.parse(localStorage.getItem('historialCierresEstuconta')) || [];
        const usuarios = [...new Set(historial.map(c => c.usuario))].filter(Boolean);
        const selectUser = document.getElementById('filtroUsuario');
        if(!selectUser) return;
        selectUser.innerHTML = '<option value="">Todos</option>';
        usuarios.forEach(u => {
            const op = document.createElement('option'); op.value = u; op.textContent = u; selectUser.appendChild(op);
        });
    }

    function cargarHistorialBD() {
        const historial = JSON.parse(localStorage.getItem('historialCierresEstuconta')) || [];
        const fSucursal = document.getElementById('filtroSucursal')?.value || "";
        const fFecha = document.getElementById('filtroFecha')?.value || "";
        const fUsuario = document.getElementById('filtroUsuario')?.value || "";
        const fPago = document.getElementById('filtroFormaPago')?.value || "";

        datosFiltradosDB = historial.filter(c => {
            let pasa = true;
            if(fSucursal && c.sucursal !== fSucursal) pasa = false;
            if(fFecha && c.fechaCierre !== fFecha) pasa = false;
            if(fUsuario && c.usuario !== fUsuario) pasa = false;
            if(fPago && c.detalles && !c.detalles.some(d => d.formaPago === fPago)) pasa = false;
            return pasa;
        });

        // Orden cronológico inverso (los últimos primero)
        datosFiltradosDB.reverse();
        renderizarTablaDB();
    }

    function renderizarTablaDB() {
        const tbody = document.querySelector('#tablaHistorial tbody');
        if(!tbody) return;

        const totalPaginas = Math.ceil(datosFiltradosDB.length / registrosPorPaginaDB) || 1;
        if(paginaActualDB > totalPaginas) paginaActualDB = totalPaginas;

        const inicio = (paginaActualDB - 1) * registrosPorPaginaDB;
        const datosPaginados = datosFiltradosDB.slice(inicio, inicio + registrosPorPaginaDB);

        const infoPagina = document.getElementById('infoPagina');
        if(infoPagina) infoPagina.textContent = `Página ${paginaActualDB} de ${totalPaginas}`;

        tbody.innerHTML = '';
        if(datosFiltradosDB.length === 0){
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #64748b; padding:20px;"><i class="fas fa-folder-open" style="font-size:2rem; display:block; margin-bottom:10px;"></i>No hay registros en la base de datos.</td></tr>';
            return;
        }

        datosPaginados.forEach(cierre => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${cierre.fechaRecibido || '-'}</td>
                <td><strong>${cierre.fechaCierre}</strong></td>
                <td>${cierre.sucursal}</td>
                <td>${cierre.usuario}</td>
                <td style="color:#3b82f6; font-weight:bold;">Q ${cierre.totalCierre}</td>
                <td style="color:#10b981; font-weight:bold;">Q ${cierre.totalFisico}</td>
                <td class="${parseFloat(cierre.diferencia) !== 0 ? 'has-diff' : ''}">Q ${cierre.diferencia}</td>
                <td class="action-buttons-cell">
                    <button class="btn-icon view" title="Ver Detalles" onclick="verDetallesCierre(${cierre.id})"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon edit" title="Editar Registro" onclick="editarCierre(${cierre.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon delete" title="Eliminar Registro" onclick="eliminarCierre(${cierre.id})"><i class="fas fa-trash-alt"></i></button>
                    <button class="btn-icon download" title="Descargar PDF" onclick="descargarPDFIndividual(${cierre.id})"><i class="fas fa-file-pdf"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // ACCIONES DE LA TABLA: Eliminar
    window.eliminarCierre = function(id) {
        if (!pedirPermisoMaestro()) return;
        if(confirm("¿Estás seguro de eliminar este registro? Esta acción no se puede deshacer.")) {
            let historial = JSON.parse(localStorage.getItem('historialCierresEstuconta')) || [];
            historial = historial.filter(c => c.id !== id);
            localStorage.setItem('historialCierresEstuconta', JSON.stringify(historial));
            registrarAuditoria("ELIMINAR", `Eliminó un registro de cierre de la base de datos`);
            cargarHistorialBD();
        }
    };

    // ACCIONES DE LA TABLA: Editar (Carga los datos al tab principal)
    window.editarCierre = function(id) {
        if (!pedirPermisoMaestro()) return;
        const historial = JSON.parse(localStorage.getItem('historialCierresEstuconta')) || [];
        const cierre = historial.find(c => c.id === id);
        if(!cierre) return;

        windowIndiceEdicion = id;
        
        // Moverse a la pestaña de captura
        activarTab('tab-captura', 'navCaptura');

        // Llenar datos principales
        // Encontrar el value del select de sucursal basado en el nombre
        const opcionesSucursal = Array.from(document.getElementById('sucursalSelect').options);
        const opEncontrada = opcionesSucursal.find(op => op.text === cierre.sucursal);
        if(opEncontrada) document.getElementById('sucursalSelect').value = opEncontrada.value;
        
        actualizarUsuarios(); // Refresca turnos de la sucursal seleccionada
        
        setTimeout(() => {
            document.getElementById('turnoSelect').value = cierre.usuario;
            document.getElementById('fechaInput').value = cierre.fechaCierre;
            document.getElementById('fechaRecibido').value = cierre.fechaRecibido || '';
            document.getElementById('notas').value = cierre.notas || '';
            
            // Extraer números de recibo (separar prefijo)
            const prefijo = document.getElementById('prefixInicio').textContent;
            if(cierre.reciboInicio) document.getElementById('reciboInicioNum').value = cierre.reciboInicio.replace(prefijo, '');
            if(cierre.reciboFinal) document.getElementById('reciboFinalNum').value = cierre.reciboFinal.replace(prefijo, '');

            // Llenar tabla de pagos
            const tbody = document.querySelector('#tablaPagos tbody');
            tbody.innerHTML = '';
            cierre.detalles.forEach(d => crearFilaPago(d));
            
            alert("✏️ Modo Edición Activo: Modifica los datos y presiona 'Guardar Cierre' para actualizar.");
        }, 100);
    };

    // ACCIONES DE LA TABLA: Ver Detalles (Modal)
    window.verDetallesCierre = function(id) {
        const historial = JSON.parse(localStorage.getItem('historialCierresEstuconta')) || [];
        const cierre = historial.find(c => c.id === id);
        if(!cierre) return;

        const modalBody = document.getElementById('modalDetallesBody');
        let htmlDetalles = `
            <div class="modal-grid-info">
                <div><span>Sucursal</span><strong>${cierre.sucursal}</strong></div>
                <div><span>Fecha Cierre</span><strong>${cierre.fechaCierre}</strong></div>
                <div><span>Usuario</span><strong>${cierre.usuario}</strong></div>
                <div><span>Recibos</span><strong>${cierre.reciboInicio} al ${cierre.reciboFinal}</strong></div>
            </div>
            <h4>Desglose de Documentos</h4>
            <table class="modern-table" style="margin-bottom: 20px;">
                <thead><tr><th>Forma</th><th>Cierre (Q)</th><th>Físico (Q)</th><th>Diferencia</th></tr></thead>
                <tbody>
        `;
        cierre.detalles.forEach(d => {
            htmlDetalles += `<tr><td>${d.formaPago}</td><td>${d.montoCierre}</td><td>${d.montoFisico}</td><td>${d.diferencia}</td></tr>`;
        });
        htmlDetalles += `</tbody></table>
            <div style="background:#f8fafc; padding:15px; border-radius:8px; border:1px solid #e2e8f0;">
                <p><strong>Notas:</strong> ${cierre.notas || 'Ninguna'}</p>
            </div>
        `;
        modalBody.innerHTML = htmlDetalles;
        document.getElementById('modalDetalles').classList.remove('hidden');
    };

    document.getElementById('btnCerrarModal')?.addEventListener('click', () => { document.getElementById('modalDetalles').classList.add('hidden'); });

    // ACCIONES DE LA TABLA: Descargar PDF Individual desde BD
    window.descargarPDFIndividual = function(id) {
        if(typeof window.jspdf === 'undefined') { alert("La librería para PDF no cargó correctamente."); return; }
        const historial = JSON.parse(localStorage.getItem('historialCierresEstuconta')) || [];
        const cierre = historial.find(c => c.id === id);
        if(!cierre) return;

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(16); doc.text("Reporte de Cierre Diario - Grupo Dent", 14, 20);
        doc.setFontSize(11);
        doc.text(`Sucursal: ${cierre.sucursal}`, 14, 30);
        doc.text(`Fecha: ${cierre.fechaCierre}`, 14, 36);
        doc.text(`Usuario: ${cierre.usuario}`, 14, 42);

        const tableData = cierre.detalles.map(d => [
            d.formaPago, `Q ${d.montoCierre}`, `Q ${d.montoFisico}`, d.documento || '-', d.fechaDoc || '-', `Q ${d.diferencia}`
        ]);
        tableData.push([ "TOTALES", `Q ${cierre.totalCierre}`, `Q ${cierre.totalFisico}`, "", "", `Q ${cierre.diferencia}` ]);

        doc.autoTable({ startY: 50, head: [["Forma de Pago", "Cierre Sist.", "Físico", "Documento", "Fecha Doc.", "Diferencia"]], body: tableData, theme: 'striped', headStyles: { fillColor: [30, 58, 138] } });
        doc.save(`Cierre_Reimpresion_${cierre.sucursal}_${cierre.fechaCierre}.pdf`);
        registrarAuditoria("IMPRESIÓN", `Reimprimió PDF del cierre de ${cierre.sucursal} (${cierre.fechaCierre})`);
    };
    
    // Filtros de BD
    document.getElementById('btnAplicarFiltros')?.addEventListener('click', () => { paginaActualDB = 1; cargarHistorialBD(); });
    document.getElementById('btnActualizarHistorial')?.addEventListener('click', () => { paginaActualDB = 1; cargarHistorialBD(); });
    
    document.getElementById('btnLimpiarFiltros')?.addEventListener('click', () => {
        document.getElementById('filtroSucursal').value = '';
        document.getElementById('filtroFecha').value = '';
        document.getElementById('filtroUsuario').value = '';
        document.getElementById('filtroFormaPago').value = '';
        paginaActualDB = 1; cargarHistorialBD();
    });

    // Paginación BD
    document.getElementById('btnAnterior')?.addEventListener('click', () => { if(paginaActualDB > 1) { paginaActualDB--; renderizarTablaDB(); } });
    document.getElementById('btnSiguiente')?.addEventListener('click', () => {
        const totalPaginas = Math.ceil(datosFiltradosDB.length / registrosPorPaginaDB) || 1;
        if(paginaActualDB < totalPaginas) { paginaActualDB++; renderizarTablaDB(); }
    });

    // Exportación Base de Datos Global Filtrada
    document.getElementById('btnExportarDB')?.addEventListener('click', () => {
        if(typeof XLSX === 'undefined') { alert("La librería para Excel no cargó correctamente."); return; }
        const rows = [["Fecha Recibido", "Fecha Cierre", "Sucursal", "Usuario", "Total Cierre", "Total Físico", "Diferencia"]];
        datosFiltradosDB.forEach(c => {
            rows.push([c.fechaRecibido || '-', c.fechaCierre, c.sucursal, c.usuario, c.totalCierre, c.totalFisico, c.diferencia]);
        });
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, "Historial DB");
        XLSX.writeFile(wb, "Historial_Cierres_Estuconta.xlsx");
        registrarAuditoria("IMPRESIÓN", "Exportó el historial de BD a Excel");
    });

    document.getElementById('btnExportarPDFDB')?.addEventListener('click', () => {
        if(typeof window.jspdf === 'undefined') { alert("La librería para PDF no cargó correctamente."); return; }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFontSize(14);
        doc.text("Historial Consolidado de Cierres Diarios", 14, 20);
        
        const tableData = datosFiltradosDB.map(c => [
            c.fechaRecibido || '-', c.fechaCierre, c.sucursal, c.usuario, `Q ${c.totalCierre}`, `Q ${c.totalFisico}`, `Q ${c.diferencia}`
        ]);

        doc.autoTable({
            startY: 30,
            head: [["Recibido", "Cierre", "Sucursal", "Usuario", "Cierre Sist.", "Físico", "Dif."]],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [30, 58, 138] }
        });
        doc.save("Historial_Cierres_Estuconta.pdf");
        registrarAuditoria("IMPRESIÓN", "Exportó el historial de BD a PDF");
    });

    // --- 8. EXPORTACIÓN INDIVIDUAL EN PANEL DE CAPTURA ---
    document.getElementById('btnExportarExcel')?.addEventListener('click', () => {
        if(typeof XLSX === 'undefined') { alert("La librería para Excel no cargó correctamente."); return; }
        const sucursal = document.getElementById('sucursalSelect').options[document.getElementById('sucursalSelect').selectedIndex].text;
        const fecha = document.getElementById('fechaInput').value;
        const wb = XLSX.utils.book_new();
        
        const rows = [
            ["REPORTE DE CIERRE DIARIO - GRUPO DENT"], [],
            ["Sucursal:", sucursal, "Fecha:", fecha],
            ["Usuario/Turno:", document.getElementById('turnoSelect').value], [],
            ["Forma de Pago", "Monto Cierre (Q)", "Monto Físico (Q)", "Documento", "Fecha Doc.", "Diferencia (Q)"]
        ];
        
        document.querySelectorAll('#tablaPagos tbody tr').forEach(row => {
            rows.push([
                row.querySelector('select').value,
                row.querySelector('.m-cierre').value || '0',
                row.querySelector('.m-fisico').value || '0',
                row.querySelector('.m-doc').value,
                row.querySelector('.m-fecha').value,
                row.querySelector('.m-diff').textContent
            ]);
        });
        
        rows.push(["TOTALES", document.getElementById('totalCierre').textContent, document.getElementById('totalFisico').textContent, "", "", document.getElementById('totalDiferencia').textContent]);

        const ws = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, "Cierre Diario");
        XLSX.writeFile(wb, `Cierre_${sucursal}_${fecha}.xlsx`);
        registrarAuditoria("IMPRESIÓN", `Exportó a Excel el cierre de ${sucursal}`);
    });

    document.getElementById('btnImprimirPdf')?.addEventListener('click', () => {
        if(typeof window.jspdf === 'undefined') { alert("La librería para PDF no cargó correctamente."); return; }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const sucursal = document.getElementById('sucursalSelect').options[document.getElementById('sucursalSelect').selectedIndex].text;
        const fecha = document.getElementById('fechaInput').value;

        doc.setFontSize(16); doc.text("Reporte de Cierre Diario - Grupo Dent", 14, 20);
        doc.setFontSize(11);
        doc.text(`Sucursal: ${sucursal}`, 14, 30);
        doc.text(`Fecha: ${fecha}`, 14, 36);
        doc.text(`Usuario: ${document.getElementById('turnoSelect').value}`, 14, 42);

        const tableData = [];
        document.querySelectorAll('#tablaPagos tbody tr').forEach(row => {
            tableData.push([
                row.querySelector('select').value,
                "Q " + (row.querySelector('.m-cierre').value || '0.00'),
                "Q " + (row.querySelector('.m-fisico').value || '0.00'),
                row.querySelector('.m-doc').value || '-',
                row.querySelector('.m-fecha').value || '-',
                "Q " + row.querySelector('.m-diff').textContent
            ]);
        });
        tableData.push([ "TOTALES", "Q " + document.getElementById('totalCierre').textContent, "Q " + document.getElementById('totalFisico').textContent, "", "", "Q " + document.getElementById('totalDiferencia').textContent ]);

        doc.autoTable({ startY: 50, head: [["Forma de Pago", "Cierre Sist.", "Físico", "Documento", "Fecha Doc.", "Diferencia"]], body: tableData, theme: 'striped', headStyles: { fillColor: [30, 58, 138] } });
        doc.save(`Cierre_PDF_${sucursal}_${fecha}.pdf`);
        registrarAuditoria("IMPRESIÓN", `Imprimió el PDF del cierre de ${sucursal}`);
    });

});