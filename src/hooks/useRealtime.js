"use client"

import { useEffect } from "react"
import echo from "@/lib/echo"

/**
 * Hook for real-time model updates
 * @param {string} channel Name of the channel (e.g., 'inventory', 'records')
 * @param {function} onUpdate Callback when update is received
 * @param {string} event Name of the event to listen for (optional)
 */
export function useRealtimeUpdate(channel, onUpdate, event = null) {
    useEffect(() => {
        if (!echo) return;

        const echoChannel = echo.channel(channel);
        
        // Listen for generic Model events (BroadcastsEvents trait)
        // Format biasanya: ModelNameCreated, ModelNameUpdated, ModelNameDeleted
        const events = event ? [event] : [
            `${channel.charAt(0).toUpperCase() + channel.slice(1)}Created`,
            `${channel.charAt(0).toUpperCase() + channel.slice(1)}Updated`,
            `${channel.charAt(0).toUpperCase() + channel.slice(1)}Deleted`
        ];

        // Specific mapping for channels to event names if needed
        // Inventory -> Item, Records -> Record
        let modelPrefix = "";
        if (channel === 'inventory') modelPrefix = "Item";
        else if (channel === 'records') modelPrefix = "Record";
        else if (channel === 'master') modelPrefix = "Category"; // Or Supplier
        else if (channel === 'purchases') modelPrefix = "PurchaseOrder";

        const modelEvents = event ? [event] : [
            `${modelPrefix}Created`,
            `${modelPrefix}Updated`,
            `${modelPrefix}Deleted`
        ];

        modelEvents.forEach(evt => {
            echoChannel.listen(`.${evt}`, (data) => {
                console.log(`[Real-time] Event received: ${evt}`, data);
                onUpdate(data);
            });
        });

        // Cleanup
        return () => {
            echo.leaveChannel(channel);
        };
    }, [channel, onUpdate, event]);
}

/**
 * Hook for private notification channel
 * @param {number} userId User ID for the private channel
 * @param {function} onNotification Callback when notification is received
 */
export function useRealtimeNotifications(userId, onNotification) {
    useEffect(() => {
        if (!echo || !userId) return;

        const privateChannel = echo.private(`App.Models.User.${userId}`);
        
        privateChannel.notification((notification) => {
            console.log("[Real-time] New notification received:", notification);
            onNotification(notification);
        });

        return () => {
            echo.leaveChannel(`App.Models.User.${userId}`);
        };
    }, [userId, onNotification]);
}
