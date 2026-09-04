const API_URL = "http://localhost:5000/api";
const TODAY = "2026-08-09";

// No começo do seu script.js, mude para buscar direto da sua API do Flask:
const state = {
  tab: "painel",
  employees: [],
  sales: [],
  reportFilter: "",
  searchId: "",
  showEmployeeForm: false,
};

// Função para buscar os dados do seu MySQL via Flask
async function carregarDadosDoBanco() {
  try {
    // Busca os funcionários que estão no seu MySQL
    const resFunc = await fetch("http://localhost:5000/api/funcionarios");
    state.employees = await resFunc.json();

    // Busca as vendas/relatórios que estão no seu MySQL
    const resVendas = await fetch("http://localhost:5000/api/relatorios");
    state.sales = await resVendas.json();

    render(); // Desenha a tela com os dados reais do banco!
  } catch (erro) {
    console.error("Erro ao conectar com o servidor Python:", erro);
  }
}

// Chame essa função assim que a página carregar
carregarDadosDoBanco();

// Exemplo para enviar a venda para a sua rota @app.route('/api/vendas')
async function registrarVendaNoBanco(dadosVenda) {
  await fetch("http://localhost:5000/api/vendas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dadosVenda)
  });
  carregarDadosDoBanco(); // Atualiza a tela após salvar
}
// ---------- Helpers ----------
function fmt(n) {
  return `R$ ${Number(n).toFixed(2)}`;
}

function employeeName(id) {
  const e = state.employees.find((emp) => emp.id === Number(id));
  return e ? e.nome : "—";
}

function showToast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.add("hidden"), 2600);
}

function totalHoje() {
  return state.sales.filter((s) => s.data === TODAY).reduce((acc, s) => acc + s.total, 0);
}

function totalGeral() {
  return state.sales.reduce((acc, s) => acc + s.total, 0);
}

// ---------- Ícones inline (SVG simples) ----------
const icon = {
  plus: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg>`,
  x: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M18 6L6 18M6 6l12 12"/></svg>`,
  trash: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6"/></svg>`,
  search: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>`,
};

// ---------- Comunicação com o Back-end (API Python) ----------
async function carregarDadosDoServidor() {
  try {
    const [resEmp, resSales] = await Promise.all([
      fetch(`${API_URL}/funcionarios`),
      fetch(`${API_URL}/relatorios`)
    ]);

    if (resEmp.ok) {
      state.employees = await resEmp.json();
    }
    if (resSales.ok) {
      const dadosVendas = await resSales.json();
      // Mapeia os campos vindos do MySQL para o formato que a tela espera
      state.sales = dadosVendas.map(v => ({
        id: v.id,
        marca: v.marca_da_roupa,
        preco: v.preco_da_roupa,
        atendenteId: v.id_do_atendente,
        desconto: v.desconto,
        total: v.total_da_compra,
        data: v.data
      }));
    }
    render();
  } catch (erro) {
    console.error("Erro ao conectar com o servidor Python:", erro);
    showToast("Erro: Servidor Flask desligado ou inacessível.");
    render();
  }
}

// ---------- Render raiz ----------
function render() {
  const fatHojeEl = document.getElementById("faturamento-hoje");
  if (fatHojeEl) fatHojeEl.textContent = fmt(totalHoje());

  document.querySelectorAll(".tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === state.tab);
  });

  const root = document.getElementById("app-content");
  if (!root) return;

  if (state.tab === "painel") root.innerHTML = renderPainel();
  if (state.tab === "venda") root.innerHTML = renderVenda();
  if (state.tab === "relatorio") root.innerHTML = renderRelatorio();
  if (state.tab === "funcionarios") root.innerHTML = renderFuncionarios();

  attachEvents();
}

// ---------- Painel ----------
function renderPainel() {
  const recent = [...state.sales].slice(-4).reverse();

  const stats = `
    <div class="stats-grid">
      <div class="tag-card stat-card">
        <span class="label">Vendas registradas</span>
        <div class="stat-value">${state.sales.length}</div>
      </div>
      <div class="tag-card stat-card">
        <span class="label">Funcionários ativos</span>
        <div class="stat-value">${state.employees.length}</div>
      </div>
      <div class="tag-card stat-card">
        <span class="label">Faturamento total</span>
        <div class="stat-value">${fmt(totalGeral())}</div>
      </div>
    </div>`;

  const rows = recent.length
    ? recent
        .map(
          (s, i) => `
        <div class="row">
          <div>
            <div class="row-title">${s.marca}</div>
            <div class="row-sub">${employeeName(s.atendenteId)} · ${s.data}</div>
          </div>
          <div class="row-value">${fmt(s.total)}</div>
        </div>
        ${i < recent.length - 1 ? '<div class="stitch"></div>' : ""}
      `
        )
        .join("")
    : `<p class="muted-text">Nenhuma venda ainda. Registre a primeira em "Nova Venda".</p>`;

  return `
    ${stats}
    <div class="tag-card">
      <span class="label">Últimas vendas</span>
      <div style="margin-top:10px;">${rows}</div>
    </div>`;
}

// ---------- Nova venda ----------
function renderVenda() {
  if (state.employees.length === 0) {
    return `
      <div class="tag-card">
        <span class="label">Cadastrar nova venda</span>
        <h2>Preencher etiqueta de venda</h2>
        <p class="error-text">Cadastre um funcionário antes de registrar uma venda.</p>
      </div>`;
  }

  const options = state.employees.map((e) => `<option value="${e.id}">#${e.id} · ${e.nome}</option>`).join("");

  return `
    <div class="tag-card" style="max-width:560px;">
      <span class="label">Cadastrar nova venda</span>
      <h2>Preencher etiqueta de venda</h2>
      <form id="venda-form">
        <div class="field">
          <span class="label">Marca da roupa</span>
          <input id="v-marca" type="text" placeholder="Ex.: Rústica Jeans" />
        </div>
        <div class="field-row">
          <div class="field">
            <span class="label">Preço (R$)</span>
            <input id="v-preco" type="number" step="0.01" placeholder="0,00" />
          </div>
          <div class="field">
            <span class="label">Desconto (%)</span>
            <input id="v-desconto" type="number" value="10" />
          </div>
        </div>
        <div class="field-row">
          <div class="field">
            <span class="label">Atendente</span>
            <select id="v-atendente">${options}</select>
          </div>
          <div class="field">
            <span class="label">Data</span>
            <input id="v-data" type="date" value="${TODAY}" />
          </div>
        </div>
        <div class="stitch"></div>
        <div class="total-line">
          <span class="label">Total calculado</span>
          <span class="value" id="v-total">R$ 0.00</span>
        </div>
        <div id="v-error" class="error-text" style="display:none;"></div>
        <button type="submit" class="btn green">${icon.plus} Registrar venda</button>
      </form>
    </div>`;
}

// ---------- Relatório ----------
function renderRelatorio() {
  const filtradas = state.reportFilter
    ? state.sales.filter((s) => s.data === state.reportFilter)
    : state.sales;
  const total = filtradas.reduce((acc, s) => acc + s.total, 0);

  const body = filtradas.length
    ? `
      <div class="table-head">
        <span class="label">Marca</span>
        <span class="label">Preço</span>
        <span class="label">Atendente</span>
        <span class="label">Desconto</span>
        <span class="label">Total</span>
      </div>
      ${filtradas
        .map(
          (s, i) => `
        <div class="table-row">
          <span style="font-weight:600;">${s.marca}</span>
          <span class="mono">${fmt(s.preco)}</span>
          <span>${employeeName(s.atendenteId)}</span>
          <span>${s.desconto}%</span>
          <span class="total">${fmt(s.total)}</span>
        </div>
        ${i < filtradas.length - 1 ? '<div class="stitch"></div>' : ""}
      `
        )
        .join("")}
      <div class="stitch brass"></div>
      <div class="report-total">
        <div style="text-align:right;">
          <span class="label">Lucro no período</span>
          <div class="value">${fmt(total)}</div>
        </div>
      </div>
    `
    : `<p class="muted-text">Nenhum registro para essa data.</p>`;

  return `
    <div class="tag-card">
      <div class="report-header">
        <div>
          <span class="label">Relatório de vendas</span>
          <h2 style="margin-bottom:0;">Livro-caixa</h2>
        </div>
        <div class="field" style="margin-bottom:0;">
          <span class="label">Filtrar por data</span>
          <div style="display:flex; gap:8px;">
            <input id="r-filtro" type="date" value="${state.reportFilter}" />
            ${state.reportFilter ? `<button class="btn-ghost" id="r-limpar">${icon.x} Limpar</button>` : ""}
          </div>
        </div>
      </div>
      ${body}
    </div>`;
}

// ---------- Funcionários ----------
function renderFuncionarios() {
  const encontrado = state.searchId
    ? state.employees.find((e) => String(e.id) === state.searchId.trim())
    : null;

  const searchResult = !state.searchId
    ? ""
    : encontrado
    ? `
      <div class="search-result">
        <div class="avatar">#${encontrado.id}</div>
        <div>
          <div class="row-title">${encontrado.nome}</div>
          <div class="row-sub">${encontrado.telefone} · ${encontrado.endereco}</div>
        </div>
      </div>`
    : `<p class="error-text" style="margin-top:12px;">Nenhum funcionário encontrado com esse ID.</p>`;

  const employeeRows = state.employees
    .map(
      (e, i) => `
    <div class="employee-row">
      <div class="employee-info">
        <div class="avatar small">#${e.id}</div>
        <div>
          <div class="row-title">${e.nome}</div>
          <div class="row-sub">${e.telefone || "sem telefone"} · ${e.sexo}</div>
        </div>
      </div>
      <button class="btn-ghost danger" data-remove="${e.id}">${icon.trash} Apagar</button>
    </div>
    ${i < state.employees.length - 1 ? '<div class="stitch"></div>' : ""}
  `
    )
    .join("");

  return `
    <div class="tag-card">
      <span class="label">Buscar atendente por ID</span>
      <div style="display:flex; gap:8px; margin-top:8px;">
        <input id="f-busca" type="text" placeholder="Digite o número da etiqueta (ID)" style="max-width:260px;" value="${state.searchId}" />
        <button class="btn-ghost" id="f-limpar-busca">${icon.search} Limpar</button>
      </div>
      ${searchResult}
    </div>

    <div class="tag-card">
      <div class="card-header-row">
        <div>
          <span class="label">Quadro de funcionários</span>
          <h2 style="margin:2px 0 0;">${state.employees.length} cadastrados</h2>
        </div>
        <button class="btn" id="f-toggle-form">${state.showEmployeeForm ? icon.x + " Fechar" : icon.plus + " Novo funcionário"}</button>
      </div>

      <form id="f-form" class="employee-form ${state.showEmployeeForm ? "open" : ""}">
        <div class="field">
          <span class="label">Nome completo</span>
          <input id="f-nome" type="text" />
        </div>
        <div class="field-row">
          <div class="field">
            <span class="label">Nascimento</span>
            <input id="f-nasc" type="date" />
          </div>
          <div class="field">
            <span class="label">Sexo</span>
            <select id="f-sexo">
              <option value="F">Feminino</option>
              <option value="M">Masculino</option>
              <option value="Outro">Outro</option>
            </select>
          </div>
        </div>
        <div class="field">
          <span class="label">Endereço</span>
          <input id="f-endereco" type="text" />
        </div>
        <div class="field">
          <span class="label">Telefone</span>
          <input id="f-telefone" type="text" placeholder="(11) 90000-0000" />
        </div>
        <div id="f-error" class="error-text" style="display:none;"></div>
        <button type="submit" class="btn green">Salvar cadastro</button>
      </form>

      <div>${employeeRows}</div>
    </div>`;
}

// ---------- Eventos ----------
function attachEvents() {
  // Nova venda
  const vendaForm = document.getElementById("venda-form");
  if (vendaForm) {
    const preco = document.getElementById("v-preco");
    const desconto = document.getElementById("v-desconto");
    const totalEl = document.getElementById("v-total");

    function updateTotal() {
      const p = parseFloat(preco.value) || 0;
      const d = parseFloat(desconto.value) || 0;
      totalEl.textContent = fmt((d / 100) * p);
    }
    preco.addEventListener("input", updateTotal);
    desconto.addEventListener("input", updateTotal);
    updateTotal();

    vendaForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const marca = document.getElementById("v-marca").value.trim();
      const precoNum = parseFloat(preco.value) || 0;
      const descontoNum = parseFloat(desconto.value) || 0;
      const atendenteId = document.getElementById("v-atendente").value;
      const data = document.getElementById("v-data").value;
      const errorEl = document.getElementById("v-error");

      let error = "";
      if (!marca) error = "Informe a marca da roupa.";
      else if (precoNum <= 0) error = "O preço deve ser maior que zero.";
      else if (!atendenteId) error = "Selecione um atendente cadastrado.";

      if (error) {
        errorEl.textContent = error;
        errorEl.style.display = "block";
        return;
      }

      try {
        const resposta = await fetch(`${API_URL}/vendas`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            marca,
            preco: precoNum,
            desconto: descontoNum,
            atendenteId: Number(atendenteId),
            data
          })
        });

        if (resposta.ok) {
          showToast("Venda registrada no MySQL com sucesso!");
          await carregarDadosDoServidor(); // Recarrega do banco
          state.tab = "painel";
          render();
        } else {
          showToast("Erro ao salvar venda no servidor.");
        }
      } catch (err) {
        showToast("Erro de conexão com o back-end.");
      }
    });
  }

  // Relatório
  const filtroInput = document.getElementById("r-filtro");
  if (filtroInput) {
    filtroInput.addEventListener("change", (e) => {
      state.reportFilter = e.target.value;
      render();
    });
  }
  const limparFiltro = document.getElementById("r-limpar");
  if (limparFiltro) {
    limparFiltro.addEventListener("click", () => {
      state.reportFilter = "";
      render();
    });
  }

  // Funcionários — busca
  const buscaInput = document.getElementById("f-busca");
  if (buscaInput) {
    buscaInput.addEventListener("input", (e) => {
      state.searchId = e.target.value;
      render();
      const el = document.getElementById("f-busca");
      if (el) {
        el.focus();
        el.selectionStart = el.selectionEnd = el.value.length;
      }
    });
  }
  const limparBusca = document.getElementById("f-limpar-busca");
  if (limparBusca) {
    limparBusca.addEventListener("click", () => {
      state.searchId = "";
      render();
    });
  }

  // Funcionários — mostrar formulário
  const toggleForm = document.getElementById("f-toggle-form");
  if (toggleForm) {
    toggleForm.addEventListener("click", () => {
      state.showEmployeeForm = !state.showEmployeeForm;
      render();
    });
  }

  // Funcionários — cadastrar
  const fForm = document.getElementById("f-form");
  if (fForm) {
    fForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nome = document.getElementById("f-nome").value.trim();
      const errorEl = document.getElementById("f-error");
      if (!nome) {
        errorEl.textContent = "Informe o nome completo.";
        errorEl.style.display = "block";
        return;
      }

      try {
        const resposta = await fetch(`${API_URL}/funcionarios`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome,
            nascimento: document.getElementById("f-nasc").value,
            endereco: document.getElementById("f-endereco").value,
            sexo: document.getElementById("f-sexo").value,
            telefone: document.getElementById("f-telefone").value,
          })
        });

        if (resposta.ok) {
          state.showEmployeeForm = false;
          showToast("Funcionário cadastrado no MySQL!");
          await carregarDadosDoServidor(); // Atualiza a lista do banco
        } else {
          showToast("Erro ao cadastrar funcionário.");
        }
      } catch (err) {
        showToast("Erro de conexão com o back-end.");
      }
    });
  }

  // Funcionários — apagar
  document.querySelectorAll("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.dataset.remove);
      try {
        const resposta = await fetch(`${API_URL}/funcionarios/${id}`, {
          method: "DELETE"
        });
        if (resposta.ok) {
          showToast("Cadastro removido do MySQL.");
          await carregarDadosDoServidor();
        } else {
          showToast("Erro ao apagar funcionário.");
        }
      } catch (err) {
        showToast("Erro de conexão com o back-end.");
      }
    });
  });
}

// ---------- Navegação por abas ----------
const tabsEl = document.getElementById("tabs");
if (tabsEl) {
  tabsEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab");
    if (!btn) return;
    state.tab = btn.dataset.tab;
    render();
  });
}

// ---------- Inicialização ----------
carregarDadosDoServidor();