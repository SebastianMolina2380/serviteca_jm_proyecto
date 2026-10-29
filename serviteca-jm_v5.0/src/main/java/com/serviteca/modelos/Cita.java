package com.serviteca.modelos;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "cita")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Cita {

    public enum Estado {
        PENDIENTE,
        CONFIRMADO,
        CANCELADA,
        COMPLETADA
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idcita")
    private Integer idCita;

    @NotNull(message = "La fecha es obligatoria")
    @FutureOrPresent(message = "La fecha no puede ser anterior a hoy")
    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @NotNull(message = "La hora es obligatoria")
    @Column(name = "hora", nullable = false)
    private LocalTime hora;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false)
    private Estado estado = Estado.PENDIENTE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idusuario", nullable = false)
    @JsonIgnoreProperties({
            "citas",
            "vehiculos",
            "hibernateLazyInitializer",
            "handler"
    })
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idvehiculo", nullable = false)
    @JsonIgnoreProperties({
            "citas",
            "servicios",
            "usuario",
            "hibernateLazyInitializer",
            "handler"
    })
    private Vehiculo vehiculo;

    @OneToOne(mappedBy = "cita", fetch = FetchType.LAZY)
    @ToString.Exclude
    @JsonIgnore // La API de citas no necesita cargar la factura inversa al serializar.
    @JsonIgnoreProperties({
            "cita",
            "hibernateLazyInitializer",
            "handler"
    })
    private Factura factura;
}
