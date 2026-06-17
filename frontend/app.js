/**
 * Frontend para CRUD de productos de la tienda de perritos con diseño premium.
 */

const API_BASE = "/api/productos";

/*para esto\*/

let editandoId = null;
let statusTimeout = null;

const tbody = document.getElementById("tbodyProductos");
const btnCargar = document.getElementById("btnCargar");
const btnGuardar = document.getElementById("btnGuardar");
const btnCancelar = document.getElementById("btnCancelar");
const formTitle = document.getElementById("formTitle");
const statusDiv = document.getElementById("status");

const inputNombre = document.getElementById("nombre");
const inputDescripcion = document.getElementById("descripcion");
const inputPrecio = document.getElementById("precio");
const inputStock = document.getElementById("stock");

// Configurar estado (notificación flotante auto-ocultable)
function setStatus(mensaje, tipo = "ok") {
  if (statusTimeout) clearTimeout(statusTimeout);

  statusDiv.textContent = mensaje;
  statusDiv.className = "status " + tipo;

  // Ocultar automáticamente después de 4 segundos
  statusTimeout = setTimeout(() => {
    statusDiv.textContent = "";
    statusDiv.className = "status";
  }, 4000);
}

// Cargar productos desde el backend
async function cargarProductos() {
  try {
    // Mostrar skeleton loader
    tbody.innerHTML = `
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
    `;

    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error("Error al cargar productos");
    const data = await res.json();
    renderProductos(data);
    setStatus("Productos cargados correctamente.", "ok");
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `
      <div class="empty-state">
        <span class="material-symbols-rounded">cloud_off</span>
        <p>No se pudieron cargar los productos. ¿Está el backend levantado?</p>
      </div>
    `;
    setStatus("Error de conexión con el servidor.", "error");
  }
}

// Renderizar productos como tarjetas elegantes
function renderProductos(productos) {
  tbody.innerHTML = "";

  // Actualizar contador del inventario
  const countBadge = document.getElementById("product-count");
  if (countBadge) {
    countBadge.textContent = `${productos.length} ${productos.length === 1 ? 'producto' : 'productos'}`;
  }

  if (productos.length === 0) {
    tbody.innerHTML = `
      <div class="empty-state">
        <span class="material-symbols-rounded">shopping_cart_off</span>
        <p>No hay productos registrados en la tienda.</p>
      </div>
    `;
    return;
  }

  productos.forEach((p) => {
    const card = document.createElement("div");
    card.className = "product-card";

    // Formatear estado de stock
    let stockClass = "in-stock";
    let stockText = `En Stock (${p.stock})`;
    if (p.stock === 0) {
      stockClass = "out-of-stock";
      stockText = "Agotado";
    } else if (p.stock <= 5) {
      stockClass = "low-stock";
      stockText = `Bajo Stock (${p.stock})`;
    }

    // Gradientes decorativos para la cabecera de las tarjetas basándose en el ID
    const gradients = [
      'linear-gradient(135deg, #c7d2fe 0%, #a5b4fc 100%)',
      'linear-gradient(135deg, #fde68a 0%, #fcd34d 100%)',
      'linear-gradient(135deg, #a7f3d0 0%, #6ee7b7 100%)',
      'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)',
      'linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 100%)'
    ];
    const headerGradient = gradients[p.id % gradients.length];

    card.innerHTML = `
      <div class="card-header-decor" style="background: ${headerGradient}">
        <span class="material-symbols-rounded card-decor-icon">pets</span>
        <span class="product-id-badge">ID #${p.id}</span>
      </div>
      <div class="card-content">
        <h3 class="product-title">${p.nombre}</h3>
        <p class="product-desc">${p.descripcion || "Sin descripción disponible."}</p>
        <div class="product-meta">
          <div class="product-price">$${Number(p.precio).toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</div>
          <span class="stock-badge ${stockClass}">${stockText}</span>
        </div>
      </div>
      <div class="card-actions">
        <button data-id="${p.id}" class="btn-card-edit">
          <span class="material-symbols-rounded">edit</span>
          Editar
        </button>
        <button data-id="${p.id}" class="btn-card-delete">
          <span class="material-symbols-rounded">delete</span>
          Eliminar
        </button>
      </div>
    `;

    tbody.appendChild(card);
  });

  // Asignar eventos a los botones de editar y eliminar
  document.querySelectorAll(".btn-card-edit").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      editarProducto(id);
    });
  });

  document.querySelectorAll(".btn-card-delete").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      if (confirm("¿Seguro que deseas eliminar este producto?")) {
        eliminarProducto(id);
      }
    });
  });
}

// Limpiar el formulario
function limpiarFormulario() {
  editandoId = null;
  formTitle.textContent = "Nuevo producto";
  inputNombre.value = "";
  inputDescripcion.value = "";
  inputPrecio.value = "";
  inputStock.value = "";
}

// Obtener datos ingresados en el formulario
function obtenerDatosFormulario() {
  return {
    nombre: inputNombre.value.trim(),
    descripcion: inputDescripcion.value.trim(),
    precio: parseFloat(inputPrecio.value),
    stock: parseInt(inputStock.value, 10),
  };
}

// Validar datos de entrada
function validarProducto(prod) {
  if (!prod.nombre) return "El nombre es obligatorio.";
  if (isNaN(prod.precio) || prod.precio < 0) return "El precio debe ser mayor o igual a 0.";
  if (isNaN(prod.stock) || prod.stock < 0) return "El stock debe ser mayor o igual a 0.";
  return null;
}

// Guardar o actualizar producto
async function guardarProducto() {
  const producto = obtenerDatosFormulario();
  const error = validarProducto(producto);
  if (error) {
    setStatus(error, "error");
    return;
  }

  try {
    let res;
    if (editandoId) {
      // Actualizar
      res = await fetch(`${API_BASE}/${editandoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(producto),
      });
    } else {
      // Crear
      res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(producto),
      });
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "Error al guardar el producto");
    }

    const mensaje = editandoId ? "Producto actualizado correctamente." : "Producto creado correctamente.";
    limpiarFormulario();
    await cargarProductos();
    setStatus(mensaje, "ok");
  } catch (err) {
    console.error(err);
    setStatus("Ocurrió un error al guardar el producto.", "error");
  }
}

// Cargar datos en el formulario para editar
async function editarProducto(id) {
  try {
    const res = await fetch(`${API_BASE}/${id}`);
    if (!res.ok) throw new Error("No se pudo obtener el producto");
    const p = await res.json();
    editandoId = p.id;
    formTitle.textContent = `Editar producto #${p.id}`;
    inputNombre.value = p.nombre;
    inputDescripcion.value = p.descripcion || "";
    inputPrecio.value = p.precio;
    inputStock.value = p.stock;
    setStatus("Editando producto.", "ok");

    // Enfocar el primer input al editar para mejorar UX
    inputNombre.focus();
  } catch (err) {
    console.error(err);
    setStatus("No se pudo cargar el producto para editarlo.", "error");
  }
}

// Eliminar un producto
async function eliminarProducto(id) {
  try {
    const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Error al eliminar producto");
    await cargarProductos();
    setStatus("Producto eliminado correctamente.", "ok");
  } catch (err) {
    console.error(err);
    setStatus("No se pudo eliminar el producto.", "error");
  }
}

// Asignar manejadores de eventos
btnCargar.addEventListener("click", cargarProductos);
btnGuardar.addEventListener("click", guardarProducto);
btnCancelar.addEventListener("click", () => {
  limpiarFormulario();
  setStatus("Edición cancelada.", "ok");
});

// Cargar lista al inicio de la página
cargarProductos();
