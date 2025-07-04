// JAVASCRIPT/script.js

document.addEventListener('DOMContentLoaded', () => {
  const btnCadastro = document.getElementById('btn_cadastro');
  const formContainer = document.getElementById('form');
  const btnVisualizar = document.querySelector('.btn_visualizar button');
  const visualizarContainer = document.getElementById('visualizarContainer');
  const form = document.getElementById('formElement');
  const tabelaBody = document.querySelector('#tabela_registros tbody');
  const btnExportarTodos = document.getElementById('btn_exportar_todos');
  const inputValor = document.getElementById('etapa_funil');

  function parseCurrency(v) {
    let num = v.replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.');
    return parseFloat(num) || 0;
  }

  function formatBRDate(i) {
    if (!i) return '';
    const [y, m, d] = i.split('-');
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
    form.elements['nome_cliente'].focus();
  }

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
      nome_cliente: form.nome_cliente.value,
      dt_entrada: form.dt_entrada.value,
      status_lead: form.status_lead.value,
      etapa_funil: form.etapa_funil.value,
      dtfechamento: form.dtfechamento.value,
      status_pagamento: form.status_pagamento.value,
      observacoes: form.observacoes.value
    };
    const arr = JSON.parse(localStorage.getItem('registros')) || [];
    arr.push(data);
    localStorage.setItem('registros', JSON.stringify(arr));
    alert('Cadastrado com sucesso!');
    verificarTamanhoStorage();
    limparFormulario();
    renderTable();
  };

  function renderTable() {
    tabelaBody.innerHTML = '';
    const arr = JSON.parse(localStorage.getItem('registros')) || [];
    arr.forEach((r, i) => {
      const tr = document.createElement('tr');

      ['nome_cliente', 'dt_entrada', 'status_lead', 'etapa_funil', 'dtfechamento', 'status_pagamento', 'observacoes']
        .forEach(key => {
          const td = document.createElement('td');
          let txt = r[key] || '';
          if (key === 'dt_entrada' || key === 'dtfechamento') txt = formatBRDate(txt);
          if (key === 'etapa_funil') txt = formatBRMoney(txt);

          if (key === 'status_pagamento') {
            const slug = txt
              .toLowerCase()
              .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
              .replace(/\s+/g, '-');
            const span = document.createElement('span');
            span.textContent = txt;
            span.classList.add('status-badge', `status-${slug}`);
            td.appendChild(span);
          } else {
            td.textContent = txt;
          }

          tr.appendChild(td);
        });

      const tdA = document.createElement('td');
      const btnE = document.createElement('button');
      btnE.textContent = 'Editar';
      btnE.onclick = () => location.href = `edit.html?idx=${i}`;
      const btnD = document.createElement('button');
      btnD.textContent = 'Salvar Registro';
      btnD.onclick = () => downloadSingle(i);
      const btnX = document.createElement('button');
      btnX.textContent = 'Excluir';
      btnX.onclick = () => {
        const a = JSON.parse(localStorage.getItem('registros')) || [];
        a.splice(i, 1);
        localStorage.setItem('registros', JSON.stringify(a));
        renderTable();
        verificarTamanhoStorage();
      };
      tdA.append(btnE, document.createTextNode(' '), btnD, document.createTextNode(' '), btnX);
      tr.appendChild(tdA);

      tabelaBody.appendChild(tr);
    });
  }

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
    const name = arr[i].nome_cliente.trim().replace(/[^\w]+/g, '_');
    XLSX.writeFile(wb, `Cliente_${name}.xlsx`);
  }

  btnExportarTodos.onclick = () => {
    const arr = JSON.parse(localStorage.getItem('registros')) || [];
    if (!arr.length) return alert('Não há registros para exportar.');
    const wb = buildWorkbook(arr, 'Todos_Registros');
    XLSX.writeFile(wb, 'Todos_Registros.xlsx');
  };

  inputValor.addEventListener('blur', () => {
    inputValor.value = formatBRMoney(inputValor.value);
  });
  inputValor.addEventListener('focus', () => {
    inputValor.value = inputValor.value.replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.');
  });

  renderTable();
  verificarTamanhoStorage();
});
