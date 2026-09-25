package com.serviteca.repository;

import com.serviteca.modelos.DetalleFactura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface DetalleFacturaRepository extends JpaRepository<DetalleFactura, Integer> {

    // Listar detalles de una factura específica
    List<DetalleFactura> findByFacturaIdFactura(Integer idFactura);

    // Listar detalles de un servicio
    List<DetalleFactura> findByServicioIdServicio(Integer idServicio);

    // Total de detalles en una factura
    @Query("""
        SELECT COUNT(d) FROM DetalleFactura d
        WHERE d.factura.idFactura = :idFactura
        """)
    int countByFactura(@Param("idFactura") Integer idFactura);

    // Suma total de subtotales en una factura
    @Query("""
        SELECT COALESCE(SUM(d.subtotal), 0) FROM DetalleFactura d
        WHERE d.factura.idFactura = :idFactura
        """)
    BigDecimal totalSubtotalPorFactura(@Param("idFactura") Integer idFactura);
}