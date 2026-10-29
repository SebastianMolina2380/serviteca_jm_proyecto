package com.serviteca.serviteca_jm;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Verifica que el contexto completo arranca con el perfil de pruebas.
 * Requiere la base PostgreSQL de pruebas, igual que las pruebas de
 * integración; sin SERVITECA_TEST_DB_URL se omite.
 */
@SpringBootTest
@ActiveProfiles("test")
@EnabledIfEnvironmentVariable(named = "SERVITECA_TEST_DB_URL", matches = ".+")
class ServitecaJmApplicationTests {

	@Test
	void contextLoads() {
	}

}
