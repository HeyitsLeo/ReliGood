'use client'
import { useState, useRef, type FormEvent } from 'react'
import { trpc } from '@/lib/trpc'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001'

interface ProductForm {
  title: string
  description: string
  category: string
  priceZmw: string
  tags: string
  inStock: boolean
  imageUrls: string[]
}

const emptyForm: ProductForm = {
  title: '',
  description: '',
  category: '',
  priceZmw: '',
  tags: '',
  inStock: true,
  imageUrls: [],
}

export default function ProductsPage() {
  const utils = trpc.useUtils()
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStock, setFilterStock] = useState<string>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [imageUrlInput, setImageUrlInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: products, isLoading } = trpc.products.list.useQuery({
    search: search || undefined,
    category: filterCategory || undefined,
    inStock: filterStock === '' ? undefined : filterStock === 'true',
  })

  const createMut = trpc.products.create.useMutation({
    onSuccess: () => { utils.products.list.invalidate(); closeModal() },
  })
  const updateMut = trpc.products.update.useMutation({
    onSuccess: () => { utils.products.list.invalidate(); closeModal() },
  })
  const deleteMut = trpc.products.delete.useMutation({
    onSuccess: () => utils.products.list.invalidate(),
  })
  const toggleMut = trpc.products.toggleStock.useMutation({
    onSuccess: () => utils.products.list.invalidate(),
  })
  const deleteAllMut = trpc.products.deleteAll.useMutation({
    onSuccess: () => utils.products.list.invalidate(),
  })

  // Collect unique categories for filter dropdown
  const categories = [...new Set((products ?? []).map((p) => p.category).filter(Boolean))]

  function openCreate() {
    setEditId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(product: any) {
    setEditId(product.id)
    setForm({
      title: product.title,
      description: product.description || '',
      category: product.category || '',
      priceZmw: product.priceZmw ? String(Number(product.priceZmw)) : '',
      tags: (product.tags || []).join(', '),
      inStock: product.inStock ?? true,
      imageUrls: product.imageUrls || [],
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditId(null)
    setForm(emptyForm)
    setImageUrlInput('')
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    setUploadError('')
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch(`${API_URL}/api/upload/product-image`, {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()
        if (res.ok) {
          setForm((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, data.url] }))
        } else {
          setUploadError(data.error || `Upload failed for ${file.name}`)
        }
      }
    } catch (err: any) {
      setUploadError(`Network error: ${err.message || 'Cannot reach server'}`)
    } finally {
      setUploading(false)
    }
  }

  function addImageUrl() {
    const url = imageUrlInput.trim()
    if (!url) return
    setForm((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, url] }))
    setImageUrlInput('')
  }

  function removeImage(idx: number) {
    setForm((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== idx),
    }))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const payload = {
      title: form.title,
      description: form.description || undefined,
      category: form.category || undefined,
      priceZmw: Number(form.priceZmw),
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      inStock: form.inStock,
      imageUrls: form.imageUrls,
    }

    if (editId) {
      updateMut.mutate({ id: editId, data: payload })
    } else {
      createMut.mutate(payload)
    }
  }

  const isSaving = createMut.isPending || updateMut.isPending

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (confirm('Delete ALL products? This cannot be undone.')) deleteAllMut.mutate()
            }}
            disabled={deleteAllMut.isPending}
            className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-50"
          >
            Delete All
          </button>
          <button
            onClick={openCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
          >
            + New Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-slate-300 rounded px-3 py-1.5 text-sm flex-1 max-w-xs"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border border-slate-300 rounded px-3 py-1.5 text-sm"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c!}>{c}</option>
          ))}
        </select>
        <select
          value={filterStock}
          onChange={(e) => setFilterStock(e.target.value)}
          className="border border-slate-300 rounded px-3 py-1.5 text-sm"
        >
          <option value="">All Stock</option>
          <option value="true">In Stock</option>
          <option value="false">Out of Stock</option>
        </select>
      </div>

      {/* Product Table */}
      {isLoading ? (
        <p className="text-slate-500">Loading...</p>
      ) : !products || products.length === 0 ? (
        <p className="text-slate-500">No products found. Click &quot;+ New Product&quot; to add one.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="p-2">Image</th>
              <th className="p-2">Title</th>
              <th className="p-2">Category</th>
              <th className="p-2">Price (ZMW)</th>
              <th className="p-2">Stock</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-slate-200">
                <td className="p-2">
                  {p.imageUrls && p.imageUrls[0] ? (
                    <img
                      src={p.imageUrls[0]}
                      alt={p.title}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-slate-200 rounded flex items-center justify-center text-slate-400 text-xs">
                      No img
                    </div>
                  )}
                </td>
                <td className="p-2 font-medium">{p.title}</td>
                <td className="p-2 text-slate-600">{p.category || '-'}</td>
                <td className="p-2">{p.priceZmw ? Number(p.priceZmw).toFixed(2) : '-'}</td>
                <td className="p-2">
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${
                      p.inStock
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {p.inStock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </td>
                <td className="p-2">
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(p)}
                      className="bg-slate-200 text-slate-700 text-xs px-2 py-1 rounded hover:bg-slate-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleMut.mutate(p.id)}
                      disabled={toggleMut.isPending}
                      className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded hover:bg-yellow-200 disabled:opacity-50"
                    >
                      {p.inStock ? 'Delist' : 'Relist'}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${p.title}"?`)) deleteMut.mutate(p.id)
                      }}
                      disabled={deleteMut.isPending}
                      className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded hover:bg-red-200 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-bold mb-4">
              {editId ? 'Edit Product' : 'New Product'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                <input
                  id="product-title"
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  id="product-description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <input
                    id="product-category"
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm"
                    placeholder="e.g. Electronics"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price (ZMW) *</label>
                  <input
                    id="product-price"
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={form.priceZmw}
                    onChange={(e) => setForm({ ...form, priceZmw: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm"
                  placeholder="e.g. phone, samsung, android"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.inStock}
                  onChange={(e) => setForm({ ...form, inStock: e.target.checked })}
                  id="inStock"
                />
                <label htmlFor="inStock" className="text-sm text-slate-700">In Stock</label>
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Images</label>
                {/* Upload */}
                <div
                  className="border-2 border-dashed border-slate-300 rounded p-4 text-center cursor-pointer hover:border-blue-400 transition mb-2"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); handleUpload(e.dataTransfer.files) }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleUpload(e.target.files)}
                  />
                  <p className="text-sm text-slate-500">
                    {uploading ? 'Uploading...' : 'Click or drag images here to upload'}
                  </p>
                </div>
                {uploadError && (
                  <p className="text-sm text-red-600 mb-2">{uploadError}</p>
                )}
                {/* URL input */}
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Or paste image URL..."
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    className="flex-1 border border-slate-300 rounded px-3 py-1.5 text-sm"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addImageUrl() } }}
                  />
                  <button
                    type="button"
                    onClick={addImageUrl}
                    className="bg-slate-200 text-slate-700 px-3 py-1.5 rounded text-sm hover:bg-slate-300"
                  >
                    Add
                  </button>
                </div>
                {/* Thumbnails */}
                {form.imageUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.imageUrls.map((url, i) => (
                      <div key={i} className="relative group">
                        <img src={url} alt="" className="w-16 h-16 object-cover rounded border" />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-[10px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
