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
    @PreUpdate
    public void calcularTotal() {
        if (subtotal != null) {
            this.total = subtotal
                    .multiply(BigDecimal.valueOf(1.19))
                    .setScale(2, java.math.RoundingMode.HALF_UP);
        }
    }
}