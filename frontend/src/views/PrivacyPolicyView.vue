<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <div class="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div class="rounded-[28px] border border-white/10 bg-slate-900/85 p-6 shadow-2xl shadow-black/20 sm:p-8 lg:p-10">
        <div class="mb-8 border-b border-white/10 pb-6">
          <p class="crs-eyebrow">Legal</p>
          <h1 class="mt-3 text-3xl font-semibold text-white sm:text-4xl">Privacy policy</h1>
          <p class="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            This page explains how {{ siteIdentity.shortProductName }} handles account information,
            trade data, and operational logs. It is written for the current product and should be
            reviewed again before public launch on a live domain.
          </p>
          <p class="mt-4 text-sm text-slate-400">Last updated: {{ lastUpdated }}</p>
        </div>

        <div class="space-y-8 text-sm leading-7 text-slate-300 sm:text-base">
          <section>
            <h2 class="text-xl font-semibold text-white">1. What this policy covers</h2>
            <p class="mt-3">
              {{ siteIdentity.productName }} is a trading journal and review system created by
              {{ siteIdentity.creator.name }}. This policy applies to the app, the documentation
              site, and the backend services used to run CRS.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white">2. Information collected</h2>
            <div class="mt-3 space-y-3">
              <p>
                CRS may collect account details such as email address, username, password hash,
                optional profile information, and admin approval status.
              </p>
              <p>
                CRS also stores the trading data you choose to enter or import, including symbols,
                timestamps, prices, volume, journal notes, setups, checklist items, screenshots,
                account labels, and analytics derived from those records.
              </p>
              <p>
                Basic operational data may also be logged for security and reliability, such as
                request metadata, import history, login timestamps, and server error logs.
              </p>
            </div>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white">3. How information is used</h2>
            <ul class="mt-3 list-disc space-y-2 pl-5">
              <li>To authenticate users and secure accounts.</li>
              <li>To store, display, and analyze your trades and journal entries.</li>
              <li>To power imports, exports, backups, and admin workflows.</li>
              <li>To send essential account emails such as verification or password reset links.</li>
              <li>To maintain service stability, diagnose errors, and improve the product.</li>
            </ul>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white">4. Data sharing</h2>
            <p class="mt-3">
              CRS is not built around selling user data. Data may be processed by infrastructure
              providers you choose to use, such as hosting, database, email, backup, analytics, or
              file storage providers. If you self-host CRS, you control those providers directly.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white">5. Self-hosted deployments</h2>
            <p class="mt-3">
              When CRS is self-hosted, the operator of that instance is responsible for the server,
              database, backups, third-party integrations, and access control. If you publish CRS
              publicly, you should review this policy and tailor it to your actual infrastructure.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white">6. Security and retention</h2>
            <div class="mt-3 space-y-3">
              <p>
                CRS uses standard account authentication, token-based session flows, and database
                persistence. No internet-facing service can promise perfect security, so you should
                use strong credentials, keep software updated, and maintain tested backups.
              </p>
              <p>
                Trade and account data are retained until they are deleted by the user, removed by
                an administrator, or cleared as part of an operational recovery process.
              </p>
            </div>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white">7. Your controls</h2>
            <ul class="mt-3 list-disc space-y-2 pl-5">
              <li>You can review and edit your trade records inside the product.</li>
              <li>You can export supported data using the available export tools.</li>
              <li>You can request account deletion or administrative help through the support contact below.</li>
            </ul>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white">8. Policy updates</h2>
            <p class="mt-3">
              This page may be updated as CRS moves from local development to live hosting. Material
              changes should be reflected by updating the date shown at the top of this page.
            </p>
          </section>

          <section class="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
            <h2 class="text-xl font-semibold text-white">9. Contact</h2>
            <p class="mt-3">
              For privacy, account, or data questions, contact
              <a
                class="ml-1 text-amber-300 transition hover:text-amber-200"
                :href="`mailto:${siteIdentity.contact.supportEmail}`"
              >
                {{ siteIdentity.contact.supportEmail }}
              </a>.
            </p>
            <p class="mt-3 text-sm text-slate-400">
              Before public launch, review this policy against your real domain, hosting providers,
              analytics tools, and email service. If CRS will be used commercially, get a legal
              review for your jurisdiction.
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
  document.title = `Privacy policy | ${siteIdentity.shortProductName}`

  const metaDescription = document.querySelector('meta[name="description"]')
  if (metaDescription) {
    metaDescription.setAttribute(
      'content',
      `${siteIdentity.shortProductName} privacy policy covering account data, trade records, imports, and self-hosted operations.`
    )
  }

  let canonical = document.querySelector('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.setAttribute('rel', 'canonical')
    document.head.appendChild(canonical)
  }
  canonical.setAttribute('href', siteIdentity.urls.privacy)
})
</script>
