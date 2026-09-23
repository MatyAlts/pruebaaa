import LoginPanel from "@/admin-dashboard/components/LoginPanel";
import { verifyAuth } from "@/admin-dashboard/server-actions/auth";
import { redirect } from "next/navigation";

const Adm = async () => {
    const isAuthenticated = await verifyAuth();


    if (!isAuthenticated) {
        return <LoginPanel />;
    }

    redirect("/adm/usuarios");
}

export default Adm;