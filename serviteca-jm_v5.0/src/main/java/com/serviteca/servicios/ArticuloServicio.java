package com.serviteca.servicios;

import com.serviteca.DTOs.ProductoDTOs;
import com.serviteca.Mapper.ProductoMapper;
import com.serviteca.modelos.Producto;
import com.serviteca.repository.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Capa de servicio para administrar los artículos/productos de la serviteca.
 *
 * En este proyecto la entidad que representa un artículo se llama Producto,
 * por eso el servicio utiliza ProductoDTOs, ProductoMapper y ProductoRepository.
 */
@Service
public class ArticuloServicio {

    @Autowired
    private ProductoRepository repo;

    public List<ProductoDTOs> listarArticulos() {
        return repo.findAll().stream()
                .map(ProductoMapper::toDTO)
                .collect(Collectors.toList());
    }

    public Optional<ProductoDTOs> obtenerPorId(Integer id) {
        return repo.findById(id)
                .map(ProductoMapper::toDTO);
    }

    public ProductoDTOs guardarArticulo(ProductoDTOs dto) {
        Producto articulo = ProductoMapper.toEntity(dto);
        Producto guardado = repo.save(articulo);
        return ProductoMapper.toDTO(guardado);
    }

    public ProductoDTOs actualizarArticulo(Integer id, ProductoDTOs dto) {
        return repo.findById(id)
                .map(articuloExistente -> {
                    articuloExistente.setNombreProducto(dto.getNombreproducto());
                    articuloExistente.setPrecioProducto(dto.getPrecioproducto());
                    articuloExistente.setDescripcionProducto(dto.getDescripcionproducto());

                    // Actualiza las relaciones solo cuando vienen en el DTO.
                    if (dto.getIdservicio() != null || dto.getIdproveedor() != null) {
                        Producto relaciones = ProductoMapper.toEntity(dto);
                        if (dto.getIdservicio() != null) {
                            articuloExistente.setServicio(relaciones.getServicio());
                        }
                        if (dto.getIdproveedor() != null) {
                            articuloExistente.setProveedor(relaciones.getProveedor());
                        }
                    }

                    Producto actualizado = repo.save(articuloExistente);
                    return ProductoMapper.toDTO(actualizado);
                })
                .orElseThrow(() -> new RuntimeException("Artículo no encontrado con id: " + id));
    }

    public boolean eliminarArticulo(Integer id) {
        if (repo.existsById(id)) {
            repo.deleteById(id);
            return true;
        }
        return false;
    }

    public List<ProductoDTOs> buscarPorNombre(String nombre) {
        return repo.findByNombreProductoContainingIgnoreCase(nombre).stream()
                .map(ProductoMapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<ProductoDTOs> listarPorServicio(Integer idServicio) {
        return repo.findByServicioIdServicio(idServicio).stream()
                .map(ProductoMapper::toDTO)
                .collect(Collectors.toList());
    }
}
