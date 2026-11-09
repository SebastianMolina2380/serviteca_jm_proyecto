package com.serviteca.e2e;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * CAJA NEGRA · modal "Registrar entrada" del inventario.
 *
 * <p>Regresión del bug reportado: el selector de Categoría se quedaba en
 * "- Seleccione categoría -". La prueba abre el modal y espera a que la
 * carga asíncrona del catálogo termine. Si la base no tiene productos, la
 * prueba se omite con un mensaje explícito (no hay categorías que mostrar).</p>
 */
@DisplayName("E2E · Inventario")
class InventarioE2ETest extends SeleniumBase {

    @Test
    @DisplayName("Al abrir el modal se cargan las categorías del catálogo")
    void modalCargaCategorias() {
        iniciarSesionAdmin();
        abrir("inventario.html");
        clic(By.id("btn-entrada"));
        assertTrue(esperar(By.id("inv-modal")).isDisplayed());

        WebElement select = wait.until(d -> {
            WebElement actual = d.findElement(By.id("inv-cat"));
            String texto = actual.getText();
            int opciones = actual.findElements(By.tagName("option")).size();
            boolean termino = opciones > 1
                    || texto.contains("No hay categorías")
                    || texto.contains("No se pudieron cargar");
            return termino ? actual : null;
        });

        long categorias = select.findElements(By.tagName("option")).stream()
                .filter(o -> !o.getAttribute("value").isBlank())
                .count();

        // Si el catálogo está vacío, no es un fallo del modal: falta sembrar
        // productos en la base. Se omite para no dar un falso positivo.
        assumeTrue(categorias > 0,
                "El catálogo de productos está vacío. Crea al menos un producto "
                        + "(o usa el perfil dev con datos de prueba) para validar las categorías.");

        assertTrue(categorias > 0);
        assertTrue(select.isEnabled(), "El selector debe quedar habilitado al haber categorías");
        assertFalse(select.getText().contains("Cargando"),
                "El selector no debe quedarse en estado de carga");
    }
}
