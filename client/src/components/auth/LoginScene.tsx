import { motion } from "framer-motion";
import { ArrowLeftRight, Check } from "lucide-react";

const float = (delay: number, dist: number) => ({
    animate: { y: [0, -dist, 0] },
    transition: { duration: 5.5, delay, repeat: Infinity, ease: "easeInOut" as const },
});

const ROWS: [string, string, string][] = [
    ["ראשון", "06:00 – 14:00", "a"],
    ["שלישי", "14:00 – 22:00", "swap"],
    ["חמישי", "22:00 – 06:00", "b"],
];

// Decorative product scene for the login screen (static demo content, no data).
export default function LoginScene() {
    return (
        <div className="scene" aria-hidden>
            <span className="scene__ring scene__ring--1" />
            <span className="scene__ring scene__ring--2" />

            <motion.div className="scene__card scene__card--week" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 160, damping: 22, delay: 0.2 }}>
                <header><b>המשמרות שלי</b><small>שבוע 12</small></header>
                {ROWS.map(([day, time, tone]) => (
                    <div key={day} className={`scene__row scene__row--${tone}`}>
                        <span>{day}</span>
                        <b>{time}</b>
                        {tone === "swap" && <em>בהחלפה</em>}
                    </div>
                ))}
            </motion.div>

            <motion.div className="scene__card scene__card--msg" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", stiffness: 160, damping: 22, delay: 0.55 }}>
                <motion.div {...float(0, 8)}>
                    <div className="scene__who"><span className="scene__av">ד</span><div><b>דנה</b><small>מחפשת מחליף/ה</small></div></div>
                    <div className="scene__shift"><b>14:00 – 22:00</b><span>יום שלישי</span></div>
                    <span className="scene__btn">אני לוקח/ת את המשמרת</span>
                </motion.div>
            </motion.div>

            <motion.div className="scene__badge" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18, delay: 1 }}>
                <motion.span {...float(1, 6)}><Check size={16} /> ההחלפה אושרה</motion.span>
            </motion.div>

            <motion.div className="scene__swap" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 240, damping: 16, delay: 0.9 }}>
                <ArrowLeftRight size={22} />
            </motion.div>
        </div>
    );
}
