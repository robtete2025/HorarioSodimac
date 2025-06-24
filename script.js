const DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const CLAVES = { jefe: "sodimac", viewer: "plazanorte" };

let trabajadores = [];

async function iniciarSesion() {
  const clave = document.getElementById("clave").value.trim();
  let rol = null;
  if (clave === CLAVES.jefe) rol = "jefe";
  else if (clave === CLAVES.viewer) rol = "viewer";

  if (rol) {
    localStorage.setItem("rol", rol);
    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "block";
    await cargarTrabajadores();
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

async function cargarTrabajadores() {
  const snapshot = await db.collection("trabajadores").get();
  trabajadores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  trabajadores.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
  mostrarTabla();
}

async function guardarTrabajador(trabajador) {
  if (trabajador.id) {
    const id = trabajador.id;
    const data = { ...trabajador };
    delete data.id;
    await db.collection("trabajadores").doc(id).set(data);
  } else {
    const docRef = await db.collection("trabajadores").add(trabajador);
    trabajador.id = docRef.id;
  }
  await cargarTrabajadores();
}

async function agregarTrabajador() {
  const nombre = prompt("Nombre del trabajador:");
  if (nombre && nombre.trim() !== "") {
    const nuevo = { nombre: nombre.trim(), horario: {} };
    await guardarTrabajador(nuevo);
  }
}

async function eliminarTrabajador(id) {
  if (confirm("¿Seguro que quieres eliminar este trabajador?")) {
    await db.collection("trabajadores").doc(id).delete();
    await cargarTrabajadores();
  }
}

async function actualizarCampo(id, dia, campo, valor) {
  const trabajador = trabajadores.find(t => t.id === id);
  if (!trabajador) return;

  if (!trabajador.horario) trabajador.horario = {};
  if (!trabajador.horario[dia]) trabajador.horario[dia] = {};

  trabajador.horario[dia][campo] = valor;

  await guardarTrabajador(trabajador);
}

function mostrarTabla() {
  const rol = localStorage.getItem("rol");
  const filtro = document.getElementById("busqueda").value.toLowerCase();
  const filtrados = trabajadores.filter(trab => trab.nombre.toLowerCase().includes(filtro));

  let html = `<h2>MALLA DE TRABAJADORES</h2><table border="1" cellpadding="5" cellspacing="0"><thead>
    <tr><th>Nombre</th>${DIAS.map(d => `<th>${d.charAt(0).toUpperCase() + d.slice(1)}</th>`).join('')}<th>Acción</th></tr>
  </thead><tbody>`;

  filtrados.forEach(trab => {
    html += `<tr><td>${trab.nombre}</td>`;
    DIAS.forEach(dia => {
      const h = trab.horario?.[dia] || {};
      if (rol === "jefe") {
        const campos = ["entrada", "salida", "refrigerio", "capacitacion", "lactancia", "fecha"];
        const inputs = campos.map(campo => {
          const valor = h[campo] || "";
          let color = "";
          if (["libre", "vacaciones"].includes(valor.toLowerCase())) {
            color = "background-color: yellow;";
          }
          const placeholder = campo === "fecha" ? "dd/mm" : campo.charAt(0).toUpperCase() + campo.slice(1);
          return `<input style="width: 70px; ${color}" placeholder="${placeholder}" value="${valor}" onchange="actualizarCampo('${trab.id}', '${dia}', '${campo}', this.value)">`;
        }).join("");
        html += `<td>${inputs}</td>`;
      } else {
        html += `<td style="font-size: 0.8em; line-height: 1.2em;">
          Entrada: ${h.entrada || '-'}<br>
          Salida: ${h.salida || '-'}<br>
          Refrigerio: ${h.refrigerio || '-'}<br>
          Capacitación: ${h.capacitacion || '-'}<br>
          Lactancia: ${h.lactancia || '-'}<br>
          Fecha: ${h.fecha || '-'}
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

function exportarExcel() {
  alert("Exportar a Excel aún no implementado en esta versión.");
}

window.onload = () => {
  if (localStorage.getItem("rol")) {
    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "block";
    cargarTrabajadores();
    mostrarBotonesSegunRol();
  }
};
