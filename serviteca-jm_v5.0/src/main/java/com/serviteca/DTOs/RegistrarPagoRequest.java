package com.serviteca.DTOs;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RegistrarPagoRequest(
        @NotNull @DecimalMin(value = "0.01") BigDecimal monto,
        @NotBlank @Size(max = 40) String metodo,
        @NotNull LocalDate fecha,
        @Size(max = 500) String notas,
        @NotBlank @Size(max = 80) String claveIdempotencia
) {}
