import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";

// Side sheet for details (slides in from the work-area edge).
export default function Sheet({ open, onOpenChange, title, children }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; children: ReactNode }) {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="dialog__overlay" asChild>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
                </Dialog.Overlay>
                <Dialog.Content className="sheet" dir="rtl" aria-describedby={undefined} asChild>
                    <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} transition={{ type: "spring", stiffness: 380, damping: 38 }}>
                        <header className="sheet__head">
                            <Dialog.Title className="dialog__title">{title}</Dialog.Title>
                            <Dialog.Close className="btn-close" aria-label="סגור"><X size={18} /></Dialog.Close>
                        </header>
                        <div className="sheet__body">{children}</div>
                    </motion.aside>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
