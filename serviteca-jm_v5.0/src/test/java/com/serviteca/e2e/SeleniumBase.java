package com.serviteca.e2e;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.openqa.selenium.By;
import org.openqa.selenium.ElementClickInterceptedException;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * Base de las pruebas de CAJA NEGRA con Selenium WebDriver.
 *
 * <p>Las pruebas E2E no arrancan la aplicación: se ejecutan contra una
 * instancia ya levantada. La URL se toma de {@code SERVITECA_E2E_URL} o de
 * la propiedad Maven {@code -Dserviteca.e2e.url} (por defecto
 * {@code http://localhost:8082}).</p>
 *
 * <p>Si la aplicación no responde, las pruebas se marcan como omitidas
 * (assumption) en lugar de fallar en cascada. Igual ocurre con las pruebas
 * que necesitan sesión si no se definen las credenciales de ADMIN.</p>
 */
public abstract class SeleniumBase {

    protected static final String BASE_URL = sinBarraFinal(
            System.getProperty("serviteca.e2e.url",
                    System.getenv().getOrDefault("SERVITECA_E2E_URL", "http://localhost:8082")));

    private static final Duration ESPERA = Duration.ofSeconds(15);

    /**
     * Pausa opcional entre acciones, en milisegundos. Sirve para grabar
     * videos: con {@code SERVITECA_E2E_PAUSA_MS=800} se aprecia cómo el
     * navegador escribe y hace clic. Por defecto es 0 (sin pausa).
     */
    private static final long PAUSA_MS = leerPausa();

    protected WebDriver driver;
    protected WebDriverWait wait;

    @BeforeEach
    void abrirNavegador() {
        assumeTrue(aplicacionDisponible(),
                "La aplicación no responde en " + BASE_URL
                        + ". Levántala antes de ejecutar el perfil e2e "
                        + "(mvnw spring-boot:run o docker compose up -d).");

        ChromeOptions opciones = new ChromeOptions();
        if (!"false".equalsIgnoreCase(
                System.getProperty("SERVITECA_E2E_HEADLESS",
                System.getenv().getOrDefault("SERVITECA_E2E_HEADLESS", "true")))) {
            opciones.addArguments("--headless=new");
        }
        opciones.addArguments(
                "--disable-gpu",
                "--no-sandbox",
                "--window-size=1440,900",
                "--lang=es-CO");

        driver = new ChromeDriver(opciones);
        driver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(30));
        wait = new WebDriverWait(driver, ESPERA);
    }

    @AfterEach
    void cerrarNavegador() {
        if (driver == null) {
            return;
        }
        try {
            driver.switchTo().alert().dismiss();
        } catch (Exception sinAlerta) {
            // La mayoría de pruebas no abre alertas; no es un error.
        }
        driver.quit();
    }

    /** Comprueba /actuator/health (público) antes de abrir el navegador. */
    protected boolean aplicacionDisponible() {
        try {
            HttpClient cliente = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(2))
                    .build();
            HttpRequest peticion = HttpRequest.newBuilder(
                            URI.create(BASE_URL + "/actuator/health"))
                    .timeout(Duration.ofSeconds(3))
                    .GET()
                    .build();
            return cliente.send(peticion, HttpResponse.BodyHandlers.discarding())
                    .statusCode() == 200;
        } catch (Exception noDisponible) {
            return false;
        }
    }

    protected void abrir(String pagina) {
        driver.get(BASE_URL + "/" + pagina);
        pausa();
    }

    protected WebElement esperar(By selector) {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(selector));
    }

    protected void clic(By selector) {
        WebElement elemento = wait.until(ExpectedConditions.presenceOfElementLocated(selector));
        // Centra el elemento en el viewport: evita fallos cuando un botón
        // queda por debajo del área visible (por ejemplo, al final de un paso).
        ((JavascriptExecutor) driver).executeScript(
                "arguments[0].scrollIntoView({block:'center', inline:'center'});", elemento);
        wait.until(ExpectedConditions.elementToBeClickable(elemento));
        try {
            elemento.click();
        } catch (ElementClickInterceptedException interceptado) {
            // Algunos elementos quedan cubiertos por barras fijas o toasts.
            // El clic por JavaScript dispara el mismo evento del DOM.
            ((JavascriptExecutor) driver).executeScript("arguments[0].click();", elemento);
        }
        pausa();
    }

    protected void escribir(By selector, String texto) {
        WebElement campo = esperar(selector);
        campo.clear();
        campo.sendKeys(texto);
        pausa();
    }

    /** Espera configurable; no hace nada si SERVITECA_E2E_PAUSA_MS no se define. */
    protected void pausa() {
        if (PAUSA_MS <= 0) {
            return;
        }
        try {
            Thread.sleep(PAUSA_MS);
        } catch (InterruptedException interrumpido) {
            Thread.currentThread().interrupt();
        }
    }

    /**
     * Asigna el valor de un input (por ejemplo type="date") y dispara los
     * eventos input/change, igual que lo haría el usuario.
     */
    protected void fijarValor(String id, String valor) {
        ((JavascriptExecutor) driver).executeScript(
                "const e=document.getElementById(arguments[0]);"
                        + "e.value=arguments[1];"
                        + "e.dispatchEvent(new Event('input',{bubbles:true}));"
                        + "e.dispatchEvent(new Event('change',{bubbles:true}));",
                id, valor);
    }

    /**
     * Inicia sesión con un ADMIN real. Las credenciales nunca se escriben
     * en el repositorio: se leen de variables de entorno.
     */
    protected void iniciarSesionAdmin() {
     String correo = System.getProperty("SERVITECA_E2E_ADMIN_EMAIL",
        System.getenv("SERVITECA_E2E_ADMIN_EMAIL"));
     String clave = System.getProperty("SERVITECA_E2E_ADMIN_PASSWORD",
        System.getenv("SERVITECA_E2E_ADMIN_PASSWORD"));
        assumeTrue(correo != null && !correo.isBlank()
                        && clave != null && !clave.isBlank(),
                "Define SERVITECA_E2E_ADMIN_EMAIL y SERVITECA_E2E_ADMIN_PASSWORD "
                        + "para ejecutar las pruebas que requieren sesión.");

        abrir("login.html");
        clic(By.cssSelector(".role[onclick*='admin']"));
        escribir(By.id("email"), correo);
        escribir(By.id("pass"), clave);
        clic(By.cssSelector("#loginForm button[type='submit']"));
        wait.until(ExpectedConditions.urlContains("dashboard.html"));
    }

    private static String sinBarraFinal(String url) {
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }

    private static long leerPausa() {
        String valor = System.getProperty("SERVITECA_E2E_PAUSA_MS", System.getenv().getOrDefault("SERVITECA_E2E_PAUSA_MS", "0"));
        try {
            return Math.max(0, Long.parseLong(valor.trim()));
        } catch (NumberFormatException ignorado) {
            return 0;
        }
    }
}
