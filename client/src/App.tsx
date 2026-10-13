import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import ToastContainer from "./components/notifications/ToastContainer";

const App = () => {
    return (
        <BrowserRouter>
            <AppRoutes />
            <ToastContainer />
        </BrowserRouter>
    );
};

export default App;
