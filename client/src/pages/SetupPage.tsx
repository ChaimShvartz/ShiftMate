import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { initAdmin } from "../api/setup";
import SetupForm from "../components/setup/SetupForm";
import SetupSuccess from "../components/setup/SetupSuccess";
import { getErrorMessage } from "../utils/getErrorMessage";

interface SetupPageState {
    loading: boolean;
    error: string | null;
    createdAdminCode: string | null;
    createdUnitName: string;
}

const SetupPage = () => {
    const [state, setState] = useState<SetupPageState>({
        loading: false,
        error: null,
        createdAdminCode: null,
        createdUnitName: "",
    });

    const navigate = useNavigate();

    const handleSetup = async (data: {
        fullName: string;
        phone: string;
        email: string;
        unitName: string;
        password: string;
    }) => {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        try {
            const admin = await initAdmin(data);
            setState((prev) => ({
                ...prev,
                loading: false,
                createdUnitName: data.unitName,
                createdAdminCode: admin.employeeCode,
            }));
        } catch (err) {
            setState((prev) => ({
                ...prev,
                loading: false,
                error: getErrorMessage(err, "שגיאה בהקמת המערכת"),
            }));
        }
    };

    return (
        <main className="setup-page" dir="rtl">
            {state.createdAdminCode ? (
                <SetupSuccess
                    adminCode={state.createdAdminCode}
                    unitName={state.createdUnitName}
                    onLoginClick={() =>
                        navigate("/login", {
                            state: { employeeCode: state.createdAdminCode },
                        })
                    }
                />
            ) : (
                <SetupForm
                    onSubmit={handleSetup}
                    loading={state.loading}
                    error={state.error}
                />
            )}
        </main>
    );
};

export default SetupPage;
