import { Link } from "@/navigation";
import { ReactNode } from "react";

interface ToolCardProps {
    href: string;
    icon: ReactNode;
    title: string;
}

export default function ToolCard({ href, icon, title }: ToolCardProps) {
    return (
        <Link href={href} className="tool-card">
            <div className="icon-wrapper" style={{ fontSize: '40px', marginBottom: '15px', color: '#3d5cb9' }}>
                {icon}
            </div>
            <span>{title}</span>
        </Link>
    );
}
