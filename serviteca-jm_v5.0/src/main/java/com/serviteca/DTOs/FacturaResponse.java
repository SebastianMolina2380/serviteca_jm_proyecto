package com.serviteca.DTOs;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record FacturaResponse(Integer idFactura, String numeroFactura, String prefijo,
        String numeroAutorizacion, Long rangoDesde, Long rangoHasta, LocalDate vigenciaDesde,
        LocalDate vigenciaHasta, ParteFiscal emisor, ParteFiscal adquirente,
        LocalDateTime fechaGeneracion, LocalDateTime fechaExpedicion, String estadoValidacionDian,
        List<Detalle> detalles, BigDecimal subtotal, BigDecimal ivaTotal, List<Iva> ivaDiscriminado,
        BigDecimal total, String formaPago, String medioPago, Integer plazoDias,
        BigDecimal pagado, BigDecimal saldoPendiente, String estadoPago, List<Pago> pagos,
        String responsabilidadesFiscales, DatosSoftware software, String cita) {
    public record ParteFiscal(String razonSocial, String tipoDocumento, String numeroDocumento,
                              String direccion, String ciudad, String telefono, String correo) {}
    public record Detalle(int item, String codigo, String unidadMedida, String descripcion,
                          int cantidad, BigDecimal valorUnitario, BigDecimal base,
                          BigDecimal tarifaIva, BigDecimal iva, BigDecimal total) {}
    public record Iva(BigDecimal tarifa, BigDecimal base, BigDecimal valor) {}
    public record Pago(Long idPago, BigDecimal monto, String metodo, LocalDateTime fecha) {}
    public record DatosSoftware(String nombre, String fabricante, String nitFabricante,
                                String proveedorTecnologico, String nitProveedorTecnologico) {}
}
