package com.serviteca.modelos;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "inventario")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Inventario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idinventario")
    private Integer idInventario;

    @NotBlank(message = "El nombre del producto es obligatorio")
    @Size(max = 120)
    @Column(name = "nombre", nullable = false, length = 120)
    private String nombre;

    @Min(value = 0, message = "La cantidad no puede ser negativa")
    @Column(name = "cantidad", nullable = false)
    private Integer cantidad = 0;

    @DecimalMin(value = "0.0", message = "El precio unitario no puede ser negativo")
    @Column(name = "preciounit")
    private BigDecimal precioUnit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idproducto")
    @JsonIgnoreProperties({
            "inventarios",
            "servicio",
            "proveedor",
            "hibernateLazyInitializer",
            "handler"
    })
    private Producto producto;

    public boolean hayStock() {
        return cantidad != null && cantidad > 0;
    }

    public void reducirStock(int unidades) {
        if (unidades > cantidad) {
            throw new IllegalStateException("Stock insuficiente para " + nombre);
        }
        cantidad -= unidades;
    }
}