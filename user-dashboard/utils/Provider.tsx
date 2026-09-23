"use client";
import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { Toaster } from "react-hot-toast";

interface ProviderProps {
    children: ReactNode;
}

const Provider = ({ children }: ProviderProps) => {
    return (
        <SessionProvider>
            {children}
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: "var(--surface-0, #fff)",
                        color: "var(--text-primary, #333)",
                        borderRadius: "12px",
                        padding: "16px",
                        fontSize: "14px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                    },
                    success: {
                        iconTheme: {
                            primary: "var(--saluteca-green, #7ABB85)",
                            secondary: "var(--saluteca-white, #fff)",
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: "var(--saluteca-danger, #dc3545)",
                            secondary: "var(--saluteca-white, #fff)",
                        },
                    },
                }}
            />
        </SessionProvider>
    );
};

export default Provider;