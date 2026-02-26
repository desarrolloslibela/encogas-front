import { useEffect, useState } from "react";
import { http } from "../../api/http";

export default function Ventas() {

  const [clientes, setClientes] = useState([]);
  const [envases, setEnvases] = useState([]);
  const [items, setItems] = useState([]);
  const [clienteId, setClienteId] = useState("");
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");
  const [montoCobrado, setMontoCobrado] = useState(0);
  const [observacion, setObservacion] = useState("");
  const [jornadaId, setJornadaId] = useState("");
  const [jornadaInfo, setJornadaInfo] = useState(null);


  // cargar combos
  useEffect(() => {
    http.get("/clientes?estado=ACTIVOS").then(r => setClientes(r.data));
    http.get("/tipos-envase?estado=ACTIVOS").then(r => setEnvases(r.data));
    http.get("/jornadas/mi-abierta")
      .then(r => {
        setJornadaId(String(r.data.id));
        setJornadaInfo(r.data);
      })
      .catch(() => {
        setJornadaId("");
        setJornadaInfo(null);
      });


  }, []);

  function agregarItem() {
    setItems([...items, {
      tipoEnvaseId: "",
      estadoEnvase: "LLENO",
      cantidad: 1,
      precioUnitario: 0
    }]);
  }

  function actualizarItem(index, campo, valor) {
    const copia = [...items];
    copia[index][campo] = valor;
    setItems(copia);
  }

  function eliminarItem(index) {
    const copia = [...items];
    copia.splice(index, 1);
    setItems(copia);
  }

  function calcularTotal() {
    return items.reduce((acc, it) =>
      acc + (it.cantidad * it.precioUnitario), 0
    );
  }

  async function guardarVenta() {
    try {

      const body = {
        jornadaId: Number(jornadaId),
        clienteId: Number(clienteId),
        metodoPago,
        montoCobrado: Number(montoCobrado),
        observacion,
        items: items.map(it => ({
          tipoEnvaseId: Number(it.tipoEnvaseId),
          estadoEnvase: it.estadoEnvase,
          cantidad: Number(it.cantidad),
          precioUnitario: Number(it.precioUnitario)
        }))
      };

      await http.post("/ventas", body);

      alert("Venta registrada correctamente");

      // reset
      setItems([]);
      setClienteId("");
      setMontoCobrado(0);
      setObservacion("");

    } catch (e) {
      alert(e.response?.data?.message || "Error al registrar venta");
    }
  }

  const total = calcularTotal();

  return (
    <div className="container mt-4">

      <h2>Registrar Venta</h2>

      <div className="card p-3 mb-3">

        
        <label>Cliente</label>
        <select className="form-control"
          value={clienteId}
          onChange={e => setClienteId(e.target.value)}
        >
          <option value="">Seleccionar...</option>
          {clientes.map(c => (
            <option key={c.id} value={c.id}>
              {c.razonSocial}
            </option>
          ))}
        </select>

      </div>

      <div className="card p-3 mb-3">
        <h5>Productos</h5>

        <button className="btn btn-primary mb-2" onClick={agregarItem}>
          Agregar envase
        </button>

        {items.map((it, i) => (
          <div key={i} className="row mb-2">

            <div className="col-4">
              <select className="form-control"
                value={it.tipoEnvaseId}
                onChange={e => actualizarItem(i, "tipoEnvaseId", e.target.value)}
              >
                <option value="">Tipo envase</option>
                {envases.map(te => (
                  <option key={te.id} value={te.id}>
                    {te.nombre} ({te.capacidadKg}kg)
                  </option>
                ))}
              </select>
            </div>

            <div className="col-2">
              <input type="number" className="form-control"
                value={it.cantidad}
                onChange={e => actualizarItem(i, "cantidad", e.target.value)}
              />
            </div>

            <div className="col-3">
              <input type="number" className="form-control"
                placeholder="Precio"
                value={it.precioUnitario}
                onChange={e => actualizarItem(i, "precioUnitario", e.target.value)}
              />
            </div>

            <div className="col-2">
              <strong>${it.cantidad * it.precioUnitario}</strong>
            </div>

            <select className="form-control"
              value={it.estadoEnvase}
              onChange={e => actualizarItem(i, "estadoEnvase", e.target.value)}
            >
              <option value="LLENO">Lleno</option>
              <option value="VACIO">Vacío</option>
            </select>

            <div className="col-1">
              <button className="btn btn-danger"
                onClick={() => eliminarItem(i)}>
                X
              </button>
            </div>

          </div>
        ))}

        <hr />
        <h4>Total: ${total}</h4>

      </div>

      <div className="card p-3 mb-3">

        <label>Método de pago</label>
        <select className="form-control"
          value={metodoPago}
          onChange={e => setMetodoPago(e.target.value)}
        >
          <option value="EFECTIVO">Efectivo</option>
          <option value="TRANSFERENCIA">Transferencia</option>
          <option value="DEUDA">Deuda</option>
          <option value="MIXTO">Mixto</option>
        </select>

        <label className="mt-2">Monto cobrado</label>
        <input type="number" className="form-control"
          value={montoCobrado}
          onChange={e => setMontoCobrado(e.target.value)}
        />

        <label className="mt-2">Observación</label>
        <input className="form-control"
          value={observacion}
          onChange={e => setObservacion(e.target.value)}
        />

      </div>

      <button
        className="btn btn-success btn-lg"
        onClick={guardarVenta}
        disabled={!jornadaId}
      >
        Guardar Venta
      </button>

      {!jornadaId && (
        <div className="alert alert-warning mt-3">
          No tenés una jornada ABIERTA. Abrí una jornada para poder registrar ventas.
        </div>
      )}

      {jornadaInfo && (
        <div className="alert alert-info">
          Jornada #{jornadaInfo.id} - Vehículo {jornadaInfo.vehiculoPatente}
        </div>
      )}

    </div>
  );
}