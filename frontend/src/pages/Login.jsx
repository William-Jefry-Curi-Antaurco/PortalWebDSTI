import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockKeyhole, Mail, LoaderCircle } from 'lucide-react';
import { loginRequest } from '../api/authApi';
import { saveAuth } from '../services/authService';

export default function Login() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: '',
        password: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await loginRequest(form);

            if (result.success) {
                saveAuth(result.data);
                navigate('/admin/dashboard', { replace: true });
            } else {
                setError(result.message || 'No se pudo iniciar sesión.');
            }
        } catch (error) {
            setError(
                error.response?.data?.message ||
                'Credenciales incorrectas o error de conexión.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="login-page">
            <section className="login-card">
                <div className="login-brand">
                    <div className="login-logo">D</div>

                    <div>
                        <h1>Portal Web DSTI</h1>
                        <p>Panel administrativo</p>
                    </div>
                </div>

                {error && (
                    <div className="alert alert-error">
                        {error}
                    </div>
                )}

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="login-field">
                        <label htmlFor="email">Correo institucional</label>

                        <div className="login-input-group">
                            <Mail size={18} />
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="admin@unasam.edu.pe"
                                autoComplete="email"
                                required
                            />
                        </div>
                    </div>

                    <div className="login-field">
                        <label htmlFor="password">Contraseña</label>

                        <div className="login-input-group">
                            <LockKeyhole size={18} />
                            <input
                                id="password"
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <LoaderCircle size={18} className="spin" />
                                <span>Ingresando...</span>
                            </>
                        ) : (
                            'Iniciar sesión'
                        )}
                    </button>
                </form>
            </section>
        </main>
    );
}