import { gsap } from "gsap";
import { useEffect } from "react";

// One observer animates every card-like element the moment it appears in the
// DOM (page mount, new data, live events), so each page gets motion for free.
const GROUPS: { selector: string; from: gsap.TweenVars; stagger?: number }[] = [
    { selector: ".kpi, .admin-stat-card", from: { y: 24, opacity: 0, scale: 0.97 }, stagger: 0.07 },
    { selector: ".panel, .admin-users-section, .admin-units-section, .profile-card, .empty-card", from: { y: 28, opacity: 0 }, stagger: 0.08 },
    { selector: ".request-row, .applicant-item, .timeline-item, .history li, .feed__item", from: { x: -28, opacity: 0 }, stagger: 0.06 },
    { selector: ".ticket, .swap-card, .day-column", from: { y: 30, opacity: 0, rotate: 0.6 }, stagger: 0.08 },
    { selector: ".toast", from: { x: -60, opacity: 0 } },
    { selector: ".login-card, .setup-form-container, .setup-success-container, .not-found-card", from: { y: 36, opacity: 0, scale: 0.97 } },
];

export function useReveal(root: () => HTMLElement | null) {
    useEffect(() => {
        const el = root();
        if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        const run = () => {
            for (const g of GROUPS) {
                const fresh = Array.from(el.querySelectorAll<HTMLElement>(g.selector)).filter(
                    (n) => !n.dataset.gsapDone,
                );
                if (!fresh.length) continue;
                fresh.forEach((n) => (n.dataset.gsapDone = "1"));
                gsap.from(fresh, {
                    ...g.from,
                    duration: 0.7,
                    ease: "power3.out",
                    stagger: g.stagger ?? 0,
                    clearProps: "transform,opacity",
                });
            }
            // time-ruler segments grow in
            const segs = Array.from(el.querySelectorAll<HTMLElement>(".ruler__seg")).filter((n) => !n.dataset.gsapDone);
            if (segs.length) {
                segs.forEach((n) => (n.dataset.gsapDone = "1"));
                gsap.from(segs, { scaleX: 0, duration: 0.9, delay: 0.25, ease: "power3.out", stagger: 0.08, clearProps: "transform" });
            }
        };

        let frame = 0;
        const observer = new MutationObserver(() => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(run);
        });
        observer.observe(el, { childList: true, subtree: true });
        run();
        return () => {
            observer.disconnect();
            cancelAnimationFrame(frame);
        };
    }, [root]);
}
