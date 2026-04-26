import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

if (typeof window !== 'undefined') {
    window.Pusher = Pusher;
}

const echoInstance = typeof window !== 'undefined' ? new Echo({
    broadcaster: 'reverb',
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY || 'reverb-key', // Gunakan key dari env jika ada
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST || window.location.hostname,
    wsPort: process.env.NEXT_PUBLIC_REVERB_PORT || 8080,
    wssPort: process.env.NEXT_PUBLIC_REVERB_PORT || 8080,
    forceTLS: (process.env.NEXT_PUBLIC_REVERB_SCHEME || 'http') === 'https',
    enabledTransports: ['ws', 'wss'],
    // Auth configuration for private channels
    authEndpoint: '/backend-api/broadcasting/auth',
    auth: {
        headers: {
            Authorization: typeof localStorage !== 'undefined' ? `Bearer ${localStorage.getItem('token')}` : '',
            Accept: 'application/json',
        },
    },
}) : null;

export default echoInstance;
