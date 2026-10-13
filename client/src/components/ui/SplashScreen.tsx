import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { LogoMark } from "../brand/Logo";

const DURATION_MS = 2600;

// Shown once per page load / refresh (not on in-app navigation).
export default function SplashScreen() {
    const [show, setShow] = useState(true);

    useEffect(() => {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const t = setTimeout(() => setShow(false), reduce ? 700 : DURATION_MS);
        return () => clearTimeout(t);
    }, []);

    return (
        <AnimatePresence>
            {show && (
                <motion.div className="splash" role="status" aria-label="ShiftMate נטען" initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.45, ease: "easeOut" }}>
                    <motion.div className="splash__logo" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 220, damping: 22 }}>
                        <LogoMark size={108} spin />
                    </motion.div>
                    <motion.div className="splash__name" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, type: "spring", stiffness: 200, damping: 24 }}>
                        <b>Shift</b><span>Mate</span>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
