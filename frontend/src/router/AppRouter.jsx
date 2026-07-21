import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Noticias from '../pages/Noticias';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from '../components/ProtectedRoute';

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

                    <Route path="/admin/configuracion" element={<Configuracion />} />

                    <Route path="noticias" element={<Noticias />} />

                    <Route path="modulos" element={<Modulos />} />
                    <Route path="categorias" element={<Categorias />} />
                    <Route path="estados" element={<Estados />} />
                    <Route path="tipos-entidad" element={<TiposEntidad />} />
                    <Route path="tipos-publicacion" element={<TiposPublicacion />} />
                    <Route path="tipos-documento" element={<TiposDocumento />} />
                    <Route path="estados-operativos" element={<EstadosOperativos />} />
                    <Route path="tipos-evento" element={<TiposEvento />} />
                    <Route path="modalidades-evento" element={<ModalidadesEvento />} />
                    <Route path="tipos-tutorial" element={<TiposTutorial />} />
                    <Route path="tipos-soporte" element={<TiposSoporte />} />
                    <Route path="prioridades" element={<Prioridades />} />
                    <Route path="etiquetas" element={<Etiquetas />} />

                    <Route path="roles" element={<Roles />} />
                    <Route path="usuarios" element={<Usuarios />} />
                    <Route path="permisos" element={<Permisos />} />
                    <Route path="logs" element={<Auditoria />} />

                    <Route path="institucional" element={<InfoInstitucional />} />
                    <Route path="autoridades" element={<Autoridades />} />
                    <Route path="proyectos" element={<ProyectosTecnologicos />} />
                    <Route path="servicios" element={<Servicios />} />
                    <Route path="sistemas" element={<SistemasInstitucionales />} />
                    <Route path="documentos" element={<DocumentosManuales />} />
                    <Route path="eventos" element={<EventosCapacitaciones />} />
                    <Route path="tutoriales" element={<Tutoriales />} />
                    <Route path="faqs" element={<Faqs />} />
                    <Route path="soporte" element={<Soporte />} />

                </Route>


                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}