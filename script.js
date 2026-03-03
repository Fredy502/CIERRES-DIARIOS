document.addEventListener('DOMContentLoaded', () => {

    // --- VARIABLES GLOBALES PARA PAGINACIÓN Y EDICIÓN ---
    let paginaActual = 1;
    const registrosPorPagina = 10;
    window.indiceEdicion = -1; // -1 significa que estamos creando uno nuevo
    const formasPago = [
        "EFECTIVO", "CHEQUE", "TRANSFERENCIA", "DEPÓSITOS", 
        "POS BAC", "COMPRA CLICK", "POS MÓVIL BAC", "POS VISA", 
        "VISALINK", "CRÉDITOS EMPRESAS", "CXC NÓMINA", "GIFTCARD"
    ];

    // --- MAPEO CONSOLIDADO: Sucursal -> Usuario -> Prefijo ---
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

// --- MAPEO DE SUCURSALES PARA FILTROS ---
    const mapaSucursales = {
        "CHIQUIMULA": "1", "SAN NICOLAS 1": "2", "SIXTINO": "3",
        "FRUTAL": "4", "METRONORTE": "5", "NARANJO": "6",
        "SAN NICOLAS 2": "7", "PERI ROOSEVELT": "8"
    };

    function actualizarUsuariosFiltro() {
        const filtroSuc = document.getElementById('filtroSucursal');
        const filtroUsu = document.getElementById('filtroUsuario');
        if(!filtroSuc || !filtroUsu) return;

        const sucNombre = filtroSuc.value;
        filtroUsu.innerHTML = '<option value="">Todos</option>'; // Limpiar opciones

        if (sucNombre !== "" && mapaSucursales[sucNombre]) {
            const idSuc = mapaSucursales[sucNombre];
            const usuarios = Object.keys(datosUsuarios[idSuc] || {});
            usuarios.forEach(usuario => {
                const opcion = document.createElement('option');
                opcion.value = usuario;
                opcion.textContent = usuario;
                filtroUsu.appendChild(opcion);
            });
        }
    }

    // Escuchar cambios en el filtro de sucursal
    document.getElementById('filtroSucursal')?.addEventListener('change', actualizarUsuariosFiltro);

    // --- SELECTORES UI ---
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const sucursalSelect = document.getElementById('sucursalSelect');
    const turnoSelect = document.getElementById('turnoSelect');
    const fechaInput = document.getElementById('fechaInput');
    const tablaPagosBody = document.querySelector('#tablaPagos tbody');
    const resumenContainer = document.getElementById('resumenConsolidadoContainer');
    const btnAddFila = document.getElementById('addFilaBtn');
    let chartInstance = null;

    // --- FUNCIONES DE PREFIJOS Y USUARIOS ---
    function obtenerPrefijo() {
        const idSucursal = sucursalSelect.value;
        const usuario = turnoSelect.value;
        if (!usuario || !datosUsuarios[idSucursal]) return "";
        return datosUsuarios[idSucursal][usuario] || "";
    }

    function actualizarCorrelativo() {
        const prefijo = obtenerPrefijo();
        if (!prefijo) return;
        
        const correlativos = JSON.parse(localStorage.getItem('correlativosEstuconta')) || {};
        const numeroActual = correlativos[prefijo] || 1; 

        // Inyectar el prefijo fijo en los SPANS visuales
        document.getElementById('prefixInicio').textContent = prefijo;
        document.getElementById('prefixFinal').textContent = prefijo;

        // Limpiar/Setear los inputs numéricos si NO estamos editando
        if (window.indiceEdicion === -1) {
            document.getElementById('reciboInicioNum').value = numeroActual;
            document.getElementById('reciboFinalNum').value = ""; 
        }
    }

    function actualizarUsuarios() {
        const idSucursal = sucursalSelect.value;
        const usuarios = Object.keys(datosUsuarios[idSucursal] || {});
        
        turnoSelect.innerHTML = '';
        usuarios.forEach(usuario => {
            const opcion = document.createElement('option');
            opcion.value = usuario;
            opcion.textContent = usuario;
            turnoSelect.appendChild(opcion);
        });

        actualizarCorrelativo();
    }

    // --- INICIALIZACIÓN ---
    const hoy = new Date().toISOString().split('T')[0];
    fechaInput.value = hoy;
    
    actualizarUsuarios();
    cargarDatosDiaActual();
    cargarHistorialBD();

    // --- EVENTOS SELECTORES ---
    sucursalSelect.addEventListener('change', actualizarUsuarios);
    turnoSelect.addEventListener('change', actualizarCorrelativo);

    const btnActualizar = document.getElementById('btnActualizarHistorial');
    if(btnActualizar) btnActualizar.addEventListener('click', cargarHistorialBD);

    // --- NAVEGACIÓN DE PESTAÑAS ---
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            tabContents.forEach(tab => tab.classList.add('hidden'));
            item.classList.add('active');
            const tabId = item.getAttribute('data-tab');
            document.getElementById(tabId).classList.remove('hidden');
        });
    });

    // --- LÓGICA DE TABLA Y CÁLCULOS ---
    function crearFilaPago(data = null) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="text-align: center;"><button class="btn-del" title="Eliminar"><i class="fas fa-trash-alt"></i></button></td>
            <td><select class="table-select">${formasPago.map(f => `<option ${data?.forma === f ? 'selected' : ''}>${f}</option>`).join('')}</select></td>
            <td><input type="number" class="table-input m-cierre" value="${data?.montoCierre || ''}" step="0.01" placeholder="0.00"></td>
            <td><input type="number" class="table-input m-fisico" value="${data?.montoFisico || ''}" step="0.01" placeholder="0.00"></td>
            <td><input type="text" class="table-input m-doc" value="${data?.noDoc || ''}" placeholder="# Ref."></td>
            <td><input type="date" class="table-input m-fecha" value="${data?.fechaDoc || ''}"></td>
            <td class="m-diff" style="text-align: right; padding-right: 15px;">0.00</td>
        `;

        row.querySelector('.btn-del').onclick = () => { row.remove(); calcularTotales(); };
        row.querySelectorAll('input, select').forEach(el => el.addEventListener('input', calcularTotales));
        
        tablaPagosBody.appendChild(row);
        calcularTotales();
    }

    function calcularTotales() {
        let tC = 0, tF = 0;
        document.querySelectorAll('#tablaPagos tbody tr').forEach(row => {
            const c = parseFloat(row.querySelector('.m-cierre').value) || 0;
            const f = parseFloat(row.querySelector('.m-fisico').value) || 0;
            const d = c - f;
            
            const cellDiff = row.querySelector('.m-diff');
            cellDiff.textContent = d.toFixed(2);
            
            if(Math.abs(d) > 0.01) cellDiff.classList.add('has-diff');
            else cellDiff.classList.remove('has-diff');
            
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

        resumenContainer.innerHTML = '';
        const labels = [], cData = [], fData = [];

        Object.keys(agrupar).forEach(f => {
            if(agrupar[f].c === 0 && agrupar[f].f === 0) return;
            const d = agrupar[f].c - agrupar[f].f;
            labels.push(f); cData.push(agrupar[f].c); fData.push(agrupar[f].f);

            // Determinar iconos y colores según estado
            let iconoEstado = Math.abs(d) < 0.01 ? '<i class="fas fa-check-circle" style="color: #10b981;"></i>' : '<i class="fas fa-exclamation-circle has-diff"></i>';
            let msgDiferencia = Math.abs(d) < 0.01 ? 'Cuadrado' : (d > 0 ? `Faltan Q${Math.abs(d).toFixed(2)}` : `Sobran Q${Math.abs(d).toFixed(2)}`);
            let colorBarraFisico = Math.abs(d) < 0.01 ? '#10b981' : (d > 0 ? '#ef4444' : '#f59e0b'); // Verde, Rojo o Naranja

            resumenContainer.innerHTML += `
                <div class="summary-item" style="padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); transition: all 0.3s ease;">
                    <div class="summary-info" style="font-size: 0.95rem; margin-bottom: 6px;">
                        <span style="font-weight: 700; color: #1e293b;"><i class="fas fa-money-check-alt" style="color:#94a3b8; margin-right:5px;"></i> ${f}</span>
                        <span style="display: flex; align-items: center; gap: 6px; font-weight: 600; font-size: 0.85rem;" class="${Math.abs(d) > 0.01 ? 'has-diff' : ''}">
                            ${msgDiferencia} ${iconoEstado}
                        </span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: #64748b; margin-bottom: 6px; font-weight: 500;">
                        <span>Sistema: Q${agrupar[f].c.toFixed(2)}</span>
                        <span>Físico: Q${agrupar[f].f.toFixed(2)}</span>
                    </div>
                    <div class="summary-bar-container" style="height: 10px; border-radius: 5px; background: #e2e8f0; overflow: hidden; position: relative;">
                        <div style="width: 100%; height: 100%; background: rgba(59, 130, 246, 0.15); position: absolute;"></div>
                        <div style="width: ${Math.min((agrupar[f].f / (agrupar[f].c || 1) * 100), 100)}%; height: 100%; background: ${colorBarraFisico}; position: absolute; border-radius: 5px; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);"></div>
                    </div>
                </div>
            `;
        });
        renderChart(labels, cData, fData);
    }

    function renderChart(labels, cData, fData) {
        if (typeof Chart === 'undefined') return;
        const canvas = document.getElementById('resumenGrafico');
        if(!canvas) return;
        const ctx = canvas.getContext('2d');
        if(chartInstance) chartInstance.destroy();

        // Configuración Global de la Fuente
        Chart.defaults.font.family = "'Segoe UI', system-ui, sans-serif";
        Chart.defaults.color = '#64748b';

        // Crear Degradados (Gradients) para barras más atractivas
        const gradientCierre = ctx.createLinearGradient(0, 0, 0, 400);
        gradientCierre.addColorStop(0, 'rgba(59, 130, 246, 0.9)'); // Azul primario
        gradientCierre.addColorStop(1, 'rgba(59, 130, 246, 0.3)');

        const gradientFisico = ctx.createLinearGradient(0, 0, 0, 400);
        gradientFisico.addColorStop(0, 'rgba(16, 185, 129, 0.9)'); // Verde success
        gradientFisico.addColorStop(1, 'rgba(16, 185, 129, 0.3)');

        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { 
                        label: 'Reporte Sistema', 
                        data: cData, 
                        backgroundColor: gradientCierre,
                        hoverBackgroundColor: '#2563eb',
                        borderColor: '#3b82f6',
                        borderWidth: { top: 2, right: 2, left: 2, bottom: 0 },
                        borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 },
                        barPercentage: 0.65,
                        categoryPercentage: 0.8
                    },
                    { 
                        label: 'Ingreso Físico', 
                        data: fData, 
                        backgroundColor: gradientFisico,
                        hoverBackgroundColor: '#059669',
                        borderColor: '#10b981',
                        borderWidth: { top: 2, right: 2, left: 2, bottom: 0 },
                        borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 },
                        barPercentage: 0.65,
                        categoryPercentage: 0.8
                    }
                ]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                interaction: {
                    mode: 'index', // Activa el hover en ambas barras a la vez
                    intersect: false,
                },
                animation: {
                    duration: 1200,
                    easing: 'easeOutQuart' // Animación suave
                },
                plugins: { 
                    legend: { 
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: { weight: 'bold', size: 12 },
                            color: '#1e293b'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)', // Fondo oscuro elegante
                        titleColor: '#f8fafc',
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 13 },
                        bodySpacing: 8,
                        padding: 15,
                        cornerRadius: 10,
                        usePointStyle: true,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) {
                                    label += 'Q ' + context.parsed.y.toLocaleString('es-GT', {minimumFractionDigits: 2});
                                }
                                return label;
                            },
                            afterBody: function(tooltipItems) {
                                // Muestra el cálculo de diferencia directo en el cuadro
                                if (tooltipItems.length === 2) {
                                    const cierre = tooltipItems[0].parsed.y;
                                    const fisico = tooltipItems[1].parsed.y;
                                    const dif = cierre - fisico;
                                    
                                    if (Math.abs(dif) < 0.01) return '\n✅ ESTADO: Cuadrado Exacto';
                                    
                                    const prefijo = dif > 0 ? '❌ FALTANTE: ' : '⚠️ SOBRANTE: ';
                                    return '\n' + prefijo + 'Q ' + Math.abs(dif).toLocaleString('es-GT', {minimumFractionDigits: 2});
                                }
                                return '';
                            }
                        }
                    }
                }, 
                scales: { 
                    x: {
                        grid: { display: false, drawBorder: false },
                        ticks: { font: { weight: '600', size: 11 }, color: '#475569' }
                    },
                    y: { 
                        beginAtZero: true,
                        border: { display: false },
                        grid: { 
                            color: '#e2e8f0', 
                            borderDash: [6, 6], // Líneas de fondo punteadas (más limpio)
                            drawBorder: false
                        },
                        ticks: {
                            font: { size: 11 },
                            color: '#64748b',
                            callback: function(value) {
                                return 'Q ' + value.toLocaleString('es-GT');
                            }
                        }
                    } 
                } 
            }
        });
    }

    function cargarDatosDiaActual() {
        tablaPagosBody.innerHTML = '';
        for(let i=0; i<3; i++) crearFilaPago();
    }

    // --- VALIDACIÓN DE FORMULARIO ---
    function validarFormulario() {
        const turno = turnoSelect.value;
        const fechaRecibido = document.getElementById('fechaRecibido').value;
        const prefijo = obtenerPrefijo();
        const inicioNum = parseInt(document.getElementById('reciboInicioNum').value, 10);
        const finalNum = parseInt(document.getElementById('reciboFinalNum').value, 10);

        if (!turno) { alert("⚠️ Seleccione un Usuario / Turno."); return false; }
        if (!fechaRecibido) { alert("⚠️ Ingrese la Fecha de Recibido."); return false; }
        
        if (isNaN(inicioNum) || inicioNum < 1) { alert("⚠️ Ingrese un número válido para el Recibo de Inicio."); return false; }
        if (isNaN(finalNum) || finalNum < inicioNum) { alert("⚠️ El Recibo Final debe ser un número mayor o igual al inicial."); return false; }

        const historial = JSON.parse(localStorage.getItem('historialCierres')) || [];

        // 1. Validación de Traslapes de Correlativos
        for (let i = 0; i < historial.length; i++) {
            if (window.indiceEdicion !== -1 && i === window.indiceEdicion) continue; 
            const cierre = historial[i];
            
            if (cierre.reciboInicio && cierre.reciboInicio.startsWith(prefijo)) {
                const savedInicio = parseInt(cierre.reciboInicio.replace(prefijo, ''), 10);
                const savedFinal = parseInt(cierre.reciboFinal.replace(prefijo, ''), 10);
                
                if ((inicioNum >= savedInicio && inicioNum <= savedFinal) || 
                    (finalNum >= savedInicio && finalNum <= savedFinal) ||
                    (inicioNum <= savedInicio && finalNum >= savedFinal)) {
                    alert(`⚠️ ERROR DE CORRELATIVO:\nEl rango ingresado (${prefijo}${inicioNum} al ${prefijo}${finalNum}) interfiere con recibos ya guardados en el sistema (${cierre.reciboInicio} al ${cierre.reciboFinal} de la fecha ${cierre.fecha}).\n\nVerifique sus números.`);
                    return false;
                }
            }
        }

        // --- 2. NUEVA VALIDACIÓN: DOCUMENTOS DUPLICADOS ---
        const filasDoc = document.querySelectorAll('#tablaPagos tbody tr');
        let documentosActuales = []; // Para revisar que no dupliquen en la misma pantalla
        
        for (let row of filasDoc) {
            const docInput = row.querySelector('.m-doc').value.trim();
            
            if (docInput !== "") {
                // A) Validar que no esté repetido en el formulario que se está llenando actualmente
                if (documentosActuales.includes(docInput)) {
                    alert(`⚠️ ERROR: El documento No. "${docInput}" está repetido en la tabla actual. Revise sus datos antes de guardar.`);
                    return false;
                }
                documentosActuales.push(docInput);

                // B) Validar que no exista ya en el historial (Base de Datos)
                for (let i = 0; i < historial.length; i++) {
                    if (window.indiceEdicion !== -1 && i === window.indiceEdicion) continue; // Ignorar si estamos editando este mismo cierre
                    
                    const cierreBD = historial[i];
                    if (cierreBD.detalles) {
                        for (let det of cierreBD.detalles) {
                            if (det.documento && det.documento.trim() === docInput) {
                                alert(`⚠️ DOCUMENTO DUPLICADO:\n\nEl documento No. ${docInput} ya fue ingresado previamente.\n\n📌 DETALLES DEL REGISTRO ORIGINAL:\n- Fecha: ${cierreBD.fecha}\n- Sucursal: ${cierreBD.sucursal}\n- Usuario: ${cierreBD.usuario}\n- Forma de Pago: ${det.forma}`);
                                return false; // Bloquear el guardado de este formulario
                            }
                        }
                    }
                }
            }
        }

        const totalCierre = parseFloat(document.getElementById('totalCierre').textContent);
        const totalFisico = parseFloat(document.getElementById('totalFisico').textContent);
        if (totalCierre === 0 && totalFisico === 0) { alert("⚠️ Ingrese al menos un monto en la tabla de documentación."); return false; }

        return true;
    }

    // --- GUARDAR CIERRE ---
    const btnGuardarCierre = document.getElementById('btnGuardarCierre');
    if(btnGuardarCierre) {
        btnGuardarCierre.addEventListener('click', () => {
            if(validarFormulario()) {
                const detallesDocumentacion = [];
                document.querySelectorAll('#tablaPagos tbody tr').forEach(row => {
                    const forma = row.querySelector('select').value;
                    const c = row.querySelector('.m-cierre').value || "0";
                    const f = row.querySelector('.m-fisico').value || "0";
                    const doc = row.querySelector('.m-doc').value || "";
                    const fechaDoc = row.querySelector('.m-fecha').value || "";
                    const diff = row.querySelector('.m-diff').textContent;
                    
                    if (parseFloat(c) > 0 || parseFloat(f) > 0) {
                        detallesDocumentacion.push({ forma, cierre: c, fisico: f, documento: doc, fechaDoc, diferencia: diff });
                    }
                });

                const prefijoActual = obtenerPrefijo();
                const nuevoCierre = {
                    fecha: fechaInput.value,
                    fechaRecibido: document.getElementById('fechaRecibido').value,
                    sucursal: sucursalSelect.options[sucursalSelect.selectedIndex].text,
                    usuario: turnoSelect.value,
                    reciboInicio: `${prefijoActual}${document.getElementById('reciboInicioNum').value}`,
                    reciboFinal: `${prefijoActual}${document.getElementById('reciboFinalNum').value}`,
                    notas: document.getElementById('notas').value,
                    cierre: document.getElementById('totalCierre').textContent,
                    fisico: document.getElementById('totalFisico').textContent,
                    diferencia: document.getElementById('totalDiferencia').textContent,
                    detalles: detallesDocumentacion 
                };

                const historial = JSON.parse(localStorage.getItem('historialCierres')) || [];
                
                if (window.indiceEdicion !== -1) {
                    historial[window.indiceEdicion] = nuevoCierre;
                    window.indiceEdicion = -1;
                    btnGuardarCierre.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> GUARDAR CIERRE DEL DÍA';
                    btnGuardarCierre.classList.replace('btn-rojo', 'btn-azul');
                } else {
                    historial.push(nuevoCierre);
                }
                
                localStorage.setItem('historialCierres', JSON.stringify(historial));

                // Actualizar el correlativo para el siguiente
                const correlativos = JSON.parse(localStorage.getItem('correlativosEstuconta')) || {};
                correlativos[prefijoActual] = parseInt(document.getElementById('reciboFinalNum').value, 10) + 1;
                localStorage.setItem('correlativosEstuconta', JSON.stringify(correlativos));

                alert('✅ Cierre guardado con éxito.');
                cargarHistorialBD(); 
                
                // Limpiar formulario básico
                document.getElementById('reciboFinalNum').value = "";
                document.getElementById('notas').value = "";
                cargarDatosDiaActual();
                actualizarCorrelativo(); 
            }
        });
    }

    // --- IMPRIMIR PDF DESDE CAPTURA ---
    const btnImprimirPdf = document.getElementById('btnImprimirPdf');
    if(btnImprimirPdf) {
        btnImprimirPdf.addEventListener('click', async () => {
            if(!validarFormulario()) return; 
            if (!window.jspdf) { alert("La librería de PDF está cargando..."); return; }
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');
            
            doc.setFontSize(16); doc.setTextColor(30, 58, 138); doc.setFont('helvetica', 'bold');
            doc.text("ESTUCONTA - REPORTE DE CIERRE DIARIO", 15, 20);

            doc.setFontSize(10); doc.setTextColor(100); doc.setFont('helvetica', 'normal');
            doc.text(`Fecha Impresión: ${new Date().toLocaleString()}`, 130, 15);
            doc.text(`Sucursal: ${sucursalSelect.selectedOptions[0].text}`, 15, 30);
            doc.text(`Usuario: ${turnoSelect.value}`, 15, 36);
            doc.text(`Fecha del Cierre: ${fechaInput.value}`, 15, 42);
            doc.text(`Correlativo: Del ${obtenerPrefijo()}${document.getElementById('reciboInicioNum').value} al ${obtenerPrefijo()}${document.getElementById('reciboFinalNum').value}`, 15, 48);

            doc.setDrawColor(200); doc.line(15, 54, 195, 54);

            let yPos = 61;
            doc.setFont('helvetica', 'bold');
            doc.text("FORMA DE PAGO", 15, yPos); doc.text("CIERRE", 80, yPos); doc.text("FÍSICO", 120, yPos); doc.text("DIFERENCIA", 160, yPos);
            
            yPos += 8; doc.setFont('helvetica', 'normal');

            document.querySelectorAll('#tablaPagos tbody tr').forEach(row => {
                const forma = row.querySelector('select').value;
                const c = row.querySelector('.m-cierre').value || "0.00";
                const f = row.querySelector('.m-fisico').value || "0.00";
                const d = row.querySelector('.m-diff').textContent;
                if (parseFloat(c) > 0 || parseFloat(f) > 0) {
                    doc.text(forma, 15, yPos); doc.text(`Q ${c}`, 80, yPos); doc.text(`Q ${f}`, 120, yPos); doc.text(`Q ${d}`, 160, yPos);
                    yPos += 7;
                }
            });

            yPos += 5; doc.line(15, yPos, 195, yPos); yPos += 8; doc.setFont('helvetica', 'bold');
            doc.text("TOTALES:", 15, yPos); doc.text(`Q ${document.getElementById('totalCierre').textContent}`, 80, yPos); doc.text(`Q ${document.getElementById('totalFisico').textContent}`, 120, yPos); doc.text(`Q ${document.getElementById('totalDiferencia').textContent}`, 160, yPos);

            yPos += 30; doc.line(30, yPos, 80, yPos); doc.line(120, yPos, 170, yPos); doc.setFontSize(9);
            doc.text("Firma Responsable", 40, yPos + 5); doc.text("Revisión Contabilidad", 130, yPos + 5);

            doc.save(`Cierre_${sucursalSelect.options[sucursalSelect.selectedIndex].text}_${fechaInput.value}.pdf`);
        });
    }

    // --- CARGAR HISTORIAL ---
    function cargarHistorialBD() {
        const tbody = document.querySelector('#tablaHistorial tbody');
        if (!tbody) return;
        
        const historial = JSON.parse(localStorage.getItem('historialCierres')) || [];
        
        // Obtener valores de todos los filtros
        const filtroSuc = document.getElementById('filtroSucursal')?.value || "";
        const filtroFec = document.getElementById('filtroFecha')?.value || "";
        const filtroUsu = document.getElementById('filtroUsuario')?.value || "";
        const filtroPago = document.getElementById('filtroFormaPago')?.value || "";

        let datosFiltrados = historial.map((item, index) => ({ ...item, indexOriginal: index }));
        
        // Aplicar filtros a la tabla en pantalla
        if (filtroSuc !== "") datosFiltrados = datosFiltrados.filter(item => item.sucursal === filtroSuc);
        if (filtroFec !== "") datosFiltrados = datosFiltrados.filter(item => item.fecha === filtroFec);
        if (filtroUsu !== "") datosFiltrados = datosFiltrados.filter(item => item.usuario === filtroUsu);
        if (filtroPago !== "") datosFiltrados = datosFiltrados.filter(item => {
            return item.detalles && item.detalles.some(det => det.forma === filtroPago);
        });

        const totalPaginas = Math.ceil(datosFiltrados.length / registrosPorPagina) || 1;
        if (paginaActual > totalPaginas) paginaActual = totalPaginas;

        const inicio = (paginaActual - 1) * registrosPorPagina;
        const datosPaginados = datosFiltrados.slice(inicio, inicio + registrosPorPagina);

        const infoPagina = document.getElementById('infoPagina');
        if(infoPagina) infoPagina.textContent = `Página ${paginaActual} de ${totalPaginas}`;

        if (datosFiltrados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No hay datos que coincidan con la búsqueda...</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        datosPaginados.forEach((item) => {
            const idx = item.indexOriginal;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.fechaRecibido || '-'}</td>
                <td>${item.fecha}</td>
                <td>${item.sucursal}</td>
                <td>${item.usuario}</td>
                <td>Q ${item.cierre}</td>
                <td>Q ${item.fisico}</td>
                <td class="${Math.abs(parseFloat(item.diferencia)) > 0.01 ? 'has-diff' : ''}">Q ${item.diferencia}</td>
                <td>
                    <div style="display: flex; gap: 5px;">
                        <button class="btn-view" onclick="abrirDetalleCierre(${idx})" title="Ver Detalles"><i class="fas fa-eye"></i></button>
                        <button class="btn-view" style="color:#2563eb; border-color:#bfdbfe; background:#dbeafe" onclick="editarFilaHistorial(${idx})" title="Editar Registro"><i class="fas fa-edit"></i></button>
                        <button class="btn-view" style="color:#b91c1c; border-color:#fca5a5; background:#fee2e2" onclick="descargarFilaPDF(${idx})" title="Descargar PDF"><i class="fas fa-file-pdf"></i></button>
                        <button class="btn-view" style="color:#047857; border-color:#6ee7b7; background:#d1fae5" onclick="descargarFilaExcel(${idx})" title="Descargar Excel Individual"><i class="fas fa-file-excel"></i></button>
                        <button class="btn-view" style="color:#ef4444; border-color:#fca5a5; background:#fef2f2" onclick="borrarFilaHistorial(${idx})" title="Eliminar Registro"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // --- FUNCIONES DEL MODAL DE DETALLES ---
    window.abrirDetalleCierre = function(index) {
        const historial = JSON.parse(localStorage.getItem('historialCierres')) || [];
        const item = historial[index];
        if(!item) return;

        const modalBody = document.getElementById('modalDetallesBody');
        let html = `
            <div class="modal-grid-info">
                <div><span>Sucursal:</span> <strong>${item.sucursal}</strong></div>
                <div><span>Usuario:</span> <strong>${item.usuario}</strong></div>
                <div><span>Fecha de Cierre:</span> <strong>${item.fecha}</strong></div>
                <div><span>Fecha Recibido:</span> <strong>${item.fechaRecibido || '-'}</strong></div>
                <div><span>Recibo Inicial:</span> <strong>${item.reciboInicio || '-'}</strong></div>
                <div><span>Recibo Final:</span> <strong>${item.reciboFinal || '-'}</strong></div>
            </div>
            <h3 style="font-size: 1rem; color: #1e293b; margin-bottom: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">Detalle de Documentación</h3>
            <div class="table-responsive">
                <table class="modern-table">
                    <thead><tr><th>Forma de Pago</th><th>No. Doc.</th><th>Fecha Doc.</th><th>Monto Cierre</th><th>Monto Físico</th><th>Diferencia</th></tr></thead>
                    <tbody>
        `;
        (item.detalles || []).forEach(det => {
            html += `<tr><td><strong>${det.forma}</strong></td><td>${det.documento || '-'}</td><td>${det.fechaDoc || '-'}</td><td>Q ${det.cierre}</td><td>Q ${det.fisico}</td><td class="${Math.abs(parseFloat(det.diferencia)) > 0.01 ? 'has-diff' : ''}">Q ${det.diferencia}</td></tr>`;
        });
        html += `</tbody></table></div>${item.notas ? `<div style="margin-top:15px; background:#fffbeb; padding:10px; border-left:4px solid #f59e0b; border-radius:4px; font-size:0.9rem;"><strong>Notas:</strong> ${item.notas}</div>` : ''}`;
        
        modalBody.innerHTML = html;
        document.getElementById('modalDetalles').classList.remove('hidden');
    };

    const closeModalBtn = document.querySelector('.close-modal');
    if(closeModalBtn) closeModalBtn.addEventListener('click', () => document.getElementById('modalDetalles').classList.add('hidden'));
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('modalDetalles');
        if(e.target === modal) modal.classList.add('hidden');
    });

    // --- EXPORTAR EXCEL GLOBAL ---
    const btnExportarExcel = document.getElementById('btnExportarExcel');
    if (btnExportarExcel) {
        btnExportarExcel.addEventListener('click', () => {
            if (!validarFormulario()) return;
            const datosExcel = [["Forma de Pago", "Monto Cierre (Q)", "Monto Físico (Q)", "Documento", "Fecha Doc.", "Diferencia (Q)"]];
            
            document.querySelectorAll('#tablaPagos tbody tr').forEach(row => {
                const forma = row.querySelector('select').value;
                const cierre = row.querySelector('.m-cierre').value || "0.00";
                const fisico = row.querySelector('.m-fisico').value || "0.00";
                const doc = row.querySelector('.m-doc').value || "";
                const fechaDoc = row.querySelector('.m-fecha').value || "";
                const diff = row.querySelector('.m-diff').textContent;
                
                if (parseFloat(cierre) > 0 || parseFloat(fisico) > 0) datosExcel.push([forma, parseFloat(cierre), parseFloat(fisico), doc, fechaDoc, parseFloat(diff)]);
            });

            datosExcel.push([]); 
            datosExcel.push(["TOTALES", parseFloat(document.getElementById('totalCierre').textContent), parseFloat(document.getElementById('totalFisico').textContent), "", "", parseFloat(document.getElementById('totalDiferencia').textContent)]);

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(datosExcel);
            XLSX.utils.book_append_sheet(wb, ws, "Cierre Diario");
            XLSX.writeFile(wb, `Cierre_${sucursalSelect.options[sucursalSelect.selectedIndex].text}_${fechaInput.value}.xlsx`);
        });
    }

    // --- FUNCIONES DESDE EL HISTORIAL (PDF, EXCEL, ELIMINAR, EDITAR) ---
    window.descargarFilaPDF = function(index) {
        const historial = JSON.parse(localStorage.getItem('historialCierres')) || [];
        const item = historial[index];
        if(!item || !window.jspdf) return;

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        doc.setFontSize(16); doc.setTextColor(30, 58, 138); doc.setFont('helvetica', 'bold');
        doc.text("ESTUCONTA - REPORTE DE CIERRE DIARIO", 15, 20);

        doc.setFontSize(10); doc.setTextColor(100); doc.setFont('helvetica', 'normal');
        doc.text(`Sucursal: ${item.sucursal}`, 15, 30); doc.text(`Usuario: ${item.usuario}`, 15, 36);
        doc.text(`Fecha del Cierre: ${item.fecha}`, 15, 42); doc.text(`Fecha Recibido: ${item.fechaRecibido || '-'}`, 15, 48);
        doc.text(`Correlativo: Del ${item.reciboInicio || '-'} al ${item.reciboFinal || '-'}`, 15, 54);

        doc.setDrawColor(200); doc.line(15, 60, 195, 60);

        let yPos = 67; doc.setFontSize(9); doc.setFont('helvetica', 'bold');
        doc.text("FORMA DE PAGO", 15, yPos); doc.text("NO. DOC", 60, yPos); doc.text("FECHA DOC", 90, yPos); doc.text("CIERRE", 125, yPos); doc.text("FÍSICO", 155, yPos); doc.text("DIFERENCIA", 180, yPos);
        
        yPos += 8; doc.setFont('helvetica', 'normal');

        (item.detalles || []).forEach(det => {
            doc.text(det.forma, 15, yPos); doc.text(det.documento || '-', 60, yPos); doc.text(det.fechaDoc || '-', 90, yPos);
            doc.text(`Q ${det.cierre}`, 125, yPos); doc.text(`Q ${det.fisico}`, 155, yPos); doc.text(`Q ${det.diferencia}`, 180, yPos);
            yPos += 7;
        });

        yPos += 5; doc.line(15, yPos, 195, yPos); yPos += 8; doc.setFont('helvetica', 'bold');
        doc.text("TOTALES:", 15, yPos); doc.text(`Q ${item.cierre}`, 125, yPos); doc.text(`Q ${item.fisico}`, 155, yPos); doc.text(`Q ${item.diferencia}`, 180, yPos);

        if (item.notas) { yPos += 15; doc.setFont('helvetica', 'bold'); doc.text("NOTAS:", 15, yPos); doc.setFont('helvetica', 'normal'); const lineasNotas = doc.splitTextToSize(item.notas, 180); doc.text(lineasNotas, 15, yPos + 6); }
        doc.save(`Cierre_${item.sucursal}_${item.fecha}.pdf`);
    };

    window.descargarFilaExcel = function(index) {
        const historial = JSON.parse(localStorage.getItem('historialCierres')) || [];
        const item = historial[index];
        if(!item || typeof XLSX === 'undefined') return;

        const datosExcel = [
            ["ESTUCONTA - REPORTE DE CIERRE DIARIO"],
            ["Sucursal:", item.sucursal], ["Usuario:", item.usuario], ["Fecha del Cierre:", item.fecha],
            ["Fecha Recibido:", item.fechaRecibido || "-"], ["Correlativo:", `Del ${item.reciboInicio || '-'} al ${item.reciboFinal || '-'}`], [],
            ["Forma de Pago", "Documento", "Fecha Doc.", "Monto Cierre (Q)", "Monto Físico (Q)", "Diferencia (Q)"]
        ];
        
        (item.detalles || []).forEach(det => {
            datosExcel.push([det.forma, det.documento || "", det.fechaDoc || "", parseFloat(det.cierre), parseFloat(det.fisico), parseFloat(det.diferencia)]);
        });

        datosExcel.push([]); datosExcel.push(["TOTALES", "", "", parseFloat(item.cierre), parseFloat(item.fisico), parseFloat(item.diferencia)]);
        if (item.notas) { datosExcel.push([]); datosExcel.push(["NOTAS:", item.notas]); }

        const wb = XLSX.utils.book_new(); const ws = XLSX.utils.aoa_to_sheet(datosExcel);
        XLSX.utils.book_append_sheet(wb, ws, "Cierre Diario"); XLSX.writeFile(wb, `Cierre_${item.sucursal}_${item.fecha}.xlsx`);
    };

    window.borrarFilaHistorial = function(index) {
        const password = prompt("⚠️ Acción protegida. Ingrese la contraseña de administrador para eliminar:");
        if (password === null) return; 
        if (password === "Grupodent_08") {
            if (confirm("¿Está absolutamente seguro de que desea eliminar este cierre? Esta acción no se puede deshacer.")) {
                let historial = JSON.parse(localStorage.getItem('historialCierres')) || [];
                historial.splice(index, 1);
                localStorage.setItem('historialCierres', JSON.stringify(historial));
                cargarHistorialBD();
                alert("✅ Registro eliminado correctamente.");
            }
        } else { alert("❌ Contraseña incorrecta. Operación denegada."); }
    };

    window.editarFilaHistorial = function(index) {
        const password = prompt("⚠️ Acción protegida. Ingrese contraseña para EDITAR:");
        if (password !== "Grupodent_08") { if(password !== null) alert("❌ Contraseña incorrecta."); return; }

        const historial = JSON.parse(localStorage.getItem('historialCierres')) || [];
        const item = historial[index];
        if(!item) return;

        window.indiceEdicion = index; 
        document.querySelector('.nav-item[data-tab="tab-captura"]').click();

        const btnGuardar = document.getElementById('btnGuardarCierre');
        btnGuardar.innerHTML = '<i class="fas fa-save"></i> ACTUALIZAR REGISTRO';
        btnGuardar.classList.replace('btn-azul', 'btn-rojo'); 

        document.getElementById('fechaInput').value = item.fecha;
        document.getElementById('fechaRecibido').value = item.fechaRecibido || '';
        document.getElementById('notas').value = item.notas || '';

        const selectSuc = document.getElementById('sucursalSelect');
        for (let i = 0; i < selectSuc.options.length; i++) {
            if (selectSuc.options[i].text === item.sucursal) selectSuc.selectedIndex = i;
        }
        selectSuc.dispatchEvent(new Event('change')); 
        
        setTimeout(() => { 
            turnoSelect.value = item.usuario; 
            turnoSelect.dispatchEvent(new Event('change'));

            // Separar el prefijo del número guardado para ponerlo en el input
            const prefijoActual = obtenerPrefijo();
            if(item.reciboInicio) document.getElementById('reciboInicioNum').value = item.reciboInicio.replace(prefijoActual, '');
            if(item.reciboFinal) document.getElementById('reciboFinalNum').value = item.reciboFinal.replace(prefijoActual, '');

        }, 150);

        const tablaBody = document.querySelector('#tablaPagos tbody');
        tablaBody.innerHTML = ''; 
        (item.detalles || []).forEach(det => { crearFilaPago({ forma: det.forma, montoCierre: det.cierre, montoFisico: det.fisico, noDoc: det.documento, fechaDoc: det.fechaDoc }); });

        alert("✏️ Modo edición activado. Realice los cambios y presione 'ACTUALIZAR REGISTRO' abajo.");
    };

    // --- FILTROS Y PAGINACIÓN ---
    document.getElementById('btnAplicarFiltros')?.addEventListener('click', () => { paginaActual = 1; cargarHistorialBD(); });
    document.getElementById('btnLimpiarFiltros')?.addEventListener('click', () => {
        document.getElementById('filtroSucursal').value = ""; 
        document.getElementById('filtroFecha').value = "";
        document.getElementById('filtroUsuario').value = "";
        document.getElementById('filtroFormaPago').value = "";
        paginaActual = 1; cargarHistorialBD();
    });
    document.getElementById('btnAnterior')?.addEventListener('click', () => { if(paginaActual > 1) { paginaActual--; cargarHistorialBD(); } });
    document.getElementById('btnSiguiente')?.addEventListener('click', () => { paginaActual++; cargarHistorialBD(); });
// --- EXPORTAR BASE DE DATOS COMPLETA / FILTRADA ---
    const btnExportarDB = document.getElementById('btnExportarDB');
    if (btnExportarDB) {
        btnExportarDB.addEventListener('click', () => {
            if (typeof XLSX === 'undefined') { alert("La librería de Excel está cargando..."); return; }

            const historial = JSON.parse(localStorage.getItem('historialCierres')) || [];
            
            const filtroSuc = document.getElementById('filtroSucursal')?.value || "";
            const filtroFec = document.getElementById('filtroFecha')?.value || "";
            const filtroUsu = document.getElementById('filtroUsuario')?.value || "";
            const filtroPago = document.getElementById('filtroFormaPago')?.value || "";

            // Encabezados en formato plano (Base de Datos Real)
            const datosExcel = [
                ["Fecha Cierre", "Fecha Recibido", "Sucursal", "Usuario", "Recibo Inicio", "Recibo Final", "Forma de Pago", "No. Documento", "Fecha Doc.", "Monto Cierre (Q)", "Monto Físico (Q)", "Diferencia (Q)", "Notas"]
            ];

            historial.forEach(cierre => {
                // Verificar si el registro cumple los filtros principales
                const matchSucursal = filtroSuc === "" || cierre.sucursal === filtroSuc;
                const matchFecha = filtroFec === "" || cierre.fecha === filtroFec;
                const matchUsuario = filtroUsu === "" || cierre.usuario === filtroUsu;

                if (matchSucursal && matchFecha && matchUsuario) {
                    if (cierre.detalles && cierre.detalles.length > 0) {
                        cierre.detalles.forEach(det => {
                            // Verificar si la forma de pago específica cumple el filtro
                            const matchPago = filtroPago === "" || det.forma === filtroPago;
                            
                            if (matchPago) {
                                datosExcel.push([
                                    cierre.fecha || "",
                                    cierre.fechaRecibido || "",
                                    cierre.sucursal || "",
                                    cierre.usuario || "",
                                    cierre.reciboInicio || "",
                                    cierre.reciboFinal || "",
                                    det.forma || "",
                                    det.documento || "",
                                    det.fechaDoc || "",
                                    parseFloat(det.cierre) || 0,
                                    parseFloat(det.fisico) || 0,
                                    parseFloat(det.diferencia) || 0,
                                    cierre.notas || ""
                                ]);
                            }
                        });
                    }
                }
            });

            if (datosExcel.length === 1) {
                alert("⚠️ La Base de Datos está vacía o ningún registro coincide con los filtros aplicados.");
                return;
            }

            // Crear libro y hoja de Excel
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(datosExcel);
            XLSX.utils.book_append_sheet(wb, ws, "Base de Datos");
            
            // Generar nombre de archivo dinámico según lo que se filtró
            let nombreArchivo = "BaseDeDatos_Estuconta";
            if(filtroSuc) nombreArchivo += `_${filtroSuc}`;
            if(filtroPago) nombreArchivo += `_${filtroPago}`;
            if(filtroFec) nombreArchivo += `_${filtroFec}`;
            nombreArchivo += ".xlsx";

            XLSX.writeFile(wb, nombreArchivo);
        });
    }

// --- EXPORTAR BASE DE DATOS COMPLETA A PDF ---
    const btnExportarPDFDB = document.getElementById('btnExportarPDFDB');
    if (btnExportarPDFDB) {
        btnExportarPDFDB.addEventListener('click', () => {
            if (!window.jspdf || !window.jspdf.jsPDF) { alert("La librería de PDF está cargando..."); return; }

            const historial = JSON.parse(localStorage.getItem('historialCierres')) || [];
            
            const filtroSuc = document.getElementById('filtroSucursal')?.value || "";
            const filtroFec = document.getElementById('filtroFecha')?.value || "";
            const filtroUsu = document.getElementById('filtroUsuario')?.value || "";
            const filtroPago = document.getElementById('filtroFormaPago')?.value || "";

            const datosTabla = [];

            historial.forEach(cierre => {
                const matchSucursal = filtroSuc === "" || cierre.sucursal === filtroSuc;
                const matchFecha = filtroFec === "" || cierre.fecha === filtroFec;
                const matchUsuario = filtroUsu === "" || cierre.usuario === filtroUsu;

                if (matchSucursal && matchFecha && matchUsuario) {
                    if (cierre.detalles && cierre.detalles.length > 0) {
                        cierre.detalles.forEach(det => {
                            const matchPago = filtroPago === "" || det.forma === filtroPago;
                            if (matchPago) {
                                datosTabla.push([
                                    cierre.fecha || "",
                                    cierre.sucursal || "",
                                    cierre.usuario || "",
                                    `${cierre.reciboInicio || ''} - ${cierre.reciboFinal || ''}`,
                                    det.forma || "",
                                    det.documento || "",
                                    `Q${parseFloat(det.cierre).toFixed(2)}`,
                                    `Q${parseFloat(det.fisico).toFixed(2)}`,
                                    `Q${parseFloat(det.diferencia).toFixed(2)}`
                                ]);
                            }
                        });
                    }
                }
            });

            if (datosTabla.length === 0) {
                alert("⚠️ No hay datos que coincidan con los filtros aplicados para exportar.");
                return;
            }

            // Generar PDF (Orientación Landscape/Horizontal para que quepan las columnas)
            const doc = new window.jspdf.jsPDF('l', 'mm', 'a4');
            
            doc.setFontSize(14);
            doc.text("Reporte Consolidado de Cierres - Estuconta", 14, 15);
            doc.setFontSize(10);
            let subFiltros = `Filtros -> Sucursal: ${filtroSuc || 'Todas'} | Fecha: ${filtroFec || 'Todas'} | Usuario: ${filtroUsu || 'Todos'} | Pago: ${filtroPago || 'Todos'}`;
            doc.text(subFiltros, 14, 22);

            // Generar Tabla
            doc.autoTable({
                startY: 28,
                head: [["Fecha", "Sucursal", "Usuario", "Recibos", "Forma Pago", "No. Doc", "Cierre", "Físico", "Dif."]],
                body: datosTabla,
                theme: 'striped',
                headStyles: { fillColor: [30, 58, 138] }, // Color Primary (--primary)
                styles: { fontSize: 8 }
            });

            // Nombre dinámico
            let nombreArchivo = "Reporte_DB_Estuconta";
            if(filtroSuc) nombreArchivo += `_${filtroSuc}`;
            if(filtroFec) nombreArchivo += `_${filtroFec}`;
            nombreArchivo += ".pdf";

            doc.save(nombreArchivo);
        });
    }

});