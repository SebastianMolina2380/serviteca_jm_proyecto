package com.serviteca.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;

import jakarta.servlet.http.HttpServletRequest;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final CustomUserDetailsService customUserDetailsService;

    public SecurityConfig(
            CustomUserDetailsService customUserDetailsService) {

        this.customUserDetailsService = customUserDetailsService;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http)
            throws Exception {

        http
                .csrf(csrf -> csrf.disable())

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.IF_REQUIRED
                        ).sessionFixation(fixation -> fixation.changeSessionId())
                )

                .authorizeHttpRequests(auth -> auth

                        // ==============================
                        // PÚBLICOS
                        // ==============================
                        .requestMatchers(
                                "/",
                                "/index.html",
                                "/login.html",
                                "/recuperar.html",
                                "/login.js",
                                "/login.css",
                                "/recuperar.js",
                                "/recuperar.css",
                                "/favicon.ico",

                                "/*.css",
                                "/*.js",
                                "/*.png",
                                "/*.jpg",
                                "/*.jpeg",
                                "/*.gif",
                                "/*.svg",
                                "/*.ico",
                                "/*.json",

                                "/scripts/**",

                                // Monitoreo: la sonda de salud es pública y
                                // no revela detalles en producción.
                                "/actuator/health",
                                "/actuator/health/**",
                                "/actuator/info",

                                // Documentación OpenAPI. Si springdoc está
                                // desactivado (prod por defecto) estas rutas
                                // simplemente responden 404.
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html"
                        ).permitAll()

                        // ==============================
                        // AUTENTICACIÓN
                        // ==============================
                        .requestMatchers(
                                "/api/auth/login",
                                "/api/auth/me",
                                "/api/auth/password/**",
                                "/api/contacto"
                        ).permitAll()

                        // ==============================
                        // ADMIN
                        // ==============================
                        .requestMatchers(
                                "/usuarios.html",
                                "/nuevo-usuario.html",
                                // El resto de Actuator (métricas, env, etc.)
                                // queda reservado a ADMIN aunque por ahora
                                // solo se expongan health e info.
                                "/actuator/**"
                        ).hasRole("ADMIN")

                        // ==============================
                        // ADMIN + TÉCNICO
                        // ==============================
                        .requestMatchers(
                                "/dashboard.html",
                                "/clientes.html",
                                "/inventario.html",
                                "/reportes.html",
                                "/registrar-pago.html"
                        ).hasAnyRole(
                                "ADMIN",
                                "TECNICO"
                        )

                        // Facturación: ADMIN/TÉCNICO gestionan; CLIENTE solo consulta sus propias facturas.
                        .requestMatchers(
                                "/facturacion.html",
                                "/factura_elect_teca_jm.html"
                        ).hasAnyRole(
                                "ADMIN", "TECNICO", "CLIENTE"
                        )

                        // ==============================
                        // ADMIN + TÉCNICO + CLIENTE
                        // ==============================
                        .requestMatchers(
                                "/citas.html",
                                "/nueva-cita.html",
                                "/vehiculo.html",
                                "/vehiculo",
                                "/nuevo-vehiculo",
                                "/nuevo-vehiculo.html"
                        ).hasAnyRole(
                                "ADMIN",
                                "TECNICO",
                                "CLIENTE"
                        )

                        // ==============================
                        // SOLO CLIENTE
                        // ==============================
                        .requestMatchers(
                                "/portal-cliente.html"
                        ).hasRole("CLIENTE")

                        // ==============================
                        // RESTO
                        // ==============================
                        .anyRequest().authenticated()
                )

                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, exception) -> {
                            /* Navegación del navegador -> login con retorno.
                               Llamadas de API/fetch -> JSON 401 de siempre. */
                            if (esNavegacionHtml(request)) {
                                String destino = request.getRequestURI();
                                response.sendRedirect(
                                        "/login.html?next="
                                                + URLEncoder.encode(destino, StandardCharsets.UTF_8)
                                );
                                return;
                            }
                            response.setStatus(401);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write("{\"status\":401,\"error\":\"Unauthorized\",\"message\":\"Autenticación requerida.\"}");
                        })
                        .accessDeniedHandler((request, response, exception) -> {
                            /* Un cliente que abre una página de staff vuelve a su
                               portal en lugar de ver un 403 sin salida. */
                            if (esNavegacionHtml(request)) {
                                response.sendRedirect(inicioDelRolActual());
                                return;
                            }
                            response.setStatus(403);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write("{\"status\":403,\"error\":\"Forbidden\",\"message\":\"No tiene permisos para esta operación.\"}");
                        })
                )

                .formLogin(form -> form.disable())

                .logout(logout ->
                        logout
                                .logoutUrl("/api/auth/logout")
                                .logoutSuccessHandler(
                                        (request, response, authentication) ->
                                                response.setStatus(204)
                                )
                );

        return http.build();
    }

    /**
     * true solo para navegaciones GET del navegador. Las llamadas
     * fetch/XHR (Accept: *&#47;* o application/json) siguen recibiendo
     * respuestas JSON 401/403, que es lo que espera api.js y la app móvil.
     */
    private static boolean esNavegacionHtml(HttpServletRequest request) {
        if (!"GET".equalsIgnoreCase(request.getMethod())) {
            return false;
        }
        String accept = request.getHeader("Accept");
        return accept != null && accept.contains("text/html");
    }

    /** Página de inicio que corresponde al rol autenticado. */
    private static String inicioDelRolActual() {
        Authentication autenticacion =
                SecurityContextHolder.getContext().getAuthentication();

        boolean esCliente = autenticacion != null
                && autenticacion.getAuthorities().stream()
                        .map(GrantedAuthority::getAuthority)
                        .anyMatch("ROLE_CLIENTE"::equals);

        return esCliente ? "/portal-cliente.html" : "/dashboard.html";
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {

        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider();

        provider.setUserDetailsService(
                customUserDetailsService
        );

        provider.setPasswordEncoder(
                passwordEncoder()
        );

        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration)
            throws Exception {

        return configuration.getAuthenticationManager();
    }

    @Bean
    public SecurityContextRepository securityContextRepository() {

        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {

        return new BCryptPasswordEncoder();
    }
}
