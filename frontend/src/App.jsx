import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import AppRouter from './router/AppRouter';

// Importar estilos en orden jerárquico
import './styles/base.css';      // Variables y reset
import './styles/layout.css';    // Grids y contenedores
import './styles/admin.css';     // Layout administrativo
import './styles/modules.css';   // Componentes modulares
import './styles/forms.css';     // Formularios
import './styles/tables.css';    // Tablas
import './styles/alerts.css';    // Alertas
import './styles/login.css';     // Login (específico)
import "./styles/public/portal.css";    // Portal público (agrega esto si no está)

// Configuración de React Query
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000,      // 5 minutos sin revalidar
            gcTime: 10 * 60 * 1000,        // 10 minutos en caché (antes cacheTime)
            refetchOnWindowFocus: false,   // No recargar al enfocar ventana
            refetchOnReconnect: false,      // No recargar al reconectar
            refetchOnMount: true,           // Recargar al montar componente
            retry: 1,                       // Solo 1 reintento
            retryDelay: 1000,               // 1 segundo entre reintentos
        },
        mutations: {
            retry: 1,
            retryDelay: 1000,
        },
    },
});

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AppRouter />

            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3500,
                    style: {
                        borderRadius: '12px',
                        background: '#1a3a5c',
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: '500',
                        padding: '12px 16px',
                    },
                    success: {
                        style: {
                            background: '#2e7d32',
                            borderLeft: '4px solid #4caf50',
                        },
                        iconTheme: {
                            primary: '#4caf50',
                            secondary: '#fff',
                        },
                    },
                    error: {
                        style: {
                            background: '#c62828',
                            borderLeft: '4px solid #ef5350',
                        },
                        iconTheme: {
                            primary: '#ef5350',
                            secondary: '#fff',
                        },
                    },
                    loading: {
                        style: {
                            background: '#f57c00',
                            borderLeft: '4px solid #ffb74d',
                        },
                    },
                }}
            />

            {/* React Query DevTools (solo en desarrollo) */}

        </QueryClientProvider>
    );
}