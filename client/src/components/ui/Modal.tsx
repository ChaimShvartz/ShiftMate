import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    size?: "sm" | "md";
    children: ReactNode;
}

// Accessible dialog (focus trap, Esc, scroll lock) from Radix.
export default function Modal({ open, onOpenChange, title, description, size = "md", children }: Props) {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="dialog__overlay" asChild>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} />
                </Dialog.Overlay>
                <Dialog.Content className={`dialog__content ${size === "sm" ? "dialog__content--sm" : ""}`} dir="rtl" aria-describedby={description ? undefined : undefined} asChild>
                    <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    >
                        <div className="modal-header">
                            <Dialog.Title className="dialog__title">{title}</Dialog.Title>
                            <Dialog.Close className="btn-close" aria-label="סגור">
                                <X size={18} />
                            </Dialog.Close>
                        </div>
                        {description ? <Dialog.Description className="dialog__desc">{description}</Dialog.Description> : <Dialog.Description className="sr-only">{title}</Dialog.Description>}
                        {children}
                    </motion.div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
