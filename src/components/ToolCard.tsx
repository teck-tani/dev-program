import { Link } from "@/navigation";
import { ReactNode } from "react";

interface ToolCardProps {
    href: string;
    icon: ReactNode;
    title: string;
    description?: string;
}

export default function ToolCard({ href, icon, title, description }: ToolCardProps) {
    return (
        <Link href={href} className="tool-card-new">
            <div className="tool-card-icon">
                {icon}
            </div>
            <div className="tool-card-content">
                <span className="tool-card-title">{title}</span>
                {description && <span className="tool-card-desc">{description}</span>}
            </div>
        </Link>
    );
}
