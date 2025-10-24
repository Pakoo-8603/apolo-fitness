// src/stores/workspace.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api/services'
import { system as apiSystem } from '@/api/http' // helpers para set headers + localStorage

export const useWorkspaceStore = defineStore('workspace', () => {
  const empresaId = ref(null)
  const empresaNombre = ref('')
  const sucursalId = ref(null)
  const sucursalNombre = ref('')
  const rol = ref(null)
  const isSuperuser = ref(false)
  const initialized = ref(false)

  const sucursales = ref([])

  async function initFromLocalStorageOrProfile () {
    // 1) Intentar leer del localStorage (http.js ya expone getters via headers)
    try {
      // apiSystem no tiene getters; pero el interceptor ya leerá de localStorage
      // aquí sólo vamos a intentar poblar nombres consultando si tenemos ids
      const { data: pr } = await api.accounts.perfil()
      isSuperuser.value = !!(pr?.is_superuser || pr?.is_staff)
      rol.value = pr?.rol_activo || pr?.rol || null

      // Preferimos lo que venga en localStorage (porque el usuario pudo cambiar)
      // y usamos el perfil como fallback de nombres si coinciden
      const empLS = localStorage.getItem('agora.empresa')
      const sucLS = localStorage.getItem('agora.sucursal')

      // empresa
      if (empLS) {
        empresaId.value = Number(empLS)
        apiSystem.setEmpresa(empresaId.value)
      } else {
        const emp = pr?.empresa_activa || pr?.empresa
        empresaId.value = emp?.id ?? null
        apiSystem.setEmpresa(empresaId.value)
        if (empresaId.value) localStorage.setItem('agora.empresa', String(empresaId.value))
      }

      // sucursal (opcional)
      if (sucLS) {
        sucursalId.value = Number(sucLS)
        apiSystem.setSucursal(sucursalId.value)
      } else {
        const suc = pr?.sucursal_activa || pr?.sucursal
        sucursalId.value = suc?.id ?? null
        if (sucursalId.value) {
          apiSystem.setSucursal(sucursalId.value)
          localStorage.setItem('agora.sucursal', String(sucursalId.value))
        }
      }

      // nombres de empresa/sucursal (si el perfil no coincide, se refrescarán al cargar catálogos)
      empresaNombre.value = pr?.empresa_activa?.nombre || pr?.empresa?.nombre || ''
      sucursalNombre.value = pr?.sucursal_activa?.nombre || pr?.sucursal?.nombre || ''

      await loadSucursales()
    } catch {
      // sin bloquear la app
      sucursales.value = []
    } finally {
      initialized.value = true
    }
  }

  async function ensureEmpresaSet () {
    if (!initialized.value) await initFromLocalStorageOrProfile()
  }

  async function loadSucursales () {
    if (!empresaId.value) { sucursales.value = []; return }
    try {
      const { data } = await api.sucursales.list({
        empresa: empresaId.value,
        ordering: 'nombre',
        page_size: 200,
      })
      sucursales.value = data?.results || data || []
      // si hay sucursalId pero no nombre, complétalo
      if (sucursalId.value && !sucursalNombre.value) {
        const s = sucursales.value.find(x => x.id === Number(sucursalId.value))
        if (s) sucursalNombre.value = s.nombre
      }
    } catch {
      sucursales.value = []
    }
  }

  async function changeEmpresa (newEmpresaId) {
    const idNum = newEmpresaId ? Number(newEmpresaId) : null
    if (idNum === empresaId.value) return
    empresaId.value = idNum
    apiSystem.setEmpresa(idNum)
    // persist
    if (idNum) localStorage.setItem('agora.empresa', String(idNum))
    else localStorage.removeItem('agora.empresa')

    // reset sucursal al cambiar empresa
    sucursalId.value = null
    sucursalNombre.value = ''
    localStorage.removeItem('agora.sucursal')
    apiSystem.setSucursal(null)

    // (opcional) precarga sucursales de la nueva empresa
    await loadSucursales()

    // recarga dura para que todo monte con el nuevo header/contexto:
    window.location.reload()
  }

  function changeSucursal (newSucursalId) {
    const idNum = newSucursalId ? Number(newSucursalId) : null
    if (idNum === sucursalId.value) return
    sucursalId.value = idNum
    apiSystem.setSucursal(idNum)
    if (idNum) localStorage.setItem('agora.sucursal', String(idNum))
    else localStorage.removeItem('agora.sucursal')

    // puedes querer recargar también si tu backend filtra por sucursal:
    window.location.reload()
  }

  const empresaKey = computed(() => empresaId.value || 'no-emp')
  const sucursalKey = computed(() => `${empresaKey.value}:${sucursalId.value || 'no-suc'}`)

  return {
    empresaId, empresaNombre,
    sucursalId, sucursalNombre,
    rol, isSuperuser, initialized,
    sucursales,

    empresaKey, sucursalKey,

    ensureEmpresaSet,
    loadSucursales,
    changeEmpresa,
    changeSucursal,
  }
})
