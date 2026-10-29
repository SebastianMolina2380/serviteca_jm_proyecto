package com.serviteca.servicios;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Envío de correo transaccional.
 *
 * Si no hay SMTP configurado (SERVITECA_SMTP_HOST vacío) el mensaje se
 * escribe en el log. Así la recuperación de contraseña y el formulario de
 * contacto siguen siendo comprobables en desarrollo sin credenciales.
 */
@Service
@RequiredArgsConstructor
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.host:}")
    private String host;

    @Value("${serviteca.mail.remitente:no-reply@servitecajm.com}")
    private String remitente;

    public boolean enviar(String destino, String asunto, String cuerpo) {
        if (destino == null || destino.isBlank()) {
            return false;
        }

        if (host == null || host.isBlank()) {
            log.warn("[CORREO EN MODO DESARROLLO] Para: {}\nAsunto: {}\n{}", destino, asunto, cuerpo);
            return false;
        }

        try {
            SimpleMailMessage mensaje = new SimpleMailMessage();
            mensaje.setFrom(remitente);
            mensaje.setTo(destino);
            mensaje.setSubject(asunto);
            mensaje.setText(cuerpo);
            mailSender.send(mensaje);
            return true;
        } catch (Exception e) {
            log.error("No se pudo enviar el correo a {}. Se registra el contenido para no perderlo.", destino, e);
            log.warn("[CORREO NO ENVIADO] Para: {}\nAsunto: {}\n{}", destino, asunto, cuerpo);
            return false;
        }
    }
}
