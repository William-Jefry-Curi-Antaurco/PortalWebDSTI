import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { getPublicNoticiaDetalle } from '../../api/publicApi';
import { getStorageUrl, formatDate } from '../../utils/portalUtils';
import EtiquetaBadges from './EtiquetaBadges.jsx';
import '../../styles/public/noticia-detalle.css';

function unwrapData(response, fallback = {}) {
    const payload = response?.data ?? response;

    if (!payload) return fallback;

    return payload.data ?? payload ?? fallback;
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
    const imagenes = Array.isArray(noticia?.imagenes) ? noticia.imagenes : [];

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

export default function NoticiaModal({ slug, onClose, onOpenNoticia }) {
    const detalleQuery = useQuery({
        queryKey: ['noticia-detalle', slug],
        queryFn: () => getPublicNoticiaDetalle(slug).then(unwrapData),
        enabled: Boolean(slug),
        staleTime: 2 * 60 * 1000,
    });

    const data = detalleQuery.data || {};
    const noticia = data.noticia || {};
    const relacionadas = Array.isArray(data.relacionadas) ? data.relacionadas : [];

    const imagenes = useMemo(() => getImagenes(noticia), [noticia]);
    const portada = imagenes[0] || null;
    const galeria = imagenes.slice(1);
    const parrafos = textoEnParrafos(noticia?.contenido);

    if (!slug) return null;

    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) onClose();
    }

    return createPortal(
        <div
            className="portal-noticia-modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-label={getTitulo(noticia) || 'Noticia'}
            onClick={handleBackdropClick}
        >
            <div className="portal-noticia-modal-dialog">
                <button
                    type="button"
                    className="portal-noticia-modal-close"
                    onClick={onClose}
                    aria-label="Cerrar"
                >
                    ×
                </button>

                {detalleQuery.isLoading ? (
                    <div className="noticia-container">
                        <p className="noticia-loading">Cargando noticia...</p>
                    </div>
                ) : detalleQuery.isError || !noticia?.idnoticia ? (
                    <div className="noticia-container">
                        <div className="noticia-error">
                            <h1>No se encontró la noticia</h1>
                            <p>La publicación no existe o ya no está disponible.</p>
                        </div>
                    </div>
                ) : (
                    <article className="noticia-container">
                        <header className="noticia-header">
                            <div className="noticia-meta">
                                {noticia?.categoria?.nombre && (
                                    <span>{noticia.categoria.nombre}</span>
                                )}

                                {getTipoPublicacion(noticia) && (
                                    <span>{getTipoPublicacion(noticia)}</span>
                                )}

                                {noticia?.fecha_publicacion && (
                                    <span>{formatDate(noticia.fecha_publicacion, { month: 'long' })}</span>
                                )}

                                <span>{Number(noticia.visitas || 0)} visitas</span>
                            </div>

                            <h1>{noticia.titulo}</h1>

                            {noticia.resumen && (
                                <p className="noticia-resumen">{noticia.resumen}</p>
                            )}

                            <EtiquetaBadges item={noticia} />
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
                                            <button
                                                type="button"
                                                key={item.idnoticia}
                                                className="noticia-relacionada-card"
                                                onClick={() => onOpenNoticia?.(item.slug)}
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
                                                            ? ` · ${formatDate(item.fecha_publicacion, { month: 'long' })}`
                                                            : ''}
                                                    </small>

                                                    <h3>{tituloRelacionada}</h3>

                                                    {getResumen(item) && (
                                                        <p>{getResumen(item)}</p>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>
                        )}
                    </article>
                )}
            </div>
        </div>,
        document.body
    );
}
