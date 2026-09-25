package com.serviteca.repository;

import com.serviteca.modelos.Seguimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SeguimientoRepository extends JpaRepository<Seguimiento, Long> {

    List<Seguimiento> findByUsuario_IdUsuario(Integer idUsuario);

    List<Seguimiento> findByServicio_IdServicio(Integer idServicio);

    List<Seguimiento> findByEstado(String estado);

    List<Seguimiento> findByTipo(String tipo);
}