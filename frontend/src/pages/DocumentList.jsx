import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import API from '../api/client'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { FiSearch, FiFileText, FiPlusCircle } from 'react-icons/fi'

const STATUS_LABEL = { draft: '임시저장', waiting: '결재중', approved: '최종승인', rejected: '반려' }
const STATUS_COLOR = { draft: 'bg-slate-100 text-slate-600', waiting: 'bg-amber-100 text-amber-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700' }

export default function DocumentList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'my'
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    const url = tab === 'pending' ? '/documents/pending' : '/documents/my'
    API.get(url).then(res => setDocs(res.data)).catch(() => setDocs([])).finally(() => setLoading(false))
  }, [tab])

  const filtered = docs.filter(d => d.title.toLowerCase().includes(search.toLowerCase()) || d.doc_number.includes(search))

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">문서함</h1>
        <Link to="/documents/create" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors">
          <FiPlusCircle size={16} />문서 작성
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {[{ key: 'my', label: '내 문서함' }, { key: 'pending', label: '결재 대기함' }].map(t => (
          <button key={t.key} onClick={() => setSearchParams({ tab: t.key })}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="제목 또는 문서번호로 검색..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <FiFileText size={40} className="mb-3 opacity-40" />
            <p className="text-sm">문서가 없습니다</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">문서번호</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">제목</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">유형</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-20">작성자</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-20">상태</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-28">작성일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(doc => (
                <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 text-xs text-slate-500 font-mono">{doc.doc_number}</td>
                  <td className="px-5 py-3.5">
                    <Link to={`/documents/${doc.id}`} className="text-sm font-medium text-slate-800 hover:text-blue-600 transition-colors">{doc.title}</Link>
                    {doc.status === 'waiting' && <span className="text-xs text-slate-400 ml-2">{doc.current_step}/{doc.total_steps}단계</span>}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{doc.doc_type}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">{doc.author.name}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[doc.status]}`}>{STATUS_LABEL[doc.status]}</span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-400">
                    {doc.created_at && format(new Date(doc.created_at), 'yy.MM.dd', { locale: ko })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
