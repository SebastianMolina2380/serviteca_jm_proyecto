package com.serviteca.servicios;

import com.serviteca.DTOs.CrearFacturaRequest;
import com.serviteca.configuracion.DatosFiscalesProperties;
import com.serviteca.modelos.*;
import com.serviteca.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.math.*;
import java.time.LocalDate;
import java.util.ArrayList;

@Service @RequiredArgsConstructor
public class FacturacionService {
    private static final BigDecimal CERO = new BigDecimal("0.00");
    private final FacturaRepository facturaRepository;
    private final UsuarioRepository usuarioRepository;
    private final CitaRepository citaRepository;
    private final ServicioRepository servicioRepository;
    private final ProductoRepository productoRepository;
    private final InventarioRepository inventarioRepository;
    private final NumeracionFacturaRepository numeracionRepository;
    private final DatosFiscalesProperties fiscales;

    @Transactional
    public Factura emitir(CrearFacturaRequest request) {
        validarConfiguracionEmisor();
        String forma = normalizar(request.formaPago());
        if (!forma.equals("CONTADO") && !forma.equals("CREDITO")) bad("La forma de pago debe ser CONTADO o CREDITO.");
        if (forma.equals("CREDITO") && (request.plazoDias() == null || request.plazoDias() < 1)) bad("Indique el plazo en días para ventas a crédito.");
        String medio = request.medioPago() == null ? "" : request.medioPago().trim();
        if (forma.equals("CONTADO") && medio.isBlank()) bad("El medio de pago es obligatorio para ventas de contado.");

        NumeracionFactura numeracion = numeracionRepository.bloquearConfiguracion()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "Configure la autorización y el rango de numeración DIAN antes de emitir."));
        LocalDate hoy = LocalDate.now();
        if (hoy.isBefore(numeracion.getVigenteDesde()) || hoy.isAfter(numeracion.getVigenteHasta())
                || numeracion.getSiguienteNumero() < numeracion.getRangoDesde()
                || numeracion.getSiguienteNumero() > numeracion.getRangoHasta())
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La numeración autorizada está vencida o agotada.");

        Cita cita = citaRepository.findByIdForUpdate(request.idCita())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cita no encontrada."));
        if (facturaRepository.existsByCitaIdCita(cita.getIdCita()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La cita ya tiene una factura emitida.");
        Usuario usuario = usuarioRepository.findById(request.idUsuario())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente no encontrado."));
        if (usuario.getNombre() == null || usuario.getNombre().isBlank() || usuario.getNumeroDoc() == null || usuario.getNumeroDoc().isBlank())
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Complete el nombre y documento fiscal del adquirente.");
        if (cita.getUsuario() == null || !usuario.getIdUsuario().equals(cita.getUsuario().getIdUsuario()))
            bad("El usuario debe ser propietario del vehículo de la cita.");

        Factura f = new Factura();
        f.setUsuario(usuario); f.setCita(cita); f.setFormaPago(forma); f.setMedioPago(medio.isBlank()?null:medio);
        f.setPlazoDias(forma.equals("CREDITO") ? request.plazoDias() : 0);
        f.setDetalles(new ArrayList<>()); f.setSubtotal(CERO); f.setIvaTotal(CERO);
        f.setPrefijo(numeracion.getPrefijo()); f.setNumeroAutorizacion(numeracion.getNumeroAutorizacion());
        f.setRangoDesde(numeracion.getRangoDesde()); f.setRangoHasta(numeracion.getRangoHasta());
        f.setVigenciaDesde(numeracion.getVigenteDesde()); f.setVigenciaHasta(numeracion.getVigenteHasta());
        f.setNumeroFactura(numeracion.getPrefijo() + numeracion.getSiguienteNumero());
        f.setEstadoValidacionDian("PENDIENTE_VALIDACION_DIAN");
        var emisor = fiscales.emisor();
        f.setRazonSocialEmisor(emisor.razonSocial()); f.setNitEmisor(emisor.nit()); f.setDireccionEmisor(emisor.direccion());
        f.setCiudadEmisor(emisor.ciudad()); f.setTelefonoEmisor(emisor.telefono()); f.setCorreoEmisor(emisor.correo());
        f.setResponsabilidadesFiscales(emisor.responsabilidadesFiscales());
        f.setNombreAdquirente(usuario.getNombre()); f.setTipoDocAdquirente(usuario.getTipoDocumento());
        f.setNumeroDocAdquirente(usuario.getNumeroDoc()); f.setDireccionAdquirente(usuario.getDireccion()); f.setCiudadAdquirente(usuario.getCiudad());
        f.setTelefonoAdquirente(usuario.getTelefono()); f.setCorreoAdquirente(usuario.getCorreo());

        BigDecimal baseTotal=CERO, ivaTotal=CERO;
        for (var linea : request.detalles()) {
            if (!linea.tieneReferenciaUnica()) bad("Cada detalle debe indicar exactamente un servicio o producto.");
            BigDecimal precio, tarifa; String descripcion, codigo, unidad;
            DetalleFactura d = new DetalleFactura(); d.setFactura(f); d.setCantidad(linea.cantidad());
            if (linea.idServicio()!=null) {
                Servicio s=servicioRepository.findById(linea.idServicio()).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Servicio no encontrado."));
                if (!Boolean.TRUE.equals(s.getActivo())) throw new ResponseStatusException(HttpStatus.CONFLICT,"El servicio no está activo.");
                precio=s.getPrecio(); tarifa=s.getTarifaIva(); descripcion=s.getDescripcion()==null||s.getDescripcion().isBlank()?s.getTipo():s.getDescripcion();
                codigo="SER-"+s.getIdServicio(); unidad="SERVICIO"; d.setServicio(s);
            } else {
                Producto p=productoRepository.findById(linea.idProducto()).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Producto no encontrado."));
                var lotes=inventarioRepository.findForUpdateByProducto(p.getIdProducto());
                int disponibles=lotes.stream().mapToInt(i->i.getCantidad()==null?0:i.getCantidad()).sum();
                if(disponibles<linea.cantidad()) throw new ResponseStatusException(HttpStatus.CONFLICT,"Stock insuficiente para "+p.getNombreProducto()+".");
                int pendientes=linea.cantidad(); for(var inv:lotes){int existencias=inv.getCantidad()==null?0:inv.getCantidad(); int n=Math.min(pendientes,existencias); if(n>0)inv.setCantidad(existencias-n); pendientes-=n; if(pendientes==0)break;}
                precio=p.getPrecioProducto(); tarifa=p.getTarifaIva(); descripcion=p.getDescripcionProducto()==null||p.getDescripcionProducto().isBlank()?p.getNombreProducto():p.getDescripcionProducto();
                codigo="PRO-"+p.getIdProducto(); unidad="UND"; d.setProducto(p);
            }
            if(precio==null||precio.signum()<0) throw new ResponseStatusException(HttpStatus.CONFLICT,"Precio de catálogo inválido.");
            if(tarifa==null||tarifa.signum()<0||tarifa.compareTo(new BigDecimal("100"))>0)
                throw new ResponseStatusException(HttpStatus.CONFLICT,"Configure una tarifa IVA válida para cada servicio o producto antes de facturar.");
            BigDecimal base=precio.multiply(BigDecimal.valueOf(linea.cantidad())).setScale(2,RoundingMode.HALF_UP);
            BigDecimal iva=base.multiply(tarifa).divide(new BigDecimal("100"),2,RoundingMode.HALF_UP);
            d.setNombre(descripcion); d.setCodigoItem(codigo); d.setUnidadMedida(unidad); d.setValor(precio.setScale(2,RoundingMode.HALF_UP));
            d.setSubtotal(base); d.setTarifaIva(tarifa); d.setIvaValor(iva); f.getDetalles().add(d);
            baseTotal=baseTotal.add(base); ivaTotal=ivaTotal.add(iva);
        }
        f.setSubtotal(baseTotal); f.setIvaTotal(ivaTotal); f.setTotal(baseTotal.add(ivaTotal).setScale(2,RoundingMode.HALF_UP));
        numeracion.setSiguienteNumero(numeracion.getSiguienteNumero()+1);
        return facturaRepository.save(f);
    }
    private void validarConfiguracionEmisor(){
        if(fiscales.emisor()==null||vacio(fiscales.emisor().razonSocial())||vacio(fiscales.emisor().nit())||vacio(fiscales.emisor().direccion()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Configure razón social, NIT y dirección del emisor antes de facturar.");
    }
    private String normalizar(String s){return s==null?"":s.trim().toUpperCase(java.util.Locale.ROOT);}
    private boolean vacio(String s){return s==null||s.isBlank();}
    private void bad(String m){throw new ResponseStatusException(HttpStatus.BAD_REQUEST,m);}
}
