package com.serviteca.repository;

import com.serviteca.modelos.Inventario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.List;

@Repository
public interface InventarioRepository extends JpaRepository<Inventario, Integer> {

    // Productos con stock por debajo del umbral dado
    List<Inventario> findByCantidadLessThanEqual(Integer umbral);

    // Productos sin stock
    List<Inventario> findByCantidad(Integer cantidad);

    List<Inventario> findByNombreContainingIgnoreCase(String nombre);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select i from Inventario i where i.producto.idProducto = :idProducto order by i.idInventario")
    List<Inventario> findForUpdateByProducto(@Param("idProducto") Integer idProducto);
}
