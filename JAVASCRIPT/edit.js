// JAVASCRIPT/edit.js

document.addEventListener('DOMContentLoaded', () => {
  const url = new URL(window.location.href);
  const idx = parseInt(url.searchParams.get('idx'), 10);
  const registros = JSON.parse(localStorage.getItem('registros')) || [];
  const rec = registros[idx];
  const form = document.getElementById('editForm');
  const cancelBtn = document.getElementById('cancelBtn');

  // Preenche o formulário com os dados existentes
  if (rec) {
    Object.keys(rec).forEach(key => {
      const inp = form.elements[key];
      if (inp) inp.value = rec[key];
    });
  }

  // Cancelar leva de volta à página principal
  cancelBtn.onclick = () => {
    window.location.href = 'index.html';
  };

  // Ao submeter, salva alterações e retorna
  form.onsubmit = (e) => {
    e.preventDefault();
    Object.keys(rec).forEach(key => {
      const inp = form.elements[key];
      if (inp) rec[key] = inp.value;
    });
    registros[idx] = rec;
    localStorage.setItem('registros', JSON.stringify(registros));
    window.location.href = 'index.html';
  };
});
