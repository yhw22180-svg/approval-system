import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import API from '../../api/client'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { FiSearch } from 'react-icons/fi'

const STATUS_LABEL = { draft: '임시저장', waiting: '결재중', approved: '최종승인', rejected: '반려' }
const STATUS_COLOR = { draft: 'bg-slate-100 text-slate-600', waiting: 'bg-amber-100 text-amber-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700' }

export default function AllDocuments() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.append('status', statusFilter)
    if (search) params.append('search', search)
    API.get(`/documents/all?${params}`).then(res => setDocs(res.data)).catch(() => {}).finally(() => setLoading(false))
  }, [statusFilter, search])

  const stats = { total: docs.length, waiting: docs.filter(d => d.status === 'waiting').length, approved: docs.filter(d => d.status === 'approved').length, rejected: docs.filter(d => d.status === 'rejected').length }

  return (
    <div className="max-w-6xl space-y-5">
      <h1 className="text-2xl font-bold text-slate-800">📁 전체 문서 관리</h1>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[{ label: '전체', value: stats.total, color: 'bg-slate-100 text-slate-700' }, { label: '결재중', value: stats.waiting, color: 'bg-amber-100 text-amber-700' }, { label: '승인완료', value: stats.approved, color: 'bg-green-100 text-green-700' }, { label: '반려', value: stats.rejected, color: 'bg-red-100 text-red-700' }].map(s => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="제목 또는 문서번호 검색..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white">
          <option value="">전체 상태</option>
          <option value="draft">임시저장</option>
          <option value="waiting">결재중</option>
          <option value="approved">승인완료</option>
          <option value="rejected">반려</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['문서번호', '제목', '유형', '작성자/부서', '상태', '진행단계', '작성일'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {docs.map(doc => (
                <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-slate-500 font-mono">{doc.doc_number}</td>
                  <td className="px-4 py-3">
                    <Link to={`/documents/${doc.id}`} className="text-sm font-medium text-slate-800 hover:text-blue-600 transition-colors">{doc.title}</Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">{doc.doc_type}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-slate-700">{doc.author.name}</p>
                    <p className="text-xs text-slate-400">{doc.author.department}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[doc.status]}`}>{STATUS_LABEL[doc.status]}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">{doc.total_steps > 0 ? `${doc.current_step}/${doc.total_steps}` : '-'}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{format(new Date(doc.created_at), 'yy.MM.dd HH:mm', { locale: ko })}</td>
                </tr>
              ))}
              {docs.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-sm text-slate-400">문서가 없습니다</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
