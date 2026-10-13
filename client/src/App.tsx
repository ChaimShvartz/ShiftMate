import { BrowserRouter } from "react-router-dom";
import ToastContainer from "./components/notifications/ToastContainer";
import AppRoutes from "./routes/AppRoutes";

const App = () => {
    return (
        <BrowserRouter>
            <AppRoutes />
            <ToastContainer />
        </BrowserRouter>
    );
};

export default App;
