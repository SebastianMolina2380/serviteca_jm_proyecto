package com.serviteca.modelos;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "seguimiento")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Seguimiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idseguimiento")
    private Long idSeguimiento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idusuario", nullable = false)
    @JsonIgnoreProperties({
            "vehiculos",
            "facturas",
            "hibernateLazyInitializer",
            "handler"
    })
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idservicio")
    @JsonIgnoreProperties({
            "productos",
            "inventarios",
            "citas",
            "vehiculo",
            "hibernateLazyInitializer",
            "handler"
    })
    private Servicio servicio;

    @Column(name = "tipo", nullable = false, length = 30)
    private String tipo;

    @Column(name = "titulo", length = 100)
    private String titulo;

    @Column(name = "flujo", length = 100)
    private String flujo;

    @Column(name = "descripcion", length = 500)
    private String descripcion;

    @Column(name = "estado", length = 30)
    private String estado;

    @Column(name = "mensaje", length = 500)
    private String mensaje;

    @Column(name = "remitente", length = 30)
    private String remitente;

    @Column(name = "tiempoestimado")
    private Integer tiempoestimado;

    @Column(name = "leida")
    private Boolean leida = false;

    @Column(name = "fecha")
    private LocalDateTime fecha;

    @PrePersist
    public void prePersist() {
        if (fecha == null) {
            fecha = LocalDateTime.now();
        }

        if (leida == null) {
            leida = false;
        }
    }
}