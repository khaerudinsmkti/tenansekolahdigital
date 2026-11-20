import { LicenseExpiringModal } from '@/components/license-expiring-modal';
import { TeacherNotificationPromptModal } from '@/components/teacher-notification-prompt-modal';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import type { BreadcrumbItem } from '@/types';

export default function AppLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs}>
            {children}
            <LicenseExpiringModal />
            <TeacherNotificationPromptModal />
        </AppLayoutTemplate>
    );
}
