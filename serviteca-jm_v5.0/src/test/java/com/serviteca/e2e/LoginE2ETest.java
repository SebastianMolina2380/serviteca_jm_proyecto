package com.serviteca.e2e;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * CAJA NEGRA · autenticación y visibilidad de contraseña.
 *
 * <p>Se prueba únicamente lo observable por el usuario (DOM y navegación),
 * sin conocer la implementación interna del backend.</p>
 */
@DisplayName("E2E · Login")
class LoginE2ETest extends SeleniumBase {

    @Test
    @DisplayName("El ojo alterna password -> text -> password")
    void ojoAlternaVisibilidad() {
        abrir("login.html");

        assertEquals("password", esperar(By.id("pass")).getAttribute("type"));

        clic(By.cssSelector(".eye[data-toggle-password='#pass']"));
        assertEquals("text", esperar(By.id("pass")).getAttribute("type"));

        clic(By.cssSelector(".eye[data-toggle-password='#pass']"));
        assertEquals("password", esperar(By.id("pass")).getAttribute("type"));
    }

    @Test
    @DisplayName("Credenciales inválidas muestran el mensaje de error")
    void credencialesInvalidasMuestranError() {
        abrir("login.html");
        clic(By.cssSelector(".role[onclick*='admin']"));
        escribir(By.id("email"), "nadie." + System.currentTimeMillis() + "@test.local");
        escribir(By.id("pass"), "Incorrecta-2026*");
        clic(By.cssSelector("#loginForm button[type='submit']"));

        WebElement error = esperar(By.id("err"));
        wait.until(d -> error.getText().toLowerCase().contains("incorrect"));
        assertTrue(error.getText().toLowerCase().contains("incorrect"));
    }

    @Test
    @DisplayName("Sin rol seleccionado no se envía el login")
    void exigeSeleccionarRol() {
        abrir("login.html");
        escribir(By.id("email"), "admin@test.local");
        escribir(By.id("pass"), "Clave-2026*");
        clic(By.cssSelector("#loginForm button[type='submit']"));

        WebElement error = esperar(By.id("err"));
        wait.until(d -> error.getText().toLowerCase().contains("tipo de usuario"));
        assertTrue(error.getText().toLowerCase().contains("tipo de usuario"));
    }

    @Test
    @DisplayName("El ADMIN inicia sesión y llega al dashboard")
    void adminLlegaAlDashboard() {
        iniciarSesionAdmin();
        assertTrue(driver.getCurrentUrl().contains("dashboard.html"));
    }
}
