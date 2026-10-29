package com.serviteca.controladores;

import com.serviteca.servicios.ContactoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/contacto")
@RequiredArgsConstructor
public class ContactoController {

    private final ContactoService contactoService;

    @PostMapping
    public ResponseEntity<?> enviar(@RequestBody(required = false) Map<String, String> body) {
        if (body == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Solicitud inválida."));
        }

        contactoService.registrar(
                body.getOrDefault("nombre", body.getOrDefault("name", "")),
                body.getOrDefault("correo", body.getOrDefault("email", "")),
                body.getOrDefault("telefono", body.getOrDefault("phone", "")),
                body.getOrDefault("mensaje", body.getOrDefault("message", ""))
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "mensaje", "Mensaje recibido. Te contactaremos pronto."));
    }
}
