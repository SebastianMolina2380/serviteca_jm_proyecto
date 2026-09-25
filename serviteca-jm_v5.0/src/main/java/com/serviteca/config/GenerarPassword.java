package com.serviteca.config;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.util.LinkedHashMap;
import java.util.Map;

public class GenerarPassword {
    public static void main(String[] args) {

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        // Mapeo de ID de usuario -> Contraseña que quieres asignarle
        Map<Integer, String> usuarios = new LinkedHashMap<>();
        usuarios.put(3, "Cliente123!");
        usuarios.put(4, "Cliente123!");
        usuarios.put(5, "Cliente123!");
        usuarios.put(7, "Cliente123!");
        usuarios.put(8, "Cliente123!");
        usuarios.put(9, "Cliente123!");
        usuarios.put(10, "Cliente123!");
        usuarios.put(11, "Cliente123!");
        usuarios.put(12, "Cliente123!");

        System.out.println("-- SENTENCIAS SQL CON HASHES BCRYPT ÚNICOS --\n");

        for (Map.Entry<Integer, String> entry : usuarios.entrySet()) {
            Integer id = entry.getKey();
            String password = entry.getValue();

            // Cada llamada a encode() genera un salt aleatorio nuevo
            String hash = encoder.encode(password);

            System.out.println("UPDATE usuario SET contrasena = '" + hash + "' WHERE idusuario = " + id + ";");
        }
    }
}