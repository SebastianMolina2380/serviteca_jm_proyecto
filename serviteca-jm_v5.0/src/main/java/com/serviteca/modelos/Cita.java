package com.serviteca.modelos;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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

    /**
     * Servicio solicitado por el cliente. Se guarda como texto libre para
     * conservar lo que pidió aunque el catálogo cambie con el tiempo.
     */
    @Size(max = 80, message = "El servicio solicitado no puede superar 80 caracteres")
    @Column(name = "servicio_solicitado", length = 80)
    private String servicioSolicitado;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    /**
     * Técnico asignado a la cita. Es opcional y, si el usuario se elimina,
     * la FK queda en NULL (ON DELETE SET NULL) para no perder la cita.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idtecnico")
    @JsonIgnoreProperties({
            "citas",
            "vehiculos",
            "facturas",
            "hibernateLazyInitializer",
            "handler"
    })
    private Usuario tecnico;

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
