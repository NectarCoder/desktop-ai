import React from 'react';
import { motion } from 'motion/react';
import { Menu } from 'lucide-react';

interface HamburgerButtonProps {
    onClick: () => void;
    isSidebarOpen: boolean;
}

export function HamburgerButton({ onClick, isSidebarOpen }: HamburgerButtonProps) {
    // When sidebar is closed, this button is visible with layoutId
    if (isSidebarOpen) return null;

    return (
        <motion.button
            className="hamburger-button"
            layoutId="menu-button" // Shared with sidebar header
            onClick={onClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            <Menu size={20} />
        </motion.button>
    );
}
