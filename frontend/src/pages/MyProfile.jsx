import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import API from '../api/client'
import toast from 'react-hot-toast'
import { FiUser, FiLock, FiMail, FiPhone, FiBriefcase } from 'react-icons/fi'

export default function MyProfile() {
  const { user, refreshUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: user?.name || '', department: user?.department || '', position: user?.position || '', phone: user?.phone || '' })
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', new_password2: '' })
  const [loading, setLoading] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      await API.put('/auth/me', form)
      await refreshUser()
      toast.success('정보가 수정되었습니다.')
      setEditing(false)
    } catch (err) { toast.error(err.response?.data?.detail || '수정에 실패했습니다.') }
    finally { setLoading(false) }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (pwForm.new_password !== pwForm.new_password2) { toast.error('새 비밀번호가 일치하지 않습니다.'); return }
    if (pwForm.new_password.length < 6) { toast.error('비밀번호는 6자 이상이어야 합니다.'); return }
    setPwLoading(true)
    try {
      await API.put('/auth/me/password', { current_password: pwForm.current_password, new_password: pwForm.new_password })
      toast.success('비밀번호가 변경되었습니다.')
      setPwForm({ current_password: '', new_password: '', new_password2: '' })
    } catch (err) { toast.error(err.response?.data?.detail || '변경에 실패했습니다.') }
    finally { setPwLoading(false) }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">내 정보</h1>

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-700 text-2xl font-bold">
            {user?.name?.[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{user?.name}</h2>
            <p className="text-slate-500">{user?.department} · {user?.position}</p>
            {user?.role === 'admin' && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium mt-1 inline-block">관리자</span>}
          </div>
        </div>

        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">이름</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">전화번호</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="010-0000-0000"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">부서</label>
                <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">직급</label>
                <input value={form.position} onChange={e => setForm({ ...form, position: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditing(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">취소</button>
              <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">저장</button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {[
              { icon: FiUser, label: '이름', value: user?.name },
              { icon: FiMail, label: '이메일', value: user?.email },
              { icon: FiBriefcase, label: '부서/직급', value: `${user?.department} · ${user?.position}` },
              { icon: FiPhone, label: '전화번호', value: user?.phone || '-' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 py-2 border-b border-slate-50">
                <Icon size={16} className="text-slate-400 flex-shrink-0" />
                <span className="text-sm text-slate-500 w-20">{label}</span>
                <span className="text-sm text-slate-800 font-medium">{value}</span>
              </div>
            ))}
            <button onClick={() => setEditing(true)} className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">정보 수정</button>
          </div>
        )}
      </div>

      {/* Password Change */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2"><FiLock size={16} />비밀번호 변경</h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">현재 비밀번호</label>
            <input type="password" value={pwForm.current_password} onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })} required
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">새 비밀번호</label>
            <input type="password" value={pwForm.new_password} onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })} required
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">새 비밀번호 확인</label>
            <input type="password" value={pwForm.new_password2} onChange={e => setPwForm({ ...pwForm, new_password2: e.target.value })} required
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <button type="submit" disabled={pwLoading} className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {pwLoading ? '변경 중...' : '비밀번호 변경'}
          </button>
        </form>
      </div>
    </div>
  )
}
