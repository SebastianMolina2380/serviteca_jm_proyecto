package com.serviteca.configuracion;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(DatosFiscalesProperties.class)
public class FacturacionConfiguration {

    private static final Logger log = LoggerFactory.getLogger(FacturacionConfiguration.class);

    private final DatosFiscalesProperties fiscales;

    public FacturacionConfiguration(DatosFiscalesProperties fiscales) {
        this.fiscales = fiscales;
    }

    /**
     * Deja constancia en consola de los datos fiscales del emisor
     * realmente cargados en el bean durante el arranque.
     * <p>
     * Verifica dos cosas que de otro modo pasarian inadvertidas:
     * <ul>
     *   <li>Que las propiedades bindearon a {@code DatosFiscalesProperties.Emisor}
     *       (Spring ignora silenciosamente los nombres que no coincidan con
     *       los campos del record, p. ej. {@code email} en lugar de {@code correo}).</li>
     *   <li>Que el texto se cargo con la codificacion correcta: si el archivo
     *       estuviera en otra codificacion se observarian secuencias como
     *       {@code ResoluciÃ³n} en lugar de {@code Resolución}.</li>
     * </ul>
     * En un sistema de facturacion electronica, dejar registro de la
     * configuracion del emisor al arrancar ademas sirve como traza de auditoria.
     */
    @PostConstruct
    void reportarEmisor() {
        var e = fiscales.emisor();
        if (e == null) {
            log.warn("DatosFiscalesProperties.emisor NO esta configurado: no sera posible emitir facturas.");
            return;
        }
        log.info("Emisor DIAN cargado -> NIT={} | RazonSocial={} | Direccion={} | Ciudad={} | Telefono={} | Correo={} | Responsabilidades={}",
                e.nit(), e.razonSocial(), e.direccion(), e.ciudad(), e.telefono(), e.correo(),
                e.responsabilidadesFiscales());
    }
}
