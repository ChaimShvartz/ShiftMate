import { notificationsRepo, usersRepo } from "../repositories/index.js";
import { emitToUser } from "../socket.js";

const TTL_MS = 30 * 24 * 60 * 60 * 1000;

export async function unitMembers(unitName, role) {
    const filter = { unit_name: unitName };
    if (role) filter.role = role;
    return (await usersRepo.getAllDocs(filter)).map((u) => u.employee_code);
}

// Persist one inbox entry per recipient and push it live. Never throws - a
// notification failure must not break the business action that triggered it.
export async function notify({
    recipients,
    type,
    level = "info",
    title,
    message,
    data = {},
    unitName = null,
}) {
    const codes = [...new Set(recipients.filter(Boolean))];
    if (!codes.length) return;

    try {
        const now = new Date();
        const docs = codes.map((recipient) => ({
            recipient,
            unitName,
            type,
            level,
            title,
            message,
            data,
            read: false,
            createdAt: now,
            expiresAt: new Date(now.getTime() + TTL_MS),
        }));
        const ids = await notificationsRepo.createMany(docs);

        docs.forEach((doc, i) => {
            const { recipient, expiresAt: _e, ...rest } = doc;
            emitToUser(recipient, "notification", { id: ids[i], ...rest });
        });
    } catch (err) {
        console.error("[notify] failed:", err.message);
    }
}
