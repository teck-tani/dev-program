import styles from "./SharedClockLayout.module.css";
import SharedClockLayoutClient from "./SharedClockLayoutClient";

export default function SharedClockLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className={styles.appMainContainer}>
            <SharedClockLayoutClient>
                {children}
            </SharedClockLayoutClient>
        </div>
    );
}
