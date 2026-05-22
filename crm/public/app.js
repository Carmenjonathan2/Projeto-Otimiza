// ── Estado Global ──────────────────────────────────────────────────────────
const estado = {
  leads: {},        // id → lead
  modalLeadId: null,
  busca: '',
  iaAtiva: false
};

// ── WebSocket ──────────────────────────────────────────────────────────────
const socket = io();

socket.on('connect', () => {
  setBadge('ws-badge', 'Conectado', 'on');
  carregarKanban();
});

socket.on('disconnect', () => {
  setBadge('ws-badge', 'Desconectado', 'off');
});

socket.on('lead:atualizado', (dados) => {
  if (estado.leads[dados.id]) {
    Object.assign(estado.leads[dados.id], dados);
  }
  renderizarKanban();
  mostrarToast(`Lead atualizado: ${dados.nome} → ${dados.etapa}`);

  if (estado.modalLeadId === dados.id) {
    carregarDetalhe(dados.id);
  }
});

socket.on('lead:etapa_atualizada', (dados) => {
  if (estado.leads[dados.id]) {
    estado.leads[dados.id].etapa = dados.etapa;
  }
  renderizarKanban();
});

// ── Carga inicial ──────────────────────────────────────────────────────────
async function carregarKanban() {
  try {
    const [kanbanRes, statusRes] = await Promise.all([
      fetch('/api/kanban'),
      fetch('/api/status')
    ]);
    const kanban = await kanbanRes.json();
    const status = await statusRes.json();

    // Popula estado
    estado.leads = {};
    Object.values(kanban.colunas).forEach(leads => {
      leads.forEach(l => { estado.leads[l.id] = l; });
    });

    estado.iaAtiva = status.ia_ativa;
    setBadge('ia-badge', status.ia_ativa ? 'IA Ativa' : 'IA Desativada', status.ia_ativa ? 'on' : 'off');
    setBadge('total-badge', `${Object.keys(estado.leads).length} leads`, 'neutro');

    renderizarKanban();
  } catch (err) {
    console.error('Erro ao carregar kanban:', err);
  }
}

// ── Renderização ───────────────────────────────────────────────────────────
function renderizarKanban() {
  const etapas = ['novo', 'interessado', 'negociacao', 'fechado', 'perdido'];
  const busca = estado.busca.toLowerCase();

  etapas.forEach(etapa => {
    const container = document.getElementById(`cards-${etapa}`);
    const countEl = document.getElementById(`count-${etapa}`);

    const leads = Object.values(estado.leads).filter(l => {
      if (l.etapa !== etapa) return false;
      if (!busca) return true;
      return (l.nome || '').toLowerCase().includes(busca) ||
             (l.telefone || '').includes(busca);
    });

    countEl.textContent = leads.length;

    if (leads.length === 0) {
      container.innerHTML = `<div class="vazio">Nenhum lead</div>`;
      return;
    }

    container.innerHTML = leads
      .sort((a, b) => new Date(b.ultima_interacao) - new Date(a.ultima_interacao))
      .map(renderCard)
      .join('');
  });

  const total = Object.keys(estado.leads).length;
  setBadge('total-badge', `${total} lead${total !== 1 ? 's' : ''}`, 'neutro');
}

function renderCard(lead) {
  const temp = lead.temperatura || 'morno';
  const proxima = lead.proxima_acao || 'Sem sugestão';
  const ultima = lead.ultima_interacao ? formatarData(lead.ultima_interacao) : 'Nunca';
  const interacoes = lead.total_interacoes || 0;

  return `
    <div class="card" onclick="abrirModal(${lead.id})">
      <div class="card-header">
        <span class="card-nome">${escapeHtml(lead.nome)}</span>
        <span class="card-temp temp-${temp}" title="${temp}"></span>
      </div>
      <p class="card-proxima">${escapeHtml(proxima)}</p>
      <div class="card-footer">
        <span class="card-interacoes">${interacoes} msg${interacoes !== 1 ? 's' : ''} · ${ultima}</span>
      </div>
    </div>`;
}

// ── Modal ──────────────────────────────────────────────────────────────────
async function abrirModal(leadId) {
  estado.modalLeadId = leadId;
  document.getElementById('modal-overlay').classList.remove('hidden');
  await carregarDetalhe(leadId);
}

function fecharModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  estado.modalLeadId = null;
}

async function carregarDetalhe(leadId) {
  try {
    const res = await fetch(`/api/leads/${leadId}`);
    const data = await res.json();
    if (!data.ok) return;

    const { lead, interacoes } = data;

    document.getElementById('modal-nome').textContent = lead.nome;
    document.getElementById('modal-tel').textContent = lead.telefone;
    document.getElementById('modal-interacoes').textContent = lead.total_interacoes || 0;
    document.getElementById('modal-ultima').textContent = lead.ultima_interacao ? formatarData(lead.ultima_interacao) : 'Nunca';
    document.getElementById('modal-resumo').textContent = lead.resumo_ia || '—';

    const proximaEl = document.getElementById('modal-proxima');
    proximaEl.textContent = lead.proxima_acao || '—';

    const tempEl = document.getElementById('modal-temperatura');
    const temp = lead.temperatura || 'morno';
    const tempLabel = { quente: '🔴 Quente', morno: '🟡 Morno', frio: '🔵 Frio' };
    tempEl.textContent = tempLabel[temp] || temp;
    tempEl.className = `tag-temperatura ${temp}`;

    const etapaSelect = document.getElementById('modal-etapa');
    const etapas = [
      { v: 'novo', l: 'Novo' },
      { v: 'interessado', l: 'Interessado' },
      { v: 'negociacao', l: 'Em Negociação' },
      { v: 'fechado', l: 'Fechado' },
      { v: 'perdido', l: 'Perdido' }
    ];
    etapaSelect.innerHTML = etapas.map(e =>
      `<option value="${e.v}" ${lead.etapa === e.v ? 'selected' : ''}>${e.l}</option>`
    ).join('');

    const mensagensEl = document.getElementById('modal-mensagens');
    if (!interacoes || interacoes.length === 0) {
      mensagensEl.innerHTML = `<div class="vazio">Nenhuma mensagem registrada</div>`;
    } else {
      mensagensEl.innerHTML = interacoes
        .slice().reverse()
        .map(renderMensagem)
        .join('');
    }
    mensagensEl.scrollTop = mensagensEl.scrollHeight;
  } catch (err) {
    console.error('Erro ao carregar detalhe:', err);
  }
}

function renderMensagem(msg) {
  const isComercial = msg.quem === 'COMERCIAL';
  const cls = isComercial ? 'msg-comercial' : 'msg-cliente';
  const corpo = msg.tipo === 'audio'
    ? `<span class="msg-audio">🎤 Mensagem de áudio</span>`
    : escapeHtml(msg.mensagem || '');

  return `
    <div class="msg ${cls}">
      <div class="msg-remetente">${escapeHtml(msg.quem)}</div>
      <div>${corpo}</div>
      <div class="msg-hora">${formatarData(msg.timestamp)}</div>
    </div>`;
}

async function moverEtapa() {
  const leadId = estado.modalLeadId;
  if (!leadId) return;
  const etapa = document.getElementById('modal-etapa').value;

  try {
    await fetch(`/api/leads/${leadId}/etapa`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ etapa })
    });
    if (estado.leads[leadId]) estado.leads[leadId].etapa = etapa;
    renderizarKanban();
    mostrarToast(`Movido para: ${etapa}`);
  } catch (err) {
    console.error('Erro ao mover etapa:', err);
  }
}

// ── Busca ──────────────────────────────────────────────────────────────────
document.getElementById('busca').addEventListener('input', (e) => {
  estado.busca = e.target.value;
  renderizarKanban();
});

// ── Fechar modal com Escape ────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') fecharModal();
});
document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) fecharModal();
});

// ── Toast ──────────────────────────────────────────────────────────────────
function mostrarToast(msg) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ── Helpers ────────────────────────────────────────────────────────────────
function setBadge(id, texto, tipo) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = texto;
  el.className = `badge badge-${tipo}`;
}

function formatarData(iso) {
  try {
    const d = new Date(iso);
    const agora = new Date();
    const diff = agora - d;
    const min = Math.floor(diff / 60000);
    if (min < 1)  return 'agora';
    if (min < 60) return `${min}min atrás`;
    const h = Math.floor(min / 60);
    if (h < 24)   return `${h}h atrás`;
    const dias = Math.floor(h / 24);
    if (dias < 7) return `${dias}d atrás`;
    return d.toLocaleDateString('pt-BR');
  } catch { return iso; }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
