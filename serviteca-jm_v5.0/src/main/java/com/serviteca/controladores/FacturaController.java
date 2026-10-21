package com.serviteca.controladores;

import com.serviteca.DTOs.CrearFacturaRequest;
import com.serviteca.DTOs.FacturaResponse;
import com.serviteca.configuracion.DatosFiscalesProperties;
import com.serviteca.modelos.*;
import com.serviteca.repository.*;
import com.serviteca.servicios.FacturacionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/facturas")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FacturaController {
    private final FacturaRepository facturaRepository;
    private final UsuarioRepository usuarioRepository;
    private final PagoFacturaRepository pagoRepository;
    private final FacturacionService facturacionService;
    private final DatosFiscalesProperties fiscales;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO','CLIENTE')")
    public ResponseEntity<List<FacturaResponse>> listarTodas(Authentication authentication) {
        List<Factura> facturas;
        if (isCliente(authentication)) {
            Usuario usuario = usuarioRepository.findByCorreo(authentication.getName()).orElse(null);
            if (usuario == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            facturas = facturaRepository.findByUsuarioIdUsuario(usuario.getIdUsuario());
        } else {
            facturas = facturaRepository.findAll();
        }
        return ResponseEntity.ok(facturas.stream().map(this::toView).toList());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO','CLIENTE')")
    public ResponseEntity<FacturaResponse> obtenerPorId(@PathVariable Integer id, Authentication authentication) {
        Factura factura = facturaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Factura no encontrada."));
        if (isCliente(authentication) && !belongsToCurrentUser(factura, authentication)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puede consultar esta factura.");
        }
        return ResponseEntity.ok(toView(factura));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<FacturaResponse> crear(@Valid @RequestBody CrearFacturaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(toView(facturacionService.emitir(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<?> actualizar(@PathVariable Integer id) {
        if (!facturaRepository.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Factura no encontrada.");
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Las facturas emitidas son inmutables. Registre abonos en /api/facturas/{id}/pagos.");
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> eliminar(@PathVariable Integer id) {
        if (!facturaRepository.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Factura no encontrada.");
        throw new ResponseStatusException(HttpStatus.CONFLICT, "No se puede eliminar una factura emitida; conserve su historial contable.");
    }

    private boolean isCliente(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_CLIENTE".equals(a.getAuthority()));
    }

    private boolean belongsToCurrentUser(Factura factura, Authentication authentication) {
        Usuario usuario = usuarioRepository.findByCorreo(authentication.getName()).orElse(null);
        return usuario != null && factura.getUsuario() != null
                && Objects.equals(usuario.getIdUsuario(), factura.getUsuario().getIdUsuario());
    }

    private FacturaResponse toView(Factura factura) {
        BigDecimal pagado = pagoRepository.totalPagado(factura.getIdFactura());
        BigDecimal total = money(factura.getTotal());
        List<PagoFactura> pagos = pagoRepository.findByFacturaIdFacturaOrderByFechaAscIdPagoAsc(factura.getIdFactura());
        String estadoPago = pagado.signum() == 0 ? "PENDIENTE" : pagado.compareTo(total) >= 0 ? "PAGADA" : "ABONADA";
        Usuario usuario = factura.getUsuario();
        Cita cita = factura.getCita();
        var emisor = new FacturaResponse.ParteFiscal(factura.getRazonSocialEmisor(), "NIT", factura.getNitEmisor(), factura.getDireccionEmisor(), factura.getCiudadEmisor(), factura.getTelefonoEmisor(), factura.getCorreoEmisor());
        var adquirente = new FacturaResponse.ParteFiscal(factura.getNombreAdquirente(), factura.getTipoDocAdquirente(), factura.getNumeroDocAdquirente(), factura.getDireccionAdquirente(), factura.getCiudadAdquirente(), factura.getTelefonoAdquirente(), factura.getCorreoAdquirente());
        var detalles = factura.getDetalles() == null ? List.<FacturaResponse.Detalle>of() : factura.getDetalles().stream().map(d -> new FacturaResponse.Detalle(
                factura.getDetalles().indexOf(d)+1, d.getCodigoItem(), d.getUnidadMedida(), d.getNombre(), d.getCantidad(), money(d.getValor()), money(d.getSubtotal()), d.getTarifaIva(), money(d.getIvaValor()), money(d.getSubtotal()).add(money(d.getIvaValor())))).toList();
        var iva = factura.getDetalles() == null ? List.<FacturaResponse.Iva>of() : factura.getDetalles().stream().collect(java.util.stream.Collectors.groupingBy(DetalleFactura::getTarifaIva, java.util.TreeMap::new, java.util.stream.Collectors.toList())).entrySet().stream().map(e -> new FacturaResponse.Iva(e.getKey(), e.getValue().stream().map(DetalleFactura::getSubtotal).reduce(BigDecimal.ZERO, BigDecimal::add), e.getValue().stream().map(DetalleFactura::getIvaValor).reduce(BigDecimal.ZERO, BigDecimal::add))).toList();
        var cfg = fiscales.software();
        var software = cfg == null ? null : new FacturaResponse.DatosSoftware(cfg.nombre(), cfg.fabricante(), cfg.nitFabricante(), cfg.proveedorTecnologico(), cfg.nitProveedorTecnologico());
        String placa = cita != null && cita.getVehiculo()!=null ? cita.getVehiculo().getPlaca() : null;
        return new FacturaResponse(factura.getIdFactura(), factura.getNumeroFactura(), factura.getPrefijo(), factura.getNumeroAutorizacion(), factura.getRangoDesde(), factura.getRangoHasta(), factura.getVigenciaDesde(), factura.getVigenciaHasta(), emisor, adquirente, factura.getFechaGeneracion(), factura.getFechaExpedicion(), factura.getEstadoValidacionDian(), detalles, money(factura.getSubtotal()), money(factura.getIvaTotal()), iva, total, factura.getFormaPago(), pagos.isEmpty()?factura.getMedioPago():pagos.get(pagos.size()-1).getMetodo(), factura.getPlazoDias(), pagado, total.subtract(pagado).max(BigDecimal.ZERO), estadoPago, pagos.stream().map(p -> new FacturaResponse.Pago(p.getIdPago(), p.getMonto(), p.getMetodo(), p.getRegistradoEn())).toList(), factura.getResponsabilidadesFiscales(), software, placa);
    }

    private BigDecimal money(BigDecimal amount) { return amount == null ? BigDecimal.ZERO : amount; }
}
