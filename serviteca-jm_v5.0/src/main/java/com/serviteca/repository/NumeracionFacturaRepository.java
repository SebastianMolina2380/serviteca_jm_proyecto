package com.serviteca.repository;

import com.serviteca.modelos.NumeracionFactura;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface NumeracionFacturaRepository extends JpaRepository<NumeracionFactura, Integer> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select n from NumeracionFactura n where n.id = 1")
    Optional<NumeracionFactura> bloquearConfiguracion();
}
