import React from 'react';
import { motion } from 'framer-motion';
import { NeteaseUser } from '../../types';
import UnifiedMusicAccountsPanel from './UnifiedMusicAccountsPanel';

// src/components/panelTab/AccountTab.tsx
// Account tab hosts the unified multi-provider connect panel.

interface AccountTabProps {
    user: NeteaseUser | null;
    onLogout: () => void;
    onSyncData: () => void;
    isSyncing: boolean;
    onRefreshUser: () => void;
    onOpenQQMusicSettings?: () => void;
}

const AccountTab: React.FC<AccountTabProps> = (props) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col justify-start h-full min-h-0"
    >
        <UnifiedMusicAccountsPanel {...props} />
    </motion.div>
);

export default AccountTab;
