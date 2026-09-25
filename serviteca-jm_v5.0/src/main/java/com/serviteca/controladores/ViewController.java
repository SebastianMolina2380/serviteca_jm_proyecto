package com.serviteca.controladores;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Rutas amigables de las vistas del módulo Vehículos.
 * Permite navegar sin escribir la extensión .html.
 */
@Controller
public class ViewController {

    @GetMapping("/vehiculo")
    public String vehiculo() {
        return "forward:/vehiculo.html";
    }

    @GetMapping("/nuevo-vehiculo")
    public String nuevoVehiculo() {
        return "forward:/nuevo-vehiculo.html";
    }
}
