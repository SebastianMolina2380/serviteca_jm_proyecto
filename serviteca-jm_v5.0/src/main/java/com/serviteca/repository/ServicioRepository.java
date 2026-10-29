package com.serviteca.repository;

import com.serviteca.modelos.Servicio;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ServicioRepository extends JpaRepository<Servicio, Integer> {

    List<Servicio> findByActivoTrue();

    List<Servicio> findByActivoTrueOrderByTipoAsc();

    List<Servicio> findByVehiculoIdvehiculo(Integer idvehiculo);

    List<Servicio> findByTipoContainingIgnoreCase(String tipo);

    List<Servicio> findByFechaServicioBetween(LocalDateTime desde, LocalDateTime hasta);

    long countByActivoTrue();

    long countByEstado(Servicio.Estado estado);

    List<Servicio> findTop5ByEstadoOrderByFechaServicioAsc(Servicio.Estado estado);

    /**
     * Listado paginado con búsqueda y filtros resueltos en la base de datos.
     * Cuando idUsuario viene informado solo se devuelven los servicios de los
     * vehículos de ese cliente (consulta del portal).
     */
    @Query("""
        SELECT s FROM Servicio s
        WHERE (:idUsuario IS NULL OR (
                 s.vehiculo.usuario IS NOT NULL AND s.vehiculo.usuario.idUsuario = :idUsuario))
          AND (lower(s.tipo) LIKE :patron OR lower(s.vehiculo.placa) LIKE :patron)
          AND (:estado IS NULL OR s.estado = :estado)
          AND (:activo IS NULL OR s.activo = :activo)
        """)
    Page<Servicio> buscarPaginado(@Param("idUsuario") Integer idUsuario,
                                  @Param("patron") String patron,
                                  @Param("estado") Servicio.Estado estado,
                                  @Param("activo") Boolean activo,
                                  Pageable pageable);
}
