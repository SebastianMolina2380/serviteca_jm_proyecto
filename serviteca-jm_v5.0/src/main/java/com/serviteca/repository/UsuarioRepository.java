package com.serviteca.repository;

import com.serviteca.modelos.Usuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {

    // Spring genera el SQL automáticamente a partir del nombre del método
    Optional<Usuario> findByCorreo(String correo);

    Optional<Usuario> findByNumeroDoc(String numeroDoc);

    List<Usuario> findByRol(Usuario.Rol rol);

    List<Usuario> findByRolAndEstado(Usuario.Rol rol, Usuario.Estado estado);

    List<Usuario> findByRolAndEstadoOrderByNombreAsc(Usuario.Rol rol, Usuario.Estado estado);

    long countByRolAndEstado(Usuario.Rol rol, Usuario.Estado estado);

    boolean existsByCorreo(String correo);

    boolean existsByNumeroDoc(String numeroDoc);

    @Query("""
        SELECT u FROM Usuario u
        WHERE u.rol = :rol AND u.estado = :estado
          AND (lower(u.nombre) LIKE :patron
               OR lower(u.correo) LIKE :patron
               OR lower(u.numeroDoc) LIKE :patron)
        """)
    Page<Usuario> buscarPorRolEstado(@Param("rol") Usuario.Rol rol,
                                     @Param("estado") Usuario.Estado estado,
                                     @Param("patron") String patron,
                                     Pageable pageable);
}
