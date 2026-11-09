package com.serviteca.e2e;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * CAJA NEGRA · formulario de usuarios.
 *
 * <p>Regresión del bug reportado: el icono del ojo no cambiaba el tipo del
 * input porque había dos listeners alternándolo en el mismo clic. La prueba
 * verifica el comportamiento visible: un clic muestra la contraseña y el
 * siguiente la vuelve a ocultar.</p>
 */
@DisplayName("E2E · Nuevo usuario")
class NuevoUsuarioE2ETest extends SeleniumBase {

    @Test
    @DisplayName("El ojo alterna la visibilidad de contraseña y confirmación")
    void ojoAlternaAmbosCampos() {
        iniciarSesionAdmin();
        abrir("nuevo-usuario.html");

        assertEquals("password", esperar(By.id("password")).getAttribute("type"));
        clic(By.cssSelector(".eye[data-toggle-password='#password']"));
        assertEquals("text", esperar(By.id("password")).getAttribute("type"));
        clic(By.cssSelector(".eye[data-toggle-password='#password']"));
        assertEquals("password", esperar(By.id("password")).getAttribute("type"));

        assertEquals("password", esperar(By.id("confirm-password")).getAttribute("type"));
        clic(By.cssSelector(".eye[data-toggle-password='#confirm-password']"));
        assertEquals("text", esperar(By.id("confirm-password")).getAttribute("type"));
        clic(By.cssSelector(".eye[data-toggle-password='#confirm-password']"));
        assertEquals("password", esperar(By.id("confirm-password")).getAttribute("type"));
    }
}
