package com.serviteca.servicios;

import com.serviteca.DTOs.VehiculoDTOs;
import com.serviteca.modelos.Usuario;
import com.serviteca.modelos.Vehiculo;
import com.serviteca.repository.CitaRepository;
import com.serviteca.repository.ServicioRepository;
import com.serviteca.repository.UsuarioRepository;
import com.serviteca.repository.VehiculoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
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
            Usuario usuario = currentUser(authentication);
            if (usuario == null) {
                throw new RuntimeException("Usuario no autenticado");
            }
            return vehiculoRepository.findByUsuarioIdUsuario(usuario.getIdUsuario())
                    .stream()
                    .map(this::convertirADTO)
                    .collect(Collectors.toList());
        }

        return vehiculoRepository.findAll()
                .stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VehiculoDTOs buscarPorId(Integer id, Authentication authentication) {
        Vehiculo vehiculo = vehiculoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehículo no encontrado con ID: " + id));

        validarAccesoPropietario(vehiculo, authentication);

        return convertirADTO(vehiculo);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> obtenerHistorial(Integer id, Authentication authentication) {
        Vehiculo vehiculo = vehiculoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehículo no encontrado con ID: " + id));

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
        if (dto.getPlaca() != null && vehiculoRepository.existsByPlaca(dto.getPlaca())) {
            throw new RuntimeException("Ya existe un vehículo registrado con la placa: " + dto.getPlaca());
        }

        Vehiculo vehiculo = new Vehiculo();
        vehiculo.setPlaca(dto.getPlaca());
        vehiculo.setMarca(dto.getMarca());
        vehiculo.setModelo(dto.getModelo());
        vehiculo.setColor(dto.getColor());
        vehiculo.setKilometraje(dto.getKilometraje() != null ? dto.getKilometraje() : 0);

        if (isClient(authentication)) {
            Usuario usuario = currentUser(authentication);
            if (usuario == null) {
                throw new RuntimeException("Usuario no autenticado");
            }
            vehiculo.setUsuario(usuario);
        } else {
            if (dto.getIdusuario() == null) {
                throw new RuntimeException("Debe indicar el ID del usuario propietario");
            }
            Usuario usuario = usuarioRepository.findById(dto.getIdusuario())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + dto.getIdusuario()));
            vehiculo.setUsuario(usuario);
        }

        Vehiculo guardado = vehiculoRepository.save(vehiculo);
        return convertirADTO(guardado);
    }

    @Transactional
    public VehiculoDTOs actualizarVehiculo(Integer id, VehiculoDTOs dto, Authentication authentication) {
        Vehiculo vehiculo = vehiculoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehículo no encontrado con ID: " + id));

        validarAccesoPropietario(vehiculo, authentication);

        if (!vehiculo.getPlaca().equalsIgnoreCase(dto.getPlaca()) && vehiculoRepository.existsByPlaca(dto.getPlaca())) {
            throw new RuntimeException("La placa " + dto.getPlaca() + " ya está registrada por otro vehículo");
        }

        if (!isClient(authentication) && dto.getIdusuario() != null) {
            Usuario nuevoPropietario = usuarioRepository.findById(dto.getIdusuario())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + dto.getIdusuario()));
            vehiculo.setUsuario(nuevoPropietario);
        }

        vehiculo.setPlaca(dto.getPlaca());
        vehiculo.setMarca(dto.getMarca());
        vehiculo.setModelo(dto.getModelo());
        vehiculo.setColor(dto.getColor());
        if (dto.getKilometraje() != null) {
            vehiculo.setKilometraje(dto.getKilometraje());
        }

        Vehiculo actualizado = vehiculoRepository.save(vehiculo);
        return convertirADTO(actualizado);
    }

    @Transactional
    public void eliminarVehiculo(Integer id, Authentication authentication) {
        Vehiculo vehiculo = vehiculoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehículo no encontrado con ID: " + id));

        validarAccesoPropietario(vehiculo, authentication);

        vehiculoRepository.delete(vehiculo);
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

    private void validarAccesoPropietario(Vehiculo vehiculo, Authentication authentication) {
        if (isClient(authentication)) {
            Usuario usuario = currentUser(authentication);
            if (usuario == null || vehiculo.getUsuario() == null ||
                    !vehiculo.getUsuario().getIdUsuario().equals(usuario.getIdUsuario())) {
                throw new SecurityException("No tiene permisos para acceder o modificar este vehículo");
            }
        }
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