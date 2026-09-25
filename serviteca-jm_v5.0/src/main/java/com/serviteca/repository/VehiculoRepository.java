package com.serviteca.repository;

import com.serviteca.modelos.Vehiculo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehiculoRepository extends JpaRepository<Vehiculo, Integer> {

    Optional<Vehiculo> findByPlaca(String placa);

    List<Vehiculo> findByUsuarioIdUsuario(Integer idUsuario);

    List<Vehiculo> findByMarcaContainingIgnoreCase(String marca);

    List<Vehiculo> findByModeloContainingIgnoreCase(String modelo);

    boolean existsByPlaca(String placa);
}