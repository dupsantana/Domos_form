document.addEventListener('DOMContentLoaded', () => {
  // --- Seletores iniciais ---
  const btnCadastro         = document.getElementById("btn_cadastro");
  const toggleForm          = document.getElementById("form");
  const btnVisualizar       = document.querySelector(".btn_visualizar button");
  const visualizarContainer = document.getElementById("visualizarContainer");
  const form                = document.querySelector("#form form");
  const tabelaBody          = document.querySelector("#tabela_registros tbody");
  const btnExportarTodos    = document.getElementById("btn_exportar_todos");

  // --- Função para verificar tamanho de localStorage.registros ---
  function verificarTamanhoStorage() {
    const item = localStorage.getItem("registros") || "";
    const bytes = new Blob([item]).size;
    const megas = bytes / (1024 * 1024);
    if (megas > 4) {
      alert(`⚠️ Atenção: você está usando ${megas.toFixed(2)} MB de 5 MB disponíveis. Considere exportar ou limpar registros antigos.`);
    }
  }

  // --- Função para limpar todos os campos do formulário ---
  function limparFormulario() {
    form.reset();
    form.elements["nome_cliente"].focus();
  }

  // --- 1) Toggle do formulário ---
  btnCadastro.addEventListener("click", () => {
    toggleForm.classList.toggle("hidden");
    visualizarContainer.classList.add("hidden");
  });

  // --- 2) Toggle da visualização e renderização da tabela ---
  btnVisualizar.addEventListener("click", () => {
    visualizarContainer.classList.toggle("hidden");
    toggleForm.classList.add("hidden");
    if (!visualizarContainer.classList.contains("hidden")) {
      renderizarTabela();
    }
  });

  // --- 3) Tratamento do envio do formulário ---
  form.addEventListener('submit', e => {
    e.preventDefault();
    const data = {
      nome_cliente:      form.elements["nome_cliente"].value,
      dt_entrada:        form.elements["dt_entrada"].value,
      status_lead:       form.elements["status_lead"].value,
      etapa_funil:       form.elements["etapa_funil"].value,
      dtfechamento:      form.elements["dtfechamento"].value,
      status_pagamento:  form.elements["status_pagamento"].value,
      observacoes:       form.elements["observacoes"].value
    };
    const registros = JSON.parse(localStorage.getItem("registros")) || [];
    registros.push(data);
    localStorage.setItem("registros", JSON.stringify(registros));
    alert("Cadastrado com sucesso!");
    verificarTamanhoStorage();
    limparFormulario();
  });

  // --- 4) Função que monta as linhas da tabela de registros ---
  function renderizarTabela() {
    const registros = JSON.parse(localStorage.getItem("registros")) || [];
    tabelaBody.innerHTML = "";
    registros.forEach((rec, idx) => {
      const tr = document.createElement("tr");

      const tdNome = document.createElement("td");
      tdNome.textContent = rec.nome_cliente;
      tr.appendChild(tdNome);

      const tdAcoes = document.createElement("td");

      const btnDownload = document.createElement("button");
      btnDownload.textContent = "Salvar Registro";
      btnDownload.addEventListener("click", () => downloadRegistro(idx));
      tdAcoes.appendChild(btnDownload);

      tdAcoes.appendChild(document.createTextNode(" "));

      const btnExcluir = document.createElement("button");
      btnExcluir.textContent = "Excluir";
      btnExcluir.addEventListener("click", () => excluirRegistro(idx));
      tdAcoes.appendChild(btnExcluir);

      tr.appendChild(tdAcoes);
      tabelaBody.appendChild(tr);
    });
  }

  // --- 5) Gera Excel (.xlsx) e força download com nome Cliente_Nome.xlsx ---
  function downloadRegistro(idx) {
    const registros = JSON.parse(localStorage.getItem("registros")) || [];
    const rec = registros[idx];
    const cabecalho    = ["Nome do Cliente","Data de Entrada","Status do Lead","Etapa do Funil","Data de Fechamento","Status Pagamento","Observações"];
    const propriedades = ["nome_cliente","dt_entrada","status_lead","etapa_funil","dtfechamento","status_pagamento","observacoes"];
    const data = [
      cabecalho,
      propriedades.map(key => rec[key] || "")
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Registro");
    const nomeLimpo = rec.nome_cliente.trim().replace(/[^\w]+/g, "_");
    XLSX.writeFile(wb, `Cliente_${nomeLimpo}.xlsx`);
  }

  // --- 6) Excluir registro do localStorage e atualizar a tabela ---
  function excluirRegistro(idx) {
    const registros = JSON.parse(localStorage.getItem("registros")) || [];
    registros.splice(idx, 1);
    localStorage.setItem("registros", JSON.stringify(registros));
    renderizarTabela();
    verificarTamanhoStorage();
  }

  // --- 7) Exportar todos os registros de uma vez ---
  btnExportarTodos.addEventListener("click", () => {
    const registros = JSON.parse(localStorage.getItem("registros")) || [];
    if (registros.length === 0) {
      alert("Não há registros para exportar.");
      return;
    }
    const cabecalho    = ["Nome do Cliente","Data de Entrada","Status do Lead","Etapa do Funil","Data de Fechamento","Status Pagamento","Observações"];
    const propriedades = ["nome_cliente","dt_entrada","status_lead","etapa_funil","dtfechamento","status_pagamento","observacoes"];
    const data = registros.map(rec => propriedades.map(key => rec[key] || ""));
    data.unshift(cabecalho);
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Todos_Registros");
    XLSX.writeFile(wb, "Todos_Registros.xlsx");
  });

  verificarTamanhoStorage();
});
