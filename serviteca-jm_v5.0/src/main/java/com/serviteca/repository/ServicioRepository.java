package com.serviteca.repository;

import com.serviteca.modelos.Servicio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServicioRepository extends JpaRepository<Servicio, Integer> {

    List<Servicio> findByActivoTrue();

    List<Servicio> findByVehiculoIdvehiculo(Integer idvehiculo);

    List<Servicio> findByTipoContainingIgnoreCase(String tipo);
}