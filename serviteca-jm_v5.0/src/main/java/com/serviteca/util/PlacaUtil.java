package com.serviteca.util;

import java.util.Locale;

/**
 * Regla única de normalización de placas.
 *
 * Mayúsculas, sin espacios en blanco y conservando los guiones para no
 * romper las placas ya registradas (por ejemplo "ABC-123").
 */
public final class PlacaUtil {

    private PlacaUtil() {
    }

    public static String normalizar(String placa) {
        if (placa == null) return null;
        return placa.trim()
                .toUpperCase(Locale.ROOT)
                .replaceAll("\\s+", "");
    }
}
