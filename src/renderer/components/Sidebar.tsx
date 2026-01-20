import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Keyboard, Settings } from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenShortcuts: () => void;
    onOpenSettings: () => void;
}

export function Sidebar({ isOpen, onClose, onOpenShortcuts, onOpenSettings }: SidebarProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop with blur */}
                    <motion.div
                        className="sidebar-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                    />

                    {/* Sidebar Panel */}
                    <motion.aside
                        className="sidebar"
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    >
                        {/* Header with Merge Effect */}
                        <motion.div
                            className="sidebar-header"
                            layoutId="menu-button" // Shared layoutId for merge effect
                        >
                            <button className="sidebar-close" onClick={onClose}>
                                <X size={20} />
                            </button>
                            <span className="sidebar-title">Menu</span>
                        </motion.div>

                        {/* Navigation Items */}
                        <nav className="sidebar-nav">
                            <SidebarItem
                                icon={<Keyboard size={20} />}
                                label="Keyboard Shortcuts"
                                onClick={onOpenShortcuts}
                            />
                        </nav>

                        {/* Fixed Bottom Settings */}
                        <div className="sidebar-footer">
                            <SidebarItem
                                icon={<Settings size={20} />}
                                label="Settings"
                                onClick={onOpenSettings}
                            />
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}

function SidebarItem({ icon, label, onClick }: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
}) {
    return (
        <motion.button
            className="sidebar-item"
            onClick={onClick}
            whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.08)' }}
            whileTap={{ scale: 0.98 }}
        >
            <span className="sidebar-item-icon">{icon}</span>
            <span className="sidebar-item-label">{label}</span>
        </motion.button>
    );
}
