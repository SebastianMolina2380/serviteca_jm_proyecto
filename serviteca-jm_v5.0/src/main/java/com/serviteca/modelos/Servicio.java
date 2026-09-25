package com.serviteca.modelos;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name="servicio")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer","handler"})
public class Servicio {
    public enum Estado { PROGRAMADO, EN_PROCESO, COMPLETADO, CANCELADO }

    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    @Column(name="idservicio") private Integer idServicio;

    @NotBlank @Size(max=80)
    @Column(name="tipo",nullable=false,length=80) private String tipo;

    @Column(name="descripcion",columnDefinition="TEXT") private String descripcion;

    @DecimalMin("0.0")
    @Column(name="precio",nullable=false,precision=12,scale=2) private BigDecimal precio;

    @Column(name="activo",nullable=false) private Boolean activo=true;

    @Enumerated(EnumType.STRING)
    @Column(name="estado",nullable=false,length=20) private Estado estado=Estado.PROGRAMADO;

    @Column(name="progreso",nullable=false) private Integer progreso=0;

    @Column(name="fecha_servicio") private LocalDateTime fechaServicio;

    @ManyToOne(fetch=FetchType.EAGER)
    @JoinColumn(name="idvehiculo",nullable=false)
    @JsonIgnoreProperties({"servicios","citas","usuario","hibernateLazyInitializer","handler"})
    private Vehiculo vehiculo;

    @OneToMany(mappedBy="servicio",cascade=CascadeType.ALL,fetch=FetchType.LAZY)
    @JsonIgnore private List<Producto> productos;
}