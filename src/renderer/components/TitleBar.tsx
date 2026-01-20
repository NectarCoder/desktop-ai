import React from 'react';
import { Minus, Square, X } from 'lucide-react';
import { HamburgerButton } from './HamburgerButton';

interface TitleBarProps {
    onMenuClick: () => void;
    isSidebarOpen: boolean;
}

export function TitleBar({ onMenuClick, isSidebarOpen }: TitleBarProps) {
    const isWindows = navigator.platform.includes('Win');
    const isMac = navigator.platform.includes('Mac');

    // macOS uses native traffic lights
    if (isMac) {
        return (
            <div className="title-bar title-bar--mac">
                <div className="drag-region" />
                <HamburgerButton onClick={onMenuClick} isSidebarOpen={isSidebarOpen} />
            </div>
        );
    }

    return (
        <div className="title-bar">
            <HamburgerButton onClick={onMenuClick} isSidebarOpen={isSidebarOpen} />
            <div className="drag-region" />
            <div className="window-controls">
                <button onClick={() => window.electronAPI.minimizeWindow()}>
                    <Minus size={16} />
                </button>
                <button onClick={() => window.electronAPI.maximizeWindow()}>
                    <Square size={14} />
                </button>
                <button
                    className="close-btn"
                    onClick={() => window.electronAPI.closeWindow()}
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}
