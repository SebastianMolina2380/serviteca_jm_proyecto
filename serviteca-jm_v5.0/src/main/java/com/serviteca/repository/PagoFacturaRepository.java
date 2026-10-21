package com.serviteca.repository;

import com.serviteca.modelos.PagoFactura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface PagoFacturaRepository extends JpaRepository<PagoFactura, Long> {
    Optional<PagoFactura> findByClaveIdempotencia(String claveIdempotencia);

    List<PagoFactura> findByFacturaIdFacturaOrderByFechaAscIdPagoAsc(Integer idFactura);

    @Query("select coalesce(sum(p.monto), 0) from PagoFactura p where p.factura.idFactura = :idFactura")
    BigDecimal totalPagado(@Param("idFactura") Integer idFactura);
}
