import React from 'react';
import QQMusicLoginPanel from '../shared/QQMusicLoginPanel';

// src/components/panelTab/QQMusicAccountCard.tsx
// QQ Music login-state card for the account panel.

type QQMusicAccountCardProps = {
    onOpenSettings?: () => void;
};

const QQMusicAccountCard: React.FC<QQMusicAccountCardProps> = ({ onOpenSettings }) => (
    <QQMusicLoginPanel variant="account" onNeedSettings={onOpenSettings} />
);

export default QQMusicAccountCard;
