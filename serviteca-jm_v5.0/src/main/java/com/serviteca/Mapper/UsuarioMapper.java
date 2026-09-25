package com.serviteca.Mapper;

import com.serviteca.DTOs.UsuarioDTOs;
import com.serviteca.modelos.Usuario;

public final class UsuarioMapper {
    private UsuarioMapper(){}

    public static UsuarioDTOs toDTO(Usuario e){
        if(e==null)return null;
        return new UsuarioDTOs(
            e.getIdUsuario()==null?null:e.getIdUsuario().longValue(),
            e.getNombre(), e.getNumeroDoc(), e.getCorreo(), null,
            e.getRol()==null?null:e.getRol().name(),
            e.getTipoDocumento(),
            e.getEstado()==null?null:e.getEstado().name(),
            e.getUltimoAcceso()==null?null:e.getUltimoAcceso().toString(),
            e.getDireccion(), e.getTelefono(), e.getCiudad()
        );
    }

    public static Usuario toEntity(UsuarioDTOs d){
        if(d==null)return null;
        Usuario e=new Usuario();
        e.setIdUsuario(d.getIdusuario()==null?null:d.getIdusuario().intValue());
        e.setNombre(d.getNombre()); e.setNumeroDoc(d.getNumeroDoc());
        e.setCorreo(d.getCorreo()); e.setContrasena(d.getContrasena());
        if(d.getRol()!=null)e.setRol(Usuario.Rol.valueOf(d.getRol().trim().toUpperCase()));
        e.setTipoDocumento(d.getTipoDocumento());
        if(d.getEstado()!=null)e.setEstado(Usuario.Estado.valueOf(d.getEstado().toUpperCase()));
        e.setDireccion(d.getDireccion()); e.setTelefono(d.getTelefono()); e.setCiudad(d.getCiudad());
        return e;
    }
}