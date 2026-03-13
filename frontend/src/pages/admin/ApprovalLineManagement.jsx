import { useState, useEffect } from 'react'
import API from '../../api/client'
import toast from 'react-hot-toast'
import { FiPlus, FiEdit2, FiTrash2, FiChevronDown, FiChevronUp } from 'react-icons/fi'

export default function ApprovalLineManagement() {
  const [templates, setTemplates] = useState([])
  const [users, setUsers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editTemplate, setEditTemplate] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', doc_type: '', steps: [{ step_order: 1, step_name: '', approver_id: '' }] })
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState({})

  const fetchAll = async () => {
    const [tRes, uRes] = await Promise.all([API.get('/approval-lines/all'), API.get('/users/list')])
    setTemplates(tRes.data)
    setUsers(uRes.data)
  }

  useEffect(() => { fetchAll() }, [])

  const resetForm = () => setForm({ name: '', description: '', doc_type: '', steps: [{ step_order: 1, step_name: '', approver_id: '' }] })

  const startEdit = (tmpl) => {
    setEditTemplate(tmpl)
    setForm({ name: tmpl.name, description: tmpl.description || '', doc_type: tmpl.doc_type || '', steps: tmpl.steps.map(s => ({ step_order: s.step_order, step_name: s.step_name, approver_id: s.approver_id || '' })) })
    setShowForm(true)
  }

  const addStep = () => setForm(f => ({ ...f, steps: [...f.steps, { step_order: f.steps.length + 1, step_name: '', approver_id: '' }] }))
  const removeStep = (i) => setForm(f => ({ ...f, steps: f.steps.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, step_order: idx + 1 })) }))
  const updateStep = (i, k, v) => setForm(f => ({ ...f, steps: f.steps.map((s, idx) => idx === i ? { ...s, [k]: v } : s) }))

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error('템플릿 이름을 입력하세요.'); return }
    for (const s of form.steps) {
      if (!s.step_name.trim()) { toast.error('결재 단계명을 입력하세요.'); return }
    }
    setLoading(true)
    try {
      const payload = { ...form, steps: form.steps.map(s => ({ ...s, approver_id: s.approver_id ? parseInt(s.approver_id) : null })) }
      if (editTemplate) { await API.put(`/approval-lines/${editTemplate.id}`, payload) }
      else { await API.post('/approval-lines/', payload) }
      toast.success(editTemplate ? '수정되었습니다.' : '생성되었습니다.')
      setShowForm(false)
      setEditTemplate(null)
      resetForm()
      fetchAll()
    } catch (err) { toast.error(err.response?.data?.detail || '저장 실패') }
    finally { setLoading(false) }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`"${name}" 템플릿을 삭제하시겠습니까?`)) return
    try { await API.delete(`/approval-lines/${id}`); toast.success('삭제되었습니다.'); fetchAll() }
    catch (err) { toast.error(err.response?.data?.detail || '삭제 실패') }
  }

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">🔗 결재라인 관리</h1>
        <button onClick={() => { setShowForm(true); setEditTemplate(null); resetForm() }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors">
          <FiPlus size={16} />새 템플릿
        </button>
      </div>

      {/* Templates List */}
      <div className="space-y-3">
        {templates.map(tmpl => (
          <div key={tmpl.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-4 px-5 py-4">
              <button onClick={() => setExpanded(e => ({ ...e, [tmpl.id]: !e[tmpl.id] }))} className="flex items-center gap-3 flex-1 text-left">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-800">{tmpl.name}</h3>
                    {tmpl.doc_type && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{tmpl.doc_type}</span>}
                    {!tmpl.is_active && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">비활성</span>}
                  </div>
                  {tmpl.description && <p className="text-sm text-slate-500 mt-0.5">{tmpl.description}</p>}
                  <p className="text-xs text-slate-400 mt-1">{tmpl.steps.length}단계 결재</p>
                </div>
                {expanded[tmpl.id] ? <FiChevronUp className="ml-auto text-slate-400" /> : <FiChevronDown className="ml-auto text-slate-400" />}
              </button>
              <div className="flex items-center gap-2">
                <button onClick={() => startEdit(tmpl)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><FiEdit2 size={15} /></button>
                <button onClick={() => handleDelete(tmpl.id, tmpl.name)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><FiTrash2 size={15} /></button>
              </div>
            </div>
            {expanded[tmpl.id] && (
              <div className="border-t border-slate-100 px-5 py-4 bg-slate-50">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600 font-medium">📝 기안자</div>
                  {tmpl.steps.map(step => (
                    <div key={step.id} className="flex items-center gap-2">
                      <span className="text-slate-300">→</span>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 text-xs">
                        <span className="font-medium text-blue-700">{step.step_name}</span>
                        {step.approver && <span className="text-blue-500 ml-1">({step.approver.name})</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {templates.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 flex flex-col items-center py-16 text-slate-400">
            <p className="text-sm">등록된 결재라인 템플릿이 없습니다</p>
            <button onClick={() => { setShowForm(true); resetForm() }} className="text-blue-600 text-sm mt-2 hover:underline">첫 번째 템플릿 만들기</button>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-5">{editTemplate ? '결재라인 수정' : '결재라인 생성'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">템플릿 이름 *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="예: 출장 신청"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">문서 유형</label>
                  <input value={form.doc_type} onChange={e => setForm({ ...form, doc_type: e.target.value })} placeholder="예: 출장 신청"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">설명</label>
                  <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="간단한 설명"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">결재 단계</label>
                  <button onClick={addStep} className="text-sm text-blue-600 hover:text-blue-700 font-medium">+ 단계 추가</button>
                </div>
                <div className="space-y-2">
                  {form.steps.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-lg p-2">
                      <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{s.step_order}</span>
                      <input value={s.step_name} onChange={e => updateStep(i, 'step_name', e.target.value)} placeholder="역할명 (팀장, 부장)"
                        className="flex-1 px-2 py-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white" />
                      <select value={s.approver_id} onChange={e => updateStep(i, 'approver_id', e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white">
                        <option value="">선택 없음</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.position})</option>)}
                      </select>
                      {form.steps.length > 1 && <button onClick={() => removeStep(i)} className="text-red-400 hover:text-red-600 px-1">✕</button>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowForm(false); setEditTemplate(null) }} className="flex-1 py-2.5 border border-slate-300 text-slate-600 rounded-lg text-sm hover:bg-slate-50">취소</button>
              <button onClick={handleSubmit} disabled={loading} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {loading ? '저장 중...' : (editTemplate ? '수정하기' : '생성하기')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
