package com.serviteca.modelos;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "factura")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Factura {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idfactura")
    private Integer idFactura;

    @CreationTimestamp
    @Column(name = "fecha", nullable = false, updatable = false)
    private LocalDate fecha;

    @CreationTimestamp
    @Column(name = "fecha_generacion", nullable = false, updatable = false)
    private LocalDateTime fechaGeneracion;

    @Column(name="numero_factura", length=40, unique=true) private String numeroFactura;
    @Column(name="prefijo", length=10) private String prefijo;
    @Column(name="numero_autorizacion", length=80) private String numeroAutorizacion;
    @Column(name="rango_desde") private Long rangoDesde;
    @Column(name="rango_hasta") private Long rangoHasta;
    @Column(name="vigencia_desde") private LocalDate vigenciaDesde;
    @Column(name="vigencia_hasta") private LocalDate vigenciaHasta;
    @Column(name="fecha_expedicion") private LocalDateTime fechaExpedicion;
    @Column(name="estado_validacion_dian", nullable=false, length=40) private String estadoValidacionDian="PENDIENTE_CONFIGURACION_DIAN";
    @Column(name="razon_social_emisor", length=160) private String razonSocialEmisor;
    @Column(name="nit_emisor", length=30) private String nitEmisor;
    @Column(name="direccion_emisor", length=180) private String direccionEmisor;
    @Column(name="ciudad_emisor", length=80) private String ciudadEmisor;
    @Column(name="telefono_emisor", length=30) private String telefonoEmisor;
    @Column(name="correo_emisor", length=100) private String correoEmisor;
    @Column(name="nombre_adquirente", length=120) private String nombreAdquirente;
    @Column(name="tipo_doc_adquirente", length=30) private String tipoDocAdquirente;
    @Column(name="numero_doc_adquirente", length=30) private String numeroDocAdquirente;
    @Column(name="direccion_adquirente", length=180) private String direccionAdquirente;
    @Column(name="ciudad_adquirente", length=80) private String ciudadAdquirente;
    @Column(name="telefono_adquirente", length=30) private String telefonoAdquirente;
    @Column(name="correo_adquirente", length=100) private String correoAdquirente;
    @Column(name="responsabilidades_fiscales", length=200) private String responsabilidadesFiscales;
    @Column(name="plazo_dias") private Integer plazoDias;
    @Column(name="iva_total", nullable=false, precision=12, scale=2) private BigDecimal ivaTotal=BigDecimal.ZERO;

    @DecimalMin(value = "0.0")
    @Column(name = "subtotal", nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    @DecimalMin(value = "0.0")
    @Column(name = "total", nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    @Column(name = "forma_pago", length = 40)
    private String formaPago = "Contado";

    @Column(name = "medio_pago", length = 60)
    private String medioPago = "Efectivo";

    @NotNull(message = "El usuario es obligatorio")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "idusuario",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_factura_usuario")
    )
    @JsonIgnoreProperties({
            "facturas",
            "vehiculos",
            "hibernateLazyInitializer",
            "handler"
    })
    private Usuario usuario;

    // Se quitó @JsonIgnore y se colocó @JsonIgnoreProperties para cortar el bucle
    @NotNull(message = "La cita es obligatoria")
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "idcita",
            nullable = false,
            unique = true,
            foreignKey = @ForeignKey(name = "fk_factura_cita")
    )
    @JsonIgnoreProperties({
            "factura",
            "hibernateLazyInitializer",
            "handler"
    })
    private Cita cita;

    @OneToMany(mappedBy = "factura", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties("factura")
    private List<DetalleFactura> detalles;

    @PrePersist
    public void calcularTotal() {
        if (subtotal != null) this.total = subtotal.add(ivaTotal == null ? BigDecimal.ZERO : ivaTotal)
                .setScale(2, java.math.RoundingMode.HALF_UP);
    }

    @PreUpdate
    public void impedirEdicionDeFacturaEmitida() {
        throw new IllegalStateException("Las facturas emitidas son inmutables; registre pagos en PagoFactura.");
    }
}
