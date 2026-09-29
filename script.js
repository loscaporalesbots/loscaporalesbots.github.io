const WHATSAPP_BASE = "https://wa.me/524793457847";
const QUEJAS_API_URL = "https://los-caporales-quejas.loscaporales-quejas-2026.workers.dev/";
const currency = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
const productos = [
    { id: 1, nombre: "Bota cobra", imagenes: ["bota1.jpg"], descripcion: "Bota vaquera de piel de cobra.", stock: 0, precio: 8500, tipo: "Piel exótica" },
    { id: 2, nombre: "Bota cocodrilo", imagenes: ["bota2.jpg", "bota2_2.jpg", "bota2_3.jpg", "bota2_4.jpg"], descripcion: "Bota vaquera de piel de cocodrilo.", stock: 1, precio: 14500, tipo: "Piel exótica" },
    { id: 3, nombre: "Bota rodeo res", imagenes: ["bota3.jpg"], descripcion: "Bota vaquera de piel de res.", stock: 1, precio: 5200, tipo: "Piel de res" },
    { id: 4, nombre: "Bota mantarraya macho", imagenes: ["bota4.jpg"], descripcion: "Bota vaquera de piel de mantarraya.", stock: 1, precio: 9800, tipo: "Piel exótica" }
];

const estado = { carrito: [], productoActual: null, indiceFoto: 0, filtro: "todos" };
const $ = (id) => document.getElementById(id);
const nodos = {
    catalogo: $("catalogo"),
    carrito: $("carrito"),
    carritoItems: $("carrito-items"),
    carritoTotal: $("carrito-total"),
    carritoContador: $("carrito-contador"),
    visor: $("visor"),
    visorImg: $("visor-img"),
    visorMiniaturas: $("visor-miniaturas"),
    btnAgregar: $("btn-agregar-carrito-float")
};

function aplicarTema(tema) {
    const modo = tema === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = modo;
    document.querySelector('meta[name="theme-color"]').content = modo === "dark" ? "#171c18" : "#20251f";
    const boton = $("tema-btn");
    boton.setAttribute("aria-label", modo === "dark" ? "Activar modo claro" : "Activar modo oscuro");
    try {
        localStorage.setItem("caporales-theme", modo);
    } catch {
        return;
    }
}

$("tema-btn").addEventListener("click", () => {
    aplicarTema(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
});

function renderCatalogo() {
    const visibles = productos.filter((producto) => estado.filtro === "todos" || producto.stock > 0);
    $("resultados").textContent = `${visibles.length} ${visibles.length === 1 ? "modelo" : "modelos"}`;
    nodos.catalogo.innerHTML = visibles.map((producto, index) => `
        <article class="product-card" style="--card-index:${index}">
            <button class="product-image-button" type="button" data-producto="${producto.id}" aria-label="Ver detalles de ${producto.nombre}">
                <img src="img/${producto.imagenes[0]}" alt="${producto.nombre}, ${producto.descripcion.toLowerCase()}" loading="lazy" decoding="async">
                <span class="product-tag ${producto.stock ? "is-available" : "is-sold-out"}">${producto.stock ? "Disponible" : "Agotada"}</span>
                <span class="image-zoom" aria-hidden="true">↗</span>
            </button>
            <div class="product-meta"><span>${producto.tipo}</span><span>0${producto.id}</span></div>
            <div class="product-title-row"><h3>${producto.nombre}</h3><strong>${currency.format(producto.precio)}</strong></div>
            <p class="product-description">${producto.descripcion}</p>
            <button class="product-detail-link" type="button" data-producto="${producto.id}">${producto.stock ? "Ver modelo" : "Consultar modelo"}<span aria-hidden="true">→</span></button>
        </article>
    `).join("");
}

function actualizarCarrito() {
    if (estado.carrito.length === 0) {
        nodos.carritoItems.innerHTML = `<div class="empty-cart"><span aria-hidden="true">—</span><p>Tu carrito está esperando<br>su primer modelo.</p></div>`;
    } else {
        nodos.carritoItems.innerHTML = estado.carrito.map((producto) => `
            <article class="carrito-item" data-id="${producto.id}">
                <img src="img/${producto.imagenes[0]}" alt="" loading="lazy">
                <div class="item-info"><strong>${producto.nombre}</strong><span>${currency.format(producto.precio)} c/u</span>
                    <div class="item-controles">
                        <button class="qty-button" type="button" data-accion="restar" aria-label="Quitar una unidad de ${producto.nombre}">−</button>
                        <span aria-live="polite">${producto.cantidad}</span>
                        <button class="qty-button" type="button" data-accion="sumar" aria-label="Agregar una unidad de ${producto.nombre}" ${producto.cantidad >= producto.stock ? "disabled" : ""}>+</button>
                        <button class="remove-button" type="button" data-accion="eliminar" aria-label="Eliminar ${producto.nombre}">Eliminar</button>
                    </div>
                </div>
                <strong class="item-subtotal">${currency.format(producto.precio * producto.cantidad)}</strong>
            </article>
        `).join("");
    }

    const total = estado.carrito.reduce((suma, producto) => suma + producto.precio * producto.cantidad, 0);
    const unidades = estado.carrito.reduce((suma, producto) => suma + producto.cantidad, 0);
    nodos.carritoTotal.textContent = currency.format(total);
    nodos.carritoContador.textContent = unidades;
    $("carrito-btn").setAttribute("aria-label", `Abrir carrito, ${unidades} ${unidades === 1 ? "artículo" : "artículos"}`);
}

function abrirProducto(id) {
    const producto = productos.find((item) => item.id === Number(id));
    if (!producto) return;
    estado.productoActual = producto;
    estado.indiceFoto = 0;
    $("visor-nombre").textContent = producto.nombre;
    $("visor-descripcion").textContent = producto.descripcion;
    $("visor-precio").textContent = currency.format(producto.precio);
    const stock = $("visor-stock");
    stock.textContent = producto.stock ? `${producto.stock} ${producto.stock === 1 ? "par disponible" : "pares disponibles"}` : "Agotada por el momento";
    stock.classList.toggle("out-of-stock", producto.stock === 0);
    nodos.btnAgregar.hidden = producto.stock === 0;
    const consulta = $("visor-consultar");
    consulta.hidden = producto.stock > 0;
    consulta.href = `${WHATSAPP_BASE}?text=${encodeURIComponent(`Hola Los Caporales, quisiera consultar disponibilidad de ${producto.nombre}.`)}`;
    nodos.visorMiniaturas.innerHTML = producto.imagenes.map((imagen, index) => `
        <button class="thumbnail-button ${index === 0 ? "is-active" : ""}" type="button" data-foto="${index}" aria-label="Ver foto ${index + 1} de ${producto.nombre}" aria-pressed="${index === 0}">
            <img src="img/${imagen}" alt="" loading="lazy" decoding="async">
        </button>
    `).join("");
    actualizarFotoVisor();
    nodos.visor.showModal();
}

function actualizarFotoVisor() {
    const imagen = estado.productoActual.imagenes[estado.indiceFoto];
    nodos.visorImg.src = `img/${imagen}`;
    nodos.visorImg.alt = `${estado.productoActual.nombre}, fotografía ${estado.indiceFoto + 1}`;
    nodos.visorMiniaturas.querySelectorAll(".thumbnail-button").forEach((boton, index) => {
        const activa = index === estado.indiceFoto;
        boton.classList.toggle("is-active", activa);
        boton.setAttribute("aria-pressed", String(activa));
    });
}

function moverFoto(direccion) {
    const total = estado.productoActual.imagenes.length;
    estado.indiceFoto = (estado.indiceFoto + direccion + total) % total;
    actualizarFotoVisor();
}

function agregarAlCarrito() {
    const producto = estado.productoActual;
    const existente = estado.carrito.find((item) => item.id === producto.id);
    if (producto.stock < 1 || (existente && existente.cantidad >= producto.stock)) return;
    if (existente) existente.cantidad += 1;
    else estado.carrito.push({ ...producto, cantidad: 1 });
    actualizarCarrito();
    nodos.visor.close();
    nodos.carrito.showModal();
}

document.addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-producto]");
    if (boton) abrirProducto(boton.dataset.producto);
});

document.querySelector(".filters").addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-filtro]");
    if (!boton) return;
    estado.filtro = boton.dataset.filtro;
    document.querySelectorAll("[data-filtro]").forEach((filtro) => {
        const activo = filtro === boton;
        filtro.classList.toggle("is-active", activo);
        filtro.setAttribute("aria-pressed", String(activo));
    });
    renderCatalogo();
});

nodos.carritoItems.addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-accion]");
    if (!boton) return;
    const articulo = boton.closest(".carrito-item");
    const indice = estado.carrito.findIndex((producto) => producto.id === Number(articulo.dataset.id));
    if (indice < 0) return;
    const producto = estado.carrito[indice];
    if (boton.dataset.accion === "sumar" && producto.cantidad < producto.stock) producto.cantidad += 1;
    if (boton.dataset.accion === "restar") producto.cantidad -= 1;
    if (boton.dataset.accion === "eliminar" || producto.cantidad < 1) estado.carrito.splice(indice, 1);
    actualizarCarrito();
});

nodos.visorMiniaturas.addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-foto]");
    if (!boton) return;
    estado.indiceFoto = Number(boton.dataset.foto);
    actualizarFotoVisor();
});

$("carrito-btn").addEventListener("click", () => {
    actualizarCarrito();
    nodos.carrito.showModal();
});
$("carrito-cerrar").addEventListener("click", () => nodos.carrito.close());
$("carrito-seguir").addEventListener("click", () => nodos.carrito.close());
$("visor-cerrar").addEventListener("click", () => nodos.visor.close());
$("visor-prev").addEventListener("click", () => moverFoto(-1));
$("visor-next").addEventListener("click", () => moverFoto(1));
nodos.btnAgregar.addEventListener("click", agregarAlCarrito);

const dialogoQuejas = $("quejas");
const formularioQuejas = $("quejas-form");
const detalleQueja = $("queja-detalle");
$("quejas-abrir").addEventListener("click", () => {
    $("queja-estado").textContent = "";
    dialogoQuejas.showModal();
});
$("quejas-cerrar").addEventListener("click", () => dialogoQuejas.close());
detalleQueja.addEventListener("input", () => {
    $("queja-caracteres").textContent = `${detalleQueja.value.length} / 1500`;
});
formularioQuejas.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const enviar = $("queja-enviar");
    const estadoQueja = $("queja-estado");
    const datos = Object.fromEntries(new FormData(formularioQuejas));
    if (window.location.protocol === "file:") {
        estadoQueja.textContent = "La página está abierta como archivo local. Para enviar, abre la tienda desde su sitio desplegado con /api/quejas activo.";
        return;
    }
    if (!QUEJAS_API_URL) {
        estadoQueja.textContent = "El servicio de quejas todavía no está conectado. Configura la URL pública de Cloudflare Worker.";
        return;
    }
    enviar.disabled = true;
    enviar.textContent = "Enviando…";
    estadoQueja.textContent = "";

    try {
        const respuesta = await fetch(QUEJAS_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });
        if (!respuesta.ok) {
            let resultado = {};
            try {
                resultado = await respuesta.json();
            } catch {
                resultado = {};
            }
            throw new Error(resultado.error || "El servidor rechazó la queja.");
        }
        formularioQuejas.reset();
        $("queja-caracteres").textContent = "0 / 1500";
        estadoQueja.textContent = datos.website ? "Gracias. Recibimos tu mensaje." : "Gracias. Tu queja fue enviada correctamente.";
    } catch (error) {
        estadoQueja.textContent = error.message || "No logramos conectar con el servicio de quejas.";
    } finally {
        enviar.disabled = false;
        enviar.innerHTML = 'Enviar queja <span aria-hidden="true">↗</span>';
    }
});

for (const dialogo of [nodos.carrito, nodos.visor]) {
    dialogo.addEventListener("click", (evento) => {
        if (evento.target === dialogo) dialogo.close();
    });
}

dialogoQuejas.addEventListener("click", (evento) => {
    if (evento.target === dialogoQuejas) dialogoQuejas.close();
});

$("carrito-comprar").addEventListener("click", () => {
    if (estado.carrito.length === 0) return;
    const lineas = estado.carrito.map((producto) => `- ${producto.nombre} (x${producto.cantidad}): ${currency.format(producto.precio * producto.cantidad)}`);
    const total = estado.carrito.reduce((suma, producto) => suma + producto.precio * producto.cantidad, 0);
    const mensaje = `Hola Los Caporales, me gustaría consultar este pedido:\n\n${lineas.join("\n")}\n\nTotal: ${currency.format(total)}`;
    window.open(`${WHATSAPP_BASE}?text=${encodeURIComponent(mensaje)}`, "_blank", "noopener,noreferrer");
});

renderCatalogo();
actualizarCarrito();