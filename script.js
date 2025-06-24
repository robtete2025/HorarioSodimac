function mostrarTabla() {
  const rol = localStorage.getItem("rol");
  const filtro = document.getElementById("busqueda").value.toLowerCase();
  const filtrados = trabajadores.filter(trab => trab.nombre.toLowerCase().includes(filtro));
  filtrados.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));

  let html = `<table border="1" cellpadding="5" cellspacing="0"><thead>
    <tr><th>Nombre</th>`;

  DIAS.forEach(dia => {
    if (rol === "jefe") {
      html += `<th>
        ${dia.charAt(0).toUpperCase() + dia.slice(1)}<br>
        <input type="text" style="width: 70px;" placeholder="dd/mm" 
          onchange="actualizarFecha('${dia}', this.value)">
      </th>`;
    } else {
      const fecha = trabajadores[0]?.fechas?.[dia] || "";
      html += `<th>${dia.charAt(0).toUpperCase() + dia.slice(1)} ${fecha}</th>`;
    }
  });

  html += `<th>Acción</th></tr></thead><tbody>`;

  filtrados.forEach(trab => {
    html += `<tr><td>${trab.nombre}</td>`;
    DIAS.forEach(dia => {
      const h = trab.horario?.[dia] || {};
      if (rol === "jefe") {
        html += `<td>
          <input style="width: 70px;" placeholder="Entrada" value="${h.entrada || ''}" onchange="actualizarCampo('${trab.id}', '${dia}', 'entrada', this.value)">
          <input style="width: 70px;" placeholder="Salida" value="${h.salida || ''}" onchange="actualizarCampo('${trab.id}', '${dia}', 'salida', this.value)">
          <input style="width: 70px;" placeholder="Refrigerio" value="${h.refrigerio || ''}" onchange="actualizarCampo('${trab.id}', '${dia}', 'refrigerio', this.value)">
          <input style="width: 70px;" placeholder="Capacitación" value="${h.capacitacion || ''}" onchange="actualizarCampo('${trab.id}', '${dia}', 'capacitacion', this.value)">
          <input style="width: 70px;" placeholder="Lactancia" value="${h.lactancia || ''}" onchange="actualizarCampo('${trab.id}', '${dia}', 'lactancia', this.value)">
        </td>`;
      } else {
        html += `<td style="font-size: 0.9em; line-height: 1.2em;">
          Entrada: ${h.entrada || '-'}<br>
          Salida: ${h.salida || '-'}<br>
          Refrigerio: ${h.refrigerio || '-'}<br>
          Capacitación: ${h.capacitacion || '-'}<br>
          Lactancia: ${h.lactancia || '-'}
        </td>`;
      }
    });
    if (rol === "jefe") {
      html += `<td><button onclick="eliminarTrabajador('${trab.id}')">🗑️</button></td>`;
    } else {
      html += `<td>-</td>`;
    }
    html += `</tr>`;
  });

  html += `</tbody></table>`;
  document.getElementById("tabla").innerHTML = html;
}
