package com.serviteca.modelos;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "detalle_factura")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class DetalleFactura {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "iddetallefactura")
    private Integer idDetalleFactura;

    @NotBlank(message = "El nombre del item es obligatorio")
    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    @Min(value = 1, message = "La cantidad debe ser al menos 1")
    @Column(name = "cantidad", nullable = false)
    private Integer cantidad;

    @DecimalMin(value = "0.0", message = "El valor no puede ser negativo")
    @Column(name = "valor", nullable = false, precision = 12, scale = 2)
    private BigDecimal valor;

    @DecimalMin(value = "0.0", message = "El subtotal no puede ser negativo")
    @Column(name = "subtotal", nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "idfactura",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_detalle_factura")
    )
    @JsonIgnoreProperties({
            "detalles",
            "hibernateLazyInitializer",
            "handler"
    })
    private Factura factura;

    // Relación opcional con Servicio
    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(
            name = "idservicio",
            nullable = true,
            foreignKey = @ForeignKey(name = "fk_detalle_servicio")
    )
    @JsonIgnoreProperties({
            "productos",
            "inventarios",
            "citas",
            "vehiculo",
            "hibernateLazyInitializer",
            "handler"
    })
    private Servicio servicio;

    // Relación opcional con Producto
    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(
            name = "idproducto",
            nullable = true,
            foreignKey = @ForeignKey(name = "fk_detalle_producto")
    )
    @JsonIgnoreProperties({
            "proveedor",
            "hibernateLazyInitializer",
            "handler"
    })
    private Producto producto;

    @PrePersist
    @PreUpdate
    public void calcularSubtotal() {
        if (cantidad != null && valor != null) {
            this.subtotal = valor
                    .multiply(BigDecimal.valueOf(cantidad))
                    .setScale(2, java.math.RoundingMode.HALF_UP);
        }
    }
}