import { BrowserRouter } from "react-router-dom";
import ToastContainer from "./components/notifications/ToastContainer";
import ConfirmHost from "./components/ui/ConfirmHost";
import { useReveal } from "./hooks/useReveal";
import AppRoutes from "./routes/AppRoutes";

const getBody = () => document.body;

const App = () => {
    useReveal(getBody);
    return (
    <BrowserRouter>
        <AppRoutes />
        <ToastContainer />
        <ConfirmHost />
    </BrowserRouter>
    );
};

export default App;
