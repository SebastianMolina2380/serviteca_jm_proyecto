package com.serviteca.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class PlacaUtilTest {

    @Test
    @DisplayName("Una placa nula sigue siendo nula")
    void normalizaNulo() {
        assertNull(PlacaUtil.normalizar(null));
    }

    @Test
    @DisplayName("Convierte a mayúsculas, quita espacios y conserva guiones")
    void normalizaPlacaConEspacios() {
        assertEquals("ABC-123", PlacaUtil.normalizar("  abc-123  "));
        assertEquals("XYZ987", PlacaUtil.normalizar("x y z 9 8 7"));
    }

    @Test
    @DisplayName("Una placa ya normalizada no cambia")
    void mantienePlacaNormalizada() {
        assertEquals("JKL456", PlacaUtil.normalizar("JKL456"));
    }
}
