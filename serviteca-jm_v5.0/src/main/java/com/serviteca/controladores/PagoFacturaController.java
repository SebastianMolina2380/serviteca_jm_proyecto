package com.serviteca.controladores;

import com.serviteca.DTOs.RegistrarPagoRequest;
import com.serviteca.modelos.PagoFactura;
import com.serviteca.repository.FacturaRepository;
import com.serviteca.repository.PagoFacturaRepository;
import com.serviteca.repository.UsuarioRepository;
import com.serviteca.servicios.PagoFacturaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/facturas/{idFactura}/pagos")
@RequiredArgsConstructor
public class PagoFacturaController {
    private final PagoFacturaService pagoService;
    private final PagoFacturaRepository pagoRepository;
    private final FacturaRepository facturaRepository;
    private final UsuarioRepository usuarioRepository;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<?> registrar(@PathVariable Integer idFactura,
                                       @Valid @RequestBody RegistrarPagoRequest request) {
        PagoFactura pago = pagoService.registrar(idFactura, request);
        BigDecimal totalPagado = pagoRepository.totalPagado(idFactura);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "idPago", pago.getIdPago(), "idFactura", idFactura, "monto", pago.getMonto(),
                "metodo", pago.getMetodo(), "fecha", pago.getFecha(), "notas", pago.getNotas() == null ? "" : pago.getNotas(),
                "pagado", totalPagado
        ));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO','CLIENTE')")
    public ResponseEntity<?> listar(@PathVariable Integer idFactura, Authentication authentication) {
        var factura = facturaRepository.findById(idFactura)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Factura no encontrada."));
        boolean cliente = authentication.getAuthorities().stream().anyMatch(a -> "ROLE_CLIENTE".equals(a.getAuthority()));
        if (cliente) {
            var usuario = usuarioRepository.findByCorreo(authentication.getName()).orElse(null);
            if (usuario == null || factura.getUsuario() == null
                    || !usuario.getIdUsuario().equals(factura.getUsuario().getIdUsuario())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puede consultar los pagos de esta factura.");
            }
        }
        List<Map<String, Object>> pagos = pagoRepository.findByFacturaIdFacturaOrderByFechaAscIdPagoAsc(idFactura)
                .stream().map(this::toView).toList();
        return ResponseEntity.ok(pagos);
    }

    private Map<String, Object> toView(PagoFactura pago) {
        Map<String, Object> view = new LinkedHashMap<>();
        view.put("idPago", pago.getIdPago()); view.put("monto", pago.getMonto());
        view.put("metodo", pago.getMetodo()); view.put("fecha", pago.getFecha());
        view.put("notas", pago.getNotas()); view.put("registradoEn", pago.getRegistradoEn());
        return view;
    }
}
