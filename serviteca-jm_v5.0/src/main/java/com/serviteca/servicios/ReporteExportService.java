package com.serviteca.servicios;

import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.serviteca.DTOs.ReporteResumen;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Genera las descargas de reportes sin depender de servicios externos.
 *
 * CSV y Excel conservan los datos tal cual; el PDF usa OpenPDF y está
 * pensado para imprimirse o archivarse.
 */
@Service
public class ReporteExportService {

    public record Exportacion(byte[] contenido, String nombreArchivo, String contentType) {
    }

    private static final Color VERDE = new Color(22, 163, 74);
    private static final Color GRIS = new Color(71, 85, 105);
    private static final Color CLARO = new Color(241, 245, 249);

    public Exportacion generar(ReporteResumen resumen, String formato) {
        String normalizado = formato == null ? "csv" : formato.trim().toLowerCase(Locale.ROOT);
        String base = "reporte-serviteca-" + resumen.desde() + "_" + resumen.hasta();
        return switch (normalizado) {
            case "csv" -> new Exportacion(csv(resumen), base + ".csv", "text/csv;charset=UTF-8");
            case "excel", "xls" -> new Exportacion(excel(resumen), base + ".xls", "application/vnd.ms-excel");
            case "pdf" -> new Exportacion(pdf(resumen), base + ".pdf", "application/pdf");
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Formato de exportación no soportado. Use csv, excel o pdf.");
        };
    }

    // ────────────────────────────────────────────────────────────
    // CSV
    // ────────────────────────────────────────────────────────────
    private byte[] csv(ReporteResumen r) {
        StringBuilder sb = new StringBuilder();
        sb.append("REPORTE SERVITECA JM\n");
        sb.append("Desde;").append(r.desde()).append(";Hasta;").append(r.hasta()).append("\n\n");

        sb.append("RESUMEN\n");
        sb.append("Metrica;Valor\n");
        sb.append("Citas;").append(r.totalCitas()).append('\n');
        sb.append("Servicios;").append(r.totalServicios()).append('\n');
        sb.append("Facturas;").append(r.totalFacturas()).append('\n');
        sb.append("Ingresos por servicios completados;").append(valor(r.ingresosServicios())).append('\n');
        sb.append("Ingresos facturados;").append(valor(r.ingresosFacturados())).append("\n\n");

        sb.append("CITAS POR ESTADO\n");
        sb.append("Estado;Cantidad\n");
        r.citasPorEstado().forEach((k, v) -> sb.append(k).append(';').append(v).append('\n'));
        sb.append('\n');

        sb.append("SERVICIOS POR ESTADO\n");
        sb.append("Estado;Cantidad\n");
        r.serviciosPorEstado().forEach((k, v) -> sb.append(k).append(';').append(v).append('\n'));
        sb.append('\n');

        sb.append("SERVICIOS MAS SOLICITADOS\n");
        sb.append("Servicio;Cantidad;Porcentaje\n");
        for (Map<String, Object> fila : r.topServicios()) {
            sb.append(csvTexto(fila.get("tipo"))).append(';')
                    .append(fila.get("cantidad")).append(';')
                    .append(fila.get("porcentaje")).append("%\n");
        }
        sb.append('\n');

        sb.append("INGRESOS POR PERIODO\n");
        sb.append("Periodo;Desde;Hasta;Ingresos facturados;Ingresos servicios\n");
        for (Map<String, Object> fila : r.ingresosPorPeriodo()) {
            sb.append(csvTexto(fila.get("etiqueta"))).append(';')
                    .append(fila.get("desde")).append(';')
                    .append(fila.get("hasta")).append(';')
                    .append(valor(fila.get("ingresos"))).append(';')
                    .append(valor(fila.get("ingresosServicios"))).append('\n');
        }
        sb.append('\n');

        sb.append("DETALLE DE SERVICIOS\n");
        sb.append("Fecha;Servicio;Placa;Cliente;Estado;Precio\n");
        for (Map<String, Object> fila : r.detalleServicios()) {
            sb.append(csvTexto(fila.get("fecha"))).append(';')
                    .append(csvTexto(fila.get("tipo"))).append(';')
                    .append(csvTexto(fila.get("placa"))).append(';')
                    .append(csvTexto(fila.get("cliente"))).append(';')
                    .append(csvTexto(fila.get("estado"))).append(';')
                    .append(valor(fila.get("precio"))).append('\n');
        }

        byte[] cuerpo = sb.toString().getBytes(StandardCharsets.UTF_8);
        byte[] conBom = new byte[cuerpo.length + 3];
        conBom[0] = (byte) 0xEF;
        conBom[1] = (byte) 0xBB;
        conBom[2] = (byte) 0xBF;
        System.arraycopy(cuerpo, 0, conBom, 3, cuerpo.length);
        return conBom;
    }

    private String csvTexto(Object valor) {
        String texto = valor == null ? "" : String.valueOf(valor);
        if (texto.contains(";") || texto.contains("\"") || texto.contains("\n")) {
            return '"' + texto.replace("\"", "\"\"") + '"';
        }
        return texto;
    }

    // ────────────────────────────────────────────────────────────
    // EXCEL (SpreadsheetML 2003, se abre en Excel/LibreOffice)
    // ────────────────────────────────────────────────────────────
    private byte[] excel(ReporteResumen r) {
        StringBuilder sb = new StringBuilder();
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        sb.append("<?mso-application progid=\"Excel.Sheet\"?>\n");
        sb.append("<Workbook xmlns=\"urn:schemas-microsoft-com:office:spreadsheet\" ")
                .append("xmlns:ss=\"urn:schemas-microsoft-com:office:spreadsheet\">\n");
        sb.append("<Styles>\n");
        sb.append("<Style ss:ID=\"titulo\"><Font ss:Bold=\"1\" ss:Size=\"14\"/></Style>\n");
        sb.append("<Style ss:ID=\"cabecera\"><Font ss:Bold=\"1\" ss:Color=\"#FFFFFF\"/>")
                .append("<Interior ss:Color=\"#16A34A\" ss:Pattern=\"Solid\"/></Style>\n");
        sb.append("</Styles>\n");

        sb.append("<Worksheet ss:Name=\"Resumen\"><Table>\n");
        tituloExcel(sb, "Reporte Serviteca JM");
        sb.append("<Row><Cell><Data ss:Type=\"String\">Desde</Data></Cell>")
                .append("<Cell><Data ss:Type=\"String\">").append(r.desde()).append("</Data></Cell></Row>\n");
        sb.append("<Row><Cell><Data ss:Type=\"String\">Hasta</Data></Cell>")
                .append("<Cell><Data ss:Type=\"String\">").append(r.hasta()).append("</Data></Cell></Row>\n");
        sb.append("<Row/>\n");
        filaExcel(sb, true, "Metrica", "Valor");
        filaExcel(sb, false, "Citas", String.valueOf(r.totalCitas()));
        filaExcel(sb, false, "Servicios", String.valueOf(r.totalServicios()));
        filaExcel(sb, false, "Facturas", String.valueOf(r.totalFacturas()));
        filaExcel(sb, false, "Ingresos por servicios completados", valor(r.ingresosServicios()));
        filaExcel(sb, false, "Ingresos facturados", valor(r.ingresosFacturados()));
        sb.append("<Row/>\n");
        filaExcel(sb, true, "Citas por estado", "Cantidad");
        r.citasPorEstado().forEach((k, v) -> filaExcel(sb, false, k, String.valueOf(v)));
        sb.append("<Row/>\n");
        filaExcel(sb, true, "Servicios por estado", "Cantidad");
        r.serviciosPorEstado().forEach((k, v) -> filaExcel(sb, false, k, String.valueOf(v)));
        sb.append("</Table></Worksheet>\n");

        sb.append("<Worksheet ss:Name=\"Servicios\"><Table>\n");
        tituloExcel(sb, "Servicios mas solicitados");
        filaExcel(sb, true, "Servicio", "Cantidad", "Porcentaje");
        for (Map<String, Object> fila : r.topServicios()) {
            filaExcel(sb, false, String.valueOf(fila.get("tipo")),
                    String.valueOf(fila.get("cantidad")),
                    String.valueOf(fila.get("porcentaje")) + "%");
        }
        sb.append("<Row/>\n");
        filaExcel(sb, true, "Periodo", "Desde", "Hasta", "Ingresos facturados", "Ingresos servicios");
        for (Map<String, Object> fila : r.ingresosPorPeriodo()) {
            filaExcel(sb, false,
                    String.valueOf(fila.get("etiqueta")),
                    String.valueOf(fila.get("desde")),
                    String.valueOf(fila.get("hasta")),
                    valor(fila.get("ingresos")),
                    valor(fila.get("ingresosServicios")));
        }
        sb.append("</Table></Worksheet>\n");

        sb.append("<Worksheet ss:Name=\"Detalle\"><Table>\n");
        tituloExcel(sb, "Detalle de servicios");
        filaExcel(sb, true, "Fecha", "Servicio", "Placa", "Cliente", "Estado", "Precio");
        for (Map<String, Object> fila : r.detalleServicios()) {
            filaExcel(sb, false,
                    texto(fila.get("fecha")), texto(fila.get("tipo")), texto(fila.get("placa")),
                    texto(fila.get("cliente")), texto(fila.get("estado")), valor(fila.get("precio")));
        }
        sb.append("</Table></Worksheet>\n");

        sb.append("</Workbook>");
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private void tituloExcel(StringBuilder sb, String titulo) {
        sb.append("<Row><Cell ss:StyleID=\"titulo\"><Data ss:Type=\"String\">")
                .append(xml(titulo)).append("</Data></Cell></Row>\n");
    }

    private void filaExcel(StringBuilder sb, boolean cabecera, String... valores) {
        sb.append("<Row>");
        for (String valor : valores) {
            sb.append("<Cell");
            if (cabecera) sb.append(" ss:StyleID=\"cabecera\"");
            sb.append("><Data ss:Type=\"String\">").append(xml(valor)).append("</Data></Cell>");
        }
        sb.append("</Row>\n");
    }

    private String xml(String valor) {
        return String.valueOf(valor == null ? "" : valor)
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }

    // ────────────────────────────────────────────────────────────
    // PDF
    // ────────────────────────────────────────────────────────────
    private byte[] pdf(ReporteResumen r) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document documento = new Document(PageSize.A4.rotate(), 32, 32, 32, 32);
            PdfWriter.getInstance(documento, out);
            documento.open();

            Font titulo = new Font(Font.HELVETICA, 17, Font.BOLD, VERDE);
            Font subtitulo = new Font(Font.HELVETICA, 10, Font.NORMAL, GRIS);
            Font seccion = new Font(Font.HELVETICA, 11, Font.BOLD, VERDE);
            Font texto = new Font(Font.HELVETICA, 9, Font.NORMAL, Color.DARK_GRAY);

            Paragraph encabezado = new Paragraph("SERVITECA JM", titulo);
            encabezado.setAlignment(Element.ALIGN_CENTER);
            documento.add(encabezado);

            Paragraph rango = new Paragraph(
                    "Reporte operativo del " + r.desde() + " al " + r.hasta(), subtitulo);
            rango.setAlignment(Element.ALIGN_CENTER);
            documento.add(rango);
            documento.add(new Paragraph(" ", subtitulo));

            documento.add(new Paragraph("Resumen del periodo", seccion));
            PdfPTable resumen = new PdfPTable(2);
            resumen.setWidthPercentage(100);
            resumen.setSpacingBefore(6);
            resumen.setSpacingAfter(12);
            resumen.addCell(celda("Métrica", true));
            resumen.addCell(celda("Valor", true));
            resumen.addCell(celda("Citas", false));
            resumen.addCell(celda(String.valueOf(r.totalCitas()), false));
            resumen.addCell(celda("Servicios", false));
            resumen.addCell(celda(String.valueOf(r.totalServicios()), false));
            resumen.addCell(celda("Facturas", false));
            resumen.addCell(celda(String.valueOf(r.totalFacturas()), false));
            resumen.addCell(celda("Ingresos por servicios completados", false));
            resumen.addCell(celda(valor(r.ingresosServicios()), false));
            resumen.addCell(celda("Ingresos facturados", false));
            resumen.addCell(celda(valor(r.ingresosFacturados()), false));
            documento.add(resumen);

            documento.add(new Paragraph("Servicios más solicitados", seccion));
            PdfPTable top = new PdfPTable(new float[]{3f, 1.2f, 1.2f});
            top.setWidthPercentage(100);
            top.setSpacingBefore(6);
            top.setSpacingAfter(12);
            filaCabecera(top, "Servicio", "Cantidad", "Porcentaje");
            for (Map<String, Object> fila : r.topServicios()) {
                top.addCell(celda(texto(fila.get("tipo")), false));
                top.addCell(celda(String.valueOf(fila.get("cantidad")), false));
                top.addCell(celda(fila.get("porcentaje") + "%", false));
            }
            documento.add(top);

            documento.add(new Paragraph("Ingresos por periodo", seccion));
            PdfPTable periodos = new PdfPTable(new float[]{1.4f, 1.4f, 1.4f, 1.8f, 1.8f});
            periodos.setWidthPercentage(100);
            periodos.setSpacingBefore(6);
            periodos.setSpacingAfter(12);
            filaCabecera(periodos, "Periodo", "Desde", "Hasta", "Facturado", "Servicios");
            for (Map<String, Object> fila : r.ingresosPorPeriodo()) {
                periodos.addCell(celda(texto(fila.get("etiqueta")), false));
                periodos.addCell(celda(texto(fila.get("desde")), false));
                periodos.addCell(celda(texto(fila.get("hasta")), false));
                periodos.addCell(celda(valor(fila.get("ingresos")), false));
                periodos.addCell(celda(valor(fila.get("ingresosServicios")), false));
            }
            documento.add(periodos);

            documento.add(new Paragraph("Detalle de servicios", seccion));
            PdfPTable detalle = new PdfPTable(new float[]{1.2f, 2.4f, 1.2f, 2.4f, 1.3f, 1.5f});
            detalle.setWidthPercentage(100);
            detalle.setSpacingBefore(6);
            filaCabecera(detalle, "Fecha", "Servicio", "Placa", "Cliente", "Estado", "Precio");
            for (Map<String, Object> fila : r.detalleServicios()) {
                detalle.addCell(celda(texto(fila.get("fecha")), false));
                detalle.addCell(celda(texto(fila.get("tipo")), false));
                detalle.addCell(celda(texto(fila.get("placa")), false));
                detalle.addCell(celda(texto(fila.get("cliente")), false));
                detalle.addCell(celda(texto(fila.get("estado")), false));
                detalle.addCell(celda(valor(fila.get("precio")), false));
            }
            documento.add(detalle);

            documento.add(new Paragraph(" ", subtitulo));
            Paragraph pie = new Paragraph(
                    "Documento generado automáticamente por Serviteca JM.", subtitulo);
            pie.setAlignment(Element.ALIGN_CENTER);
            documento.add(pie);

            documento.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "No se pudo generar el PDF del reporte.");
        }
    }

    private void filaCabecera(PdfPTable tabla, String... valores) {
        for (String valor : valores) {
            tabla.addCell(celda(valor, true));
        }
    }

    private PdfPCell celda(String valor, boolean cabecera) {
        PdfPCell celda = new PdfPCell(new Phrase(valor == null ? "" : valor,
                new Font(Font.HELVETICA, 8,
                        cabecera ? Font.BOLD : Font.NORMAL,
                        cabecera ? Color.WHITE : Color.DARK_GRAY)));
        celda.setPadding(5);
        if (cabecera) {
            celda.setBackgroundColor(VERDE);
        } else {
            celda.setBackgroundColor(new Color(248, 250, 252));
        }
        return celda;
    }

    private String texto(Object valor) {
        return valor == null ? "" : String.valueOf(valor);
    }

    private String valor(Object valor) {
        if (valor instanceof BigDecimal decimal) {
            return decimal.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString();
        }
        return valor == null ? "0.00" : String.valueOf(valor);
    }
}
