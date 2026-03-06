import { UniversalProfilePage } from '../../../components/profile/UniversalProfilePage'
import { useAuth } from '../../../lib/auth-context'

export default function PlatformAdminProfilePage() {
    const { user } = useAuth()
    return <UniversalProfilePage role={user?.role || "platform_admin"} />
}
