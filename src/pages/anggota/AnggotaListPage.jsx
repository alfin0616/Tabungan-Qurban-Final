import { useMemo, useRef, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Search, Upload, Download, Users, Building2, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  useAnggotaList,
  useCreateAnggota,
  useUpdateAnggota,
  useDeleteAnggota,
  useImportAnggota,
} from '../../hooks/useAnggota'
import { useInstansiSelect } from '../../hooks/useInstansi'
import { useKelompokSelect } from '../../hooks/useKelompok'
import { exportAnggotaToExcel } from '../../repositories/anggotaRepository'
import { useAuth } from '../../context/AuthContext'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import Avatar from '../../components/ui/Avatar'
import Modal from '../../components/modal/Modal'
import ConfirmModal from '../../components/modal/ConfirmModal'
import AnggotaTable from '../../components/tables/AnggotaTable'
import AnggotaForm from '../../components/forms/AnggotaForm'

export default function AnggotaListPage() {
  const { user, profile, anggotaSaya, isAdmin, isSuperAdmin, isJamaah } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const jamaahInstansiId = anggotaSaya?.instansi_id || profile?.instansi_id || ''
  const jamaahKelompokId = anggotaSaya?.kelompok_id || profile?.kelompok_id || ''

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('semua')
  const [instansiId, setInstansiId] = useState(
    () => searchParams.get('instansi_id') || jamaahInstansiId || '',
  )
  const [kelompokId, setKelompokId] = useState(
    () => searchParams.get('kelompok_id') || jamaahKelompokId || '',
  )
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (isJamaah) {
      if (jamaahInstansiId && instansiId !== jamaahInstansiId) {
        setInstansiId(jamaahInstansiId)
      }
      if (jamaahKelompokId && !kelompokId) {
        setKelompokId(jamaahKelompokId)
      }
      return
    }
    const paramInst = searchParams.get('instansi_id') || ''
    const paramKel = searchParams.get('kelompok_id') || ''
    if (paramInst !== instansiId) setInstansiId(paramInst)
    if (paramKel !== kelompokId) setKelompokId(paramKel)
  }, [searchParams, isJamaah, jamaahInstansiId, jamaahKelompokId])

  const effectiveInstansiId = isJamaah ? jamaahInstansiId || instansiId : instansiId
  const effectiveKelompokId = isJamaah ? kelompokId || jamaahKelompokId : kelompokId

  const { data: instansiList } = useInstansiSelect()
  const { data: kelompokList } = useKelompokSelect(effectiveInstansiId || null)

  const filters = useMemo(
    () => ({
      search,
      status,
      instansi_id: effectiveInstansiId || null,
      kelompok_id: effectiveKelompokId || null,
      page,
      pageSize: isJamaah ? 20 : 10,
    }),
    [search, status, effectiveInstansiId, effectiveKelompokId, page, isJamaah],
  )
  const { data, isLoading, isFetching } = useAnggotaList(filters)

  const activeKelompokObj = useMemo(() => {
    if (!effectiveKelompokId) return anggotaSaya?.kelompok || profile?.kelompok || null
    const found = (kelompokList || []).find((k) => k.id === effectiveKelompokId)
    return found || anggotaSaya?.kelompok || profile?.kelompok || null
  }, [effectiveKelompokId, kelompokList, anggotaSaya, profile])

  const tableRows = useMemo(() => {
    const rawRows = Array.isArray(data?.data) ? [...data.data] : []
    if (
      isJamaah &&
      anggotaSaya &&
      (!effectiveKelompokId || anggotaSaya.kelompok_id === effectiveKelompokId)
    ) {
      const exists = rawRows.some((r) => r.id === anggotaSaya.id)
      if (!exists) {
        rawRows.unshift({
          ...anggotaSaya,
          instansi: anggotaSaya.instansi || profile?.instansi || null,
          kelompok: activeKelompokObj || anggotaSaya.kelompok || null,
        })
      }
    }
    return rawRows
  }, [data?.data, isJamaah, anggotaSaya, effectiveKelompokId, profile, activeKelompokObj])

  const createMutation = useCreateAnggota()
  const updateMutation = useUpdateAnggota()
  const deleteMutation = useDeleteAnggota()
  const importMutation = useImportAnggota()

  async function handleSubmit(values) {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload: values })
        toast.success('Data anggota diperbarui')
      } else {
        await createMutation.mutateAsync(values)
        toast.success('Anggota baru berhasil ditambahkan')
      }
      setModalOpen(false)
      setEditing(null)
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan data anggota')
    }
  }

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync(deleting.id)
      toast.success('Anggota berhasil dihapus')
      setDeleting(null)
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus anggota')
    }
  }

  async function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const imported = await importMutation.mutateAsync(file)
      toast.success(`${imported.length} anggota berhasil diimpor`)
    } catch (err) {
      toast.error(err.message || 'Gagal mengimpor file')
    } finally {
      e.target.value = ''
    }
  }

  async function handleExport() {
    try {
      await exportAnggotaToExcel(tableRows)
    } catch {
      toast.error('Gagal mengekspor data')
    }
  }

  function updateUrlParams(nextInstansi, nextKelompok) {
    const params = {}
    if (nextInstansi) params.instansi_id = nextInstansi
    if (nextKelompok) params.kelompok_id = nextKelompok
    setSearchParams(params)
  }

  const maxSlots =
    activeKelompokObj?.maksimal_anggota ||
    (activeKelompokObj?.jenis_qurban === 'kambing' ? 1 : 7)

  return (
    <div className="space-y-4">
      {/* Banner Daftar Nama Anggota Kelompok (Tampil otomatis untuk Jamaah atau saat filter Kelompok dipilih) */}
      {(isJamaah || effectiveKelompokId) && activeKelompokObj && (
        <div className="rounded-2xl border border-emerald-500/25 bg-surface dark:bg-surface-dark p-5 shadow-argon">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border dark:border-border-dark pb-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-soft">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    {isJamaah ? 'Kelompok Qurban Saya' : 'Detail Kelompok Qurban'}
                  </span>
                  {activeKelompokObj.kode_kelompok && (
                    <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-mono text-xs font-semibold text-ink-muted dark:text-ink-muted-dark">
                      {activeKelompokObj.kode_kelompok}
                    </span>
                  )}
                  <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-bold uppercase text-amber-700 dark:text-amber-400">
                    {activeKelompokObj.jenis_qurban === 'kambing' ? 'Kambing (1 Orang)' : `Sapi (Maks ${maxSlots} Orang)`}
                  </span>
                </div>
                <h2 className="mt-1 text-lg font-extrabold text-ink dark:text-ink-dark">
                  {activeKelompokObj.nama_kelompok}
                </h2>
                {(anggotaSaya?.instansi?.nama_instansi || profile?.instansi?.nama_instansi) && (
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-ink-muted dark:text-ink-muted-dark">
                    <Building2 className="h-3.5 w-3.5 text-emerald-600" />
                    {anggotaSaya?.instansi?.nama_instansi || profile?.instansi?.nama_instansi}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-center">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/70 dark:bg-emerald-950/40 px-4 py-2 text-right">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  Terisi
                </p>
                <p className="text-base font-extrabold text-emerald-800 dark:text-emerald-200">
                  {tableRows.length} / {maxSlots} Anggota
                </p>
              </div>
            </div>
          </div>

          {/* Grid Nama-Nama Anggota di Kelompok Ini */}
          <div className="mt-4">
            <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-muted-dark">
              Daftar Nama Anggota di Kelompok {activeKelompokObj.nama_kelompok}:
            </p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: Math.max(maxSlots, tableRows.length) }).map((_, idx) => {
                const member = tableRows[idx]
                const isSelf =
                  member &&
                  ((anggotaSaya?.id && member.id === anggotaSaya.id) ||
                    (user?.id && member.user_id && member.user_id === user.id))
                if (member) {
                  return (
                    <div
                      key={member.id}
                      className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
                        isSelf
                          ? 'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/50 shadow-sm'
                          : 'border-border dark:border-border-dark bg-bg/60 dark:bg-bg-dark/60'
                      }`}
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600/15 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        {idx + 1}
                      </div>
                      <Avatar src={member.foto} name={member.nama} size={32} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-xs font-bold text-ink dark:text-ink-dark">
                            {member.nama}
                          </p>
                          {isSelf && (
                            <span className="shrink-0 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                              Anda
                            </span>
                          )}
                        </div>
                        <p className="truncate font-mono text-[11px] text-ink-muted dark:text-ink-muted-dark">
                          {member.kode_anggota || 'Anggota Aktif'}
                        </p>
                      </div>
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  )
                }

                return (
                  <div
                    key={`empty-slot-${idx}`}
                    className="flex items-center gap-3 rounded-xl border border-dashed border-border dark:border-border-dark bg-bg/25 dark:bg-bg-dark/25 p-3 opacity-65"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-200/70 dark:bg-slate-800 font-mono text-xs font-bold text-ink-muted dark:text-ink-muted-dark">
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium italic text-ink-muted dark:text-ink-muted-dark">
                        Slot Anggota #{idx + 1} Kosong
                      </p>
                      <p className="text-[10px] text-ink-muted/70 dark:text-ink-muted-dark/70">
                        Menunggu jamaah bergabung
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {isJamaah
              ? `Tabel Anggota Kelompok ${activeKelompokObj?.nama_kelompok || 'Saya'}`
              : 'Data & Monitoring Anggota'}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleImport}
                />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4" /> Import Excel
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4" /> Export Excel
            </Button>
            {isAdmin && (
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null)
                  setModalOpen(true)
                }}
              >
                <Plus className="h-4 w-4" /> Tambah Anggota
              </Button>
            )}
          </div>
        </CardHeader>

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted dark:text-ink-muted-dark" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Cari nama anggota atau kode anggota..."
              className="h-10 w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark pl-9 pr-3 text-sm text-ink dark:text-ink-dark placeholder:text-ink-muted/60 dark:placeholder:text-ink-muted-dark/60 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {isSuperAdmin && (
            <Select
              value={instansiId}
              onChange={(e) => {
                const nextInst = e.target.value
                setInstansiId(nextInst)
                setKelompokId('')
                setPage(1)
                updateUrlParams(nextInst, '')
              }}
              options={[
                { value: '', label: 'Semua Instansi' },
                ...(instansiList || []).map((inst) => ({
                  value: inst.id,
                  label: `${inst.nama_instansi} (${inst.kode_instansi})`,
                })),
              ]}
            />
          )}

          {!isJamaah && (
            <Select
              value={kelompokId}
              onChange={(e) => {
                const nextKel = e.target.value
                setKelompokId(nextKel)
                setPage(1)
                updateUrlParams(instansiId, nextKel)
              }}
              options={[
                { value: '', label: 'Semua Kelompok' },
                ...(kelompokList || []).map((kel) => ({
                  value: kel.id,
                  label: `${kel.nama_kelompok} (${kel.kode_kelompok})`,
                })),
              ]}
            />
          )}

          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
            options={[
              { value: 'semua', label: 'Semua Status' },
              { value: 'aktif', label: 'Aktif' },
              { value: 'tidak_aktif', label: 'Tidak Aktif' },
            ]}
          />
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner />
          </div>
        ) : !tableRows.length ? (
          <EmptyState
            icon={Users}
            title="Belum ada data anggota"
            description="Tambahkan anggota baru atau ubah filter pencarian instansi/kelompok."
          />
        ) : (
          <>
            <div className={isFetching ? 'opacity-60 transition-opacity' : ''}>
              <AnggotaTable
                data={tableRows}
                isAdmin={isAdmin}
                currentAnggotaId={anggotaSaya?.id}
                currentUserId={user?.id}
                onEdit={(a) => {
                  setEditing(a)
                  setModalOpen(true)
                }}
                onDelete={setDeleting}
                onToggleStatus={async (a) => {
                  try {
                    await updateMutation.mutateAsync({ id: a.id, status: !a.status })
                    toast.success('Status anggota diperbarui')
                  } catch {
                    toast.error('Gagal memperbarui status')
                  }
                }}
              />
            </div>
            <div className="mt-4">
              <Pagination
                page={data?.page || 1}
                totalPages={data?.totalPages || 1}
                totalItems={Math.max(data?.count || 0, tableRows.length)}
                pageSize={data?.pageSize || 10}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        title={editing ? 'Edit Anggota' : 'Tambah Anggota'}
        size="lg"
      >
        <AnggotaForm
          key={editing?.id ?? 'new'}
          anggotaId={editing?.id}
          defaultValues={editing ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => {
            setModalOpen(false)
            setEditing(null)
          }}
          submitLabel={editing ? 'Simpan Perubahan' : 'Tambah Anggota'}
        />
      </Modal>

      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Hapus Anggota"
        description={`Yakin ingin menghapus ${deleting?.nama}? Data tabungan dan riwayat transaksi terkait akan ikut terhapus.`}
        confirmLabel="Ya, Hapus"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
