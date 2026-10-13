import { notificationsRepo } from "../repositories/index.js";

const toDto = ({ _id, recipient: _r, expiresAt: _e, id, ...rest }) => ({
    id: id ?? _id.toString(),
    ...rest,
});

export const notificationController = {
    async list(req, res) {
        const recipient = req.user.employeeCode;
        const [items, unread] = await Promise.all([
            notificationsRepo.getAllDocs(
                { recipient },
                { sort: { createdAt: -1 }, limit: 60 },
            ),
            notificationsRepo.countDocs({ recipient, read: false }),
        ]);
        res.json({ success: true, data: { items: items.map(toDto), unread } });
    },

    async markAllRead(req, res) {
        await notificationsRepo.updateMany(
            { recipient: req.user.employeeCode, read: false },
            { $set: { read: true } },
        );
        res.json({ success: true });
    },

    async clear(req, res) {
        await notificationsRepo.deleteMany({
            recipient: req.user.employeeCode,
        });
        res.json({ success: true });
    },
};
