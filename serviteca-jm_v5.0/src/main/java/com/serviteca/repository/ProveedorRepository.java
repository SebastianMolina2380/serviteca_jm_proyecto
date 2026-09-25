package com.serviteca.repository;

import com.serviteca.modelos.Proveedor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProveedorRepository extends JpaRepository<Proveedor, Integer> {

    // Comprueba si el NIT ya existe (para creación)
    boolean existsByNitProveedor(String nitProveedor);

    // Comprueba si el NIT pertenece a otro proveedor distinto al que se está editando (para actualización)
    boolean existsByNitProveedorAndIdProveedorNot(String nitProveedor, Integer idProveedor);
}