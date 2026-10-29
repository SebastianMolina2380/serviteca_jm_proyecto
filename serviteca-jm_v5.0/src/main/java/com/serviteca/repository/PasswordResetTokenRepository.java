package com.serviteca.repository;

import com.serviteca.modelos.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByTokenHashAndUsadoFalse(String tokenHash);

    Optional<PasswordResetToken> findTopByUsuarioIdUsuarioOrderByCreadoEnDesc(Integer idUsuario);

    @Modifying
    @Query("update PasswordResetToken t set t.usado = true " +
            "where t.usuario.idUsuario = :idUsuario and t.usado = false")
    int invalidarTokensActivos(@Param("idUsuario") Integer idUsuario);

    @Modifying
    @Query("delete from PasswordResetToken t where t.expiraEn < :limite or t.usado = true")
    int limpiarTokensAntiguos(@Param("limite") LocalDateTime limite);
}
