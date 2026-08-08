import AdminRoutes from './routes/AdminRoutes'
import AdminLayout from './components/AdminLayout'
import { adminDataService } from './services/adminDataService'
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext'

export { AdminRoutes, AdminLayout, adminDataService, AdminAuthProvider, useAdminAuth }
export default AdminRoutes
