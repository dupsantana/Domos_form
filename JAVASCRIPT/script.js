// JAVASCRIPT/script.js

document.addEventListener('DOMContentLoaded', () => {
  const btnCadastro = document.getElementById('btn_cadastro');
  const formContainer = document.getElementById('form');
  const btnVisualizar = document.querySelector('.btn_visualizar button');
  const visualizarContainer = document.getElementById('visualizarContainer');
  const form = document.getElementById('formElement');
  const tabela = document.getElementById('tabela_registros');
  const tabelaBody = tabela.querySelector('tbody');
  const btnExportarTodos = document.getElementById('btn_exportar_todos');
  const inputValor = document.getElementById('etapa_funil');

  /* ---------------- utilitários e formatação (mantidos) ---------------- */
  function parseCurrency(v) {
    let num = (v || '').toString().replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.');
    return parseFloat(num) || 0;
  }

  function formatBRDate(i) {
    if (!i) return '';
    // aceita 'yyyy-mm-dd' (valor de input date) e retorna dd/mm/yyyy
    const [y, m, d] = i.split('-');
    if (!y || !m || !d) return i;
    return `${d}/${m}/${y}`;
  }

  function formatBRMoney(v) {
    const n = parseCurrency(v);
    return n
      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
      : '';
  }

  function verificarTamanhoStorage() {
    const mb = new Blob([localStorage.getItem('registros') || '']).size / (1024 * 1024);
    if (mb > 4) alert(`⚠️ Você está usando ${mb.toFixed(2)} MB de 5 MB.`);
  }

  function limparFormulario() {
    form.reset();
    if (form.elements['nome_cliente']) form.elements['nome_cliente'].focus();
  }

  /* ---------------- eventos principais (mantidos) ---------------- */
  btnCadastro.onclick = () => {
    formContainer.classList.toggle('hidden');
    visualizarContainer.classList.add('hidden');
  };

  btnVisualizar.onclick = () => {
    visualizarContainer.classList.toggle('hidden');
    formContainer.classList.add('hidden');
    if (!visualizarContainer.classList.contains('hidden')) renderTable();
  };

  form.onsubmit = (e) => {
    e.preventDefault();
    const data = {
      nome_cliente: form.nome_cliente ? form.nome_cliente.value : '',
      dt_entrada: form.dt_entrada ? form.dt_entrada.value : '',
      status_lead: form.status_lead ? form.status_lead.value : '',
      etapa_funil: form.etapa_funil ? form.etapa_funil.value : '',
      dtfechamento: form.dtfechamento ? form.dtfechamento.value : '',
      status_pagamento: form.status_pagamento ? form.status_pagamento.value : '',
      observacoes: form.observacoes ? form.observacoes.value : ''
    };
    const arr = JSON.parse(localStorage.getItem('registros')) || [];
    arr.push(data);
    localStorage.setItem('registros', JSON.stringify(arr));
    alert('Cadastrado com sucesso!');
    verificarTamanhoStorage();
    limparFormulario();
    renderTable();
  };

  /* ----------------- helpers para coluna Editar / cabeçalho ----------------- */
  // Se o <th> "Editar" não existir no início do thead, insere via JS (não altera seu CSS).
  function ensureEditarHeader() {
    const headRow = tabela.tHead && tabela.tHead.rows[0];
    if (!headRow) return;
    const firstText = headRow.cells[0] && headRow.cells[0].textContent.trim().toLowerCase();
    if (firstText !== 'editar') {
      const th = document.createElement('th');
      th.textContent = 'Editar';
      headRow.parentNode.rows[0].insertBefore(th, headRow.parentNode.rows[0].cells[0]);
    }
  }

  // Remove filter box aberto (se existir)
  function removeFilterBox() {
    const existing = document.getElementById('filterBox');
    if (existing) existing.remove();
  }

  /* ----------------- lógica de filtros estilo "Excel" (seta + checkbox) ----------------- */
  function addFilterIcons() {
    const headRow = tabela.tHead && tabela.tHead.rows[0];
    if (!headRow) return;

    // evita adicionar ícones duplicados
    Array.from(headRow.cells).forEach((th) => {
      if (th.querySelector('.filter-icon')) return;
      // não coloca ícone na primeira coluna (Editar) nem na última (Ações)
      const isFirst = th === headRow.cells[0];
      const isLast = th === headRow.cells[headRow.cells.length - 1];
      if (isFirst || isLast) return;

      const icon = document.createElement('span');
      icon.className = 'filter-icon';
      icon.innerHTML = ' &#9660;'; // seta pequena ▾
      icon.style.cursor = 'pointer';
      icon.style.marginLeft = '6px';
      icon.style.fontSize = '0.9em';
      icon.addEventListener('click', (ev) => {
        ev.stopPropagation(); // evita fechar imediatamente
        showFilterBox(Array.from(headRow.cells).indexOf(th));
      });
      th.appendChild(icon);
    });
  }

  function showFilterBox(colIndex) {
    removeFilterBox();

    // coleta valores únicos da coluna (já renderizada)
    const rows = Array.from(tabelaBody.querySelectorAll('tr')).filter(r => r.style.display !== 'none');
    const values = [...new Set(rows.map(r => (r.cells[colIndex] ? r.cells[colIndex].textContent.trim() : '')))]
      .filter(v => v !== '')
      .sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));

    // cria box
    const box = document.createElement('div');
    box.id = 'filterBox';
    box.style.position = 'absolute';
    box.style.background = '#fff';
    box.style.border = '1px solid #ccc';
    box.style.borderRadius = '8px';
    box.style.boxShadow = '0 6px 18px rgba(0,0,0,0.08)';
    box.style.padding = '8px';
    box.style.maxHeight = '220px';
    box.style.overflowY = 'auto';
    box.style.zIndex = 9999;
    box.style.fontFamily = 'Poppins, sans-serif';
    box.style.fontSize = '13px';
    box.style.minWidth = '160px';

    // botão "Selecionar todos / Limpar"
    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.justifyContent = 'space-between';
    controls.style.gap = '8px';
    controls.style.marginBottom = '6px';

    const selAll = document.createElement('button');
    selAll.type = 'button';
    selAll.textContent = 'Todos';
    selAll.style.cursor = 'pointer';
    selAll.style.border = 'none';
    selAll.style.background = '#f0f0f0';
    selAll.style.padding = '4px 6px';
    selAll.style.borderRadius = '6px';
    selAll.onclick = () => {
      box.querySelectorAll('input[type=checkbox]').forEach(c => c.checked = true);
      filterColumnByChecked(colIndex);
    };

    const clearAll = document.createElement('button');
    clearAll.type = 'button';
    clearAll.textContent = 'Limpar';
    clearAll.style.cursor = 'pointer';
    clearAll.style.border = 'none';
    clearAll.style.background = '#f8f8f8';
    clearAll.style.padding = '4px 6px';
    clearAll.style.borderRadius = '6px';
    clearAll.onclick = () => {
      box.querySelectorAll('input[type=checkbox]').forEach(c => c.checked = false);
      filterColumnByChecked(colIndex);
    };

    controls.appendChild(selAll);
    controls.appendChild(clearAll);
    box.appendChild(controls);

    // adiciona cada valor com checkbox
    values.forEach(v => {
      const label = document.createElement('label');
      label.style.display = 'block';
      label.style.cursor = 'pointer';
      label.style.padding = '4px 6px';
      label.style.borderRadius = '6px';
      label.onmouseover = () => label.style.background = '#f3e8ff';
      label.onmouseout = () => label.style.background = 'transparent';

      const chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.value = v;
      chk.checked = true;
      chk.style.marginRight = '8px';
      chk.onchange = () => filterColumnByChecked(colIndex);

      label.appendChild(chk);
      label.appendChild(document.createTextNode(v));
      box.appendChild(label);
    });

    document.body.appendChild(box);

    // posiciona a box embaixo do TH clicado
    const th = tabela.tHead.rows[0].cells[colIndex];
    const rect = th.getBoundingClientRect();
    const docRect = document.documentElement.getBoundingClientRect();
    // Ajusta para caber na janela
    let left = rect.left;
    if (left + box.offsetWidth > window.innerWidth) {
      left = Math.max(8, window.innerWidth - box.offsetWidth - 8);
    }
    box.style.left = left + 'px';
    box.style.top = (rect.bottom + window.scrollY) + 'px';
  }

  function filterColumnByChecked(colIndex) {
    const box = document.getElementById('filterBox');
    if (!box) return;
    const checked = Array.from(box.querySelectorAll('input[type=checkbox]'))
      .filter(i => i.checked).map(i => i.value);

    // se nenhum marcado, esconde tudo
    const rows = Array.from(tabelaBody.querySelectorAll('tr'));
    rows.forEach(r => {
      const cell = r.cells[colIndex];
      const val = cell ? cell.textContent.trim() : '';
      r.style.display = (checked.length === 0) ? 'none' : (checked.includes(val) ? '' : 'none');
    });
  }

  // fecha a caixa ao clicar fora
  document.addEventListener('click', (e) => {
    const box = document.getElementById('filterBox');
    if (!box) return;
    if (box.contains(e.target)) return;
    const isTh = !!e.target.closest('th');
    if (!isTh) removeFilterBox();
  });

  /* ----------------- renderização da tabela (mantida e só adiciona Edit/Ações) ----------------- */
  function renderTable() {
    // antes de desenhar, fecha qualquer filterBox aberto
    removeFilterBox();

    tabelaBody.innerHTML = '';
    const arr = JSON.parse(localStorage.getItem('registros')) || [];

    arr.forEach((r, i) => {
      const tr = document.createElement('tr');

      // Coluna Editar (ícone) — primeira coluna
      const tdEdit = document.createElement('td');
      const btnEdit = document.createElement('button');
      btnEdit.innerHTML = '<i class="fa-solid fa-pen"></i>'; // ícone pequeno
      btnEdit.title = 'Editar registro';
      btnEdit.onclick = () => location.href = `edit.html?idx=${i}`;
      tdEdit.appendChild(btnEdit);
      tr.appendChild(tdEdit);

      // Colunas de dados — mantém ordem original
      ['nome_cliente', 'dt_entrada', 'status_lead', 'etapa_funil', 'dtfechamento', 'status_pagamento', 'observacoes']
        .forEach(key => {
          const td = document.createElement('td');
          let txt = r[key] || '';
          if ((key === 'dt_entrada' || key === 'dtfechamento') && txt) txt = formatBRDate(txt);
          if (key === 'etapa_funil' && txt) txt = formatBRMoney(txt);

          if (key === 'status_pagamento') {
            const slug = txt.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
            const span = document.createElement('span');
            span.textContent = txt;
            span.classList.add('status-badge', `status-${slug}`);
            td.appendChild(span);
          } else {
            td.textContent = txt;
          }

          tr.appendChild(td);
        });

      // Coluna Ações (apenas download e excluir — sem "Editar")
      const tdA = document.createElement('td');
      const btnDownload = document.createElement('button');
      btnDownload.innerHTML = '<i class="fa-solid fa-download"></i>';
      btnDownload.title = 'Exportar registro';
      btnDownload.onclick = () => downloadSingle(i);

      const btnExcluir = document.createElement('button');
      btnExcluir.innerHTML = '<i class="fa-solid fa-trash"></i>';
      btnExcluir.title = 'Excluir registro';
      btnExcluir.onclick = () => {
        const a = JSON.parse(localStorage.getItem('registros')) || [];
        a.splice(i, 1);
        localStorage.setItem('registros', JSON.stringify(a));
        renderTable();
        verificarTamanhoStorage();
      };

      tdA.append(btnDownload, document.createTextNode(' '), btnExcluir);
      tr.appendChild(tdA);

      tabelaBody.appendChild(tr);
    });

    // garante que exista th "Editar" no cabeçalho e adiciona ícones
    ensureEditarHeader();
    addFilterIcons();
  }

  /* ----------------- export / xlsx (mantidos) ----------------- */
  function buildWorkbook(regs, name) {
    const header = ['Nome do Cliente','Data de Entrada','Status do Lead','Valor do Orçamento','Data de Fechamento','Status do Pagamento','Observações'];
    const aoa = [header].concat(regs.map(r => [
      r.nome_cliente,
      r.dt_entrada ? new Date(r.dt_entrada) : null,
      r.status_lead,
      parseCurrency(r.etapa_funil),
      r.dtfechamento ? new Date(r.dtfechamento) : null,
      r.status_pagamento,
      r.observacoes
    ]));
    const ws = XLSX.utils.aoa_to_sheet(aoa, { cellDates: true });
    ws['!cols'] = [{wch:20},{wch:12},{wch:15},{wch:15},{wch:12},{wch:15},{wch:30}];
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      const cellB = ws[XLSX.utils.encode_cell({r:R,c:1})];
      if (cellB && cellB.t === 'd') cellB.z = 'dd/mm/yyyy';
      const cellD = ws[XLSX.utils.encode_cell({r:R,c:3})];
      if (cellD && cellD.t === 'n') cellD.z = 'R$ #,##0.00';
      const cellE = ws[XLSX.utils.encode_cell({r:R,c:4})];
      if (cellE && cellE.t === 'd') cellE.z = 'dd/mm/yyyy';
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, name);
    return wb;
  }

  function downloadSingle(i) {
    const arr = JSON.parse(localStorage.getItem('registros')) || [];
    const wb = buildWorkbook([arr[i]], 'Registro');
    const name = (arr[i].nome_cliente || '').trim().replace(/[^\w]+/g, '_');
    XLSX.writeFile(wb, `Cliente_${name}.xlsx`);
  }

  btnExportarTodos.onclick = () => {
    const arr = JSON.parse(localStorage.getItem('registros')) || [];
    if (!arr.length) return alert('Não há registros para exportar.');
    const wb = buildWorkbook(arr, 'Todos_Registros');
    XLSX.writeFile(wb, 'Todos_Registros.xlsx');
  };

  /* ----------------- formatação do campo valor (mantida) ----------------- */
  if (inputValor) {
    inputValor.addEventListener('blur', () => {
      inputValor.value = formatBRMoney(inputValor.value);
    });
    inputValor.addEventListener('focus', () => {
      inputValor.value = (inputValor.value || '').toString().replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.');
    });
  }

  /* ----------------- inicialização ----------------- */
  renderTable();
  verificarTamanhoStorage();
});
