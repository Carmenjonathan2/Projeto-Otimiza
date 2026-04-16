const API_URL = '/api/tasks';
const API_CONTEXT = '/api/contexto';

// Elementos DOM
const cols = {
    motor: document.getElementById('list-motor'),
    gargalo: document.getElementById('list-gargalo'),
    cofre: document.getElementById('list-cofre')
};

const telemetryContainer = document.getElementById('telemetry-charts');
const timelineContainer = document.getElementById('timeline-container');

const modal = document.getElementById('task-modal');
const modalTitle = document.getElementById('modal-title');
const inputId = document.getElementById('task-id');
const inputTitle = document.getElementById('task-title');
const inputProject = document.getElementById('task-project');
const inputDesc = document.getElementById('task-desc');
const inputCol = document.getElementById('task-column');
const inputTag = document.getElementById('task-tag');
const inputAutonomy = document.getElementById('task-autonomy');
const inputReview = document.getElementById('task-review');

const btnNew = document.getElementById('btn-new-task');
const btnClose = document.getElementById('btn-close-modal');
const btnSave = document.getElementById('btn-save-task');
const btnDelete = document.getElementById('btn-delete-task');
const projectPills = document.querySelectorAll('.pill');

let currentFilter = 'all';
let currentTasks = [];
let memoryFlow = [];
let allCampaigns = [];
let allBookings = [];

// Funções de API
async function fetchTasks() {
    try {
        const res = await fetch(API_CONTEXT);
        const data = await res.json();
        currentTasks = data.tarefas || [];
        memoryFlow = data.memoria_longo_prazo || [];
        allCampaigns = data.campanhas || [];
        allBookings = data.agendamentos || [];
        
        renderTasks();
        renderTimeline();
        renderAppointments();
    } catch (err) {
        console.error("Erro ao puxar contexto mestre", err);
    }
}

async function saveTask(task) {
    const isEdit = !!task.id;
    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit ? `${API_URL}/${task.id}` : API_URL;

    try {
        await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        });
        await fetchTasks();
    } catch (err) {
        console.error("Erro ao salvar tarefa", err);
    }
}

async function deleteTask(id) {
    if(!confirm("Tem certeza que deseja apagar essa ideia/tarefa do painel?")) return;
    
    try {
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        await fetchTasks();
        closeModal();
    } catch (err) {
        console.error("Erro ao deletar", err);
    }
}

// Atualizar a coluna via Drag & Drop
async function updateTaskColumn(taskId, newCol) {
    const task = currentTasks.find(t => t.id === taskId);
    if(task && task.coluna !== newCol) {
        task.coluna = newCol;
        await saveTask(task);
    }
}

// DOM Rendering
function formatDate(isoString) {
    const d = new Date(isoString);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function formatDateTime(isoString) {
    if(!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function renderTelemetry() {
    telemetryContainer.innerHTML = '';
    
    // Agrupar tarefas por projeto e calcular
    const projetos = {};
    
    currentTasks.forEach(t => {
        const p = t.projeto || "Geral";
        if(!projetos[p]) projetos[p] = { total: 0, concluido: 0 };
        
        projetos[p].total++;
        if(t.coluna === 'motor') {
            projetos[p].concluido++;
        }
    });
    
    // Gerar blocos de HTML
    Object.keys(projetos).forEach(projName => {
        const proj = projetos[projName];
        let perc = proj.total === 0 ? 0 : Math.round((proj.concluido / proj.total) * 100);
        
        const div = document.createElement('div');
        div.className = 'project-health';
        div.innerHTML = `
            <div class="ph-header">
                <span class="ph-title">${projName}</span>
                <span class="ph-perc">${perc}% Motor</span>
            </div>
            <div class="ph-bar-bg">
                <div class="ph-bar-fill" style="width: ${perc}%"></div>
            </div>
        `;
        telemetryContainer.appendChild(div);
    });
}

function getProjectColor(projectName) {
    const colors = {
        'Vendas B2B': '#3b82f6',
        'Vet em Casa': '#10b981',
        'Site Hub': '#8b5cf6',
        'Mutirão': '#f59e0b',
        'Fidelização': '#ec4899',
        'Inteligência (GIO)': '#6366f1'
    };
    return colors[projectName] || 'var(--accent)';
}

function createTaskElement(task) {
    const div = document.createElement('div');
    div.className = 'kanban-card';
    div.dataset.id = task.id;
    
    // Aplica borda dourada se semi-automatico
    if (task.autonomia === 'semi') {
        div.classList.add('semi-auto');
    }
    
    let tagHtml = '';
    if (task.tags && task.tags.length > 0) {
        task.tags.forEach(t => {
            if(t) {
                const isAccent = t.includes('Rotina') || t.includes('IA');
                tagHtml += `<span class="tag ${isAccent ? 'tag-accent' : ''}">${t}</span>`;
            }
        });
    }

    const projectColor = getProjectColor(task.projeto);
    const projectBadge = `<span class="project-badge" style="background: ${projectColor}">${task.projeto || 'Geral'}</span>`;

    let reviewHtml = '';
    if (task.proxima_revisao) {
        reviewHtml = `<div class="review-badge">⏰ Revisar em: ${formatDateTime(task.proxima_revisao)}</div>`;
    }

    div.innerHTML = `
        <div class="card-top">
            ${projectBadge}
            <div class="card-tags">${tagHtml}</div>
        </div>
        <h4 class="card-title">${task.titulo}</h4>
        <div class="card-desc">${task.descricao || ''}</div>
        ${reviewHtml}
        <div class="card-meta">
            <span>ID: ${task.id ? task.id.substring(8, 13) : ''}</span>
        </div>
    `;

    div.addEventListener('click', () => openModal(task));

    return div;
}

function renderTimeline() {
    if (!timelineContainer) return;
    timelineContainer.innerHTML = '';
    
    memoryFlow.forEach(mem => {
        const div = document.createElement('div');
        const statusClass = mem.status ? mem.status.toLowerCase() : 'progresso';
        
        let displayStatus = 'Em Progresso';
        if(statusClass === 'concluido') displayStatus = 'Concluído';
        if(statusClass === 'revisar') displayStatus = 'Revisar';

        div.className = `timeline-node border-${statusClass}`;
        
        div.innerHTML = `
            <div class="node-status status-${statusClass}">${displayStatus}</div>
            <div class="node-title">${mem.titulo}</div>
            <div class="node-desc">${mem.descricao || ''}</div>
        `;
        timelineContainer.appendChild(div);
    });
}

function renderAppointments() {
    const body = document.getElementById('appointments-body');
    if (!body) return;
    body.innerHTML = '';

    if (allBookings.length === 0) {
        body.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem; color: #666;">Nenhum agendamento realizado ainda. Tudo pronto para o próximo sábado!</td></tr>';
        return;
    }

    allBookings.forEach(book => {
        const campanha = allCampaigns.find(c => c.id === book.campanhaId);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${book.horario}</td>
            <td>${book.nome}</td>
            <td>${book.petNome}</td>
            <td>${book.telefone}</td>
            <td>${book.email || '-'}</td>
            <td>${campanha ? campanha.condominio : '(Id Removido)'}</td>
        `;
        body.appendChild(tr);
    });
}

function renderTasks() {
    Object.values(cols).forEach(col => col.innerHTML = '');

    const filtered = currentFilter === 'all' 
        ? currentTasks 
        : currentTasks.filter(t => t.projeto === currentFilter);

    filtered.forEach(task => {
        const col = cols[task.coluna];
        if (col) {
            col.appendChild(createTaskElement(task));
        }
    });
    
    renderTelemetry();
}

function initSortable() {
    Object.keys(cols).forEach(key => {
        new Sortable(cols[key], {
            group: 'kanban',
            animation: 150,
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            onEnd: function (evt) {
                const itemEl = evt.item;
                const toList = evt.to;
                const taskId = itemEl.dataset.id;
                const newCol = toList.parentElement.dataset.column;
                updateTaskColumn(taskId, newCol);
            },
        });
    });
}

function openModal(task = null) {
    if (task) {
        modalTitle.innerText = "Editar Tarefa";
        inputId.value = task.id;
        inputTitle.value = task.titulo;
        inputProject.value = task.projeto || '';
        inputDesc.value = task.descricao || '';
        inputCol.value = task.coluna;
        inputTag.value = task.tags && task.tags.length > 0 ? task.tags[0] : "";
        inputAutonomy.value = task.autonomia || 'manual';
        inputReview.value = task.proxima_revisao ? task.proxima_revisao.substring(0, 16) : '';
        btnDelete.classList.remove('hidden');
    } else {
        modalTitle.innerText = "Nova Tarefa";
        inputId.value = '';
        inputTitle.value = '';
        inputProject.value = '';
        inputDesc.value = '';
        inputAutonomy.value = 'manual';
        inputReview.value = '';
        btnDelete.classList.add('hidden');
    }
    
    modal.classList.remove('hidden');
    setTimeout(() => inputTitle.focus(), 100);
}

function closeModal() {
    modal.classList.add('hidden');
}

// Eventos
btnNew.addEventListener('click', () => openModal());
btnClose.addEventListener('click', closeModal);

modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal(); 
});

btnSave.addEventListener('click', () => {
    if(!inputTitle.value.trim()) {
        alert("O título é obrigatório");
        return;
    }

    const taskData = {
        id: inputId.value || undefined,
        titulo: inputTitle.value.trim(),
        projeto: inputProject.value.trim(),
        descricao: inputDesc.value.trim(),
        coluna: inputCol.value,
        tags: inputTag.value ? [inputTag.value] : [],
        autonomia: inputAutonomy.value,
        proxima_revisao: inputReview.value
    };

    saveTask(taskData);
    closeModal();
});

btnDelete.addEventListener('click', () => {
    if (inputId.value) {
        deleteTask(inputId.value);
    }
});

// Listener das Pills de Projeto
projectPills.forEach(pill => {
    pill.addEventListener('click', () => {
        projectPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentFilter = pill.dataset.project;
        renderTasks();
    });
});

document.addEventListener('DOMContentLoaded', () => {
    initSortable();
    fetchTasks();
});
