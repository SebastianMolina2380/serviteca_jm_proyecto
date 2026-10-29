package com.serviteca.integracion;

import com.serviteca.soporte.IntegracionBase;
import com.serviteca.soporte.PruebaIntegracion;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Reportes y exportaciones: agregados reales y descargas con el tipo
 * MIME correcto (CSV, Excel y PDF).
 */
@PruebaIntegracion
class ReportesIntegrationTest extends IntegracionBase {

    private static final String RANGO = "?desde=2026-01-01&hasta=2026-12-31";

    @Test
    @DisplayName("El resumen se calcula en el servidor para el rango solicitado")
    void resumenDevuelveElPeriodo() throws Exception {
        mockMvc.perform(get("/api/reportes" + RANGO).session(iniciarSesion(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.desde").value("2026-01-01"))
                .andExpect(jsonPath("$.hasta").value("2026-12-31"))
                .andExpect(jsonPath("$.totalCitas").isNumber())
                .andExpect(jsonPath("$.ingresosServicios").isNumber())
                .andExpect(jsonPath("$.citasPorEstado").isMap());
    }

    @Test
    @DisplayName("La exportación CSV contiene el encabezado esperado")
    void exportaCsv() throws Exception {
        MvcResult resultado = mockMvc.perform(get("/api/reportes/export?formato=csv" + "&desde=2026-01-01&hasta=2026-12-31")
                        .session(iniciarSesion(admin)))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/csv"))
                .andExpect(header().string("Content-Disposition",
                        org.hamcrest.Matchers.containsString(".csv")))
                .andReturn();

        String csv = new String(resultado.getResponse().getContentAsByteArray(), StandardCharsets.UTF_8);
        // El archivo incluye BOM UTF-8 para que Excel respete las tildes.
        assertThat(csv).contains("REPORTE SERVITECA JM");
    }

    @Test
    @DisplayName("La exportación Excel usa el tipo MIME de hoja de cálculo")
    void exportaExcel() throws Exception {
        mockMvc.perform(get("/api/reportes/export?formato=excel" + "&desde=2026-01-01&hasta=2026-12-31")
                        .session(iniciarSesion(admin)))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("application/vnd.ms-excel"))
                .andExpect(header().string("Content-Disposition",
                        org.hamcrest.Matchers.containsString(".xls")));
    }

    @Test
    @DisplayName("La exportación PDF genera un archivo PDF válido")
    void exportaPdf() throws Exception {
        MvcResult resultado = mockMvc.perform(get("/api/reportes/export?formato=pdf" + "&desde=2026-01-01&hasta=2026-12-31")
                        .session(iniciarSesion(admin)))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("application/pdf"))
                .andReturn();

        assertThat(resultado.getResponse().getContentAsByteArray())
                .startsWith("%PDF".getBytes(StandardCharsets.US_ASCII));
    }

    @Test
    @DisplayName("Un formato desconocido responde 400")
    void formatoInvalidoDevuelve400() throws Exception {
        mockMvc.perform(get("/api/reportes/export?formato=xml").session(iniciarSesion(admin)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }
}
