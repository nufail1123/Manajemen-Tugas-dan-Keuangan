<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { DropdownMenuRoot, DropdownMenuTrigger, DropdownMenuPortal, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator } from 'reka-ui'
import { ChevronDown, LogOut, Trash2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import PasswordInput from '@/components/ui/PasswordInput.vue'
import { useAuthStore } from '@/stores/auth'
import { useDeleteAccount, useLogout } from '@/queries/auth'
import { authError } from '@/lib/authError'

const auth = useAuthStore()
const router = useRouter()
const logout = useLogout()
const deleteAccount = useDeleteAccount()

const logoutOpen = ref(false)
const deleteOpen = ref(false)
const password = ref('')
const deleteError = ref('')
watch(deleteOpen, (v) => { if (v) { password.value = ''; deleteError.value = '' } })

async function onLogout() {
  await logout.mutateAsync()
  logoutOpen.value = false
  toast.success('Anda telah keluar')
  router.replace('/masuk')
}
async function onDelete() {
  deleteError.value = ''
  try {
    await deleteAccount.mutateAsync(password.value)
    deleteOpen.value = false
    toast.success('Akun Anda telah dihapus')
    router.replace('/daftar')
  } catch (e) {
    deleteError.value = authError(e, { 403: 'Kata sandi salah.' })
  }
}
const item = 'flex items-center gap-2 px-3 py-2 font-body-md text-body-md font-medium cursor-pointer outline-none select-none'
</script>

<template>
  <!-- modal=false: dialog konfirmasi bisa dibuka dari item menu tanpa bentrok fokus -->
  <DropdownMenuRoot :modal="false">
    <DropdownMenuTrigger
      class="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border-2 border-ink bg-white shadow-hard-sm hover:bg-accent hover:-translate-y-0.5 hover:shadow-hard transition-all focus:outline-none data-[state=open]:bg-accent"
      title="Profil"
    >
      <span class="w-7 h-7 rounded-full border-2 border-ink bg-primary text-white font-label-sm text-label-sm font-bold flex items-center justify-center">
        {{ auth.initials }}
      </span>
      <span class="hidden sm:block max-w-[9rem] truncate font-body-sm text-body-sm text-on-surface">{{ auth.user?.name }}</span>
      <ChevronDown :size="16" class="text-on-surface" />
    </DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent align="end" :side-offset="8" class="z-[60] min-w-[14rem] border-2 border-ink bg-white p-1.5 shadow-hard data-[state=open]:animate-pop">
        <DropdownMenuLabel class="px-3 py-2">
          <div class="font-body-md text-body-md font-semibold text-on-surface truncate">{{ auth.user?.name }}</div>
          <div class="font-label-sm text-label-sm text-on-surface-variant truncate">{{ auth.user?.email }}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator class="my-1 h-0.5 bg-ink" />
        <DropdownMenuItem :class="[item, 'text-on-surface data-[highlighted]:bg-accent']" @select="logoutOpen = true">
          <LogOut :size="16" /> Keluar
        </DropdownMenuItem>
        <DropdownMenuItem :class="[item, 'text-error data-[highlighted]:bg-error data-[highlighted]:text-white']" @select="deleteOpen = true">
          <Trash2 :size="16" /> Hapus Akun
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>

  <ConfirmDialog
    v-model:open="logoutOpen" :icon="LogOut" title="Yakin ingin keluar?"
    description="Anda perlu masuk lagi untuk membuka tugas dan catatan keuangan Anda."
    confirm-label="Ya, keluar" :loading="logout.isPending.value" @confirm="onLogout"
  />

  <ConfirmDialog
    v-model:open="deleteOpen" danger :icon="Trash2" title="Hapus akun secara permanen?"
    description="Seluruh tugas, transaksi, tagihan, dan pengaturan WhatsApp Anda akan dihapus dan tidak bisa dikembalikan."
    confirm-label="Ya, hapus akun" :loading="deleteAccount.isPending.value" :confirm-disabled="!password" @confirm="onDelete"
  >
    <label class="font-label-sm text-label-sm text-on-surface-variant font-medium">Masukkan kata sandi untuk melanjutkan</label>
    <PasswordInput v-model="password" autocomplete="current-password" placeholder="Kata sandi Anda" @keydown.enter="password && onDelete()" />
    <p v-if="deleteError" class="font-body-sm text-body-sm text-error">{{ deleteError }}</p>
  </ConfirmDialog>
</template>
