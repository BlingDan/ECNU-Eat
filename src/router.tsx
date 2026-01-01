import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from '@/App';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import ProfilePage from '@/pages/ProfilePage';
import CollectionPage from '@/pages/CollectionPage';
import ReviewsPage from '@/pages/ReviewsPage';
import CreateRoomPage from '@/pages/CreateRoomPage';
import RoomPage from '@/pages/RoomPage';

const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        children: [
            {
                index: true,
                element: <HomePage />,
            },
            {
                path: 'login',
                element: <LoginPage />,
            },
            {
                path: 'profile',
                element: <ProfilePage />,
            },
            {
                path: 'collection',
                element: <CollectionPage />,
            },
            {
                path: 'reviews',
                element: <ReviewsPage />,
            },
            {
                path: 'room/create',
                element: <CreateRoomPage />,
            },
            {
                path: 'room/:code',
                element: <RoomPage />,
            },
        ],
    },
]);

export function AppRouter() {
    return <RouterProvider router={router} />;
}
