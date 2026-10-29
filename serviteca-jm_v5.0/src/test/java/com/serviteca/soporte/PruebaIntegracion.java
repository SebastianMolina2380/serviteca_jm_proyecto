package com.serviteca.soporte;

import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marca una prueba de integración con Spring Boot + MockMvc.
 *
 * Solo se ejecuta si SERVITECA_TEST_DB_URL apunta a una base PostgreSQL
 * de pruebas. En CI la variable la define el service container; en local
 * se configura una base temporal. Sin ella, `mvn test` sigue pasando y
 * ejecuta únicamente las pruebas unitarias.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@EnabledIfEnvironmentVariable(named = "SERVITECA_TEST_DB_URL", matches = ".+")
public @interface PruebaIntegracion {
}
