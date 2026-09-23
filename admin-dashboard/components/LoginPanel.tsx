"use client";

import { useState } from "react";
import { Container, Card, Form, Button, Alert } from "react-bootstrap";
import { login } from "../server-actions/auth";
import { useRouter } from "next/navigation";

const LoginPanel = () => {
    const router = useRouter();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setLoading(true);

        const formData = new FormData(e.currentTarget);

        try {
            const result = await login(formData);
            if (result?.error) {
                setError(result.error);
            }
            router.refresh()
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Container
            fluid
            className="d-flex justify-content-center align-items-center min-vh-100"
            style={{ backgroundColor: "var(--surface-inset)" }}
        >
            <Card style={{ width: "100%", maxWidth: "400px" }} className="shadow-sm">
                <Card.Body className="p-4">
                    <div className="text-center mb-3">
                        <img
                            src="/images/Logo_Saluteca_AzulNew.png"
                            alt="Mi Saluteca"
                            style={{ width: "48px", height: "48px", objectFit: "contain" }}
                        />
                        <img
                            src="/images/Recurso 21Logo_Mi Saluteca_AzulNew.png"
                            alt="Mi Saluteca"
                            className="ms-2"
                            style={{ height: "28px", objectFit: "contain" }}
                        />
                    </div>
                    <Card.Title className="text-center mb-4">
                        <h2>Acceso</h2>
                    </Card.Title>

                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3" controlId="password">
                            <Form.Label>Contraseña</Form.Label>
                            <Form.Control
                                type="password"
                                name="password"
                                required
                                disabled={loading}
                            />
                        </Form.Group>

                        {error && (
                            <Alert variant="danger" className="py-2">
                                {error}

                            </Alert>
                        )}


                        <button
                            type="submit"
                            disabled={loading}
                            className="w-100 btn"
                            style={{
                                backgroundColor: "#2F416A",
                                borderColor: "#2F416A",
                                color: "#fff",
                                borderRadius: "50px",
                            }}
                        >
                            {loading ? (
                                <>
                                    <span
                                        className="spinner-border spinner-border-sm me-2"
                                        role="status"
                                        aria-hidden="true"
                                    ></span>
                                    Verificando...
                                </>
                            ) : (
                                "Enviar"
                            )}
                        </button>

                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default LoginPanel;
