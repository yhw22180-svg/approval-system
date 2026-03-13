import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useState, useEffect } from 'react'
import API from '../api/client'
import { FiHome, FiFileText, FiPlusCircle, FiUsers, FiSettings, FiLogOut, FiBell, FiMenu, FiX, FiList, FiClock } from 'react-icons/fi'

export default function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [showNotif, setShowNotif] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }, [location.pathname])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/notifications/')
      setNotifications(res.data)
      setUnreadCount(res.data.filter(n => !n.is_read).length)
    } catch {}
  }

  const handleNotifClick = async (notif) => {
    if (!notif.is_read) {
      await API.put(`/notifications/${notif.id}/read`)
      fetchNotifications()
    }
    if (notif.document_id) navigate(`/documents/${notif.document_id}`)
    setShowNotif(false)
  }

  const markAllRead = async () => {
    await API.put('/notifications/read-all')
    fetchNotifications()
  }

  const handleLogout = () => { logout(); navigate('/login') }

  const navItems = [
    { to: '/', label: '대시보드', icon: FiHome },
    { to: '/documents/create', label: '문서 작성', icon: FiPlusCircle },
    { to: '/documents?tab=my', label: '내 문서함', icon: FiFileText },
    { to: '/documents?tab=pending', label: '결재 대기함', icon: FiClock },
  ]

  const adminItems = [
    { to: '/admin/users', label: '회원 관리', icon: FiUsers },
    { to: '/admin/approval-lines', label: '결재라인 관리', icon: FiList },
    { to: '/admin/documents', label: '전체 문서', icon: FiFileText },
  ]

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path.split('?')[0])
  }

  const isMobile = window.innerWidth < 768

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {sidebarOpen && isMobile && (
        <div className="fixed inset-0 bg-black/50 z-30" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        ${isMobile
          ? `fixed top-0 left-0 h-full z-40 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
          : `relative ${sidebarOpen ? 'w-60' : 'w-16'} transition-all duration-300`
        }
        w-60 bg-slate-900 text-white flex flex-col flex-shrink-0
      `}>
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <FiFileText className="text-white" size={16} />
          </div>
          <span className="font-bold text-sm leading-tight">전자결재<br /><span className="text-slate-400 font-normal">시스템</span></span>
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} className="ml-auto text-slate-400 hover:text-white">
              <FiX size={20} />
            </button>
          )}
        </div>

        <div className="px-4 py-3 border-b border-slate-700">
          <p className="text-sm font-semibold">{user?.name}</p>
          <p className="text-xs text-slate-400">{user?.department} · {user?.position}</p>
          {user?.role === 'admin' && (
            <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded mt-1 inline-block">관리자</span>
          )}
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          <p className="px-4 text-xs text-slate-500 mb-2 uppercase tracking-wider">메뉴</p>
          {navItems.map(item => (
            <Link key={item.to} to={item.to}
              className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${isActive(item.to) ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
              <item.icon size={18} className="flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          ))}

          {user?.role === 'admin' && (
            <>
              <p className="px-4 text-xs text-slate-500 mb-2 mt-4 uppercase tracking-wider">관리자</p>
              {adminItems.map(item => (
                <Link key={item.to} to={item.to}
                  className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${isActive(item.to) ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                  <item.icon size={18} className="flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </>
          )}
        </nav>

        <div className="border-t border-slate-700 p-3 space-y-1">
          <Link to="/profile" className="flex items-center gap-3 px-2 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded">
            <FiSettings size={18} />
            <span>내 정보</span>
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-2 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded">
            <FiLogOut size={18} />
            <span>로그아웃</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-slate-100">
            <FiMenu size={20} />
          </button>
          <span className="text-sm font-semibold text-slate-700 md:hidden">전자결재 시스템</span>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setShowNotif(!showNotif)} className="relative p-2 rounded-lg hover:bg-slate-100">
                <FiBell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{unreadCount}</span>
                )}
              </button>
              {showNotif && (
                <div className="absolute right-0 top-10 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <h3 className="font-semibold text-sm">알림 ({unreadCount})</h3>
                    <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">전체 읽음</button>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-center text-sm text-slate-400 py-8">알림이 없습니다</p>
                    ) : notifications.map(n => (
                      <button key={n.id} onClick={() => handleNotifClick(n)}
                        className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 ${!n.is_read ? 'bg-blue-50' : ''}`}>
                        <p className={`text-sm font-medium ${!n.is_read ? 'text-blue-900' : 'text-slate-700'}`}>{n.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
              {user?.name?.[0]}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      {showNotif && <div className="fixed inset-0 z-40" onClick={() => setShowNotif(false)} />}
    </div>
  )
}