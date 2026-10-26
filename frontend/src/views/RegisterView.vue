<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { toast } from 'vue-sonner'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import FormField from '@/components/ui/FormField.vue'
import PasswordInput from '@/components/ui/PasswordInput.vue'
import { registerSchema } from '@/lib/schemas'
import { authError, safeRedirect } from '@/lib/authError'
import { inputClass, btnPrimary } from '@/lib/styles'
import { useRegister } from '@/queries/auth'

const router = useRouter()
const route = useRoute()
const { mutateAsync, isPending } = useRegister()
const serverError = ref('')

const { handleSubmit, errors, defineField, setFieldError } = useForm({
  validationSchema: toTypedSchema(registerSchema),
  initialValues: { name: '', email: '', password: '', confirmPassword: '' },
})
const [name] = defineField('name')
const [email] = defineField('email')
const [password] = defineField('password')
const [confirmPassword] = defineField('confirmPassword')

const onSubmit = handleSubmit(async (v) => {
  serverError.value = ''
  try {
    const res = await mutateAsync(v)
    toast.success(`Akun dibuat. Selamat datang, ${res.user.name}`)
    router.replace(safeRedirect(route.query.redirect))
  } catch (e) {
    const msg = authError(e, { 409: 'Email sudah terdaftar.' })
    if (msg === 'Email sudah terdaftar.') setFieldError('email', msg)
    else serverError.value = msg
  }
})
</script>

<template>
  <AuthLayout title="Buat Akun" subtitle="Mulai kelola tugas dan keuangan Anda dengan pengingat WhatsApp.">
    <form class="flex flex-col gap-space-md" novalidate @submit.prevent="onSubmit">
      <p v-if="serverError" class="rounded-lg bg-error-container/30 text-error px-3 py-2 font-body-sm text-body-sm">{{ serverError }}</p>
      <FormField label="Nama Lengkap" :error="errors.name">
        <input v-model="name" autocomplete="name" placeholder="Nama Anda" :class="inputClass" />
      </FormField>
      <FormField label="Email" :error="errors.email">
        <input v-model="email" type="email" autocomplete="email" placeholder="nama@email.com" :class="inputClass" />
      </FormField>
      <FormField label="Kata Sandi" :error="errors.password">
        <PasswordInput v-model="password" autocomplete="new-password" placeholder="Minimal 8 karakter" />
        <p v-if="!errors.password" class="font-label-sm text-label-sm text-outline">Minimal 8 karakter, kombinasi huruf dan angka.</p>
      </FormField>
      <FormField label="Ulangi Kata Sandi" :error="errors.confirmPassword">
        <PasswordInput v-model="confirmPassword" autocomplete="new-password" placeholder="Ketik ulang kata sandi" />
      </FormField>
      <button type="submit" :disabled="isPending" :class="[btnPrimary, 'mt-space-xs w-full py-2.5']">{{ isPending ? 'Memproses...' : 'Daftar' }}</button>
    </form>
    <template #footer>
      Sudah punya akun? <RouterLink :to="{ name: 'masuk', query: route.query }" class="text-primary hover:underline font-medium">Masuk</RouterLink>
    </template>
  </AuthLayout>
</template>
