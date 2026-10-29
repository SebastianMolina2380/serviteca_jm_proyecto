package com.serviteca.servicios;

import com.serviteca.modelos.MensajeContacto;
import com.serviteca.repository.MensajeContactoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.regex.Pattern;

/**
 * Formulario de contacto de la landing.
 *
 * El mensaje se guarda siempre en base de datos y, si hay SMTP, se notifica
 * al buzón configurado. Así el negocio no depende de que el correo salga.
 */
@Service
@RequiredArgsConstructor
public class ContactoService {

    private static final Pattern CORREO_VALIDO =
            Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private final MensajeContactoRepository mensajeRepository;
    private final EmailService emailService;

    @Value("${serviteca.mail.contacto:contacto@servitecajm.com}")
    private String correoDestino;

    @Transactional
    public void registrar(String nombre, String correo, String telefono, String mensaje) {
        String nombreLimpio = limpiar(nombre);
        String correoLimpio = limpiar(correo);
        String telefonoLimpio = limpiar(telefono);
        String mensajeLimpio = limpiar(mensaje);

        if (nombreLimpio == null || nombreLimpio.length() < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Indica tu nombre.");
        }
        if (correoLimpio == null || !CORREO_VALIDO.matcher(correoLimpio).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Indica un correo electrónico válido.");
        }
        if (mensajeLimpio == null || mensajeLimpio.length() < 10) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Cuéntanos brevemente en qué podemos ayudarte.");
        }
        if (nombreLimpio.length() > 120 || correoLimpio.length() > 100
                || (telefonoLimpio != null && telefonoLimpio.length() > 30)
                || mensajeLimpio.length() > 2000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El mensaje supera la longitud permitida.");
        }

        MensajeContacto entidad = new MensajeContacto();
        entidad.setNombre(nombreLimpio);
        entidad.setCorreo(correoLimpio);
        entidad.setTelefono(telefonoLimpio);
        entidad.setMensaje(mensajeLimpio);
        mensajeRepository.save(entidad);

        String cuerpo = """
                Nuevo mensaje desde la página de Serviteca JM

                Nombre: %s
                Correo: %s
                Teléfono: %s

                Mensaje:
                %s
                """.formatted(nombreLimpio, correoLimpio,
                telefonoLimpio == null ? "No indicado" : telefonoLimpio, mensajeLimpio);

        emailService.enviar(correoDestino, "Contacto web · Serviteca JM", cuerpo);
    }

    private String limpiar(String valor) {
        if (valor == null) return null;
        String limpio = valor.trim();
        return limpio.isEmpty() ? null : limpio;
    }
}
