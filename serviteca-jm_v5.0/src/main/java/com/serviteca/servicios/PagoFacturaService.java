package com.serviteca.servicios;

import com.serviteca.DTOs.RegistrarPagoRequest;
import com.serviteca.modelos.PagoFactura;
import com.serviteca.repository.FacturaRepository;
import com.serviteca.repository.PagoFacturaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class PagoFacturaService {
    private final FacturaRepository facturaRepository;
    private final PagoFacturaRepository pagoRepository;

    @Transactional
    public PagoFactura registrar(Integer idFactura, RegistrarPagoRequest request) {
        var existente = pagoRepository.findByClaveIdempotencia(request.claveIdempotencia());
        if (existente.isPresent()) {
            PagoFactura pago = existente.get();
            if (!pago.getFactura().getIdFactura().equals(idFactura)
                    || pago.getMonto().compareTo(request.monto()) != 0
                    || !pago.getMetodo().equals(request.metodo())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "La clave de idempotencia ya fue utilizada para otro pago.");
            }
            return pago;
        }

        var factura = facturaRepository.findByIdForUpdate(idFactura)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Factura no encontrada."));
        existente = pagoRepository.findByClaveIdempotencia(request.claveIdempotencia());
        if (existente.isPresent()) {
            PagoFactura pago = existente.get();
            if (!pago.getFactura().getIdFactura().equals(idFactura)
                    || pago.getMonto().compareTo(request.monto()) != 0
                    || !pago.getMetodo().equals(request.metodo())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "La clave de idempotencia ya fue utilizada para otro pago.");
            }
            return pago;
        }
        BigDecimal pagado = pagoRepository.totalPagado(idFactura);
        BigDecimal saldo = factura.getTotal().subtract(pagado).setScale(2, RoundingMode.HALF_UP);
        BigDecimal monto = request.monto().setScale(2, RoundingMode.HALF_UP);
        if (saldo.signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La factura ya está pagada.");
        }
        if (monto.compareTo(saldo) > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El pago supera el saldo pendiente de " + saldo + ".");
        }

        PagoFactura pago = new PagoFactura();
        pago.setFactura(factura);
        pago.setMonto(monto);
        pago.setMetodo(request.metodo().trim());
        pago.setFecha(request.fecha());
        pago.setNotas(request.notas() == null || request.notas().isBlank() ? null : request.notas().trim());
        pago.setClaveIdempotencia(request.claveIdempotencia().trim());
        return pagoRepository.saveAndFlush(pago);
    }
}
