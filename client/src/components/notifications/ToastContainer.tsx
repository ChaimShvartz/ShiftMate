import { Toaster } from "sonner";
import { useThemeStore } from "../../store/themeStore";

export default function ToastContainer() {
    const mode = useThemeStore((s) => s.mode);
    return <Toaster dir="rtl" position="bottom-left" theme={mode} closeButton visibleToasts={3} />;
}
