import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import API from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { FiFileText, FiClock, FiCheckCircle, FiXCircle, FiPlusCircle, FiArrowRight } from 'react-icons/fi'

const STATUS_LABEL = { draft: '임시저장', waiting: '결재중', approved: '승인', rejected: '반려' }
const STATUS_COLOR = { draft: 'bg-slate-100 text-slate-600', waiting: 'bg-amber-100 text-amber-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700' }

function StatCard({ label, value, icon: Icon, color, to }) {
  const content = (
    <div className={`bg-white rounded-xl p-5 border border-slate-200 hover:shadow-md transition-shadow flex items-center gap-4`}>
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  )
  return to ? <Link to={to}>{content}</Link> : content
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [myDocs, setMyDocs] = useState([])
  const [pendingDocs, setPendingDocs] = useState([])

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, myRes, pendingRes] = await Promise.all([
          API.get('/documents/dashboard'),
          API.get('/documents/my?status=waiting'),
          API.get('/documents/pending'),
        ])
        setStats(statsRes.data)
        setMyDocs(myRes.data.slice(0, 5))
        setPendingDocs(pendingRes.data.slice(0, 5))
      } catch {}
    }
    fetchAll()
  }, [])

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">안녕하세요, {user?.name}님 👋</h1>
          <p className="text-slate-500 text-sm mt-1">{user?.department} · {user?.position}</p>
        </div>
        <Link to="/documents/create" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors">
          <FiPlusCircle size={18} />문서 작성
        </Link>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard label="임시저장" value={stats.my_drafts} icon={FiFileText} color="bg-slate-100 text-slate-600" to="/documents?tab=my" />
          <StatCard label="결재 진행중" value={stats.my_waiting} icon={FiClock} color="bg-amber-100 text-amber-600" to="/documents?tab=my&status=waiting" />
          <StatCard label="승인 완료" value={stats.my_approved} icon={FiCheckCircle} color="bg-green-100 text-green-600" to="/documents?tab=my&status=approved" />
          <StatCard label="반려" value={stats.my_rejected} icon={FiXCircle} color="bg-red-100 text-red-600" to="/documents?tab=my&status=rejected" />
          <StatCard label="결재 대기" value={stats.pending_approval} icon={FiClock} color="bg-blue-100 text-blue-600" to="/documents?tab=pending" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending approval */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">📋 내가 결재할 문서</h2>
            <Link to="/documents?tab=pending" className="text-sm text-blue-600 hover:underline flex items-center gap-1">전체 <FiArrowRight size={14} /></Link>
          </div>
          <div className="divide-y divide-slate-50">
            {pendingDocs.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-10">결재 대기 문서가 없습니다</p>
            ) : pendingDocs.map(doc => (
              <Link key={doc.id} to={`/documents/${doc.id}`}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{doc.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{doc.doc_number} · {doc.author?.name} · {doc.doc_type}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${STATUS_COLOR[doc.status]}`}>{STATUS_LABEL[doc.status]}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* My documents in progress */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">🔄 내 진행 중 문서</h2>
            <Link to="/documents?tab=my" className="text-sm text-blue-600 hover:underline flex items-center gap-1">전체 <FiArrowRight size={14} /></Link>
          </div>
          <div className="divide-y divide-slate-50">
            {myDocs.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-10">진행 중인 문서가 없습니다</p>
            ) : myDocs.map(doc => (
              <Link key={doc.id} to={`/documents/${doc.id}`}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{doc.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{doc.doc_number} · {doc.doc_type}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLOR[doc.status]}`}>{STATUS_LABEL[doc.status]}</span>
                  <span className="text-xs text-slate-400">{doc.current_step}/{doc.total_steps}단계</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
