import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import API from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { FiDownload, FiCheck, FiX, FiRotateCcw, FiTrash2, FiSend, FiClock, FiUser } from 'react-icons/fi'

const STATUS_LABEL = { draft: '임시저장', waiting: '결재중', approved: '최종승인', rejected: '반려' }
const STATUS_COLOR = { draft: 'bg-slate-100 text-slate-700', waiting: 'bg-amber-100 text-amber-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700' }
const STEP_STATUS = { pending: '대기', approved: '승인', rejected: '반려' }
const STEP_COLOR = { pending: 'border-slate-300 text-slate-500', approved: 'border-green-500 text-green-600 bg-green-50', rejected: 'border-red-500 text-red-600 bg-red-50' }

export default function DocumentDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [doc, setDoc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [approveModal, setApproveModal] = useState(false)
  const [rejectModal, setRejectModal] = useState(false)
  const [comment, setComment] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchDoc = async () => {
    try {
      const res = await API.get(`/documents/${id}`)
      setDoc(res.data)
    } catch (err) {
      toast.error('문서를 불러올 수 없습니다.')
      navigate(-1)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchDoc() }, [id])

  const canApprove = () => {
    if (!doc || doc.status !== 'waiting') return false
    const currentStep = doc.approval_steps.find(s => s.step_order === doc.current_step)
    return currentStep?.approver_id === user.id && currentStep?.status === 'pending'
  }

  const canRecall = () => doc?.author_id === user.id && doc?.status === 'waiting' && !doc?.approval_steps.some(s => s.status === 'approved')
  const canDelete = () => (doc?.author_id === user.id || user.role === 'admin') && doc?.status !== 'waiting'
  const canSubmit = () => doc?.author_id === user.id && doc?.status === 'draft'

  const handleApprove = async () => {
    setActionLoading(true)
    try {
      await API.post(`/documents/${id}/approve`, { action: 'approve', comment })
      toast.success('승인되었습니다.')
      setApproveModal(false)
      setComment('')
      fetchDoc()
    } catch (err) { toast.error(err.response?.data?.detail || '오류가 발생했습니다.') }
    finally { setActionLoading(false) }
  }

  const handleReject = async () => {
    if (!comment.trim()) { toast.error('반려 사유를 입력해주세요.'); return }
    setActionLoading(true)
    try {
      await API.post(`/documents/${id}/approve`, { action: 'reject', comment })
      toast.success('반려되었습니다.')
      setRejectModal(false)
      setComment('')
      fetchDoc()
    } catch (err) { toast.error(err.response?.data?.detail || '오류가 발생했습니다.') }
    finally { setActionLoading(false) }
  }

  const handleRecall = async () => {
    if (!confirm('문서를 회수하시겠습니까?')) return
    try { await API.post(`/documents/${id}/recall`); toast.success('문서가 회수되었습니다.'); fetchDoc() }
    catch (err) { toast.error(err.response?.data?.detail || '오류가 발생했습니다.') }
  }

  const handleDelete = async () => {
    if (!confirm('문서를 삭제하시겠습니까?')) return
    try { await API.delete(`/documents/${id}`); toast.success('삭제되었습니다.'); navigate('/documents') }
    catch (err) { toast.error(err.response?.data?.detail || '오류가 발생했습니다.') }
  }

  const handleSubmit = async () => {
    if (!confirm('결재를 요청하시겠습니까?')) return
    try { await API.post(`/documents/${id}/submit`); toast.success('결재가 요청되었습니다.'); fetchDoc() }
    catch (err) { toast.error(err.response?.data?.detail || '오류가 발생했습니다.') }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
  if (!doc) return null

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className={`text-sm px-3 py-1 rounded-full font-medium ${STATUS_COLOR[doc.status]}`}>{STATUS_LABEL[doc.status]}</span>
            <span className="text-sm text-slate-500">{doc.doc_number}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">{doc.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{doc.doc_type} · {doc.author.name} ({doc.author.department}) · {format(new Date(doc.created_at), 'yyyy.MM.dd HH:mm', { locale: ko })}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {canSubmit() && <button onClick={handleSubmit} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"><FiSend size={14} />결재 요청</button>}
          {canApprove() && (
            <>
              <button onClick={() => { setApproveModal(true); setComment('') }} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg"><FiCheck size={14} />승인</button>
              <button onClick={() => { setRejectModal(true); setComment('') }} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg"><FiX size={14} />반려</button>
            </>
          )}
          {canRecall() && <button onClick={handleRecall} className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg"><FiRotateCcw size={14} />회수</button>}
          {canDelete() && <button onClick={handleDelete} className="flex items-center gap-1.5 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium rounded-lg"><FiTrash2 size={14} />삭제</button>}
        </div>
      </div>

      {/* Approval Line */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-700 mb-4 text-sm uppercase tracking-wider">결재라인</h2>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Author */}
          <div className="flex flex-col items-center gap-1 min-w-[80px]">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">{doc.author.name[0]}</div>
            <p className="text-xs font-medium text-slate-700">{doc.author.name}</p>
            <p className="text-xs text-slate-400">기안자</p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">작성</span>
          </div>

          {doc.approval_steps.map((step, idx) => (
            <div key={step.id} className="flex items-center gap-2">
              <div className="text-slate-300 text-lg">→</div>
              <div className={`flex flex-col items-center gap-1 min-w-[80px] border-2 rounded-xl p-2 ${STEP_COLOR[step.status]}`}>
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600">{step.approver.name[0]}</div>
                <p className="text-xs font-medium">{step.approver.name}</p>
                <p className="text-xs text-slate-400">{step.step_name}</p>
                <span className="text-xs font-semibold">{STEP_STATUS[step.status]}</span>
                {step.acted_at && <p className="text-xs text-slate-400">{format(new Date(step.acted_at), 'MM.dd')}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-700 mb-4 text-sm uppercase tracking-wider">문서 내용</h2>
        <div className="prose max-w-none text-slate-700 text-sm whitespace-pre-wrap leading-relaxed border border-slate-100 rounded-lg p-4 bg-slate-50 min-h-[200px]">
          {doc.content}
        </div>
      </div>

      {/* Attachments */}
      {doc.attachments.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-700 mb-4 text-sm uppercase tracking-wider">첨부파일 ({doc.attachments.length})</h2>
          <div className="space-y-2">
            {doc.attachments.map(att => (
              <a key={att.id} href={`/api/documents/${doc.id}/attachments/${att.id}/download`}
                className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors group">
                <span className="text-sm text-slate-700">{att.original_filename}</span>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>{(att.file_size / 1024).toFixed(1)} KB</span>
                  <FiDownload size={14} className="group-hover:text-blue-600" />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {doc.history.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-700 mb-4 text-sm uppercase tracking-wider">처리 이력</h2>
          <div className="space-y-3">
            {doc.history.map(h => (
              <div key={h.id} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0 text-slate-600 text-sm font-bold">{h.actor.name[0]}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">{h.actor.name}</span>
                    <span className="text-xs text-slate-400">{h.step_name && `(${h.step_name})`}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${h.action === 'approved' || h.action === 'submitted' ? 'bg-green-100 text-green-700' : h.action === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                      {{ submitted: '결재 요청', approved: '승인', rejected: '반려', recalled: '회수' }[h.action] || h.action}
                    </span>
                    <span className="text-xs text-slate-400 ml-auto">{format(new Date(h.created_at), 'yyyy.MM.dd HH:mm', { locale: ko })}</span>
                  </div>
                  {h.comment && <p className="text-sm text-slate-500 mt-1 bg-slate-50 px-3 py-2 rounded-lg">{h.comment}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {approveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-slate-800 mb-4">✅ 결재 승인</h3>
            <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="의견 (선택사항)" rows={3}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none" />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setApproveModal(false)} className="flex-1 py-2.5 border border-slate-300 text-slate-600 rounded-lg text-sm hover:bg-slate-50">취소</button>
              <button onClick={handleApprove} disabled={actionLoading} className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">승인하기</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-slate-800 mb-4">❌ 결재 반려</h3>
            <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="반려 사유를 입력해주세요 (필수)" rows={4}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm resize-none" />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setRejectModal(false)} className="flex-1 py-2.5 border border-slate-300 text-slate-600 rounded-lg text-sm hover:bg-slate-50">취소</button>
              <button onClick={handleReject} disabled={actionLoading} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">반려하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
