import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Noticias from '../pages/Noticias';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import RequirePermission from '../components/RequirePermission';

import InicioPublico from '../pages/public/InicioPublico.jsx';

import Modulos from '../pages/Modulos.jsx';
import Categorias from '../pages/Categorias.jsx';
import Estados from '../pages/Estados.jsx';
import TiposEntidad from '../pages/TiposEntidad.jsx';
import TiposPublicacion from '../pages/TiposPublicacion.jsx';
import TiposDocumento from '../pages/TiposDocumento.jsx';
import EstadosOperativos from '../pages/EstadosOperativos.jsx';
import TiposEvento from '../pages/TiposEvento.jsx';
import ModalidadesEvento from '../pages/ModalidadesEvento.jsx';
import TiposTutorial from '../pages/TiposTutorial.jsx';
import TiposSoporte from '../pages/TiposSoporte.jsx';
import Prioridades from '../pages/Prioridades.jsx';
import Etiquetas from '../pages/Etiquetas.jsx';
import Roles from '../pages/Roles.jsx';
import Usuarios from '../pages/Usuarios.jsx';
import Permisos from '../pages/Permisos.jsx';
import Auditoria from '../pages/Auditoria.jsx';
import InfoInstitucional from '../pages/InfoInstitucional.jsx';
import Autoridades from '../pages/Autoridades.jsx';
import ProyectosTecnologicos from '../pages/ProyectosTecnologicos.jsx';
import Servicios from '../pages/Servicios.jsx';
import SistemasInstitucionales from '../pages/SistemasInstitucionales.jsx';
import DocumentosManuales from '../pages/DocumentosManuales.jsx';
import EventosCapacitaciones from '../pages/EventosCapacitaciones.jsx';
import Tutoriales from '../pages/Tutoriales.jsx';
import Faqs from '../pages/Faqs.jsx';
import Soporte from '../pages/Soporte.jsx';
import Configuracion    from "../pages/Configuracionpage.jsx";


import NoticiaDetalle from '../pages/public/NoticiaDetalle.jsx';

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>

                <Route path="/" element={<InicioPublico />} />

                <Route path="/noticias/:slug" element={<NoticiaDetalle />} />

                <Route path="/login" element={<Login />} />


                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute>
                            <AdminLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Navigate to="/admin/dashboard" replace />} />

                    <Route path="dashboard" element={<Dashboard />} />

                    <Route
                        path="/admin/configuracion"
                        element={<RequirePermission permiso="catalogos.ver"><Configuracion /></RequirePermission>}
                    />

                    <Route path="noticias" element={<RequirePermission permiso="noticias.ver"><Noticias /></RequirePermission>} />

                    <Route path="modulos" element={<RequirePermission permiso="catalogos.ver"><Modulos /></RequirePermission>} />
                    <Route path="categorias" element={<RequirePermission permiso="catalogos.ver"><Categorias /></RequirePermission>} />
                    <Route path="estados" element={<RequirePermission permiso="catalogos.ver"><Estados /></RequirePermission>} />
                    <Route path="tipos-entidad" element={<RequirePermission permiso="catalogos.ver"><TiposEntidad /></RequirePermission>} />
                    <Route path="tipos-publicacion" element={<RequirePermission permiso="catalogos.ver"><TiposPublicacion /></RequirePermission>} />
                    <Route path="tipos-documento" element={<RequirePermission permiso="catalogos.ver"><TiposDocumento /></RequirePermission>} />
                    <Route path="estados-operativos" element={<RequirePermission permiso="catalogos.ver"><EstadosOperativos /></RequirePermission>} />
                    <Route path="tipos-evento" element={<RequirePermission permiso="catalogos.ver"><TiposEvento /></RequirePermission>} />
                    <Route path="modalidades-evento" element={<RequirePermission permiso="catalogos.ver"><ModalidadesEvento /></RequirePermission>} />
                    <Route path="tipos-tutorial" element={<RequirePermission permiso="catalogos.ver"><TiposTutorial /></RequirePermission>} />
                    <Route path="tipos-soporte" element={<RequirePermission permiso="catalogos.ver"><TiposSoporte /></RequirePermission>} />
                    <Route path="prioridades" element={<RequirePermission permiso="catalogos.ver"><Prioridades /></RequirePermission>} />
                    <Route path="etiquetas" element={<RequirePermission permiso="catalogos.ver"><Etiquetas /></RequirePermission>} />

                    <Route path="roles" element={<RequirePermission permiso="seguridad.ver"><Roles /></RequirePermission>} />
                    <Route path="usuarios" element={<RequirePermission permiso="seguridad.ver"><Usuarios /></RequirePermission>} />
                    <Route path="permisos" element={<RequirePermission permiso="seguridad.ver"><Permisos /></RequirePermission>} />
                    <Route path="logs" element={<RequirePermission permiso="seguridad.ver"><Auditoria /></RequirePermission>} />

                    <Route path="institucional" element={<RequirePermission permiso="institucional.ver"><InfoInstitucional /></RequirePermission>} />
                    <Route path="autoridades" element={<RequirePermission permiso="institucional.ver"><Autoridades /></RequirePermission>} />
                    <Route path="proyectos" element={<RequirePermission permiso="proyectos.ver"><ProyectosTecnologicos /></RequirePermission>} />
                    <Route path="servicios" element={<RequirePermission permiso="servicios.ver"><Servicios /></RequirePermission>} />
                    <Route path="sistemas" element={<RequirePermission permiso="sistemas.ver"><SistemasInstitucionales /></RequirePermission>} />
                    <Route path="documentos" element={<RequirePermission permiso="documentos.ver"><DocumentosManuales /></RequirePermission>} />
                    <Route path="eventos" element={<RequirePermission permiso="eventos.ver"><EventosCapacitaciones /></RequirePermission>} />
                    <Route path="tutoriales" element={<RequirePermission permiso="tutoriales.ver"><Tutoriales /></RequirePermission>} />
                    <Route path="faqs" element={<RequirePermission permiso="tutoriales.ver"><Faqs /></RequirePermission>} />
                    <Route path="soporte" element={<RequirePermission permiso="soporte.ver"><Soporte /></RequirePermission>} />

                </Route>


                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}