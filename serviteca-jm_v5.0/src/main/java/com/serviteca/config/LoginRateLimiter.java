package com.serviteca.config;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Limitador de intentos de login en memoria.
 *
 * Aplica dos ventanas independientes:
 *  - por IP, para frenar ataques que rotan correos;
 *  - por IP + correo, para no bloquear a todos los usuarios de una red.
 *
 * Tras 5 fallos se bloquea durante 15 minutos. Un login correcto limpia el
 * contador de la credencial, pero no el de la IP (evita que una cuenta válida
 * reinicie el ataque).
 */
@Component
public class LoginRateLimiter {

    static final int MAX_ATTEMPTS = 5;
    static final long WINDOW_SECONDS = 15 * 60;
    static final long BLOCK_SECONDS = 15 * 60;
    private static final int CLEANUP_THRESHOLD = 10_000;

    private final Map<String, Attempt> byIp = new ConcurrentHashMap<>();
    private final Map<String, Attempt> byCredential = new ConcurrentHashMap<>();

    public long remainingBlockSeconds(String ip, String correo) {
        long now = Instant.now().getEpochSecond();
        return Math.max(
                remainingSeconds(byIp.get(ipKey(ip)), now),
                remainingSeconds(byCredential.get(credentialKey(ip, correo)), now)
        );
    }

    public void registerFailure(String ip, String correo) {
        long now = Instant.now().getEpochSecond();
        registerFailure(byIp, ipKey(ip), now);
        registerFailure(byCredential, credentialKey(ip, correo), now);

        if (byIp.size() + byCredential.size() > CLEANUP_THRESHOLD) {
            cleanup(now);
        }
    }

    public void registerSuccess(String ip, String correo) {
        byCredential.remove(credentialKey(ip, correo));
    }

    private void registerFailure(Map<String, Attempt> attempts, String key, long now) {
        attempts.compute(key, (k, current) -> {
            if (current == null || now - current.windowStart() >= WINDOW_SECONDS) {
                current = new Attempt(0, now, 0);
            }
            int failures = current.failures() + 1;
            long blockedUntil = failures >= MAX_ATTEMPTS
                    ? now + BLOCK_SECONDS
                    : current.blockedUntil();
            return new Attempt(failures, current.windowStart(), blockedUntil);
        });
    }

    private long remainingSeconds(Attempt attempt, long now) {
        if (attempt == null || attempt.blockedUntil() <= now) return 0;
        return attempt.blockedUntil() - now;
    }

    private void cleanup(long now) {
        byIp.entrySet().removeIf(entry -> expired(entry.getValue(), now));
        byCredential.entrySet().removeIf(entry -> expired(entry.getValue(), now));
    }

    private boolean expired(Attempt attempt, long now) {
        return now - attempt.windowStart() >= WINDOW_SECONDS && attempt.blockedUntil() <= now;
    }

    private String ipKey(String ip) {
        return "ip:" + (ip == null || ip.isBlank() ? "desconocida" : ip.trim());
    }

    private String credentialKey(String ip, String correo) {
        String correoNormalizado = correo == null
                ? ""
                : correo.trim().toLowerCase(Locale.ROOT);
        return ipKey(ip) + "|correo:" + correoNormalizado;
    }

    private record Attempt(int failures, long windowStart, long blockedUntil) {
    }
}
