import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  Globe, 
  MapPin, 
  Clock, 
  LogOut,
  Shield,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const SessionManagement = () => {
  const { user, logoutFromAllDevices } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      // Since we don't have a dedicated sessions endpoint, we'll show refresh token info from user
      if (user?.refreshTokens) {
        const activeSessions = user.refreshTokens
          .filter(rt => rt.isActive)
          .map(rt => ({
            id: rt._id,
            deviceInfo: rt.deviceInfo,
            createdAt: rt.createdAt,
            isCurrentSession: false // We'll determine this on the frontend
          }))
        setSessions(activeSessions)
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
      toast.error('Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }

  const getDeviceIcon = (userAgent) => {
    const ua = userAgent.toLowerCase()
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return Smartphone
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return Tablet
    } else {
      return Monitor
    }
  }

  const getDeviceInfo = (userAgent) => {
    const ua = userAgent.toLowerCase()
    
    let browser = 'Unknown Browser'
    let os = 'Unknown OS'
    
    // Detect browser
    if (ua.includes('chrome')) browser = 'Chrome'
    else if (ua.includes('firefox')) browser = 'Firefox'
    else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari'
    else if (ua.includes('edge')) browser = 'Edge'
    else if (ua.includes('opera')) browser = 'Opera'
    
    // Detect OS
    if (ua.includes('windows')) os = 'Windows'
    else if (ua.includes('mac')) os = 'macOS'
    else if (ua.includes('linux')) os = 'Linux'
    else if (ua.includes('android')) os = 'Android'
    else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS'
    
    return { browser, os }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleLogoutAllDevices = async () => {
    if (!window.confirm('Are you sure you want to log out from all devices? You will need to sign in again on all your devices.')) {
      return
    }

    try {
      await logoutFromAllDevices()
      setSessions([])
      toast.success('Logged out from all devices successfully')
    } catch (error) {
      toast.error('Error logging out from all devices')
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Shield className="h-5 w-5 text-green-500 mr-2" />
            Active Sessions
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage your active login sessions across different devices
          </p>
        </div>
        
        {sessions.length > 1 && (
          <button
            onClick={handleLogoutAllDevices}
            className="inline-flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout All Devices
          </button>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-8">
          <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Active Sessions</h4>
          <p className="text-gray-600">No active sessions found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session, index) => {
            const DeviceIcon = getDeviceIcon(session.deviceInfo.userAgent)
            const deviceInfo = getDeviceInfo(session.deviceInfo.userAgent)
            const isCurrentSession = index === 0 // Assume first session is current for demo
            
            return (
              <div
                key={session.id || index}
                className={`border rounded-lg p-4 ${
                  isCurrentSession ? 'border-green-200 bg-green-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-lg ${
                      isCurrentSession ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <DeviceIcon className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">
                          {deviceInfo.browser} on {deviceInfo.os}
                        </h4>
                        {isCurrentSession && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Current Session
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-1 space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-1" />
                          IP: {session.deviceInfo.ip}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-1" />
                          Last active: {formatDate(session.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {!isCurrentSession && (
                    <button
                      onClick={() => {
                        // Individual session logout would need backend implementation
                        toast.info('Individual session logout coming soon')
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="End this session"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Security Tips */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">Security Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Always log out from public or shared devices</li>
              <li>• Review your active sessions regularly</li>
              <li>• Use "Remember Me" only on trusted devices</li>
              <li>• If you see unfamiliar sessions, log out from all devices immediately</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SessionManagement
