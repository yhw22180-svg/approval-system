import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../api/client'
import toast from 'react-hot-toast'
import { FiPlus, FiTrash2, FiUpload, FiX, FiSave, FiSend } from 'react-icons/fi'

// 1. 문서 유형 정의 (출장/휴가 추가)
const DOC_TYPES = ['일반', '휴가 신청', '출장 신청', '지출 품의서', '구매의뢰서', '업무 보고', '기타']

const EMPTY_EXPENSE_ROW = () => ({ content: '', amount: '', note: '' })
const EMPTY_PURCHASE_ROW = () => ({ name: '', spec: '', unit: 'EA', qty: '1', note: '' })

/** [양식 1] 지출 품의서 */
function ExpenseForm({ data, onChange }) {
  const update = (field, val) => onChange({ ...data, [field]: val })
  const updateRow = (i, field, val) => {
    const rows = data.rows.map((r, idx) => idx === i ? { ...r, [field]: val } : r)
    onChange({ ...data, rows })
  }
  const addRow = () => onChange({ ...data, rows: [...data.rows, EMPTY_EXPENSE_ROW()] })
  const delRow = (i) => { if (data.rows.length > 1) onChange({ ...data, rows: data.rows.filter((_, idx) => idx !== i) }) }

  return (
    <div className="space-y-4">
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">지출 품의서</span>
            <input type="date" value={data.date || ''} onChange={e => update('date', e.target.value)}
              className="text-xs border border-slate-200 rounded px-2 py-1 w-40" />
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-slate-500 mb-1 block">지출처</label>
              <input value={data.vendor || ''} onChange={e => update('vendor', e.target.value)} placeholder="지출처"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
            <div><label className="text-xs text-slate-500 mb-1 block">계정과목</label>
              <input value={data.account || ''} onChange={e => update('account', e.target.value)} placeholder="계정과목"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
          </div>
          <div><label className="text-xs text-slate-500 mb-1 block">지출목적</label>
            <input value={data.purpose || ''} onChange={e => update('purpose', e.target.value)} placeholder="지출 목적"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
          <div><label className="text-xs text-slate-500 mb-1 block">참석자</label>
            <input value={data.attendees || ''} onChange={e => update('attendees', e.target.value)} placeholder="참석자 명단"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
          <div><label className="text-xs text-slate-500 mb-1 block">합계금액</label>
            <input value={data.total || ''} onChange={e => update('total', e.target.value)} placeholder="₩ 0"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
        </div>
      </div>
      {/* 내역 테이블 */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2.5 text-left font-medium text-slate-600 border-b border-slate-200 w-2/5">내용</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-600 border-b border-slate-200 w-1/4">금액</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-600 border-b border-slate-200 w-1/4">비고</th>
              <th className="px-3 py-2.5 border-b border-slate-200 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, i) => (
              <tr key={i} className="border-b border-slate-100 last:border-0">
                <td className="px-2 py-1.5"><input value={row.content} onChange={e => updateRow(i, 'content', e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm" /></td>
                <td className="px-2 py-1.5"><input value={row.amount} onChange={e => updateRow(i, 'amount', e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm" /></td>
                <td className="px-2 py-1.5"><input value={row.note} onChange={e => updateRow(i, 'note', e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm" /></td>
                <td className="px-2 py-1.5 text-center">
                  <button onClick={() => delRow(i)} disabled={data.rows.length === 1} className="text-slate-300 hover:text-red-500"><FiTrash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-2"><button onClick={addRow} className="w-full flex items-center justify-center gap-1.5 py-2 text-sm text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-lg border border-dashed border-slate-300 transition-colors"><FiPlus size={14} />항목 추가</button></div>
      </div>
    </div>
  )
}

/** [양식 2] 구매의뢰서 */
function PurchaseForm({ data, onChange }) {
  const update = (field, val) => onChange({ ...data, [field]: val })
  const updateRow = (i, field, val) => {
    const rows = data.rows.map((r, idx) => idx === i ? { ...r, [field]: val } : r)
    onChange({ ...data, rows })
  }
  const addRow = () => onChange({ ...data, rows: [...data.rows, EMPTY_PURCHASE_ROW()] })
  const delRow = (i) => { if (data.rows.length > 1) onChange({ ...data, rows: data.rows.filter((_, idx) => idx !== i) }) }

  return (
    <div className="space-y-4">
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">구매의뢰서</span>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-slate-500 mb-1 block">수주처</label><input value={data.vendor || ''} onChange={e => update('vendor', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
            <div><label className="text-xs text-slate-500 mb-1 block">의뢰인</label><input value={data.requester || ''} onChange={e => update('requester', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
            <div><label className="text-xs text-slate-500 mb-1 block">의뢰일</label><input type="date" value={data.requestDate || ''} onChange={e => update('requestDate', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
            <div><label className="text-xs text-slate-500 mb-1 block">입고요청일</label><input type="date" value={data.deliveryDate || ''} onChange={e => update('deliveryDate', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
          </div>
          <div><label className="text-xs text-slate-500 mb-1 block">사용구분</label><input value={data.usage || ''} onChange={e => update('usage', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
        </div>
      </div>
      {/* 구매 품목 테이블 */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2.5 text-center font-medium text-slate-600 border-b border-slate-200 w-10">No</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-600 border-b border-slate-200">품명</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-600 border-b border-slate-200 w-16">수량</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-600 border-b border-slate-200">비고</th>
              <th className="px-3 py-2.5 border-b border-slate-200 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, i) => (
              <tr key={i} className="border-b border-slate-100 last:border-0">
                <td className="px-2 py-1.5 text-center text-slate-400 text-xs">{i + 1}</td>
                <td className="px-2 py-1.5"><input value={row.name} onChange={e => updateRow(i, 'name', e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm" /></td>
                <td className="px-2 py-1.5"><input value={row.qty} onChange={e => updateRow(i, 'qty', e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm" /></td>
                <td className="px-2 py-1.5"><input value={row.note} onChange={e => updateRow(i, 'note', e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm" /></td>
                <td className="px-2 py-1.5 text-center">
                  <button onClick={() => delRow(i)} disabled={data.rows.length === 1} className="text-slate-300 hover:text-red-500"><FiTrash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-2"><button onClick={addRow} className="w-full flex items-center justify-center gap-1.5 py-2 text-sm text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-lg border border-dashed border-slate-300 transition-colors"><FiPlus size={14} />품목 추가</button></div>
      </div>
    </div>
  )
}

/** [양식 3] 휴가 신청서 (신규) */
function VacationForm({ data, onChange }) {
  const update = (field, val) => onChange({ ...data, [field]: val })
  return (
    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs text-slate-500 mb-1 block">휴가 구분</label>
          <select value={data.type || '연차'} onChange={e => update('type', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
            <option value="연차">연차</option><option value="반차">반차</option><option value="병가">병가</option><option value="경조사">경조사</option>
          </select></div>
        <div><label className="text-xs text-slate-500 mb-1 block">사용 일수</label>
          <input value={data.days || ''} onChange={e => update('days', e.target.value)} placeholder="예: 1" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs text-slate-500 mb-1 block">시작일</label><input type="date" value={data.startDate || ''} onChange={e => update('startDate', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
        <div><label className="text-xs text-slate-500 mb-1 block">종료일</label><input type="date" value={data.endDate || ''} onChange={e => update('endDate', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
      </div>
      <div><label className="text-xs text-slate-500 mb-1 block">사유</label><input value={data.reason || ''} onChange={e => update('reason', e.target.value)} placeholder="휴가 사유 입력" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
    </div>
  )
}

/** [양식 4] 출장 신청서 (신규) */
function BusinessTripForm({ data, onChange }) {
  const update = (field, val) => onChange({ ...data, [field]: val })
  return (
    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs text-slate-500 mb-1 block">출장지</label><input value={data.location || ''} onChange={e => update('location', e.target.value)} placeholder="장소명" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
        <div><label className="text-xs text-slate-500 mb-1 block">출장 기간</label><input value={data.period || ''} onChange={e => update('period', e.target.value)} placeholder="예: 2026-03-20 ~ 2026-03-22" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
      </div>
      <div><label className="text-xs text-slate-500 mb-1 block">출장 목적</label><input value={data.purpose || ''} onChange={e => update('purpose', e.target.value)} placeholder="목적 입력" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
      <div><label className="text-xs text-slate-500 mb-1 block">예상 비용</label><input value={data.budget || ''} onChange={e => update('budget', e.target.value)} placeholder="₩ 0" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
    </div>
  )
}

export default function DocumentCreate() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', content: '', doc_type: '일반' })
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [users, setUsers] = useState([])
  const [steps, setSteps] = useState([{ step_order: 1, step_name: '', approver_id: '' }])
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)

  // 각 양종별 상태 관리
  const [expenseData, setExpenseData] = useState({ date: '', vendor: '', account: '', purpose: '', attendees: '', total: '', rows: [EMPTY_EXPENSE_ROW()] })
  const [purchaseData, setPurchaseData] = useState({ vendor: '', requester: '', equipment: '', location: '', sn: '', company: '', requestDate: '', deliveryDate: '', usage: '', deptNo: '', rows: [EMPTY_PURCHASE_ROW()] })
  const [vacationData, setVacationData] = useState({ type: '연차', days: '', startDate: '', endDate: '', reason: '' })
  const [tripData, setTripData] = useState({ location: '', period: '', purpose: '', budget: '' })

  const isExpense = form.doc_type === '지출 품의서'
  const isPurchase = form.doc_type === '구매의뢰서'
  const isVacation = form.doc_type === '휴가 신청'
  const isBusinessTrip = form.doc_type === '출장 신청'
  const isStructured = isExpense || isPurchase || isVacation || isBusinessTrip

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
      setSteps(tmpl.steps.map(s => ({ step_order: s.step_order, step_name: s.step_name, approver_id: s.approver_id || '' })))
      if (tmpl.doc_type) setForm(f => ({ ...f, doc_type: tmpl.doc_type }))
    }
  }

  const addStep = () => setSteps(prev => [...prev, { step_order: prev.length + 1, step_name: '', approver_id: '' }])
  const removeStep = (idx) => setSteps(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step_order: i + 1 })))
  const updateStep = (idx, field, value) => setSteps(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  const handleFileChange = (e) => setFiles(prev => [...prev, ...Array.from(e.target.files)])
  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx))

  const validateSteps = () => {
    for (const s of steps) {
      if (!s.step_name.trim()) { toast.error('결재 단계명을 입력해주세요.'); return false }
      if (!s.approver_id) { toast.error('결재자를 선택해주세요.'); return false }
    }
    return true
  }

  const getContent = () => {
    if (isExpense) return JSON.stringify({ type: 'expense', ...expenseData })
    if (isPurchase) return JSON.stringify({ type: 'purchase', ...purchaseData })
    if (isVacation) return JSON.stringify({ type: 'vacation', ...vacationData })
    if (isBusinessTrip) return JSON.stringify({ type: 'trip', ...tripData })
    return form.content
  }

  const validateContent = () => {
    if (isExpense && !expenseData.purpose.trim()) { toast.error('지출목적을 입력해주세요.'); return false }
    if (isPurchase && !purchaseData.vendor.trim()) { toast.error('수주처를 입력해주세요.'); return false }
    if (isVacation && !vacationData.reason.trim()) { toast.error('휴가 사유를 입력해주세요.'); return false }
    if (isBusinessTrip && !tripData.location.trim()) { toast.error('출장지를 입력해주세요.'); return false }
    if (!isStructured && !form.content.trim()) { toast.error('내용을 입력해주세요.'); return false }
    return true
  }

  const buildFormData = () => {
    const fd = new FormData()
    fd.append('title', form.title)
    fd.append('content', getContent())
    fd.append('doc_type', form.doc_type)
    if (selectedTemplate) fd.append('template_id', selectedTemplate.id)
    fd.append('steps_json', JSON.stringify(steps.map(s => ({ ...s, approver_id: parseInt(s.approver_id) }))))
    return fd
  }

  const saveDraft = async () => {
    if (!form.title.trim()) { toast.error('제목을 입력해주세요.'); return }
    if (!validateSteps()) return
    setLoading(true)
    try {
      const res = await API.post('/documents/', buildFormData())
      const id = res.data.id
      if (files.length > 0) {
        const filesFd = new FormData()
        files.forEach(f => filesFd.append('files', f))
        await API.post(`/documents/${id}/attachments`, filesFd)
      }
      toast.success('임시저장되었습니다.')
      navigate(`/documents/${id}`)
    } catch (err) { toast.error(err.response?.data?.detail || '저장에 실패했습니다.')
    } finally { setLoading(false) }
  }

  const saveAndSubmit = async () => {
    if (!form.title.trim()) { toast.error('제목을 입력해주세요.'); return }
    if (!validateContent() || !validateSteps()) return
    setLoading(true)
    try {
      const res = await API.post('/documents/', buildFormData())
      const id = res.data.id
      if (files.length > 0) {
        const filesFd = new FormData()
        files.forEach(f => filesFd.append('files', f))
        await API.post(`/documents/${id}/attachments`, filesFd)
      }
      await API.post(`/documents/${id}/submit`)
      toast.success('결재가 요청되었습니다!')
      navigate(`/documents/${id}`)
    } catch (err) { toast.error(err.response?.data?.detail || '제출에 실패했습니다.')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3"><h1 className="text-2xl font-bold text-slate-800">📝 문서 작성</h1></div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">문서 기본 정보</h2>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">문서 유형 *</label>
            <select value={form.doc_type} onChange={e => setForm({ ...form, doc_type: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500">
              {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">결재라인 템플릿</label>
            <select onChange={handleTemplateSelect} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white">
              <option value="">직접 설정</option>{templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select></div>
        </div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">제목 *</label>
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="문서 제목을 입력하세요" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm" /></div>

        {/* 양식 렌더링 영역 */}
        {isExpense && <ExpenseForm data={expenseData} onChange={setExpenseData} />}
        {isPurchase && <PurchaseForm data={purchaseData} onChange={setPurchaseData} />}
        {isVacation && <VacationForm data={vacationData} onChange={setVacationData} />}
        {isBusinessTrip && <BusinessTripForm data={tripData} onChange={setTripData} />}
        {!isStructured && (
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">내용 *</label>
            <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="문서 내용을 입력하세요..." rows={10} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm resize-none" /></div>
        )}
      </div>

      {/* 결재라인 설정 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4"><h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">결재라인 설정</h2><button onClick={addStep} className="text-sm text-blue-600 font-medium">+ 단계 추가</button></div>
        <div className="space-y-3">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-slate-50 rounded-lg p-3">
              <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">{step.step_order}</div>
              <input value={step.step_name} onChange={e => updateStep(idx, 'step_name', e.target.value)} placeholder="역할" className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" />
              <select value={step.approver_id} onChange={e => updateStep(idx, 'approver_id', e.target.value)} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                <option value="">결재자 선택</option>{users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.department})</option>)}
              </select>
              {steps.length > 1 && <button onClick={() => removeStep(idx)} className="p-1.5 text-red-400"><FiTrash2 size={16} /></button>}
            </div>
          ))}
        </div>
      </div>

      {/* 첨부파일 영역 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wider mb-4">첨부파일</h2>
        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
          <FiUpload className="text-slate-400" size={24} /><p className="text-sm text-slate-500 mt-2">클릭하여 파일 선택</p>
          <input type="file" multiple onChange={handleFileChange} className="hidden" />
        </label>
        {files.length > 0 && (
          <div className="mt-3 space-y-2">{files.map((f, i) => (<div key={i} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg text-sm"><span className="text-slate-700 truncate">{f.name}</span><button onClick={() => removeFile(i)} className="text-slate-400 hover:text-red-500 ml-2"><FiX size={16} /></button></div>))}</div>
        )}
      </div>

      {/* 버튼 영역 */}
      <div className="flex items-center justify-end gap-3">
        <button onClick={() => navigate(-1)} className="px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">취소</button>
        <button onClick={saveDraft} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"><FiSave size={16} />임시저장</button>
        <button onClick={saveAndSubmit} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg disabled:opacity-50"><FiSend size={16} />결재 요청</button>
      </div>
    </div>
  )
}