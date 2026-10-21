package com.serviteca.modelos;

import jakarta.persistence.*;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name="numeracion_factura") @Getter @Setter
public class NumeracionFactura {
    @Id @Column(name="id") private Integer id;
    @Column(name="prefijo", nullable=false, length=10) private String prefijo;
    @Column(name="numero_autorizacion", nullable=false, length=80) private String numeroAutorizacion;
    @Column(name="rango_desde", nullable=false) private Long rangoDesde;
    @Column(name="rango_hasta", nullable=false) private Long rangoHasta;
    @Column(name="siguiente_numero", nullable=false) private Long siguienteNumero;
    @Column(name="vigente_desde", nullable=false) private LocalDate vigenteDesde;
    @Column(name="vigente_hasta", nullable=false) private LocalDate vigenteHasta;
}
