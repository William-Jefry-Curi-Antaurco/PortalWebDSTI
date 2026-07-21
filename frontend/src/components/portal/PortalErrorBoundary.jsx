import { Component } from "react";

export default class PortalErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error("Error en portal público:", error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="portal-empty-state portal-empty-error">
                    <p>Ocurrió un error al cargar esta sección.</p>
                    <small>{String(this.state.error?.message || this.state.error)}</small>
                    <button type="button" onClick={() => window.location.reload()}>
                        Recargar
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}