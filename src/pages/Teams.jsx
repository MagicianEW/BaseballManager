import { useState, useEffect, useRef } from 'react'
import { api } from '../utils/api'
import { useAuth } from '../context/AuthContext'

function Teams() {
  const { canWrite } = useAuth()
  const [teams, setTeams] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', stadium: '', logo: '' })
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => { loadTeams() }, [])

  const loadTeams = async () => {
    const data = await api.teams.getAll()
    setTeams(data)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canWrite('teams')) return
    if (editing) {
      await api.teams.update(editing.id, form)
    } else {
      await api.teams.create(form)
    }
    resetForm()
    loadTeams()
  }

  const resetForm = () => {
    setForm({ name: '', stadium: '', logo: '' })
    setPreviewUrl(null)
    setEditing(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (id) => {
    if (!canWrite('teams')) return
    if (confirm('确定删除？')) {
      await api.teams.delete(id)
      loadTeams()
    }
  }

  const startEdit = (team) => {
    if (!canWrite('teams')) return
    setEditing(team)
    setForm({ name: team.name, stadium: team.stadium, logo: team.logo || '' })
    setPreviewUrl(team.logo ? `http://localhost:3001${team.logo}` : null)
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // 预览本地图片
    const localPreviewUrl = URL.createObjectURL(file)
    setPreviewUrl(localPreviewUrl)

    // 上传到服务器
    setUploading(true)
    try {
      const result = await api.upload.uploadTeamLogo(file)
      setForm({ ...form, logo: result.url })
    } catch (error) {
      alert('上传失败: ' + error.message)
      setPreviewUrl(null)
    } finally {
      setUploading(false)
    }
  }

  const getLogoUrl = (logo) => {
    if (!logo) return null
    if (logo.startsWith('http')) return logo
    return `http://localhost:3001${logo}`
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">球队管理</h1>

      {canWrite('teams') && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">球队名称</label>
              <input
                type="text"
                placeholder="输入球队名称"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="border p-2 rounded w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">主场球场</label>
              <input
                type="text"
                placeholder="输入主场球场"
                value={form.stadium}
                onChange={e => setForm({ ...form, stadium: e.target.value })}
                className="border p-2 rounded w-full"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">队徽图片</label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                className="border p-2 rounded"
                disabled={uploading}
              />
              {uploading && <span className="text-blue-600">上传中...</span>}
            </div>

            {previewUrl && (
              <div className="mt-4">
                <img
                  src={previewUrl}
                  alt="队徽预览"
                  className="w-24 h-24 object-contain border rounded"
                />
                <p className="text-sm text-gray-500 mt-1">预览</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-2">
            <button
              type="submit"
              className="bg-green-800 text-white px-4 py-2 rounded hover:bg-green-700"
              disabled={uploading}
            >
              {editing ? '更新' : '添加'}球队
            </button>
            {editing && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                取消
              </button>
            )}
          </div>
        </form>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {teams.map(team => (
          <div key={team.id} className="bg-white p-4 rounded shadow">
            <div className="flex items-center gap-4 mb-2">
              {team.logo ? (
                <img
                  src={getLogoUrl(team.logo)}
                  alt={team.name}
                  className="w-16 h-16 object-contain"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-2xl">
                  ⚾
                </div>
              )}
              <div>
                <h2 className="font-bold text-lg">{team.name}</h2>
                <p className="text-gray-600 text-sm">{team.stadium || '未设置主场'}</p>
              </div>
            </div>
            {canWrite('teams') && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => startEdit(team)}
                  className="text-blue-600 text-sm hover:text-blue-800"
                >
                  编辑
                </button>
                <button
                  onClick={() => handleDelete(team.id)}
                  className="text-red-600 text-sm hover:text-red-800"
                >
                  删除
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {teams.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          {canWrite('teams') ? '暂无球队，点击上方按钮添加' : '暂无球队数据'}
        </div>
      )}
    </div>
  )
}

export default Teams