package com.serviteca.modelos;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Entity
@Table(name = "producto")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idproducto")
    private Integer idProducto;

    @Column(name = "nombre_producto", length = 50, nullable = false)
    private String nombreProducto;

    @Column(name = "precio_producto", precision = 10, scale = 2, nullable = false)
    private BigDecimal precioProducto;

    @Column(name = "descripcion_producto", length = 250)
    private String descripcionProducto;

    @Column(name="tarifa_iva", precision=5, scale=2) private BigDecimal tarifaIva;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idservicio")
    @JsonIgnoreProperties({
            "productos",
            "inventarios",
            "citas",
            "vehiculo",
            "hibernateLazyInitializer",
            "handler"
    })
    private Servicio servicio;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idproveedor")
    @JsonIgnoreProperties({
            "productos",
            "hibernateLazyInitializer",
            "handler"
    })
    private Proveedor proveedor;

    @OneToMany(mappedBy = "producto", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Inventario> inventarios;
}
