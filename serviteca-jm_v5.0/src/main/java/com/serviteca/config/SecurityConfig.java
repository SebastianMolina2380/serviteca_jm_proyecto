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
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;

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
                        )
                )

                .authorizeHttpRequests(auth -> auth

                        // ==============================
                        // PÚBLICOS
                        // ==============================
                        .requestMatchers(
                                "/",
                                "/index.html",
                                "/login.html",
                                "/login.js",
                                "/login.css",
                                "/favicon.ico",

                                "/*.css",
                                "/*.js",
                                "/*.png",
                                "/*.jpg",
                                "/*.jpeg",
                                "/*.gif",
                                "/*.svg",
                                "/*.ico",

                                "/scripts/**"
                        ).permitAll()

                        // ==============================
                        // AUTENTICACIÓN
                        // ==============================
                        .requestMatchers(
                                "/api/auth/login",
                                "/api/auth/me"
                        ).permitAll()

                        // ==============================
                        // ADMIN
                        // ==============================
                        .requestMatchers(
                                "/usuarios.html",
                                "/nuevo-usuario.html"
                        ).hasRole("ADMIN")

                        // ==============================
                        // ADMIN + TÉCNICO
                        // ==============================
                        .requestMatchers(
                                "/clientes.html",
                                "/inventario.html",
                                "/reportes.html"
                        ).hasAnyRole(
                                "ADMIN",
                                "TECNICO"
                        )

                        // Facturación: ADMIN/TÉCNICO gestionan; CLIENTE solo consulta sus propias facturas.
                        .requestMatchers("/facturacion.html").hasAnyRole(
                                "ADMIN", "TECNICO", "CLIENTE"
                        )

                        // ==============================
                        // ADMIN + TÉCNICO + CLIENTE
                        // ==============================
                        .requestMatchers(
                                "/dashboard.html",
                                "/citas.html",
                                "/nueva-cita.html",
                                "/vehiculo.html",
                                "/vehiculo",
                                "/nuevo-vehiculo"
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