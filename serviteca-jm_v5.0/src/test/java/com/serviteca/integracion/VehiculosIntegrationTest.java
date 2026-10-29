package com.serviteca.integracion;

import com.fasterxml.jackson.databind.JsonNode;
import com.serviteca.soporte.IntegracionBase;
import com.serviteca.soporte.PruebaIntegracion;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Flujo de negocio de vehículos: alta con placa normalizada, consulta
 * del propietario, aislamiento entre clientes y borrado lógico.
 */
@PruebaIntegracion
class VehiculosIntegrationTest extends IntegracionBase {

    @Test
    @DisplayName("ADMIN crea un vehículo y la placa se normaliza")
    void creaVehiculoConPlacaNormalizada() throws Exception {
        String placa = "ab" + UUID.randomUUID().toString().replace("-", "").substring(0, 5);

        MvcResult resultado = mockMvc.perform(post("/api/vehiculos")
                        .session(iniciarSesion(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "idusuario", cliente.getIdUsuario(),
                                "placa", "  " + placa + " ",
                                "marca", "Renault",
                                "modelo", "Logan",
                                "color", "Gris",
                                "kilometraje", 12000))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.placa").value(placa.toUpperCase(Locale.ROOT)))
                .andExpect(jsonPath("$.idusuario").value(cliente.getIdUsuario()))
                .andReturn();

        JsonNode creado = objectMapper.readTree(resultado.getResponse().getContentAsString());
        int idVehiculo = creado.get("idvehiculo").asInt();

        // El propietario puede consultarlo.
        mockMvc.perform(get("/api/vehiculos/" + idVehiculo)
                        .session(iniciarSesion(cliente)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.placa").value(placa.toUpperCase(Locale.ROOT)));
    }

    @Test
    @DisplayName("Una placa duplicada responde 409 aunque cambie el formato")
    void placaDuplicadaDevuelve409() throws Exception {
        var sesion = iniciarSesion(admin);
        String placa = "DUP" + (System.nanoTime() % 100000);

        mockMvc.perform(post("/api/vehiculos").session(sesion)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "idusuario", cliente.getIdUsuario(),
                                "placa", placa,
                                "marca", "Mazda",
                                "modelo", "3",
                                "kilometraje", 1000))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/vehiculos").session(sesion)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "idusuario", cliente.getIdUsuario(),
                                "placa", "  " + placa.toLowerCase() + " ",
                                "marca", "Mazda",
                                "modelo", "3",
                                "kilometraje", 1000))))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Un cliente no puede consultar el vehículo de otro cliente")
    void clienteNoVeVehiculoAjeno() throws Exception {
        MvcResult resultado = mockMvc.perform(post("/api/vehiculos")
                        .session(iniciarSesion(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "idusuario", cliente.getIdUsuario(),
                                "placa", "AIS-" + System.nanoTime() % 100000,
                                "marca", "Chevrolet",
                                "modelo", "Onix",
                                "kilometraje", 5000))))
                .andExpect(status().isCreated())
                .andReturn();

        int idVehiculo = objectMapper.readTree(resultado.getResponse().getContentAsString())
                .get("idvehiculo").asInt();

        var otroCliente = crearUsuario(com.serviteca.modelos.Usuario.Rol.CLIENTE);

        mockMvc.perform(get("/api/vehiculos/" + idVehiculo)
                        .session(iniciarSesion(otroCliente)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("El borrado es lógico: el vehículo desaparece de las consultas")
    void borradoLogicoOcultaElVehiculo() throws Exception {
        MvcResult resultado = mockMvc.perform(post("/api/vehiculos")
                        .session(iniciarSesion(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "idusuario", cliente.getIdUsuario(),
                                "placa", "LOG-" + System.nanoTime() % 100000,
                                "marca", "Kia",
                                "modelo", "Picanto",
                                "kilometraje", 8000))))
                .andExpect(status().isCreated())
                .andReturn();

        int idVehiculo = objectMapper.readTree(resultado.getResponse().getContentAsString())
                .get("idvehiculo").asInt();
        var sesion = iniciarSesion(admin);

        mockMvc.perform(delete("/api/vehiculos/" + idVehiculo).session(sesion))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/vehiculos/" + idVehiculo).session(sesion))
                .andExpect(status().isNotFound());
    }
}
