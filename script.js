/**
 * ============================================================================
 * LÓGICA FRONTEND - CAJASAN (script.js) - FIX APLICADO
 * ============================================================================
 */

const API_URL = 'http://localhost:5000/api';
let estadoLocal = { campers: {}, computadores: {} };

async function fetchDatosPython() {
    // Buscamos el elemento en el HTML. Puede que exista o sea 'null'
    const statusElement = document.getElementById('conexion-status');
    
    try {
        const response = await fetch(`${API_URL}/estado`);
        if (response.ok) {
            estadoLocal = await response.json();
            
            // FIX: Solo actualizamos el estado si la etiqueta existe en tu HTML
            if (statusElement) {
                statusElement.innerHTML = '<i class="fa-solid fa-link mr-1"></i> Python Conectado';
                statusElement.className = "flex items-center text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200";
            }
            
            renderDashboard();
            renderSelectsAuditoria();
        } else { 
            throw new Error("Error en servidor"); 
        }
    } catch (error) {
        console.error("Fallo la conexión con Python:", error);
        // FIX: Solo actualizamos el estado si la etiqueta existe
        if (statusElement) {
            statusElement.innerHTML = '<i class="fa-solid fa-link-slash mr-1"></i> Sin Conexión';
            statusElement.className = "flex items-center text-sm font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200";
        }
    }
}

async function registrarCamper(e) {
    e.preventDefault();
    const payload = {
        documento: document.getElementById('camper-doc').value.trim(),
        nombre: document.getElementById('camper-nombre').value.trim()
    };
    try {
        const resp = await fetch(`${API_URL}/campers`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        if(!resp.ok) throw new Error();
        alert(`✅ Camper guardado en campers.json`);
        document.getElementById('camper-doc').value = ''; 
        document.getElementById('camper-nombre').value = '';
        fetchDatosPython(); 
    } catch (error) { alert("❌ Error. Verifique que el documento no exista ya."); }
}

async function registrarPC(e) {
    e.preventDefault();
    const payload = {
        id_pc: document.getElementById('pc-id').value.trim().toUpperCase(),
        fila: document.getElementById('pc-fila').value.trim()
    };
    try {
        const resp = await fetch(`${API_URL}/computadores`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        if(!resp.ok) throw new Error();
        alert(`✅ PC guardado en computadores.json`);
        document.getElementById('pc-id').value = ''; 
        document.getElementById('pc-fila').value = '';
        fetchDatosPython();
    } catch (error) { alert("❌ Error al registrar el PC."); }
}

async function asignarEquipo(e) {
    e.preventDefault();
    const payload = {
        id_pc: document.getElementById('select-pc-disponible').value,
        documento_camper: document.getElementById('select-camper-asignar').value
    };
    if (!payload.id_pc || !payload.documento_camper) return alert("Seleccione un PC y un Camper.");

    await fetch(`${API_URL}/asignar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    alert(`✅ Equipo Asignado exitosamente.`);
    fetchDatosPython();
}

async function liberarEquipo(e) {
    e.preventDefault();
    const usbOk = document.getElementById('check-usb').checked;
    const softOk = document.getElementById('check-soft').checked;
    const hayNovedad = (!usbOk || !softOk);

    const payload = {
        id_pc: document.getElementById('select-pc-uso').value,
        hay_novedad: hayNovedad,
        novedad: hayNovedad ? document.getElementById('txt-novedad').value.trim() : ''
    };

    await fetch(`${API_URL}/liberar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });

    alert(hayNovedad ? `⚠️ PC liberado. Novedad guardada en Historial JSON.` : `✅ PC liberado exitosamente.`);
    
    document.getElementById('check-usb').checked = true; 
    document.getElementById('check-soft').checked = true;
    evaluarNovedad(); 
    fetchDatosPython();
}

function navegar(vistaId) {
    const titulos = {'dashboard': 'Panel General', 'asignar': 'Auditoría', 'reg_camper': 'Registro Camper', 'reg_pc': 'Registro PC'};
    
    // FIX: Verificamos si existe el titulo antes de cambiarlo
    const headerTitle = document.getElementById('header-title');
    if(headerTitle) headerTitle.innerText = titulos[vistaId];
    
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden-view'));
    
    const vistaDestino = document.getElementById(`view-${vistaId}`);
    if(vistaDestino) vistaDestino.classList.remove('hidden-view');
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.className = (btn.dataset.target === vistaId) 
            ? "nav-btn active w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-blue-600 font-bold text-white" 
            : "nav-btn w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white font-medium";
    });
    fetchDatosPython(); 
}

function toggleSubModo(formId, btnId) {
    document.getElementById('form-asignar').classList.add('hidden-view');
    document.getElementById('form-liberar').classList.add('hidden-view');
    document.getElementById(formId).classList.remove('hidden-view');
    document.getElementById('btn-asignar').className = "flex-1 py-2 font-bold rounded-md text-slate-500 hover:text-slate-700";
    document.getElementById('btn-liberar').className = "flex-1 py-2 font-bold rounded-md text-slate-500 hover:text-slate-700";
    document.getElementById(btnId).className = "flex-1 py-2 font-bold rounded-md bg-white shadow text-blue-700";
}

function renderDashboard() {
    const pcs = Object.entries(estadoLocal.computadores);
    
    // FIX: Validaciones para las estadísticas
    const statTotal = document.getElementById('stat-total');
    const statUso = document.getElementById('stat-uso');
    const statNovedad = document.getElementById('stat-novedad');
    const grid = document.getElementById('pc-grid');

    if(statTotal) statTotal.innerText = pcs.length;
    if(statUso) statUso.innerText = pcs.filter(([_, pc]) => pc.en_uso).length;
    if(statNovedad) statNovedad.innerText = pcs.filter(([_, pc]) => pc.estado.includes("Novedad")).length;

    if(grid) {
        grid.innerHTML = '';
        pcs.forEach(([id, pc]) => {
            const tieneNovedad = pc.estado.includes("Novedad");
            let color = tieneNovedad ? 'border-l-rose-500' : (pc.en_uso ? 'border-l-blue-500' : 'border-l-emerald-500');
            let estadoHTML = tieneNovedad ? `<div class="text-rose-600 text-sm mt-2 font-medium"><i class="fa-solid fa-triangle-exclamation"></i> Requiere Soporte</div>` : 
                             pc.en_uso ? `<div class="text-sm mt-2 text-slate-500">Usado por: <span class="font-bold text-blue-700">${estadoLocal.campers[pc.usuario_actual]?.nombre || pc.usuario_actual}</span></div>` : 
                             `<div class="text-emerald-600 text-sm mt-2 font-medium"><i class="fa-solid fa-circle-check"></i> Disponible</div>`;
            grid.innerHTML += `<div class="p-4 rounded-xl border-l-4 shadow-sm bg-white border ${color}">
                                <div class="flex justify-between items-center mb-2"><span class="font-bold text-lg text-slate-700">${id}</span><span class="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">Fila ${pc.fila}</span></div>
                                ${estadoHTML}</div>`;
        });
    }
}

function renderSelectsAuditoria() {
    const disp = document.getElementById('select-pc-disponible');
    const cmp = document.getElementById('select-camper-asignar');
    const uso = document.getElementById('select-pc-uso');
    
    if(!disp || !cmp || !uso) return; // Si no estamos en la pestaña correcta, evitamos el error

    disp.innerHTML = '<option value="">-- Seleccione PC Disponible --</option>';
    Object.entries(estadoLocal.computadores).filter(([_, pc]) => !pc.en_uso && !pc.estado.includes("Novedad")).forEach(([id, pc]) => disp.innerHTML += `<option value="${id}">${id} (Fila ${pc.fila})</option>`);
    
    cmp.innerHTML = '<option value="">-- Seleccione Camper --</option>';
    Object.entries(estadoLocal.campers).forEach(([id, c]) => cmp.innerHTML += `<option value="${id}">${c.nombre} (Doc: ${id})</option>`);
    
    uso.innerHTML = '<option value="">-- Seleccione PC a recibir --</option>';
    Object.entries(estadoLocal.computadores).filter(([_, pc]) => pc.en_uso).forEach(([id, pc]) => uso.innerHTML += `<option value="${id}">${id} - Usado por: ${estadoLocal.campers[pc.usuario_actual]?.nombre}</option>`);
    
    validarSeleccionLiberar();
}

function validarSeleccionLiberar() {
    const sel = document.getElementById('select-pc-uso');
    if(!sel) return;

    const box = document.getElementById('auditoria-box');
    const btn = document.getElementById('btn-submit-liberar');
    
    if (sel.value) { 
        box.classList.remove('opacity-50', 'pointer-events-none'); 
        evaluarNovedad(); 
    } else { 
        box.classList.add('opacity-50', 'pointer-events-none'); 
        btn.disabled = true; 
        btn.className = "w-full font-bold py-3 rounded bg-slate-200 text-slate-400 cursor-not-allowed"; 
        btn.innerText = "Seleccione un PC primero"; 
    }
}

function evaluarNovedad() {
    const sel = document.getElementById('select-pc-uso');
    if (!sel || !sel.value) return;

    const todoOk = document.getElementById('check-usb').checked && document.getElementById('check-soft').checked;
    const box = document.getElementById('box-novedad');
    const txt = document.getElementById('txt-novedad');
    const btn = document.getElementById('btn-submit-liberar');
    
    document.getElementById('label-usb').className = document.getElementById('check-usb').checked ? "text-slate-700" : "text-rose-600 font-bold";
    document.getElementById('label-soft').className = document.getElementById('check-soft').checked ? "text-slate-700" : "text-rose-600 font-bold";

    if (!todoOk) {
        box.classList.remove('hidden-view'); txt.required = true;
        btn.disabled = false; btn.className = "w-full font-bold py-3 rounded bg-rose-600 hover:bg-rose-700 text-white shadow-md"; btn.innerText = "Registrar Daño y Liberar";
    } else {
        box.classList.add('hidden-view'); txt.required = false; txt.value = '';
        btn.disabled = false; btn.className = "w-full font-bold py-3 rounded bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"; btn.innerText = "Liberar PC (Todo OK)";
    }
}

// Iniciar
window.onload = fetchDatosPython;