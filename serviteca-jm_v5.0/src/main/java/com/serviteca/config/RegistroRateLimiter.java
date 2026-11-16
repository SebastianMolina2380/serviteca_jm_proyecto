package com.serviteca.config;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Limitador de registros públicos por IP.
 *
 * El registro está abierto a Internet, así que se permite un número
 * acotado de altas por hora y dirección. No se bloquea por correo porque
 * un atacante podría rotar correos y el objetivo aquí es frenar el abuso
 * automatizado, no impedir que varias personas legítimas compartan red.
 */
@Component
public class RegistroRateLimiter {

    static final int MAX_REGISTROS = 5;
    static final long WINDOW_SECONDS = 60 * 60;
    private static final int CLEANUP_THRESHOLD = 10_000;

    private final Map<String, Window> byIp = new ConcurrentHashMap<>();

    /**
     * Registra un intento y devuelve 0 si se permite o los segundos que
     * faltan para que la ventana actual libere el cupo.
     */
    public long tryConsume(String ip) {
        long now = Instant.now().getEpochSecond();

        Window ventana = byIp.compute(ipKey(ip), (clave, actual) -> {
            if (actual == null || now - actual.start() >= WINDOW_SECONDS) {
                return new Window(now, 1);
            }
            return new Window(actual.start(), actual.count() + 1);
        });

        if (byIp.size() > CLEANUP_THRESHOLD) {
            cleanup(now);
        }

        if (ventana.count() <= MAX_REGISTROS) {
            return 0;
        }
        return Math.max(1, ventana.start() + WINDOW_SECONDS - now);
    }

    private void cleanup(long now) {
        byIp.entrySet().removeIf(entry -> now - entry.getValue().start() >= WINDOW_SECONDS);
    }

    private String ipKey(String ip) {
        return "ip:" + (ip == null || ip.isBlank() ? "desconocida" : ip.trim());
    }

    private record Window(long start, int count) {
    }
}
