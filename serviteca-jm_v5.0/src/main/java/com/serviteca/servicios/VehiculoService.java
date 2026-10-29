package com.serviteca.servicios;

import com.serviteca.DTOs.VehiculoDTOs;
import com.serviteca.modelos.Usuario;
import com.serviteca.modelos.Vehiculo;
import com.serviteca.repository.CitaRepository;
import com.serviteca.repository.ServicioRepository;
import com.serviteca.repository.UsuarioRepository;
import com.serviteca.repository.VehiculoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VehiculoService {

    private final VehiculoRepository vehiculoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ServicioRepository servicioRepository;
    private final CitaRepository citaRepository;

    @Transactional(readOnly = true)
    public List<VehiculoDTOs> listarVehiculos(Authentication authentication) {
        if (isClient(authentication)) {
            Usuario usuario = requireCurrentUser(authentication);
            return vehiculoRepository.findByUsuarioIdUsuarioAndEstado(
                            usuario.getIdUsuario(), Vehiculo.Estado.ACTIVO)
                    .stream()
                    .map(this::convertirADTO)
                    .collect(Collectors.toList());
        }

        return vehiculoRepository.findByEstado(Vehiculo.Estado.ACTIVO)
                .stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VehiculoDTOs buscarPorId(Integer id, Authentication authentication) {
        Vehiculo vehiculo = obtenerVehiculo(id);
        validarAccesoPropietario(vehiculo, authentication);
        return convertirADTO(vehiculo);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> obtenerHistorial(Integer id, Authentication authentication) {
        Vehiculo vehiculo = obtenerVehiculo(id);
        validarAccesoPropietario(vehiculo, authentication);

        var servicios = servicioRepository.findByVehiculoIdvehiculo(id);
        var citas = citaRepository.findByVehiculoIdvehiculo(id);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("vehiculo", convertirADTO(vehiculo));
        result.put("servicios", servicios);
        result.put("citas", citas);

        return result;
    }

    @Transactional
    public VehiculoDTOs crearVehiculo(VehiculoDTOs dto, Authentication authentication) {
        String placa = validarDatosVehiculo(dto);

        if (vehiculoRepository.existsByPlaca(placa)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Ya existe un vehículo registrado con la placa: " + placa);
        }

        Vehiculo vehiculo = new Vehiculo();
        vehiculo.setPlaca(placa);
        vehiculo.setEstado(Vehiculo.Estado.ACTIVO);
        aplicarDatosVehiculo(vehiculo, dto);

        if (isClient(authentication)) {
            vehiculo.setUsuario(requireCurrentUser(authentication));
        } else {
            vehiculo.setUsuario(obtenerPropietario(dto.getIdusuario(), true));
        }

        Vehiculo guardado = vehiculoRepository.save(vehiculo);
        return convertirADTO(guardado);
    }

    @Transactional
    public VehiculoDTOs actualizarVehiculo(Integer id, VehiculoDTOs dto, Authentication authentication) {
        Vehiculo vehiculo = obtenerVehiculo(id);
        validarAccesoPropietario(vehiculo, authentication);

        String placa = validarDatosVehiculo(dto);

        if (!placa.equalsIgnoreCase(vehiculo.getPlaca()) && vehiculoRepository.existsByPlaca(placa)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "La placa " + placa + " ya está registrada por otro vehículo");
        }

        if (!isClient(authentication) && dto.getIdusuario() != null) {
            vehiculo.setUsuario(obtenerPropietario(dto.getIdusuario(), true));
        }

        vehiculo.setPlaca(placa);
        aplicarDatosVehiculo(vehiculo, dto);

        Vehiculo actualizado = vehiculoRepository.save(vehiculo);
        return convertirADTO(actualizado);
    }

    @Transactional
    public void eliminarVehiculo(Integer id, Authentication authentication) {
        Vehiculo vehiculo = obtenerVehiculo(id);
        validarAccesoPropietario(vehiculo, authentication);

        // Borrado lógico: se conserva el historial de citas, servicios y facturas.
        vehiculo.setEstado(Vehiculo.Estado.INACTIVO);
        vehiculoRepository.save(vehiculo);
    }

    private Vehiculo obtenerVehiculo(Integer id) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El ID del vehículo es obligatorio");
        }
        Vehiculo vehiculo = vehiculoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Vehículo no encontrado con ID: " + id));
        if (vehiculo.getEstado() == Vehiculo.Estado.INACTIVO) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehículo no encontrado con ID: " + id);
        }
        return vehiculo;
    }

    /**
     * Normaliza y valida los datos obligatorios del vehículo.
     *
     * @return la placa normalizada (sin espacios y en mayúsculas)
     */
    private String validarDatosVehiculo(VehiculoDTOs dto) {
        if (dto == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Los datos del vehículo son obligatorios");
        }

        String placa = normalizarPlaca(dto.getPlaca());
        if (placa == null || placa.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La placa es obligatoria");
        }
        if (placa.length() > 10) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La placa no puede exceder los 10 caracteres");
        }

        String marca = textoOpcional(dto.getMarca());
        if (marca == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La marca es obligatoria");
        }
        if (marca.length() > 50) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La marca no puede exceder los 50 caracteres");
        }

        String modelo = textoOpcional(dto.getModelo());
        if (modelo == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El modelo es obligatorio");
        }
        if (modelo.length() > 50) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El modelo no puede exceder los 50 caracteres");
        }

        String color = textoOpcional(dto.getColor());
        if (color != null && color.length() > 30) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El color no puede exceder los 30 caracteres");
        }

        if (dto.getKilometraje() != null && dto.getKilometraje() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El kilometraje no puede ser negativo");
        }

        return placa;
    }

    private void aplicarDatosVehiculo(Vehiculo vehiculo, VehiculoDTOs dto) {
        vehiculo.setMarca(textoOpcional(dto.getMarca()));
        vehiculo.setModelo(textoOpcional(dto.getModelo()));
        vehiculo.setColor(textoOpcional(dto.getColor()));
        vehiculo.setKilometraje(dto.getKilometraje() != null ? dto.getKilometraje() : 0);
    }

    private Usuario obtenerPropietario(Integer idUsuario, boolean obligatorio) {
        if (idUsuario == null) {
            if (obligatorio) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Debe indicar el ID del usuario propietario");
            }
            return null;
        }
        return usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Usuario no encontrado con ID: " + idUsuario));
    }

    private boolean isClient(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CLIENTE"));
    }

    private Usuario currentUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) return null;
        return usuarioRepository.findByCorreo(authentication.getName()).orElse(null);
    }

    private Usuario requireCurrentUser(Authentication authentication) {
        Usuario usuario = currentUser(authentication);
        if (usuario == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no autenticado");
        }
        return usuario;
    }

    private void validarAccesoPropietario(Vehiculo vehiculo, Authentication authentication) {
        if (!isClient(authentication)) return;

        Usuario usuario = requireCurrentUser(authentication);
        if (vehiculo.getUsuario() == null
                || !vehiculo.getUsuario().getIdUsuario().equals(usuario.getIdUsuario())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "No tiene permisos para acceder o modificar este vehículo");
        }
    }

    private String normalizarPlaca(String placa) {
        return com.serviteca.util.PlacaUtil.normalizar(placa);
    }

    private String textoOpcional(String valor) {
        if (valor == null) return null;
        String limpio = valor.trim();
        return limpio.isEmpty() ? null : limpio;
    }

    private VehiculoDTOs convertirADTO(Vehiculo vehiculo) {
        return new VehiculoDTOs(
                vehiculo.getIdvehiculo(),
                vehiculo.getUsuario() != null ? vehiculo.getUsuario().getIdUsuario() : null,
                vehiculo.getPlaca(),
                vehiculo.getMarca(),
                vehiculo.getModelo(),
                vehiculo.getColor(),
                vehiculo.getKilometraje()
        );
    }
}
