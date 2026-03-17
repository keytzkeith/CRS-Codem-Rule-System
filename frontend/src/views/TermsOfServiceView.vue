<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <div class="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div class="rounded-[28px] border border-white/10 bg-slate-900/85 p-6 shadow-2xl shadow-black/20 sm:p-8 lg:p-10">
        <div class="mb-8 border-b border-white/10 pb-6">
          <p class="crs-eyebrow">Legal</p>
          <h1 class="mt-3 text-3xl font-semibold text-white sm:text-4xl">Terms of use</h1>
          <p class="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            These terms govern access to {{ siteIdentity.productName }}. They are a solid working
            starting point for the current product, but they should be reviewed before a public
            launch on a live domain.
          </p>
          <p class="mt-4 text-sm text-slate-400">Last updated: {{ lastUpdated }}</p>
        </div>

        <div class="space-y-8 text-sm leading-7 text-slate-300 sm:text-base">
          <section>
            <h2 class="text-xl font-semibold text-white">1. Agreement</h2>
            <p class="mt-3">
              By creating an account, accessing the app, or using the documentation, you agree to
              these terms. If you do not agree, do not use the service.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white">2. Product scope</h2>
            <p class="mt-3">
              {{ siteIdentity.productName }} is a journaling, analytics, and review tool for trade
              records and related workflow data. It is not a brokerage, exchange, custodian, or
              investment advisory service.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white">3. No financial advice</h2>
            <p class="mt-3">
              CRS is provided for record-keeping, review, and operational insight. Nothing in the
              app, docs, dashboards, or analytics should be treated as financial, legal, tax, or
              investment advice.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white">4. User responsibilities</h2>
            <ul class="mt-3 list-disc space-y-2 pl-5">
              <li>Provide accurate information where reasonably required.</li>
              <li>Keep your credentials secure.</li>
              <li>Use the service lawfully and without abusing shared infrastructure.</li>
              <li>Review imported data before relying on it for performance analysis.</li>
              <li>Maintain your own records and backups where necessary.</li>
            </ul>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white">5. Availability and changes</h2>
            <p class="mt-3">
              CRS may evolve over time. Features may be added, changed, limited, or removed. Access
              may be suspended temporarily for maintenance, operational issues, or security reasons.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white">6. Self-hosted use</h2>
            <p class="mt-3">
              If you self-host CRS, you are responsible for deployment, backups, data retention,
              email configuration, third-party services, and access control for your instance.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white">7. Acceptable use</h2>
            <ul class="mt-3 list-disc space-y-2 pl-5">
              <li>Do not attempt to disrupt, overload, or compromise the service.</li>
              <li>Do not use the service for unlawful activity.</li>
              <li>Do not upload harmful files, deceptive records, or abusive content.</li>
              <li>Do not attempt to access data that does not belong to you.</li>
            </ul>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white">8. Limitation of liability</h2>
            <p class="mt-3">
              CRS is provided on an “as is” and “as available” basis. To the extent allowed by
              applicable law, the service owner is not liable for trading losses, missed
              opportunities, data loss, downtime, or indirect damages arising from use of the
              product.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white">9. Termination</h2>
            <p class="mt-3">
              Access may be suspended or terminated for abuse, misuse, security concerns, or
              operational necessity. Users may also stop using the service at any time.
            </p>
          </section>

          <section class="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
            <h2 class="text-xl font-semibold text-white">10. Contact and launch guidance</h2>
            <p class="mt-3">
              For questions about these terms, contact
              <a
                class="ml-1 text-amber-300 transition hover:text-amber-200"
                :href="`mailto:${siteIdentity.contact.supportEmail}`"
              >
                {{ siteIdentity.contact.supportEmail }}
              </a>.
            </p>
            <p class="mt-3 text-sm text-slate-400">
              Before public launch, replace placeholder domains, verify your real support email,
              and review these terms against the laws and compliance requirements that apply to your
              deployment.
            </p>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import siteIdentity from '../../../config/siteIdentity.json'

const lastUpdated = 'March 16, 2026'

onMounted(() => {
  document.title = `Terms of use | ${siteIdentity.shortProductName}`

  const metaDescription = document.querySelector('meta[name="description"]')
  if (metaDescription) {
    metaDescription.setAttribute(
      'content',
      `${siteIdentity.shortProductName} terms of use covering access, responsibilities, self-hosting, and service limitations.`
    )
  }

  let canonical = document.querySelector('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.setAttribute('rel', 'canonical')
    document.head.appendChild(canonical)
  }
  canonical.setAttribute('href', siteIdentity.urls.terms)
})
</script>
