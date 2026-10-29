package com.serviteca.repository;

import com.serviteca.modelos.Producto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Integer> {

    List<Producto> findByNombreProductoContainingIgnoreCase(String nombre);

    List<Producto> findByServicioIdServicio(Integer idServicio);

    List<Producto> findAllByOrderByNombreProductoAsc();

    @Query("""
        SELECT p FROM Producto p
        WHERE lower(p.nombreProducto) LIKE :patron
           OR lower(p.descripcionProducto) LIKE :patron
        """)
    Page<Producto> buscarPaginado(@Param("patron") String patron, Pageable pageable);
}
