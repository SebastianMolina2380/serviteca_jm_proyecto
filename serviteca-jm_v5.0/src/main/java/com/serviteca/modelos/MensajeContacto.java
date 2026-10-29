package com.serviteca.modelos;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Mensaje enviado desde el formulario de contacto de la landing.
 * Se persiste para que ningún contacto se pierda cuando el SMTP no está
 * configurado.
 */
@Entity
@Table(name = "mensaje_contacto")
@Getter
@Setter
@NoArgsConstructor
public class MensajeContacto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "nombre", nullable = false, length = 120)
    private String nombre;

    @Column(name = "correo", nullable = false, length = 100)
    private String correo;

    @Column(name = "telefono", length = 30)
    private String telefono;

    @Column(name = "mensaje", nullable = false, length = 2000)
    private String mensaje;

    @Column(name = "atendido", nullable = false)
    private boolean atendido = false;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime creadoEn;
}
