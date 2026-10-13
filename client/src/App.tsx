import { MotionConfig } from "framer-motion";
import { BrowserRouter } from "react-router-dom";
import CommandPalette from "./components/search/CommandPalette";
import ToastContainer from "./components/notifications/ToastContainer";
import ConfirmHost from "./components/ui/ConfirmHost";
import SplashScreen from "./components/ui/SplashScreen";
import AppRoutes from "./routes/AppRoutes";

const App = () => (
    <MotionConfig reducedMotion="user">
        <SplashScreen />
        <BrowserRouter>
            <AppRoutes />
            <CommandPalette />
            <ToastContainer />
            <ConfirmHost />
        </BrowserRouter>
    </MotionConfig>
);

export default App;
