package com.serviteca.repository;

import com.serviteca.modelos.Cita;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import java.util.Optional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface CitaRepository extends JpaRepository<Cita, Integer> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Cita c where c.idCita = :id")
    Optional<Cita> findByIdForUpdate(@Param("id") Integer id);

    List<Cita> findByFecha(LocalDate fecha);
    List<Cita> findByEstado(Cita.Estado estado);
    List<Cita> findByVehiculoIdvehiculo(Integer idvehiculo);

    @Query("SELECT c FROM Cita c WHERE c.vehiculo.usuario.idUsuario = :idUsuario ORDER BY c.idCita ASC")
    List<Cita> buscarPorUsuario(@Param("idUsuario") Integer idUsuario);

    // Conflicto de horario basado únicamente en fecha y hora
    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END " +
            "FROM Cita c WHERE c.fecha = :fecha AND c.hora = :hora")
    boolean existeConflicto(
            @Param("fecha") LocalDate fecha,
            @Param("hora") LocalTime hora
    );

    // Conflicto excluyendo la cita actual
    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END " +
            "FROM Cita c WHERE c.fecha = :fecha AND c.hora = :hora AND c.idCita <> :idCita")
    boolean existeConflictoExcluyendoId(
            @Param("fecha") LocalDate fecha,
            @Param("hora") LocalTime hora,
            @Param("idCita") Integer idCita
    );
}
