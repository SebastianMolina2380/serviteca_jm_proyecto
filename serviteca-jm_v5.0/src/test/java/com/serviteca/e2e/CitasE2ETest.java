package com.serviteca.e2e;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Random;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * CAJA NEGRA · flujo completo de agendamiento.
 *
 * <p>Recorre el asistente como lo haría un recepcionista: registra un
 * cliente nuevo, registra su vehículo, elige servicio/fecha/hora, confirma y
 * comprueba que la cita aparece en el listado. Es la prueba de regresión del
 * bug "la cita muestra ticket pero no aparece en citas.html".</p>
 */
@DisplayName("E2E · Nueva cita")
class CitasE2ETest extends SeleniumBase {

    private static final List<String> HORAS = List.of("07:00 AM", "08:00 AM", "11:00 AM");

    @Test
    @DisplayName("La cita se guarda y aparece en el listado con su ticket")
    void creaCitaYApareceEnElListado() {
        iniciarSesionAdmin();
        abrir("nueva-cita.html");

        String sufijo = String.valueOf(System.currentTimeMillis());
        String documento = "E2E" + sufijo.substring(sufijo.length() - 9);
        String placa = "E" + sufijo.substring(sufijo.length() - 7);

        // PASO 1 · cliente
        escribir(By.id("numero-doc"), documento);
        escribir(By.id("nombre-cliente"), "Cliente E2E " + documento);
        escribir(By.id("telefono-cliente"), "3001234567");
        escribir(By.id("correo-cliente"), "cliente." + documento + "@test.local");
        clic(By.id("btn-continuar-cliente"));

        String alertaCliente = descartarAlertSiExiste();
        org.junit.jupiter.api.Assertions.assertNull(
                alertaCliente,
                "El backend rechazó el cliente: " + alertaCliente
        );

        esperar(By.id("p2"));

        // PASO 2 · vehículo nuevo
        clic(By.id("vh-tab-nuevo"));
        escribir(By.id("placa-vehiculo"), placa);
       new Select(esperar(By.id("tipo-vehiculo"))).selectByIndex(1);
       new Select(esperar(By.id("marca-vehiculo"))).selectByIndex(1);
        escribir(By.id("modelo-vehiculo"), "Corolla");
        escribir(By.id("anio-vehiculo"), "2020");
        escribir(By.id("kilometraje-vehiculo"), "10000");
        escribir(By.id("color-vehiculo"), "Blanco");
        clic(By.cssSelector("#p2 button[onclick='avanzarDesdePaso2()']"));
        esperar(By.id("p3"));

        // PASO 3 · servicio, fecha y hora. Se usa una fecha futura aleatoria
        // para no chocar con la restricción global fecha+hora del backend.
        LocalDate fecha = LocalDate.now().plusDays(60 + new Random().nextInt(300));
        fijarValor("fecha-preferida", fecha.format(DateTimeFormatter.ISO_LOCAL_DATE));
        new Select(esperar(By.id("hora-disponible"))).selectByIndex(1);
        clic(By.cssSelector("#p3 button[onclick='goStep(4)']"));
        esperar(By.id("p4"));

        // PASO 4 · confirmación real contra /api/citas
        clic(By.id("btn-confirmar-cita"));

        String alertaCita = descartarAlertSiExiste();
        org.junit.jupiter.api.Assertions.assertNull(
                alertaCita,
                "El backend rechazó la cita: " + alertaCita
        );
        WebElement ticketElemento = wait.until(
                ExpectedConditions.visibilityOfElementLocated(By.id("cita-ticket")));
        wait.until(d -> ticketElemento.getText().matches("TKT-\\d+"));
        String ticket = ticketElemento.getText();

        assertNotEquals("TKT--", ticket, "El ticket debe provenir del idCita real");
        assertTrue(ticket.matches("TKT-\\d+"), "Ticket inesperado: " + ticket);

        // PASO 5 · el listado debe mostrar la misma cita
        abrir("citas.html");
        wait.until(ExpectedConditions.textToBePresentInElementLocated(
                By.id("tbody-citas"), ticket));
        assertTrue(driver.findElement(By.id("tbody-citas")).getText().contains(ticket));
    }
}
