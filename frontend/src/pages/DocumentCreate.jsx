import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../api/client'
import toast from 'react-hot-toast'
import { FiPlus, FiTrash2, FiUpload, FiX, FiSave, FiSend } from 'react-icons/fi'

const DOC_TYPES = ['일반', '휴가 신청', '출장 신청', '구매 요청', '지출 결의서', '업무 보고', '기타']

export default function DocumentCreate() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', content: '', doc_type: '일반' })
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [users, setUsers] = useState([])
  const [steps, setSteps] = useState([{ step_order: 1, step_name: '', approver_id: '' }])
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [docId, setDocId] = useState(null)

  useEffect(() => {
    Promise.all([API.get('/approval-lines/'), API.get('/users/list')])
      .then(([tRes, uRes]) => { setTemplates(tRes.data); setUsers(uRes.data) })
      .catch(() => {})
  }, [])

  const handleTemplateSelect = (e) => {
    const tid = parseInt(e.target.value)
    if (!tid) { setSelectedTemplate(null); setSteps([{ step_order: 1, step_name: '', approver_id: '' }]); return }
    const tmpl = templates.find(t => t.id === tid)
    setSelectedTemplate(tmpl)
    if (tmpl) {
      setSteps(tmpl.steps.map(s => ({
        step_order: s.step_order,
        step_name: s.step_name,
        approver_id: s.approver_id || ''
      })))
      if (tmpl.doc_type) setForm(f => ({ ...f, doc_type: tmpl.doc_type }))
    }
  }

  const addStep = () => {
    setSteps(prev => [...prev, { step_order: prev.length + 1, step_name: '', approver_id: '' }])
  }

  const removeStep = (idx) => {
    setSteps(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step_order: i + 1 })))
  }

  const updateStep = (idx, field, value) => {
    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  }

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files)
    setFiles(prev => [...prev, ...newFiles])
  }

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx))

  const validateSteps = () => {
    for (const s of steps) {
      if (!s.step_name.trim()) { toast.error('결재 단계명을 입력해주세요.'); return false }
      if (!s.approver_id) { toast.error('결재자를 선택해주세요.'); return false }
    }
    return true
  }

  const saveDraft = async () => {
    if (!form.title.trim()) { toast.error('제목을 입력해주세요.'); return }
    if (!validateSteps()) return
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('content', form.content)
      fd.append('doc_type', form.doc_type)
      if (selectedTemplate) fd.append('template_id', selectedTemplate.id)
      fd.append('steps_json', JSON.stringify(steps.map(s => ({ ...s, approver_id: parseInt(s.approver_id) }))))

      const res = await API.post('/documents/', fd)
      const id = res.data.id
      setDocId(id)

      if (files.length > 0) {
        const filesFd = new FormData()
        files.forEach(f => filesFd.append('files', f))
        await API.post(`/documents/${id}/attachments`, filesFd)
      }

      toast.success('임시저장되었습니다.')
      navigate(`/documents/${id}`)
    } catch (err) {
      toast.error(err.response?.data?.detail || '저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const saveAndSubmit = async () => {
    if (!form.title.trim()) { toast.error('제목을 입력해주세요.'); return }
    if (!form.content.trim()) { toast.error('내용을 입력해주세요.'); return }
    if (!validateSteps()) return
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('content', form.content)
      fd.append('doc_type', form.doc_type)
      if (selectedTemplate) fd.append('template_id', selectedTemplate.id)
      fd.append('steps_json', JSON.stringify(steps.map(s => ({ ...s, approver_id: parseInt(s.approver_id) }))))

      const res = await API.post('/documents/', fd)
      const id = res.data.id

      if (files.length > 0) {
        const filesFd = new FormData()
        files.forEach(f => filesFd.append('files', f))
        await API.post(`/documents/${id}/attachments`, filesFd)
      }

      await API.post(`/documents/${id}/submit`)
      toast.success('결재가 요청되었습니다!')
      navigate(`/documents/${id}`)
    } catch (err) {
      toast.error(err.response?.data?.detail || '제출에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-800">📝 문서 작성</h1>
      </div>

      {/* Document Type & Template */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">문서 기본 정보</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">문서 유형 *</label>
            <select value={form.doc_type} onChange={e => setForm({ ...form, doc_type: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white">
              {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">결재라인 템플릿</label>
            <select onChange={handleTemplateSelect}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white">
              <option value="">직접 설정</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">제목 *</label>
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="문서 제목을 입력하세요"
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">내용 *</label>
          <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
            placeholder="문서 내용을 입력하세요..."
            rows={10}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
        </div>
      </div>

      {/* Approval Line */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">결재라인 설정</h2>
          <button onClick={addStep} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
            <FiPlus size={16} />단계 추가
          </button>
        </div>
        <div className="space-y-3">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-slate-50 rounded-lg p-3">
              <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">{step.step_order}</div>
              <input value={step.step_name} onChange={e => updateStep(idx, 'step_name', e.target.value)}
                placeholder="역할 (예: 팀장, 부장, 대표)"
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white" />
              <select value={step.approver_id} onChange={e => updateStep(idx, 'approver_id', e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white">
                <option value="">결재자 선택</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.department} · {u.position})</option>)}
              </select>
              {steps.length > 1 && (
                <button onClick={() => removeStep(idx)} className="p-1.5 text-red-400 hover:text-red-600">
                  <FiTrash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* File Upload */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wider mb-4">첨부파일</h2>
        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
          <FiUpload className="text-slate-400" size={24} />
          <p className="text-sm text-slate-500 mt-2">클릭하여 파일 선택 (최대 10MB)</p>
          <input type="file" multiple onChange={handleFileChange} className="hidden" />
        </label>
        {files.length > 0 && (
          <div className="mt-3 space-y-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg text-sm">
                <span className="text-slate-700 truncate">{f.name}</span>
                <button onClick={() => removeFile(i)} className="text-slate-400 hover:text-red-500 ml-2"><FiX size={16} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3">
        <button onClick={() => navigate(-1)} className="px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">취소</button>
        <button onClick={saveDraft} disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
          <FiSave size={16} />임시저장
        </button>
        <button onClick={saveAndSubmit} disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
          <FiSend size={16} />결재 요청
        </button>
      </div>
    </div>
  )
}
