import { useAppController } from '@/hooks/useAppController';
import { AppRootView } from '@/components/app/root/AppRootView';

export default function App() {
    const controller = useAppController();
    return <AppRootView controller={controller} />;
}
