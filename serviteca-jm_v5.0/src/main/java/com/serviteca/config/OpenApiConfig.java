package com.serviteca.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Contrato OpenAPI de la API de Serviteca JM.
 *
 * La UI interactiva queda en /swagger-ui.html y el contrato JSON en
 * /v3/api-docs. En producción ambos se desactivan por defecto con
 * springdoc.*.enabled=false (ver application-prod.properties).
 *
 * La autenticación es por sesión HTTP: tras POST /api/auth/login el
 * navegador recibe la cookie SERVITECASESSION. El esquema se documenta
 * como apiKey en cookie para que "Authorize" permita pegar el valor.
 */
@Configuration
public class OpenApiConfig {

    private static final String ESQUEMA_SESION = "sesionCookie";

    @Bean
    public OpenAPI servitecaOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Serviteca JM API")
                        .description("""
                                API REST del sistema de gestión de Serviteca JM.

                                **Autenticación:** sesión HTTP con cookie \
                                `SERVITECASESSION`. Inicie sesión en \
                                `POST /api/auth/login` con correo, contraseña y rol \
                                (`ADMIN`, `TECNICO` o `CLIENTE`).

                                **Salud:** `GET /actuator/health` es público e \
                                informa `UP`/`DOWN` sin detalles internos en producción.
                                """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Serviteca JM")
                                .email("contacto@servitecajm.com"))
                        .license(new License()
                                .name("Uso interno")))
                .components(new Components()
                        .addSecuritySchemes(ESQUEMA_SESION, new SecurityScheme()
                                .type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.COOKIE)
                                .name("SERVITECASESSION")
                                .description("Cookie de sesión emitida por /api/auth/login.")))
                .addSecurityItem(new SecurityRequirement().addList(ESQUEMA_SESION));
    }
}
