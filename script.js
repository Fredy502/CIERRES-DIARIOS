document.addEventListener('DOMContentLoaded', () => {

    // --- 1. BASE DE DATOS DE USUARIOS ---
    const usersDB = {
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
            document.getElementById('navConfigNotif').classList.remove('hidden');
            document.getElementById('btnCampanaNotif').classList.remove('hidden');
            activarTab('tab-captura', 'navCaptura');
        } 
        else if (currentUser.role === 'regular') {
            document.getElementById('navCaptura').classList.remove('hidden');
            document.getElementById('navDatabase').classList.remove('hidden');
            document.getElementById('navResumen').classList.remove('hidden'); 
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
        if(tabId === 'tab-resumen') generarResumenMensual(); 
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


    // --- 4. NUEVA UI: CARGA PDF Y REPOSITORIO ---
    
    // Variables temporales para la nueva lógica UI
    let tempFileDataUrl = null;
    let tempFileName = "";

    const archivoPdf = document.getElementById('archivoPdf');
    const dropzone = document.getElementById('dropzonePdf');
    const fileInfo = document.getElementById('fileInfoDisplay');
    const fileNameDisp = document.getElementById('fileNameDisplay');
    const btnRemove = document.getElementById('btnRemoveFile');
    const btnPreview = document.getElementById('btnPrevisualizarPdf');
    const btnSubir = document.getElementById('btnSubirPdf');

    // Drag and Drop Effects
    dropzone?.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.style.borderColor = "var(--accent)"; dropzone.style.background = "#eff6ff"; });
    dropzone?.addEventListener('dragleave', (e) => { e.preventDefault(); dropzone.style.borderColor = "#cbd5e1"; dropzone.style.background = "#f8fafc"; });
    dropzone?.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = "#cbd5e1"; dropzone.style.background = "#f8fafc";
        if(e.dataTransfer.files.length) {
            archivoPdf.files = e.dataTransfer.files;
            archivoPdf.dispatchEvent(new Event('change'));
        }
    });

    archivoPdf?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if(file) {
            if (file.type !== 'application/pdf') {
                Swal.fire('Formato incorrecto', 'Por favor selecciona un archivo PDF.', 'warning');
                archivoPdf.value = ''; return;
            }
            if (file.size > 5 * 1024 * 1024) {
                Swal.fire('Archivo muy pesado', 'El archivo excede los 5MB permitidos.', 'error');
                archivoPdf.value = ''; return;
            }
            tempFileName = file.name;
            fileNameDisp.textContent = tempFileName;
            dropzone.classList.add('hidden');
            fileInfo.classList.remove('hidden');
            
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
        archivoPdf.value = '';
        tempFileDataUrl = null; tempFileName = "";
        dropzone.classList.remove('hidden');
        fileInfo.classList.add('hidden');
        btnPreview.style.display = 'none';
        btnSubir.style.width = '100%';
    });

    btnPreview?.addEventListener('click', () => {
        if(tempFileDataUrl) {
            document.getElementById('pdfPreviewFrame').src = tempFileDataUrl;
            document.getElementById('modalPreview').classList.remove('hidden');
        }
    });

    document.getElementById('btnCerrarPreview')?.addEventListener('click', () => {
        document.getElementById('modalPreview').classList.add('hidden');
        document.getElementById('pdfPreviewFrame').src = '';
    });

    // Acción Original de Subida
    btnSubir?.addEventListener('click', async () => {
        const fecha = document.getElementById('fechaCargaPdf').value;
        const fileInput = document.getElementById('archivoPdf');
        
        if(!fecha || !fileInput.files[0]) { await Swal.fire('Campos incompletos', 'Por favor selecciona la fecha y arrastra tu archivo PDF.', 'warning'); return; }

        const file = fileInput.files[0];
        const fileName = file.name;
        const sucursal = currentUser.sucursal;

        // Se usa la promesa FileReader
        const reader = new FileReader();
        reader.onload = async function(e) {
            const fileData = e.target.result;
            const repositorio = JSON.parse(localStorage.getItem('repoArchivos')) || [];
            const existente = repositorio.find(r => r.sucursal === sucursal && r.fecha === fecha);
            
            if (existente) {
                const res = await Swal.fire({ title: 'Archivo existente', text: 'Ya existe un archivo para esta fecha. ¿Deseas sobreescribirlo?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, sobreescribir'});
                if(!res.isConfirmed) return;
                
                existente.archivo = fileName; existente.fileData = fileData; existente.fechaSubida = new Date().toLocaleString();
            } else {
                repositorio.push({ sucursal: sucursal, fecha: fecha, archivo: fileName, fileData: fileData, usuarioCarga: currentUser.user, fechaSubida: new Date().toLocaleString() });
            }

            try {
                localStorage.setItem('repoArchivos', JSON.stringify(repositorio));
                agregarNotificacion(`✅ La sucursal ${sucursal} ha subido la documentación del día ${fecha}.`, ['master', 'regular']);
                await Swal.fire('Completado', 'Archivo subido exitosamente a la base de datos central.', 'success');
                
                // Reiniciar UI
                btnRemove.click();
            } catch (error) { await Swal.fire('Error Critico', 'Almacenamiento local lleno. Reduzca el tamaño de los PDFs o elimine antiguos.', 'error'); }
        };
        reader.readAsDataURL(file);
    });

    // --- ACCIONES GLOBALES REPOSITORIO ---
    window.descargarDocumentoReal = function(nombreArchivo, base64Data) {
        if (!base64Data) { Swal.fire('Error', 'Este archivo es antiguo y no tiene contenido real guardado.', 'error'); return; }
        const link = document.createElement('a'); link.href = base64Data; link.download = nombreArchivo;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };

    window.verDocumentoRepositorio = function(base64) {
        if (!base64) { Swal.fire('Error', 'Archivo no disponible para vista previa', 'error'); return; }
        document.getElementById('pdfPreviewFrame').src = base64;
        document.getElementById('modalPreview').classList.remove('hidden');
    }

    window.eliminarDocumentoRepositorio = async function(sucursal, fecha) {
        const result = await Swal.fire({title: '¿Eliminar Documento?', text: 'Se borrará permanentemente de la base de datos.', icon: 'warning', showCancelButton:true, confirmButtonColor: '#d33'});
        if(result.isConfirmed) {
            let repo = JSON.parse(localStorage.getItem('repoArchivos')) || [];
            repo = repo.filter(r => !(r.sucursal === sucursal && r.fecha === fecha));
            localStorage.setItem('repoArchivos', JSON.stringify(repo));
            registrarAuditoria("ELIMINAR", `Eliminó archivo consolidado de sucursal ${sucursal} del día ${fecha}`);
            renderizarRepositorio();
            Swal.fire('Eliminado', 'El documento ha sido borrado.', 'success');
        }
    }

    window.editarDocumentoRepositorio = async function(sucursal, fecha) {
        const { value: file } = await Swal.fire({
          title: 'Selecciona el nuevo archivo PDF',
          input: 'file',
          inputAttributes: { 'accept': 'application/pdf', 'aria-label': 'Subir tu PDF aquí' },
          showCancelButton: true
        });

        if (file) {
            if (file.size > 5 * 1024 * 1024) { Swal.fire('Error', 'El archivo excede los 5MB permitidos.', 'error'); return; }
            const reader = new FileReader();
            reader.onload = (e) => {
                const repo = JSON.parse(localStorage.getItem('repoArchivos')) || [];
                const index = repo.findIndex(r => r.sucursal === sucursal && r.fecha === fecha);
                if(index > -1) {
                    repo[index].fileData = e.target.result;
                    repo[index].archivo = file.name;
                    repo[index].fechaSubida = new Date().toLocaleString();
                    localStorage.setItem('repoArchivos', JSON.stringify(repo));
                    registrarAuditoria("EDITAR", `Reemplazó el documento de sucursal ${sucursal} del día ${fecha}`);
                    renderizarRepositorio();
                    Swal.fire('Actualizado', 'Documento reemplazado con éxito.', 'success');
                }
            };
            reader.readAsDataURL(file);
        }
    }

    function renderizarRepositorio() {
        const repo = JSON.parse(localStorage.getItem('repoArchivos')) || [];
        const container = document.getElementById('treeViewContainer');
        if(!container) return;
        container.innerHTML = '';

        const arbolArchivos = {};
        const mesesStr = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

        repo.forEach(item => {
            const sucursal = item.sucursal;
            const [year, month, day] = item.fecha.split('-');
            const mesNombre = mesesStr[parseInt(month)-1];
            
            if(!arbolArchivos[sucursal]) arbolArchivos[sucursal] = {};
            if(!arbolArchivos[sucursal][year]) arbolArchivos[sucursal][year] = {};
            if(!arbolArchivos[sucursal][year][mesNombre]) arbolArchivos[sucursal][year][mesNombre] = {};
            if(!arbolArchivos[sucursal][year][mesNombre][day]) arbolArchivos[sucursal][year][mesNombre][day] = [];
            arbolArchivos[sucursal][year][mesNombre][day].push(item);
        });

        // MEJORA: Validar visibilidad estricta. Si es sucursal, SOLO ve su nombre.
        let sucursalesPermitidas = ["CHIQUIMULA", "SAN NICOLAS 1", "SIXTINO", "FRUTAL", "METRONORTE", "NARANJO", "SAN NICOLAS 2", "PERI ROOSEVELT"];
        if (currentUser && currentUser.role === 'sucursal') {
            sucursalesPermitidas = [currentUser.sucursal];
        }

        sucursalesPermitidas.forEach(sucursal => {
            const detSucursal = document.createElement('details'); detSucursal.className = 'folder folder-root';
            const tieneArchivosSucursal = arbolArchivos[sucursal] !== undefined;
            if(!tieneArchivosSucursal) detSucursal.classList.add('empty-folder');

            detSucursal.innerHTML = `<summary>${sucursal} ${!tieneArchivosSucursal ? '<span style="font-size:0.75rem; color:#94a3b8; font-weight:normal;">(Vacio)</span>' : ''}</summary>`;

            if (tieneArchivosSucursal) {
                Object.keys(arbolArchivos[sucursal]).sort().reverse().forEach(anioStr => {
                    const detAnio = document.createElement('details'); detAnio.className = 'folder';
                    detAnio.innerHTML = `<summary>Año ${anioStr}</summary>`;
                    
                    for(let mes in arbolArchivos[sucursal][anioStr]) {
                        const detMes = document.createElement('details'); detMes.className = 'folder';
                        detMes.innerHTML = `<summary>${mes}</summary>`;
                        
                        Object.keys(arbolArchivos[sucursal][anioStr][mes]).sort().forEach(dia => {
                            const detDia = document.createElement('details'); detDia.className = 'folder';
                            detDia.innerHTML = `<summary>Día ${dia}</summary>`;
                            
                            arbolArchivos[sucursal][anioStr][mes][dia].forEach(archivo => {
                                const divFile = document.createElement('div'); divFile.className = 'file-item';
                                
                                let btnAcciones = '';
                                // Todos pueden descargar y ver su propia información
                                btnAcciones += `<button class="btn-download" style="background:#475569;" onclick="verDocumentoRepositorio('${archivo.fileData || ''}')" title="Previsualizar"><i class="fas fa-eye"></i></button>`;
                                btnAcciones += `<button class="btn-download" onclick="descargarDocumentoReal('${archivo.archivo}', '${archivo.fileData || ''}')" title="Descargar"><i class="fas fa-download"></i></button>`;
                                
                                // Opciones de modificación y borrado (Seguridad para Master/Regular o dueño de archivo)
                                if (currentUser.role === 'master' || currentUser.role === 'regular' || (currentUser.role === 'sucursal' && currentUser.sucursal === archivo.sucursal)) {
                                    btnAcciones += `<button class="btn-download" style="background:#d97706;" onclick="editarDocumentoRepositorio('${archivo.sucursal}', '${archivo.fecha}')" title="Reemplazar"><i class="fas fa-exchange-alt"></i></button>`;
                                    btnAcciones += `<button class="btn-download" style="background:var(--danger);" onclick="eliminarDocumentoRepositorio('${archivo.sucursal}', '${archivo.fecha}')" title="Eliminar"><i class="fas fa-trash-alt"></i></button>`;
                                }

                                divFile.innerHTML = `
                                    <div class="file-item-info">
                                        <i class="fas fa-file-pdf"></i>
                                        <div><strong>[${archivo.sucursal}]</strong> ${archivo.archivo} <br><span style="font-size:0.75rem; color:#94a3b8;">Subido por: ${archivo.usuarioCarga} (${archivo.fechaSubida})</span></div>
                                    </div>
                                    <div style="display:flex; gap:8px;">${btnAcciones}</div>
                                `;
                                detDia.appendChild(divFile);
                            });
                            detMes.appendChild(detDia);
                        });
                        detAnio.appendChild(detMes);
                    }
                    detSucursal.appendChild(detAnio);
                });
            }
            container.appendChild(detSucursal);
        });
    }

    // --- 5. AUDITORÍA Y PERMISOS ---
    async function pedirPermisoMaestro() {
        const { value: adminPass } = await Swal.fire({
            title: 'Permiso Maestro Requerido',
            text: 'Ingrese su contraseña de usuario Master para autorizar la acción:',
            input: 'password',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#059669',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Autorizar'
        });

        if (!adminPass) return false;
        const isMasterValid = Object.values(usersDB).some(u => u.role === 'master' && u.pass === adminPass);
        if (isMasterValid) return true;
        
        await Swal.fire('Denegado', 'Contraseña de maestro incorrecta. Acción cancelada.', 'error');
        return false;
    }

    function registrarAuditoria(accion, detalle) {
        if (!currentUser && accion !== "ERROR SESIÓN") return;
        const auditoria = JSON.parse(localStorage.getItem('auditoriaEstuconta')) || [];
        const now = new Date();
        auditoria.unshift({
            fecha: now.toLocaleDateString() + ' ' + now.toLocaleTimeString(),
            usuario: currentUser ? currentUser.user : 'SISTEMA', 
            rol: currentUser ? currentUser.role : 'sistema', 
            accion: accion, 
            detalle: detalle
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
            else if (item.accion === 'ERROR SESIÓN') { colorClass = 'bg-error'; icon = 'fa-times-circle'; }
            else if (item.accion === 'CIERRE SESIÓN') { colorClass = 'bg-logout'; icon = 'fa-sign-out-alt'; }
            else if (item.accion === 'AGREGAR') { colorClass = 'bg-add'; icon = 'fa-plus-circle'; }
            else if (item.accion === 'ELIMINAR') { colorClass = 'bg-delete'; icon = 'fa-trash-alt'; }
            else if (item.accion === 'EDITAR') { colorClass = 'bg-edit'; icon = 'fa-edit'; }
            else if (item.accion === 'IMPRESIÓN') { colorClass = 'bg-print'; icon = 'fa-print'; }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="color: #475569; font-size: 0.85rem; font-weight: 500;">${item.fecha}</td>
                <td>
                    <div class="auditoria-user-cell">
                        <div class="auditoria-avatar" style="${item.rol === 'sistema'? 'background:#fee2e2; color:#b91c1c;':''}"><i class="fas ${item.rol === 'sistema'? 'fa-robot':'fa-user-tie'}"></i></div>
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
    
    document.getElementById('btnLimpiarAuditoria')?.addEventListener('click', async () => {
        if (await pedirPermisoMaestro()) {
            const result = await Swal.fire({ title: '¿Peligro Inminente?', text: 'Estás a punto de borrar todo el historial forense. Esto es irreversible.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33' });
            if(result.isConfirmed) {
                localStorage.removeItem('auditoriaEstuconta');
                registrarAuditoria("ELIMINAR", "VACIADO COMPLETO DEL HISTORIAL DE AUDITORÍA");
                cargarTablaAuditoria();
                Swal.fire('Eliminado', 'Auditoría borrada', 'success');
            }
        }
    });

    document.getElementById('btnExportarAuditoria')?.addEventListener('click', () => {
        const auditoria = JSON.parse(localStorage.getItem('auditoriaEstuconta')) || [];
        if(typeof XLSX === 'undefined') return Swal.fire('Error', 'La librería para Excel no está cargada.', 'error');
        const rows = [["Fecha y Hora", "Usuario", "Rol", "Acción", "Detalle"]];
        auditoria.forEach(a => rows.push([a.fecha, a.usuario, a.rol, a.accion, a.detalle]));
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, "Auditoria");
        XLSX.writeFile(wb, "Registro_Auditoria_Estuconta.xlsx");
        registrarAuditoria("IMPRESIÓN", "Se exportó a Excel el Log de Auditoría completo");
    });


    // --- 6. PANEL CIERRE DIARIO ---
    let windowIndiceEdicion = -1; 
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
        
        const selectElement = document.getElementById('sucursalSelect');
        const sucursalNombre = selectElement.options[selectElement.selectedIndex].text;
        const usuarioNombre = document.getElementById('turnoSelect').value;
        const inputInicio = document.getElementById('reciboInicioNum');

        document.getElementById('prefixInicio').textContent = prefijo;
        document.getElementById('prefixFinal').textContent = prefijo;
        
        if(windowIndiceEdicion === -1) {
            const historial = JSON.parse(localStorage.getItem('historialCierresEstuconta')) || [];
            const registrosMismoUsuario = historial.filter(c => c.sucursal === sucursalNombre && c.usuario === usuarioNombre);
            
            let numSiguiente = 1;
            if(registrosMismoUsuario.length > 0) {
                let maxNumFinal = 0;
                registrosMismoUsuario.forEach(r => {
                    const finalLimpio = parseInt(r.reciboFinal.replace(prefijo, '')) || 0;
                    if(finalLimpio > maxNumFinal) maxNumFinal = finalLimpio;
                });
                numSiguiente = maxNumFinal + 1;
            }

            inputInicio.value = numSiguiente;
            inputInicio.disabled = true; 
            document.getElementById('reciboFinalNum').value = ""; 
        } else {
            inputInicio.disabled = false;
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
            let iconoEstado = Math.abs(d) < 0.01 ? '<i class="fas fa-check-circle" style="color: #059669;"></i>' : '<i class="fas fa-exclamation-circle has-diff"></i>';
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
            data: { 
                labels: labels, 
                datasets: [ 
                    { label: 'Sistema', data: cData, backgroundColor: '#2563eb', borderRadius: 4 }, 
                    { label: 'Físico', data: fData, backgroundColor: '#059669', borderRadius: 4 } 
                ]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { labels: { font: { family: "'Inter', sans-serif" } } } },
                scales: {
                    y: { border: { display: false }, grid: { color: '#f1f5f9' }, ticks: { font: { family: "'Inter', sans-serif" } } },
                    x: { grid: { display: false }, ticks: { font: { family: "'Inter', sans-serif" } } }
                }
            }
        });
    }

    function cargarDatosDiaActual() {
        if(tablaPagosBody) { tablaPagosBody.innerHTML = ''; for(let i=0; i<3; i++) crearFilaPago(); }
    }

    // --- GUARDADO DEL CIERRE DIARIO ---
    document.getElementById('btnGuardarCierre')?.addEventListener('click', async () => {
        const selectElement = document.getElementById('sucursalSelect');
        const sucursalNombre = selectElement.options[selectElement.selectedIndex].text;
        
        let hayDuplicado = false;
        let mensajeDuplicado = "";
        const historial = JSON.parse(localStorage.getItem('historialCierresEstuconta')) || [];
        
        const filas = document.querySelectorAll('#tablaPagos tbody tr');
        for(let row of filas) {
            const documentoActual = row.querySelector('.m-doc').value.trim();
            if(documentoActual !== "") {
                for(let h of historial) {
                    if (windowIndiceEdicion !== -1 && h.id === windowIndiceEdicion) continue;
                    
                    const itemDuplicado = h.detalles.find(d => d.documento === documentoActual);
                    if (itemDuplicado) {
                        hayDuplicado = true;
                        mensajeDuplicado = `El documento Nro. <b>${documentoActual}</b> ya fue registrado previamente.<br><br><b>Ubicación:</b> Sucursal ${h.sucursal}<br><b>Usuario:</b> ${h.usuario}<br><b>Fecha Cierre:</b> ${h.fechaCierre}<br><b>Forma de Pago:</b> ${itemDuplicado.formaPago} por Q${itemDuplicado.montoCierre}`;
                        break;
                    }
                }
            }
            if(hayDuplicado) break;
        }

        if(hayDuplicado) {
            registrarAuditoria("SISTEMA", `El usuario intentó ingresar el documento duplicado: ${mensajeDuplicado.split('<br><br>')[0].replace(/<b>/g, '').replace(/<\/b>/g, '')}`);
            await Swal.fire({ icon: 'error', title: 'Documento Duplicado', html: mensajeDuplicado, confirmButtonText: 'Entendido' });
            return; 
        }
        
        const nuevoCierre = {
            id: windowIndiceEdicion !== -1 ? windowIndiceEdicion : Date.now(), 
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

        filas.forEach(row => {
            nuevoCierre.detalles.push({
                formaPago: row.querySelector('select').value,
                montoCierre: row.querySelector('.m-cierre').value,
                montoFisico: row.querySelector('.m-fisico').value,
                documento: row.querySelector('.m-doc').value,
                fechaDoc: row.querySelector('.m-fecha').value,
                diferencia: row.querySelector('.m-diff').textContent
            });
        });

        if (windowIndiceEdicion !== -1) {
            const idx = historial.findIndex(c => c.id === windowIndiceEdicion);
            if(idx > -1) {
                historial[idx] = nuevoCierre;
                registrarAuditoria("EDITAR", `Editó de manera profunda el cierre de sucursal ${sucursalNombre} del día ${nuevoCierre.fechaCierre} (ID: ${nuevoCierre.id})`);
                await Swal.fire('Actualizado', 'Cierre Diario modificado correctamente.', 'success');
            }
            windowIndiceEdicion = -1; 
        } else {
            historial.push(nuevoCierre);
            registrarAuditoria("AGREGAR", `Guardó un cierre en ${sucursalNombre} por un Total de Q${nuevoCierre.totalCierre}`);
            await Swal.fire({ title: '¡Guardado Exitoso!', text: 'El Cierre Diario ha sido alojado en la base de datos.', icon: 'success', confirmButtonText: 'Continuar' });
        }

        localStorage.setItem('historialCierresEstuconta', JSON.stringify(historial));

        cargarDatosDiaActual();
        actualizarCorrelativo(); 
        document.getElementById('notas').value = "";
        poblarFiltroUsuariosDB(); 
        paginaActualDB = 1;
        cargarHistorialBD();
    });


    // --- 7. HISTORIAL BASE DE DATOS ---
    let paginaActualDB = 1; const registrosPorPaginaDB = 15; let datosFiltradosDB = [];

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

        datosFiltradosDB.sort((a,b) => new Date(b.fechaCierre) - new Date(a.fechaCierre));
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
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #64748b; padding:40px;"><i class="fas fa-folder-open" style="font-size:3rem; display:block; margin-bottom:15px; color:#cbd5e1;"></i>No hay registros en la base de datos con estos filtros.</td></tr>';
            return;
        }

        let fechaGrupoActual = null;

        datosPaginados.forEach(cierre => {
            if (cierre.fechaCierre !== fechaGrupoActual) {
                const trGrupo = document.createElement('tr');
                trGrupo.className = 'date-group-row';
                trGrupo.innerHTML = `<td colspan="8"><i class="fas fa-calendar-day" style="margin-right:8px; color:#3b82f6;"></i> Cierres del ${cierre.fechaCierre.split('-').reverse().join('/')}</td>`;
                tbody.appendChild(trGrupo);
                fechaGrupoActual = cierre.fechaCierre;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${cierre.fechaRecibido || '-'}</td>
                <td style="color:#64748b; font-size:0.85rem;">${cierre.fechaCierre}</td>
                <td><strong>${cierre.sucursal}</strong></td>
                <td>${cierre.usuario}</td>
                <td style="color:#2563eb; font-weight:bold;">Q ${cierre.totalCierre}</td>
                <td style="color:#059669; font-weight:bold;">Q ${cierre.totalFisico}</td>
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

    window.eliminarCierre = async function(id) {
        if (!await pedirPermisoMaestro()) return;
        const result = await Swal.fire({ title: '¿Eliminar Permanentemente?', text: 'Este cierre desaparecerá de la base de datos de manera definitiva.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33' });
        
        if(result.isConfirmed) {
            let historial = JSON.parse(localStorage.getItem('historialCierresEstuconta')) || [];
            const registro = historial.find(c => c.id === id);
            historial = historial.filter(c => c.id !== id);
            localStorage.setItem('historialCierresEstuconta', JSON.stringify(historial));
            
            registrarAuditoria("ELIMINAR", `Eliminó el cierre de [${registro.sucursal}] del usuario [${registro.usuario}] por valor de Q${registro.totalCierre}`);
            
            cargarHistorialBD();
            Swal.fire('Eliminado', 'El registro ha sido destruido.', 'success');
        }
    };

    window.editarCierre = async function(id) {
        if (!await pedirPermisoMaestro()) return;
        const historial = JSON.parse(localStorage.getItem('historialCierresEstuconta')) || [];
        const cierre = historial.find(c => c.id === id);
        if(!cierre) return;

        windowIndiceEdicion = id;
        
        activarTab('tab-captura', 'navCaptura');

        const opcionesSucursal = Array.from(document.getElementById('sucursalSelect').options);
        const opEncontrada = opcionesSucursal.find(op => op.text === cierre.sucursal);
        if(opEncontrada) document.getElementById('sucursalSelect').value = opEncontrada.value;
        
        actualizarUsuarios(); 
        
        setTimeout(() => {
            document.getElementById('turnoSelect').value = cierre.usuario;
            document.getElementById('fechaInput').value = cierre.fechaCierre;
            document.getElementById('fechaRecibido').value = cierre.fechaRecibido || '';
            document.getElementById('notas').value = cierre.notas || '';
            
            const prefijo = document.getElementById('prefixInicio').textContent;
            
            const inputInicio = document.getElementById('reciboInicioNum');
            inputInicio.disabled = false;
            
            if(cierre.reciboInicio) inputInicio.value = cierre.reciboInicio.replace(prefijo, '');
            if(cierre.reciboFinal) document.getElementById('reciboFinalNum').value = cierre.reciboFinal.replace(prefijo, '');

            const tbody = document.querySelector('#tablaPagos tbody');
            tbody.innerHTML = '';
            cierre.detalles.forEach(d => crearFilaPago(d));
            
            Swal.fire({ title: 'Modo Edición Activado', text: 'Estás modificando un registro antiguo de la base de datos. Los controles restrictivos están deshabilitados.', icon: 'info', toast: true, position: 'top-end', showConfirmButton: false, timer: 4000 });
        }, 150);
    };

    window.verDetallesCierre = function(id) {
        const historial = JSON.parse(localStorage.getItem('historialCierresEstuconta')) || [];
        const cierre = historial.find(c => c.id === id);
        if(!cierre) return;

        const detallesFiltrados = cierre.detalles.filter(d => 
            (parseFloat(d.montoCierre) > 0 || parseFloat(d.montoFisico) > 0 || d.documento.trim() !== '')
        );

        const modalBody = document.getElementById('modalDetallesBody');
        let htmlDetalles = `
            <div class="modal-grid-info">
                <div class="info-box"><span>Sucursal</span><strong>${cierre.sucursal}</strong></div>
                <div class="info-box"><span>Fecha de Cierre</span><strong>${cierre.fechaCierre}</strong></div>
                <div class="info-box"><span>Usuario</span><strong>${cierre.usuario}</strong></div>
                <div class="info-box"><span>Fecha Recibido</span><strong>${cierre.fechaRecibido || 'N/A'}</strong></div>
            </div>
            
            <div style="background:#eff6ff; border:1px solid #bfdbfe; padding:15px; border-radius:8px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
                <span style="color:#1e40af; font-weight:700;">Recibos Correlativos:</span>
                <span style="font-size:1.2rem; font-weight:800; color:#1e3a8a; letter-spacing:1px;">${cierre.reciboInicio} <i class="fas fa-arrow-right" style="font-size:0.9rem; margin:0 5px;"></i> ${cierre.reciboFinal}</span>
            </div>

            <h4 style="margin-bottom: 15px; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom:5px;">Desglose de Operaciones Reales</h4>
            <div class="table-responsive" style="margin-bottom:20px;">
                <table class="modern-table">
                    <thead><tr><th>Forma</th><th>Cierre Sist. (Q)</th><th>Físico (Q)</th><th>Diferencia</th><th>Documento</th><th>Fecha Doc.</th></tr></thead>
                    <tbody>
        `;
        
        if(detallesFiltrados.length === 0) {
            htmlDetalles += `<tr><td colspan="6" style="text-align:center; color:#94a3b8; font-style:italic;">No se reportaron movimientos en este cierre</td></tr>`;
        } else {
            detallesFiltrados.forEach(d => {
                htmlDetalles += `<tr>
                    <td><strong>${d.formaPago}</strong></td>
                    <td style="color:#2563eb;">${d.montoCierre}</td>
                    <td style="color:#059669;">${d.montoFisico}</td>
                    <td class="${parseFloat(d.diferencia) !== 0 ? 'has-diff' : ''}">${d.diferencia}</td>
                    <td>${d.documento || '-'}</td>
                    <td>${d.fechaDoc || '-'}</td>
                </tr>`;
            });
        }
        
        htmlDetalles += `
                    </tbody>
                    <tfoot>
                        <tr style="background:#f8fafc; font-weight:bold;">
                            <td>TOTALES</td>
                            <td style="color:#1d4ed8;">${cierre.totalCierre}</td>
                            <td style="color:#047857;">${cierre.totalFisico}</td>
                            <td class="${parseFloat(cierre.diferencia) !== 0 ? 'has-diff' : ''}">${cierre.diferencia}</td>
                            <td colspan="2"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div style="background:#f1f5f9; padding:15px; border-radius:8px; border:1px solid #cbd5e1;">
                <p style="margin: 0; color: #334155;"><strong><i class="fas fa-comment-dots"></i> Notas Adicionales:</strong><br> ${cierre.notas || '<span style="color:#94a3b8; font-style:italic;">Ninguna observación registrada por el usuario.</span>'}</p>
            </div>
        `;
        modalBody.innerHTML = htmlDetalles;
        document.getElementById('modalDetalles').classList.remove('hidden');
    };

    document.getElementById('btnCerrarModal')?.addEventListener('click', () => { document.getElementById('modalDetalles').classList.add('hidden'); });

    window.descargarPDFIndividual = function(id) {
        if(typeof window.jspdf === 'undefined') { Swal.fire('Error', 'La librería PDF no cargó correctamente.', 'error'); return; }
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

        const detallesFiltrados = cierre.detalles.filter(d => (parseFloat(d.montoCierre) > 0 || parseFloat(d.montoFisico) > 0 || d.documento.trim() !== ''));

        const tableData = detallesFiltrados.map(d => [
            d.formaPago, `Q ${d.montoCierre}`, `Q ${d.montoFisico}`, d.documento || '-', d.fechaDoc || '-', `Q ${d.diferencia}`
        ]);
        tableData.push([ "TOTALES", `Q ${cierre.totalCierre}`, `Q ${cierre.totalFisico}`, "", "", `Q ${cierre.diferencia}` ]);

        doc.autoTable({ startY: 50, head: [["Forma de Pago", "Cierre Sist.", "Físico", "Documento", "Fecha Doc.", "Diferencia"]], body: tableData, theme: 'striped', headStyles: { fillColor: [30, 58, 138] } });
        doc.save(`Cierre_Reimpresion_${cierre.sucursal}_${cierre.fechaCierre}.pdf`);
        registrarAuditoria("IMPRESIÓN", `Reimprimió PDF del cierre de ${cierre.sucursal} (${cierre.fechaCierre})`);
    };
    
    document.getElementById('btnAplicarFiltros')?.addEventListener('click', () => { paginaActualDB = 1; cargarHistorialBD(); });
    document.getElementById('btnActualizarHistorial')?.addEventListener('click', () => { paginaActualDB = 1; cargarHistorialBD(); });
    
    document.getElementById('btnLimpiarFiltros')?.addEventListener('click', () => {
        document.getElementById('filtroSucursal').value = '';
        document.getElementById('filtroFecha').value = '';
        document.getElementById('filtroUsuario').value = '';
        document.getElementById('filtroFormaPago').value = '';
        paginaActualDB = 1; cargarHistorialBD();
    });

    document.getElementById('btnAnterior')?.addEventListener('click', () => { if(paginaActualDB > 1) { paginaActualDB--; renderizarTablaDB(); } });
    document.getElementById('btnSiguiente')?.addEventListener('click', () => {
        const totalPaginas = Math.ceil(datosFiltradosDB.length / registrosPorPaginaDB) || 1;
        if(paginaActualDB < totalPaginas) { paginaActualDB++; renderizarTablaDB(); }
    });

    document.getElementById('btnExportarDB')?.addEventListener('click', () => {
        if(typeof XLSX === 'undefined') { Swal.fire('Error', 'Librería Excel no lista.', 'error'); return; }
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
        if(typeof window.jspdf === 'undefined') { Swal.fire('Error', 'Librería PDF no lista.', 'error'); return; }
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
        if(typeof XLSX === 'undefined') { Swal.fire('Error', 'Librería Excel no lista.', 'error'); return; }
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
            const montoCierre = row.querySelector('.m-cierre').value || '0';
            const montoFisico = row.querySelector('.m-fisico').value || '0';
            const documento = row.querySelector('.m-doc').value;
            if(parseFloat(montoCierre) > 0 || parseFloat(montoFisico) > 0 || documento.trim() !== '') {
                rows.push([
                    row.querySelector('select').value, montoCierre, montoFisico, documento,
                    row.querySelector('.m-fecha').value, row.querySelector('.m-diff').textContent
                ]);
            }
        });
        
        rows.push(["TOTALES", document.getElementById('totalCierre').textContent, document.getElementById('totalFisico').textContent, "", "", document.getElementById('totalDiferencia').textContent]);

        const ws = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, "Cierre Diario");
        XLSX.writeFile(wb, `Cierre_${sucursal}_${fecha}.xlsx`);
        registrarAuditoria("IMPRESIÓN", `Exportó a Excel el cierre de ${sucursal}`);
    });

    document.getElementById('btnImprimirPdf')?.addEventListener('click', () => {
        if(typeof window.jspdf === 'undefined') { Swal.fire('Error', 'Librería PDF no lista.', 'error'); return; }
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
            const mCierre = row.querySelector('.m-cierre').value || '0.00';
            const mFisico = row.querySelector('.m-fisico').value || '0.00';
            const docu = row.querySelector('.m-doc').value || '-';
            
            if(parseFloat(mCierre) > 0 || parseFloat(mFisico) > 0 || docu !== '-') {
                tableData.push([
                    row.querySelector('select').value, "Q " + mCierre, "Q " + mFisico, docu,
                    row.querySelector('.m-fecha').value || '-', "Q " + row.querySelector('.m-diff').textContent
                ]);
            }
        });
        tableData.push([ "TOTALES", "Q " + document.getElementById('totalCierre').textContent, "Q " + document.getElementById('totalFisico').textContent, "", "", "Q " + document.getElementById('totalDiferencia').textContent ]);

        doc.autoTable({ startY: 50, head: [["Forma de Pago", "Cierre Sist.", "Físico", "Documento", "Fecha Doc.", "Diferencia"]], body: tableData, theme: 'striped', headStyles: { fillColor: [30, 58, 138] } });
        doc.save(`Cierre_PDF_${sucursal}_${fecha}.pdf`);
        registrarAuditoria("IMPRESIÓN", `Imprimió el PDF del cierre de ${sucursal}`);
    });

    // --- 9. RESUMEN MENSUAL CONTABLE ---
    
    // Asignar mes actual por defecto
    const fMesResumen = document.getElementById('filtroMesResumen');
    if (fMesResumen) {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        fMesResumen.value = `${yyyy}-${mm}`;
    }

    document.getElementById('btnGenerarResumen')?.addEventListener('click', generarResumenMensual);
    
    function generarResumenMensual() {
        const mesAnio = document.getElementById('filtroMesResumen')?.value;
        const sucursalFiltro = document.getElementById('filtroSucursalResumen')?.value;
        
        if (!mesAnio) {
            Swal.fire('Atención', 'Seleccione un mes y año para procesar.', 'warning');
            return;
        }

        const historial = JSON.parse(localStorage.getItem('historialCierresEstuconta')) || [];
        
        const datosFiltrados = historial.filter(c => {
            const mesCierre = c.fechaCierre.substring(0, 7); 
            let pasa = mesCierre === mesAnio;
            if (sucursalFiltro && c.sucursal !== sucursalFiltro) pasa = false;
            return pasa;
        });

        const resumen = {};
        
        datosFiltrados.forEach(cierre => {
            const suc = cierre.sucursal;
            if (!resumen[suc]) resumen[suc] = {};

            cierre.detalles.forEach(d => {
                const mC = parseFloat(d.montoCierre) || 0;
                const mF = parseFloat(d.montoFisico) || 0;
                
                if (mC > 0 || mF > 0) {
                    const forma = d.formaPago;
                    if (!resumen[suc][forma]) resumen[suc][forma] = { c: 0, f: 0 };
                    resumen[suc][forma].c += mC;
                    resumen[suc][forma].f += mF;
                }
            });
        });

        const tbody = document.querySelector('#tablaResumenMensual tbody');
        const tfoot = document.querySelector('#tfootResumenMensual');
        if (!tbody || !tfoot) return;
        
        tbody.innerHTML = ''; tfoot.innerHTML = '';
        let totalGralCierre = 0, totalGralFisico = 0;

        if (Object.keys(resumen).length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #64748b; padding:40px;"><i class="fas fa-folder-open" style="font-size:3rem; display:block; margin-bottom:15px; color:#cbd5e1;"></i>No se encontraron transacciones en el mes seleccionado.</td></tr>';
            return;
        }

        const sucursales = Object.keys(resumen).sort();
        
        sucursales.forEach(suc => {
            const formas = Object.keys(resumen[suc]).sort();
            let sumSucC = 0, sumSucF = 0;

            formas.forEach((forma, index) => {
                const c = resumen[suc][forma].c;
                const f = resumen[suc][forma].f;
                const diff = c - f;
                
                sumSucC += c; sumSucF += f;
                totalGralCierre += c; totalGralFisico += f;

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="${index === 0 ? 'font-weight:700; color:#1e293b; font-size:1.05rem;' : ''}">${index === 0 ? suc : ''}</td>
                    <td>${forma}</td>
                    <td style="color:#2563eb; font-weight:500;">Q ${c.toFixed(2)}</td>
                    <td style="color:#059669; font-weight:500;">Q ${f.toFixed(2)}</td>
                    <td class="${Math.abs(diff) > 0.01 ? 'has-diff' : ''}">Q ${diff.toFixed(2)}</td>
                `;
                tbody.appendChild(tr);
            });
            
            const diffSuc = sumSucC - sumSucF;
            const trSub = document.createElement('tr');
            trSub.style.backgroundColor = '#f1f5f9';
            trSub.innerHTML = `
                <td colspan="2" style="text-align:right; font-weight:700; color:#475569;">Subtotal ${suc}:</td>
                <td style="font-weight:bold; color:#1d4ed8;">Q ${sumSucC.toFixed(2)}</td>
                <td style="font-weight:bold; color:#047857;">Q ${sumSucF.toFixed(2)}</td>
                <td style="font-weight:bold;" class="${Math.abs(diffSuc) > 0.01 ? 'has-diff' : ''}">Q ${diffSuc.toFixed(2)}</td>
            `;
            tbody.appendChild(trSub);
            
            const trEspacio = document.createElement('tr');
            trEspacio.innerHTML = `<td colspan="5" style="height:15px; border-bottom:none;"></td>`;
            tbody.appendChild(trEspacio);
        });

        const diffGral = totalGralCierre - totalGralFisico;
        tfoot.innerHTML = `
            <tr class="total-row" style="background-color: #e2e8f0;">
                <td colspan="2" style="text-align:right; font-weight:800; color:#0f172a;">TOTAL GENERAL DEL MES:</td>
                <td style="font-weight:bold; color:#1e3a8a;">Q ${totalGralCierre.toFixed(2)}</td>
                <td style="font-weight:bold; color:#064e3b;">Q ${totalGralFisico.toFixed(2)}</td>
                <td style="font-weight:bold;" class="${Math.abs(diffGral) > 0.01 ? 'has-diff' : ''}">Q ${diffGral.toFixed(2)}</td>
            </tr>
        `;
    }

    // Funcionalidad de Exportación Inteligente de Resumen a Excel
    document.getElementById('btnExportarResumenExcel')?.addEventListener('click', () => {
        if(typeof XLSX === 'undefined') { Swal.fire('Error', 'Librería Excel no lista.', 'error'); return; }
        
        const mesAnio = document.getElementById('filtroMesResumen')?.value; 
        const sucursalFiltro = document.getElementById('filtroSucursalResumen')?.value || 'TODAS';
        
        if (!mesAnio) return Swal.fire('Atención', 'Seleccione un mes para exportar.', 'warning');

        const historial = JSON.parse(localStorage.getItem('historialCierresEstuconta')) || [];
        
        const datosFiltrados = historial.filter(c => {
            const mesCierre = c.fechaCierre.substring(0, 7); 
            let pasa = mesCierre === mesAnio;
            if (sucursalFiltro !== 'TODAS' && c.sucursal !== sucursalFiltro) pasa = false;
            return pasa;
        });

        if (datosFiltrados.length === 0) return Swal.fire('Atención', 'No hay datos para exportar en este mes.', 'warning');

        const resumen = {};
        datosFiltrados.forEach(cierre => {
            const suc = cierre.sucursal;
            if (!resumen[suc]) resumen[suc] = {};

            cierre.detalles.forEach(d => {
                const mC = parseFloat(d.montoCierre) || 0;
                const mF = parseFloat(d.montoFisico) || 0;
                if (mC > 0 || mF > 0) {
                    const forma = d.formaPago;
                    if (!resumen[suc][forma]) resumen[suc][forma] = { c: 0, f: 0 };
                    resumen[suc][forma].c += mC;
                    resumen[suc][forma].f += mF;
                }
            });
        });

        const rows = [
            ["RESUMEN MENSUAL CONTABLE - GRUPO DENT"],
            [],
            ["Mes/Año:", mesAnio, "Sucursal:", sucursalFiltro],
            [],
            ["Sucursal", "Forma de Pago", "Suma Total Sistema (Q)", "Suma Total Físico (Q)", "Diferencia Mensual (Q)"]
        ];

        let totalGralC = 0, totalGralF = 0;

        Object.keys(resumen).sort().forEach(suc => {
            let subC = 0, subF = 0;
            Object.keys(resumen[suc]).sort().forEach((forma, idx) => {
                const c = resumen[suc][forma].c;
                const f = resumen[suc][forma].f;
                const diff = c - f;
                subC += c; subF += f;
                rows.push([idx === 0 ? suc : "", forma, c, f, diff]);
            });
            totalGralC += subC; totalGralF += subF;
            rows.push(["", `Subtotal ${suc}:`, subC, subF, subC - subF]);
            rows.push([]); // Fila vacía para separar sucursales y darle formato premium al Excel
        });

        rows.push(["", "TOTAL GENERAL:", totalGralC, totalGralF, totalGralC - totalGralF]);

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, "Cuadre Mensual");
        XLSX.writeFile(wb, `Cuadre_Contable_${mesAnio}.xlsx`);
        registrarAuditoria("IMPRESIÓN", `Exportó a Excel el Resumen Contable Mensual de ${mesAnio}`);
    });

});