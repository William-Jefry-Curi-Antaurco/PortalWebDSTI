import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPublicNoticiaDetalle } from '../../api/publicApi';
import '../../styles/public/noticia-detalle.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';


function unwrapData(response, fallback = {}) {
    const payload = response?.data ?? response;

    if (!payload) return fallback;

    return payload.data ?? payload ?? fallback;
}

function getStorageUrl(path) {
    if (!path || typeof path !== 'string') return null;

    let value = path.trim();

    if (!value) return null;

    if (value.startsWith('http://') || value.startsWith('https://')) {
        return value;
    }

    value = value.replace(/^public\//, '');
    value = value.replace(/^storage\//, '');
    value = value.replace(/^\/storage\//, '');
    value = value.replace(/^\/+/, '');

    return `${BACKEND_URL}/storage/${value}`;
}

function getArchivoUrl(archivo) {
    if (!archivo) return null;

    return getStorageUrl(
        archivo.url ||
        archivo.ruta ||
        archivo.path ||
        archivo.nombre_guardado ||
        ''
    );
}

function getImagenes(noticia) {
    const imagenes = Array.isArray(noticia?.imagenes)
        ? noticia.imagenes
        : [];

    return imagenes
        .map((img) => ({
            id: img.idnoticiaimagen || img.id,
            url: getArchivoUrl(img?.archivo),
            alt: img.texto_alternativo || noticia?.titulo || 'Imagen de noticia',
            descripcion: img.descripcion || '',
            esPortada: Number(img.es_portada) === 1,
            orden: Number(img.orden || 0),
        }))
        .filter((img) => img.url)
        .sort((a, b) => {
            if (a.esPortada && !b.esPortada) return -1;
            if (!a.esPortada && b.esPortada) return 1;

            return a.orden - b.orden;
        });
}

function formatDate(value) {
    if (!value) return '';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return '';

    return new Intl.DateTimeFormat('es-PE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).format(date);
}

function textoEnParrafos(texto) {
    const value = String(texto || '').trim();

    if (!value) return [];

    const bloquesPorSaltos = value
        .split(/\n+/)
        .map((item) => item.trim())
        .filter(Boolean);

    if (bloquesPorSaltos.length > 1) {
        return bloquesPorSaltos;
    }

    return value
        .split(/(?<=[.!?])\s+/)
        .map((item) => item.trim())
        .filter(Boolean);
}

function getTitulo(item) {
    return item?.titulo || item?.nombre || '';
}

function getResumen(item) {
    return item?.resumen || item?.descripcion || '';
}

function getPortada(item) {
    return getImagenes(item)[0]?.url || null;
}

function getTipoPublicacion(item) {
    return (
        item?.tipoPublicacion?.nombre ||
        item?.tipo_publicacion?.nombre ||
        ''
    );
}

// ---------------------------------------------------------------------------
// Página detalle
// ---------------------------------------------------------------------------
export default function NoticiaDetalle() {
    const { slug } = useParams();

    const detalleQuery = useQuery({
        queryKey: ['noticia-detalle', slug],
        queryFn: () => getPublicNoticiaDetalle(slug).then(unwrapData),
        enabled: Boolean(slug),
        staleTime: 2 * 60 * 1000,
    });

    const data = detalleQuery.data || {};
    const noticia = data.noticia || {};
    const relacionadas = Array.isArray(data.relacionadas)
        ? data.relacionadas
        : [];

    const imagenes = useMemo(() => getImagenes(noticia), [noticia]);
    const portada = imagenes[0] || null;
    const galeria = imagenes.slice(1);
    const parrafos = textoEnParrafos(noticia?.contenido);

    if (detalleQuery.isLoading) {
        return (
            <main className="noticia-page">
                <div className="noticia-container">
                    <p className="noticia-loading">Cargando noticia...</p>
                </div>
            </main>
        );
    }

    if (detalleQuery.isError || !noticia?.idnoticia) {
        return (
            <main className="noticia-page">
                <nav className="noticia-navbar">
                    <Link to="/" className="noticia-brand">
                        <span>DSTI</span>
                        <small>Portal institucional</small>
                    </Link>

                    <div className="noticia-nav-actions">
                        <Link to="/">Volver al portal</Link>
                    </div>
                </nav>

                <div className="noticia-container">
                    <Link to="/" className="noticia-back">
                        ← Volver al portal
                    </Link>

                    <div className="noticia-error">
                        <h1>No se encontró la noticia</h1>
                        <p>La publicación no existe o ya no está disponible.</p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="noticia-page">
            <nav className="noticia-navbar">
                <Link to="/" className="noticia-brand">
                    <span>DSTI</span>
                    <small>Portal institucional</small>
                </Link>

                <div className="noticia-nav-actions">
                    <Link to="/#noticias">Noticias</Link>
                    <Link to="/">Volver al portal</Link>
                </div>
            </nav>

            <article className="noticia-container">
                <Link to="/#noticias" className="noticia-back">
                    ← Volver a noticias
                </Link>

                <header className="noticia-header">
                    <div className="noticia-meta">
                        {noticia?.categoria?.nombre && (
                            <span>{noticia.categoria.nombre}</span>
                        )}

                        {getTipoPublicacion(noticia) && (
                            <span>{getTipoPublicacion(noticia)}</span>
                        )}

                        {noticia?.fecha_publicacion && (
                            <span>{formatDate(noticia.fecha_publicacion)}</span>
                        )}

                        <span>{Number(noticia.visitas || 0)} visitas</span>
                    </div>

                    <h1>{noticia.titulo}</h1>

                    {noticia.resumen && (
                        <p className="noticia-resumen">{noticia.resumen}</p>
                    )}
                </header>

                {portada?.url && (
                    <figure className="noticia-portada">
                        <img
                            src={portada.url}
                            alt={portada.alt}
                            onError={(e) => {
                                const figure = e.currentTarget.closest('.noticia-portada');

                                if (figure) {
                                    figure.remove();
                                }
                            }}
                        />

                        {portada.descripcion && (
                            <figcaption>{portada.descripcion}</figcaption>
                        )}
                    </figure>
                )}

                <section className="noticia-contenido">
                    {parrafos.length > 0 ? (
                        parrafos.map((parrafo, index) => (
                            <p key={index}>{parrafo}</p>
                        ))
                    ) : (
                        <p>{noticia.resumen}</p>
                    )}
                </section>

                {galeria.length > 0 && (
                    <section className="noticia-galeria">
                        <h2>Galería</h2>

                        <div className="noticia-galeria-grid">
                            {galeria.map((img) => (
                                <figure key={img.id || img.url}>
                                    <img
                                        src={img.url}
                                        alt={img.alt}
                                        onError={(e) => {
                                            const figure = e.currentTarget.closest('figure');

                                            if (figure) {
                                                figure.remove();
                                            }
                                        }}
                                    />

                                    {img.descripcion && (
                                        <figcaption>{img.descripcion}</figcaption>
                                    )}
                                </figure>
                            ))}
                        </div>
                    </section>
                )}

                {relacionadas.length > 0 && (
                    <section className="noticia-relacionadas">
                        <div className="noticia-section-title">
                            <span>También te puede interesar</span>
                            <h2>Noticias relacionadas</h2>
                        </div>

                        <div className="noticia-relacionadas-grid">
                            {relacionadas.map((item) => {
                                const portadaRelacionada = getPortada(item);
                                const tituloRelacionada = getTitulo(item);

                                return (
                                    <Link
                                        key={item.idnoticia}
                                        to={`/noticias/${item.slug}`}
                                        className="noticia-relacionada-card"
                                    >
                                        <div
                                            className={`noticia-relacionada-img ${!portadaRelacionada ? 'sin-imagen' : ''}`}
                                            data-letter={tituloRelacionada.charAt(0) || 'N'}
                                        >
                                            {portadaRelacionada && (
                                                <img
                                                    src={portadaRelacionada}
                                                    alt={tituloRelacionada}
                                                    onError={(e) => {
                                                        const wrapper = e.currentTarget.parentElement;

                                                        e.currentTarget.remove();

                                                        if (wrapper) {
                                                            wrapper.classList.add('sin-imagen');
                                                        }
                                                    }}
                                                />
                                            )}
                                        </div>

                                        <div>
                                            <small>
                                                {item?.categoria?.nombre || 'Noticia'}
                                                {item?.fecha_publicacion
                                                    ? ` · ${formatDate(item.fecha_publicacion)}`
                                                    : ''}
                                            </small>

                                            <h3>{tituloRelacionada}</h3>

                                            {getResumen(item) && (
                                                <p>{getResumen(item)}</p>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                )}
            </article>
        </main>
    );
}