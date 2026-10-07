import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { Page, PageHeader } from '#/components/layout/page.tsx'
import { Avatar } from '#/components/ui/avatar.tsx'
import { Field, FieldDescription, FieldError, FieldLabel } from '#/components/ui/field.tsx'
import { Input } from '#/components/ui/input.tsx'
import { SubmitButton } from '#/components/ui/submit-button.tsx'
import { Textarea } from '#/components/ui/textarea.tsx'
import { toast } from '#/components/ui/toast.tsx'
import { fieldErrors } from '#/lib/form-errors.ts'
import { requireAuth } from '#/lib/guards.ts'
import { myProfileQuery, sessionQuery } from '#/lib/queries.ts'
import { SITE_NAME } from '#/lib/seo.ts'
import { updateProfile } from '#/server/functions/profiles.ts'
import { profileInput } from '#/shared/schemas.ts'

export const Route = createFileRoute('/settings')({
  beforeLoad: requireAuth,
  loader: ({ context }) => context.queryClient.ensureQueryData(myProfileQuery),
  head: () => ({ meta: [{ title: `Settings · ${SITE_NAME}` }] }),
  component: Settings,
})

function Settings() {
  const { data: me } = useSuspenseQuery(myProfileQuery)
  const router = useRouter()
  const queryClient = useQueryClient()
  const update = useServerFn(updateProfile)
  const [image, setImage] = useState(me.image ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const save = useMutation({
    mutationFn: (data: Parameters<typeof update>[0]['data']) => update({ data }),
    onSuccess: async ({ username }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: sessionQuery.queryKey }),
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
      ])
      await router.invalidate()
      toast.success('Profile saved')
      await router.navigate({ to: '/u/$username', params: { username } })
    },
    onError: (error) => toast.error('Could not save', error.message),
  })

  return (
    <Page className="max-w-2xl">
      <PageHeader title="Settings" description="How you appear on your public profile and binder." />
      <form
        noValidate
        className="flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault()
          const form = Object.fromEntries(new FormData(e.currentTarget))
          const parsed = profileInput.safeParse(form)
          if (!parsed.success) {
            setErrors(fieldErrors(parsed.error))
            return
          }
          setErrors({})
          save.mutate(parsed.data)
        }}
      >
        <div className="flex items-center gap-5">
          <Avatar name={me.name} src={image || null} size="xl" />
          <Field invalid={Boolean(errors.image)} className="flex-1">
            <FieldLabel>Photo link</FieldLabel>
            <Input
              name="image"
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://…"
            />
            <FieldDescription>Paste a link to any image. Leave empty to show your initials.</FieldDescription>
            <FieldError>{errors.image}</FieldError>
          </Field>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field invalid={Boolean(errors.name)}>
            <FieldLabel>Display name</FieldLabel>
            <Input name="name" defaultValue={me.name} autoComplete="name" />
            <FieldError>{errors.name}</FieldError>
          </Field>
          <Field invalid={Boolean(errors.username)}>
            <FieldLabel>Username</FieldLabel>
            <Input name="username" defaultValue={me.username ?? ''} autoComplete="username" />
            <FieldError>{errors.username}</FieldError>
          </Field>
        </div>
        <Field invalid={Boolean(errors.favoriteCard)}>
          <FieldLabel>Favourite card</FieldLabel>
          <Input name="favoriteCard" defaultValue={me.favoriteCard ?? ''} placeholder="Base Set Charizard" />
          <FieldError>{errors.favoriteCard}</FieldError>
        </Field>
        <Field>
          <FieldLabel>Bio</FieldLabel>
          <Textarea
            name="bio"
            defaultValue={me.bio ?? ''}
            maxLength={240}
            placeholder="Chasing every Eeveelution illustration rare."
          />
        </Field>
        <p className="text-sm text-paper-dim">Signed in as {me.email}</p>
        <div className="flex justify-end">
          <SubmitButton size="lg" disabled={save.isPending}>
            {save.isPending ? 'Saving…' : 'Save profile'}
          </SubmitButton>
        </div>
      </form>
    </Page>
  )
}
