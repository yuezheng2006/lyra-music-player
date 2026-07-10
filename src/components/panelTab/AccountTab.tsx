import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { NeteaseUser } from '../../types';
import CocoAccountCard from './CocoAccountCard';
import NeteaseAccountCard from './NeteaseAccountCard';
import QQMusicAccountCard from './QQMusicAccountCard';

// src/components/panelTab/AccountTab.tsx
// Peer music-account cards for Netease, QQ Music, and Coco.

interface AccountTabProps {
    user: NeteaseUser | null;
    onLogout: () => void;
    onSyncData: () => void;
    isSyncing: boolean;
    onRefreshUser: () => void;
    onOpenQQMusicSettings?: () => void;
}

const AccountTab: React.FC<AccountTabProps> = ({
    user,
    onLogout,
    onSyncData,
    isSyncing,
    onRefreshUser,
    onOpenQQMusicSettings,
}) => {
    const { t } = useTranslation();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col justify-start h-full gap-3"
        >
            <div className="text-[10px] font-bold uppercase tracking-wide opacity-45 px-1">
                {t('account.musicAccounts') || 'Music accounts'}
            </div>

            <div className="space-y-2.5 overflow-y-auto pr-0.5">
                <NeteaseAccountCard
                    user={user}
                    onLogout={onLogout}
                    onSyncData={onSyncData}
                    isSyncing={isSyncing}
                    onRefreshUser={onRefreshUser}
                />
                <QQMusicAccountCard onOpenSettings={onOpenQQMusicSettings} />
                <CocoAccountCard />
            </div>
        </motion.div>
    );
};

export default AccountTab;
