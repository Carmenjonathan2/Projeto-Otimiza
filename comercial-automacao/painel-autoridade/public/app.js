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
        fetchGIO();
    } catch (err) {
        console.error("Erro ao puxar contexto mestre", err);
    }
}

async function fetchGIO() {
    const container = document.getElementById('gio-insights');
    if (!container) return;

    try {
        const res = await fetch('/api/gio');
        const data = await res.json();

        if (!data.strategy) {
            container.innerHTML = '<div class="gio-empty">Cérebro aguardando primeira estratégia...</div>';
            return;
        }

        const alertHtml = data.alerts && data.alerts.length > 0 
            ? `<div class="gio-alerts">
                ${data.alerts.map(a => `<div class="gio-alert-item">⚠️ ${a.mensagem}</div>`).join('')}
               </div>` 
            : '';

        container.innerHTML = `
            ${alertHtml}
            <div class="gio-card strategy-card">
                <div class="gio-badge">Estratégia do Dia</div>
                <p>${data.strategy.goal}</p>
                <div class="gio-meta">Prioridade: <span>${data.strategy.priority}</span></div>
            </div>
            <div class="gio-card ranking-card">
                <div class="gio-badge">Top 5 Clientes (Ranking A)</div>
                <ul class="gio-list">
                    ${data.abc.map(c => `<li>${c.nome} <span>R$ ${c.total.toLocaleString('pt-BR')}</span></li>`).join('')}
                </ul>
            </div>
        `;
    } catch (err) {
        container.innerHTML = '<div class="gio-error">Erro ao conectar com GIO.</div>';
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
    const projetos = {};
    
    currentTasks.forEach(t => {
        const p = t.projeto || "Geral";
        if(!projetos[p]) projetos[p] = { total: 0, concluido: 0 };
        
        projetos[p].total++;
        if(t.coluna === 'feito') projetos[p].concluido++;
    });
    
    Object.keys(projetos).forEach(projName => {
        const proj = projetos[projName];
        let perc = proj.total === 0 ? 0 : Math.round((proj.concluido / proj.total) * 100);
        
        const div = document.createElement('div');
        div.className = 'project-health';
        div.innerHTML = `
            <div class="ph-header">
                <span class="ph-title">${projName}</span>
                <span class="ph-perc">${perc}% Concluído</span>
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
        'LinkedIn': '#3b82f6',
        'Instagram': '#ec4899',
        'Shopify Blog': '#8b5cf6',
        'Operações': '#10b981',
        'Fidelização': '#6366f1'
    };
    return colors[projectName] || 'var(--accent)';
}

function createTaskElement(task) {
    const div = document.createElement('div');
    div.className = 'kanban-card';
    div.dataset.id = task.id;
    
    if (task.autonomia === 'semi') div.classList.add('semi-auto');
    
    let tagHtml = '';
    if (task.tags) {
        task.tags.forEach(t => {
            const isAccent = t.includes('Rotina') || t.includes('IA');
            tagHtml += `<span class="tag ${isAccent ? 'tag-accent' : ''}">${t}</span>`;
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
        div.className = `timeline-node border-${statusClass}`;
        div.innerHTML = `
            <div class="node-status status-${statusClass}">${statusClass}</div>
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

    allBookings.forEach(book => {
        const campanha = allCampaigns.find(c => c.id === book.campanhaId);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${book.horario}</td>
            <td>${book.nome}</td>
            <td>${book.petNome}</td>
            <td>${book.telefone}</td>
            <td>${book.email || '-'}</td>
            <td>${campanha ? campanha.condominio : '-'}</td>
        `;
        body.appendChild(tr);
    });
}

function renderTasks() {
    const globalBoard = document.getElementById('global-kanban');
    const multiView = document.getElementById('multi-board-view');
    const appointmentsPanel = document.querySelector('.appointments-panel');
    const memorySection = document.getElementById('memory-section');

    if (currentFilter === 'Redes Sociais' || currentFilter === 'E-commerce') {
        globalBoard.classList.add('hidden');
        multiView.classList.remove('hidden');
        if (memorySection) memorySection.classList.add('hidden');
        
        const platforms = currentFilter === 'Redes Sociais' 
            ? ['LinkedIn', 'Instagram', 'Shopify Blog', 'TikTok']
            : ['Inventory', 'Shopify Store'];
            
        renderMultiBoardView(platforms);
    } else {
        globalBoard.classList.remove('hidden');
        multiView.classList.add('hidden');
        if (memorySection) {
            // Só mostra a memória na visão global "all"
            if (currentFilter === 'all') memorySection.classList.remove('hidden');
            else memorySection.classList.add('hidden');
        }
        renderGlobalView();
    }
    
    // Controle de visibilidade dos Agendamentos (Vet em Casa)
    if (currentFilter === 'all' || currentFilter === 'Vet em Casa') {
        if (appointmentsPanel) appointmentsPanel.classList.remove('hidden');
    } else {
        if (appointmentsPanel) appointmentsPanel.classList.add('hidden');
    }
    
    renderDoneHistory();
    renderTelemetry();
}

function renderGlobalView() {
    Object.values(cols).forEach(col => col.innerHTML = '');
    const filtered = currentFilter === 'all' ? currentTasks : currentTasks.filter(t => t.projeto === currentFilter);

    filtered.forEach(task => {
        if (task.coluna === 'feito') return;
        const col = cols[task.coluna];
        if (col) col.appendChild(createTaskElement(task));
    });
}

function renderMultiBoardView(platforms) {
    const multiView = document.getElementById('multi-board-view');
    multiView.innerHTML = '';
    
    platforms.forEach(platform => {
        const row = document.createElement('div');
        row.className = 'social-platform-row';
        row.innerHTML = `
            <div class="platform-header"><h2>${platform}</h2></div>
            <div class="platform-board">
                <div class="social-col" data-platform="${platform}" data-column="motor">
                    <div class="social-col-header">⚙️ Motor</div>
                    <div class="social-list" id="list-${platform}-motor"></div>
                </div>
                <div class="social-col" data-platform="${platform}" data-column="gargalo">
                    <div class="social-col-header">⚠️ Gargalo</div>
                    <div class="social-list" id="list-${platform}-gargalo"></div>
                </div>
                <div class="social-col" data-platform="${platform}" data-column="cofre">
                    <div class="social-col-header">💡 Ideias</div>
                    <div class="social-list" id="list-${platform}-cofre"></div>
                </div>
            </div>
        `;
        multiView.appendChild(row);

        currentTasks.filter(t => t.projeto === platform && t.coluna !== 'feito').forEach(task => {
            const list = document.getElementById(`list-${platform}-${task.coluna}`);
            if (list) list.appendChild(createTaskElement(task));
        });

        ['motor', 'gargalo', 'cofre'].forEach(colType => {
            const listEl = document.getElementById(`list-${platform}-${colType}`);
            new Sortable(listEl, {
                group: 'kanban',
                animation: 150,
                onEnd: function (evt) {
                    const taskId = evt.item.dataset.id;
                    const newCol = evt.to.parentElement.dataset.column;
                    updateTaskColumn(taskId, newCol);
                },
            });
        });
    });
}

function renderDoneHistory() {
    const doneList = document.getElementById('done-list');
    if (!doneList) return;
    doneList.innerHTML = '';

    const doneTasks = currentTasks.filter(t => t.coluna === 'feito');
    if (doneTasks.length === 0) {
        doneList.innerHTML = '<p style="color: #666; font-style: italic;">Nenhuma tarefa concluída recentemente.</p>';
        return;
    }

    doneTasks.forEach(task => {
        const div = document.createElement('div');
        div.className = 'done-card';
        div.innerHTML = `
            <div class="done-card-title">${task.titulo}</div>
            <div class="done-card-meta"><span>${task.projeto}</span><span>${formatDate(task.criado_em)}</span></div>
        `;
        div.onclick = () => openModal(task);
        doneList.appendChild(div);
    });
}

function initSortable() {
    Object.keys(cols).forEach(key => {
        new Sortable(cols[key], {
            group: 'kanban',
            animation: 150,
            onEnd: function (evt) {
                const taskId = evt.item.dataset.id;
                const newCol = evt.to.parentElement.dataset.column;
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
        inputId.value = ''; inputTitle.value = ''; inputProject.value = ''; inputDesc.value = '';
        inputAutonomy.value = 'manual'; inputReview.value = '';
        btnDelete.classList.add('hidden');
    }
    modal.classList.remove('hidden');
}

function closeModal() { modal.classList.add('hidden'); }

btnNew.addEventListener('click', () => openModal());
btnClose.addEventListener('click', closeModal);
btnSave.addEventListener('click', () => {
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

btnDelete.addEventListener('click', () => { if (inputId.value) deleteTask(inputId.value); });

projectPills.forEach(pill => {
    pill.addEventListener('click', () => {
        projectPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentFilter = pill.dataset.project;
        renderTasks();
    });
});

// Google Calendar Logic
const btnGoogle = document.getElementById('btn-google-calendar');

async function checkGoogleStatus() {
    try {
        const res = await fetch('/api/auth/status');
        const data = await res.json();
        if (data.connected) {
            btnGoogle.innerText = "🔄 Sincronizar Agenda";
            btnGoogle.classList.add('connected');
        } else {
            btnGoogle.innerText = "📅 Conectar Google";
            btnGoogle.classList.remove('connected');
        }
    } catch (err) {
        console.error("Erro ao verificar Google Status", err);
    }
}

btnGoogle.addEventListener('click', async () => {
    try {
        const res = await fetch('/api/auth/status');
        const data = await res.json();
        
        if (data.connected) {
            // Sincronizar
            btnGoogle.innerText = "⏳ Sincronizando...";
            const syncRes = await fetch('/api/sync/calendar', { method: 'POST' });
            const syncData = await syncRes.json();
            alert(syncData.message || syncData.error);
            checkGoogleStatus();
        } else {
            // Conectar (Abrir Auth URL)
            const authRes = await fetch('/api/auth/google');
            const authData = await authRes.json();
            if (authData.url) {
                window.open(authData.url, '_blank');
            } else {
                alert("Erro ao obter URL de autenticação. Verifique se o arquivo credentials.json está na pasta do painel.");
            }
        }
    } catch (err) {
        alert("Erro na operação do Google Calendar: " + err.message);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    initSortable();
    fetchTasks();
    checkGoogleStatus();
});
