<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { toast } from 'vue-sonner'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import FormField from '@/components/ui/FormField.vue'
import PasswordInput from '@/components/ui/PasswordInput.vue'
import { loginSchema } from '@/lib/schemas'
import { authError, safeRedirect } from '@/lib/authError'
import { inputClass, btnPrimary } from '@/lib/styles'
import { useLogin } from '@/queries/auth'

const router = useRouter()
const route = useRoute()
const { mutateAsync, isPending } = useLogin()
const serverError = ref('')

const { handleSubmit, errors, defineField } = useForm({
  validationSchema: toTypedSchema(loginSchema),
  initialValues: { email: '', password: '' },
})
const [email] = defineField('email')
const [password] = defineField('password')

const onSubmit = handleSubmit(async (v) => {
  serverError.value = ''
  try {
    const res = await mutateAsync(v)
    toast.success(`Selamat datang, ${res.user.name}`)
    router.replace(safeRedirect(route.query.redirect))
  } catch (e) {
    serverError.value = authError(e, { 401: 'Email atau kata sandi salah.' })
  }
})
</script>

<template>
  <AuthLayout title="Masuk" subtitle="Lanjutkan ke tugas dan catatan keuangan Anda.">
    <form class="flex flex-col gap-space-md" novalidate @submit.prevent="onSubmit">
      <p v-if="serverError" class="border-2 border-error bg-white text-error font-medium px-3 py-2 font-body-sm text-body-sm">{{ serverError }}</p>
      <FormField label="Email" :error="errors.email">
        <input v-model="email" type="email" autocomplete="email" placeholder="nama@email.com" :class="inputClass" />
      </FormField>
      <FormField label="Kata Sandi" :error="errors.password">
        <PasswordInput v-model="password" autocomplete="current-password" placeholder="Kata sandi Anda" />
      </FormField>
      <button type="submit" :disabled="isPending" :class="[btnPrimary, 'mt-space-xs w-full py-2.5']">{{ isPending ? 'Memproses...' : 'Masuk' }}</button>
    </form>
    <template #footer>
      Belum punya akun? <RouterLink :to="{ name: 'daftar', query: route.query }" class="text-primary hover:underline font-medium">Daftar</RouterLink>
    </template>
  </AuthLayout>
</template>
