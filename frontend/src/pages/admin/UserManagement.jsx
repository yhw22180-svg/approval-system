import { useState, useEffect } from 'react'
import API from '../../api/client'
import toast from 'react-hot-toast'
import { FiSearch, FiEdit2, FiTrash2, FiKey, FiUserCheck, FiUserX } from 'react-icons/fi'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editUser, setEditUser] = useState(null)
  const [editForm, setEditForm] = useState({})

  const fetchUsers = async () => {
    setLoading(true)
    try { setUsers((await API.get('/users/')).data) } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchUsers() }, [])

  const filtered = users.filter(u => u.name.includes(search) || u.email.includes(search) || u.department.includes(search))

  const handleEdit = (user) => { setEditUser(user); setEditForm({ name: user.name, department: user.department, position: user.position, phone: user.phone || '', role: user.role, is_active: user.is_active }) }

  const handleSave = async () => {
    try {
      await API.put(`/users/${editUser.id}`, editForm)
      toast.success('수정되었습니다.')
      setEditUser(null)
      fetchUsers()
    } catch (err) { toast.error(err.response?.data?.detail || '수정 실패') }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`${name}님을 삭제하시겠습니까?`)) return
    try { await API.delete(`/users/${id}`); toast.success('삭제되었습니다.'); fetchUsers() }
    catch (err) { toast.error(err.response?.data?.detail || '삭제 실패') }
  }

  const handleResetPw = async (id, name) => {
    if (!confirm(`${name}님의 비밀번호를 초기화하시겠습니까? (임시: Change1234!)`)) return
    try { await API.put(`/users/${id}/reset-password`); toast.success('비밀번호가 초기화되었습니다.') }
    catch (err) { toast.error(err.response?.data?.detail || '초기화 실패') }
  }

  const toggleActive = async (user) => {
    try {
      await API.put(`/users/${user.id}`, { is_active: !user.is_active })
      toast.success(user.is_active ? '계정이 비활성화되었습니다.' : '계정이 활성화되었습니다.')
      fetchUsers()
    } catch {}
  }

  return (
    <div className="max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">👥 회원 관리</h1>
        <span className="text-sm text-slate-500">총 {users.length}명</span>
      </div>

      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="이름, 이메일, 부서로 검색..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['이름', '이메일', '부서/직급', '권한', '상태', '가입일', '작업'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(user => (
                <tr key={user.id} className={`hover:bg-slate-50 ${!user.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold">{user.name[0]}</div>
                      <span className="text-sm font-medium text-slate-800">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">{user.email}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{user.department} · {user.position}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${user.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                      {user.role === 'admin' ? '관리자' : '일반'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user.is_active ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{format(new Date(user.created_at), 'yy.MM.dd', { locale: ko })}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(user)} title="수정" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"><FiEdit2 size={14} /></button>
                      <button onClick={() => handleResetPw(user.id, user.name)} title="비밀번호 초기화" className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded"><FiKey size={14} /></button>
                      <button onClick={() => toggleActive(user)} title={user.is_active ? '비활성화' : '활성화'} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded">
                        {user.is_active ? <FiUserX size={14} /> : <FiUserCheck size={14} />}
                      </button>
                      <button onClick={() => handleDelete(user.id, user.name)} title="삭제" className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><FiTrash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-slate-800 mb-5">사용자 정보 수정</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">이름</label>
                <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">부서</label>
                  <input value={editForm.department} onChange={e => setEditForm({ ...editForm, department: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">직급</label>
                  <input value={editForm.position} onChange={e => setEditForm({ ...editForm, position: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">전화번호</label>
                <input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">권한</label>
                <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white">
                  <option value="user">일반 사용자</option>
                  <option value="admin">관리자</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditUser(null)} className="flex-1 py-2.5 border border-slate-300 text-slate-600 rounded-lg text-sm hover:bg-slate-50">취소</button>
              <button onClick={handleSave} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
