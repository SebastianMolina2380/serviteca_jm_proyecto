package com.serviteca.repository;

import com.serviteca.modelos.Inventario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventarioRepository extends JpaRepository<Inventario, Integer> {

    // Productos con stock por debajo del umbral dado
    List<Inventario> findByCantidadLessThanEqual(Integer umbral);

    // Productos sin stock
    List<Inventario> findByCantidad(Integer cantidad);

    List<Inventario> findByNombreContainingIgnoreCase(String nombre);
}