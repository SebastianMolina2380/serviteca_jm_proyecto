package com.serviteca.repository;

import com.serviteca.modelos.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Integer> {

    List<Producto> findByNombreProductoContainingIgnoreCase(String nombre);

    List<Producto> findByServicioIdServicio(Integer idServicio);
}