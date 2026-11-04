package com.serviteca;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@SpringBootApplication
public class ServitecaJmApplication {

	public static void main(String[] args) {
		SpringApplication.run(ServitecaJmApplication.class, args);
	}

	@Bean
	CommandLineRunner corregirCredencialesTecnico(JdbcTemplate jdbcTemplate) {
		return args -> {
			String hash = new BCryptPasswordEncoder().encode("AdminServiteca2026*");
			int actualizados = jdbcTemplate.update(
					"UPDATE usuario SET contrasena = ?, rol = 'TECNICO' WHERE LOWER(correo) = LOWER(?)",
					hash,
					"sebastian.vargas@gmail.com"
			);
			if (actualizados == 0) {
				System.err.println("No se encontró el usuario técnico sebastian.vargas@gmail.com; no se actualizaron credenciales.");
			}
		};
	}

}
