package com.serviteca.modelos;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "pago_factura", uniqueConstraints =
        @UniqueConstraint(name = "uk_pago_factura_idempotencia", columnNames = "clave_idempotencia"))
@Getter
@Setter
@NoArgsConstructor
public class PagoFactura {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idpago")
    private Long idPago;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idfactura", nullable = false, foreignKey = @ForeignKey(name = "fk_pago_factura"))
    @JsonIgnore
    private Factura factura;

    @Column(name = "monto", nullable = false, precision = 12, scale = 2)
    private BigDecimal monto;

    @Column(name = "metodo", nullable = false, length = 40)
    private String metodo;

    @Column(name = "fecha_pago", nullable = false)
    private LocalDate fecha;

    @Column(name = "notas", length = 500)
    private String notas;

    @Column(name = "clave_idempotencia", nullable = false, length = 80)
    private String claveIdempotencia;

    @CreationTimestamp
    @Column(name = "registrado_en", nullable = false, updatable = false)
    private LocalDateTime registradoEn;
}
