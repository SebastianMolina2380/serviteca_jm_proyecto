package com.serviteca.modelos;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Entity
@Table(name = "proveedor")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Proveedor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idproveedor")
    private Integer idProveedor;

    @NotBlank(message = "El nombre del proveedor es obligatorio")
    @Column(name = "nombre_proveedor", length = 100, nullable = false)
    private String nombreProveedor;

    @NotBlank(message = "El NIT es obligatorio")
    @Column(name = "nit_proveedor", length = 20, nullable = false, unique = true)
    private String nitProveedor;

    @Column(name = "tipo_producto", length = 250)
    private String tipoProducto;

    @Email(message = "El correo no tiene un formato válido")
    @Column(name = "correo_proveedor", length = 100)
    private String correoProveedor;

    @OneToMany(mappedBy = "proveedor", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Producto> productos;
}