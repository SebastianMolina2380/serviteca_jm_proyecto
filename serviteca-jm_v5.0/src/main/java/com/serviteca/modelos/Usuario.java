package com.serviteca.modelos;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "usuario")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Usuario {

    public enum Rol {
        ADMIN,
        TECNICO,
        CLIENTE
    }
    public enum Estado { ACTIVO, INACTIVO }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idusuario")
    private Integer idUsuario;

    @NotBlank(message = "El nombre no puede estar vacío")
    @Size(max = 120)
    @Column(name = "nombre", nullable = false, length = 120)
    private String nombre;

    @NotBlank(message = "El número de documento es obligatorio")
    @Size(max = 30)
    @Column(name = "numero_doc", nullable = false, unique = true, length = 30)
    private String numeroDoc;

    @Email(message = "Correo inválido")
    @NotBlank(message = "El correo es obligatorio")
    @Column(name = "correo", nullable = false, unique = true, length = 100)
    private String correo;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(name = "contrasena", nullable = false, length = 255)
    private String contrasena;

    @Enumerated(EnumType.STRING)
    @Column(name = "rol", nullable = false, length = 20)
    private Rol rol = Rol.CLIENTE;

    @Column(name = "tipo_documento", nullable = false, length = 30)
    private String tipoDocumento = "CC";

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private Estado estado = Estado.ACTIVO;

    @Column(name = "ultimo_acceso")
    private LocalDateTime ultimoAcceso;

    // Datos de contacto usados por el portal y la plantilla de factura.
    @Column(name = "direccion", length = 180)
    private String direccion;

    @Column(name = "telefono", length = 30)
    private String telefono;

    @Column(name = "ciudad", length = 80)
    private String ciudad;

    @OneToMany(mappedBy = "usuario", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Vehiculo> vehiculos;

    @OneToMany(mappedBy = "usuario", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Factura> facturas;
}