/*
   Debug logging. Enabled in development builds (`npm run dev`) and when
   `localStorage.lbcaDebug = "1"` is set on leboncoin.fr (works in production builds too).
 */
function isEnabled(): boolean {
    if (process.env.NODE_ENV === "development") { return true; }
    try {
        return window.localStorage.getItem("lbcaDebug") === "1";
    } catch {
        return false;
    }
}

export const DEBUG = isEnabled();
const PREFIX = "LaBonneCarte -";

export const debug = {
    log: (...args: unknown[]) => { if (DEBUG) console.log(PREFIX, ...args); },
    warn: (...args: unknown[]) => { if (DEBUG) console.warn(PREFIX, ...args); },
    table: (rows: object[]) => { if (DEBUG && rows.length) console.table(rows); },
    group: (label: string) => { if (DEBUG) console.groupCollapsed(`${PREFIX} ${label}`); },
    groupEnd: () => { if (DEBUG) console.groupEnd(); },
};
