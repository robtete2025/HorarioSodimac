const DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const CLAVES = {
  jefe: "sodimac",
  viewer: "plazanorte"
};

let trabajadores = []; // lista cargada desde Firestore

// Iniciar sesión
async function iniciarSesion() {
  const clave = document.getElementById("clave").value.trim();
  let rol = null;
  if (clave === CLAVES.jefe) rol = "jefe";
  else if (clave === CLAVES.viewer) rol = "viewer";

  if (rol) {
    localStorage.setItem("rol", rol);
    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "block";
    await cargarTrabajadores(); // cargar desde Firestore
    mostrarBotonesSegunRol();
  } else {
    alert("Clave incorrecta");
  }
}

function cerrarSesion() {
  localStorage.removeItem("rol");
  location.reload();
}

function mostrarBotonesSegunRol() {
  const rol = localStorage.getItem("rol");
  document.querySelector("button[onclick='agregarTrabajador()']").style.display = rol === "jefe" ? "inline-block" : "none";
  document.querySelector("button[onclick='exportarExcel()']").style.display = rol === "jefe" ? "inline-block" : "none";
}

// Cargar trabajadores desde Firestore
async function cargarTrabajadores() {
  const snapshot = await db.collection("trabajadores").get();
  trabajadores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  trabajadores.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
  mostrarTabla();
}

// Guardar o actualizar trabajador en Firestore
async function guardarTrabajador(trabajador) {
  if (trabajador.id) {
    // Actualizar documento existente
    const id = trabajador.id;
    const data = { ...trabajador };
    delete data.id;
    await db.collection("trabajadores").doc(id).set(data);
  } else {
    // Crear nuevo trabajador
    const docRef = await db.collection("trabajadores").add(trabajador);
    trabajador.id = docRef.id;
  }
  await cargarTrabajadores();
}

// Agregar trabajador nuevo
async function agregarTrabajador() {
  const nombre = prompt("Nombre del trabajador:");
  if (nombre && nombre.trim() !== "") {
    const nuevo = { nombre: nombre.trim(), horario: {} };
    await guardarTrabajador(nuevo);
  }
}

// Eliminar trabajador por id
async function eliminarTrabajador(id) {
  if (confirm("¿Seguro que quieres eliminar este trabajador?")) {
    await db.collection("trabajadores").doc(id).delete();
    await cargarTrabajadores();
  }
}

// Actualizar campo horario de un trabajador y guardar
async function actualizarCampo(id, dia, campo, valor) {
  // Buscar trabajador
  const trabajador = trabajadores.find(t => t.id === id);
  if (!trabajador) return;

  if (!trabajador.horario) trabajador.horario = {};
  if (!trabajador.horario[dia]) trabajador.horario[dia] = {};

  trabajador.horario[dia][campo] = valor;

  await guardarTrabajador(trabajador);
}

// Mostrar tabla de trabajadores y horarios
function mostrarTabla() {
  const rol = localStorage.getItem("rol");
  const filtro = document.getElementById("busqueda").value.toLowerCase();

  const filtrados = trabajadores.filter(trab => trab.nombre.toLowerCase().includes(filtro));
  filtrados.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));

  let html = `<table border="1" cellpadding="5" cellspacing="0"><thead>
    <tr><th>Nombre</th>${DIAS.map(d => `<th>${d.charAt(0).toUpperCase() + d.slice(1)}</th>`).join('')}<th>Acción</th></tr>
  </thead><tbody>`;

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

// Exportar Excel: igual, con la variable trabajadores que ya carga desde Firestore
function exportarExcel() {
  const headers = ["Nombre"];
  const subHeaders = [];
  const data = [];

  DIAS.forEach(dia => {
    ["Entrada", "Salida", "Refrigerio", "Capacitación", "Lactancia"].forEach(sub => {
      headers.push(dia.charAt(0).toUpperCase() + dia.slice(1));
      subHeaders.push(sub);
    });
  });

  trabajadores.forEach(trab => {
    const fila = [trab.nombre];
    DIAS.forEach(dia => {
      const h = trab.horario?.[dia] || {};
      fila.push(
        h.entrada || "",
        h.salida || "",
        h.refrigerio || "",
        h.capacitacion || "",
        h.lactancia || ""
      );
    });
    data.push(fila);
  });

  const finalData = [headers, subHeaders, ...data];
  const worksheet = XLSX.utils.aoa_to_sheet(finalData);

  const columnWidths = finalData[0].map((_, colIndex) => {
    const maxLength = finalData.reduce((acc, row) => {
      const val = row[colIndex] ? row[colIndex].toString() : "";
      return Math.max(acc, val.length);
    }, 10);
    return { wch: maxLength + 2 };
  });
  worksheet["!cols"] = columnWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Horario");

  XLSX.writeFile(workbook, "horario.xlsx");
}

// Al cargar la página: mostrar login o app según rol
window.onload = () => {
  if (localStorage.getItem("rol")) {
    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "block";
    cargarTrabajadores();
    mostrarBotonesSegunRol();
  }
};
