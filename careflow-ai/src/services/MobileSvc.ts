import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { toast } from 'sonner';

/**
 * Native bridge service for Capacitor-based mobile applications.
 */
export const mobileSvc = {
    isNative: (): boolean => {
        return Capacitor.isNativePlatform();
    },

    /**
     * Request permissions and register for push notifications.
     */
    initPushNotifications: async () => {
        if (!mobileSvc.isNative()) {
            console.log('Push notifications skipped: Not a native platform');
            return;
        }

        try {
            let perm = await PushNotifications.checkPermissions();

            if (perm.receive === 'prompt') {
                perm = await PushNotifications.requestPermissions();
            }

            if (perm.receive !== 'granted') {
                throw new Error('Push notification permission denied');
            }

            await PushNotifications.register();

            // Listeners
            PushNotifications.addListener('registration', (token) => {
                console.log('Push registration success, token: ' + token.value);
                // In a real app, send this token to your backend/Supabase
            });

            PushNotifications.addListener('registrationError', (error) => {
                console.error('Push registration error: ' + error.error);
            });

            PushNotifications.addListener('pushNotificationReceived', (notification) => {
                toast(notification.title || 'New Notification', {
                    description: notification.body
                });
            });

        } catch (err: any) {
            console.error('Push Notification Init Failed:', err.message);
        }
    },

    /**
     * Schedule a local notification (e.g., medication reminders).
     */
    scheduleLocalNotification: async (title: string, body: string, delayMs: number = 0) => {
        if (!mobileSvc.isNative()) {
            toast(title, { description: body });
            return;
        }

        try {
            const hasPerm = await LocalNotifications.checkPermissions();
            if (hasPerm.display !== 'granted') {
                await LocalNotifications.requestPermissions();
            }

            await LocalNotifications.schedule({
                notifications: [
                    {
                        title,
                        body,
                        id: Math.floor(Math.random() * 10000),
                        schedule: { at: new Date(Date.now() + delayMs) },
                        sound: 'default'
                    }
                ]
            });
        } catch (err) {
            console.error('Local Notification Failed:', err);
        }
    }
};
