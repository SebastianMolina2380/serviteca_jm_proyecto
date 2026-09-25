package com.serviteca.repository;

import com.serviteca.modelos.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {

    // Spring genera el SQL automáticamente a partir del nombre del método
    Optional<Usuario> findByCorreo(String correo);

    Optional<Usuario> findByNumeroDoc(String numeroDoc);

    List<Usuario> findByRol(Usuario.Rol rol);

    boolean existsByCorreo(String correo);

    boolean existsByNumeroDoc(String numeroDoc);
}