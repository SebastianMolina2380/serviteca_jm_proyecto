package com.serviteca.repository;

import com.serviteca.modelos.Factura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.EntityGraph;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface FacturaRepository extends JpaRepository<Factura, Integer> {

    @Override
    @EntityGraph(attributePaths = {"usuario", "cita", "cita.vehiculo", "detalles"})
    List<Factura> findAll();

    @EntityGraph(attributePaths = {"usuario", "cita", "cita.vehiculo", "detalles"})
    List<Factura> findByUsuarioIdUsuario(Integer idUsuario);

    @EntityGraph(attributePaths = {"usuario", "cita", "cita.vehiculo", "detalles"})
    List<Factura> findByCitaIdCita(Integer idCita);

    boolean existsByCitaIdCita(Integer idCita);

    List<Factura> findByFechaBetween(LocalDate desde, LocalDate hasta);

    @Query("""
        SELECT COALESCE(SUM(f.total), 0) FROM Factura f
        WHERE f.fecha BETWEEN :desde AND :hasta
    """)
    BigDecimal totalFacturadoEnPeriodo(@Param("desde") LocalDate desde,
                                       @Param("hasta") LocalDate hasta);
}