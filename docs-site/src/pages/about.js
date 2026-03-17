import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

function BuildIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 3a5 5 0 0 0-4.22 7.68l-6 6a1.5 1.5 0 0 0 2.12 2.12l6-6A5 5 0 1 0 14 3Z" fill="currentColor" />
    </svg>
  );
}

function ImportIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v10m0 0 4-4m-4 4-4-4M5 15v3a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DeployIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 4 7v5c0 5 3.4 8 8 9 4.6-1 8-4 8-9V7l-8-4Zm0 5v8m0 0 3-3m-3 3-3-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6h16v12H4zM4 7l8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3a9 9 0 1 0 0 18m0-18c2.5 2.4 4 5.6 4 9s-1.5 6.6-4 9m0-18c-2.5 2.4-4 5.6-4 9s1.5 6.6 4 9m-8-9h16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3a9 9 0 0 0-2.85 17.53c.45.09.62-.19.62-.43v-1.53c-2.54.55-3.07-1.08-3.07-1.08-.42-1.05-1.02-1.33-1.02-1.33-.84-.57.06-.56.06-.56.93.07 1.42.95 1.42.95.83 1.4 2.18 1 2.71.77.08-.6.32-1 .58-1.23-2.03-.23-4.16-1-4.16-4.5 0-1 .36-1.82.95-2.46-.1-.23-.41-1.17.09-2.43 0 0 .78-.25 2.55.94A8.8 8.8 0 0 1 12 7.8c.78 0 1.56.1 2.3.3 1.77-1.2 2.55-.94 2.55-.94.5 1.26.19 2.2.09 2.43.59.64.95 1.46.95 2.46 0 3.5-2.14 4.27-4.17 4.5.33.28.62.82.62 1.65v2.45c0 .24.16.53.63.43A9 9 0 0 0 12 3Z" fill="currentColor" />
    </svg>
  );
}

const features = [
  {
    eyebrow: 'Build',
    title: 'Set up CRS locally',
    body: 'Run frontend, backend, Postgres, and Adminer with one clear local layout.',
    to: '/getting-started/local-setup',
    icon: BuildIcon,
  },
  {
    eyebrow: 'Operate',
    title: 'Import broker CSVs cleanly',
    body: 'Use the CRS-native import pipeline, duplicate safeguards, and skipped-row reports.',
    to: '/workflows/import-export',
    icon: ImportIcon,
  },
  {
    eyebrow: 'Ship',
    title: 'Prepare for deployment',
    body: 'Use the documented env structure, Docker path, and deployment checklist when you go live.',
    to: '/operations/deployment',
    icon: DeployIcon,
  },
];

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  const siteIdentity = siteConfig.customFields.siteIdentity;

  return (
    <Layout
      title="CRS Docs"
      description="CRS documentation for setup, import workflows, data model, and deployment."
    >
      <main className="crs-home">
        <section className="crs-hero">
          <div className="crs-grid" />
          <div className="crs-hero__content">
            <p className="crs-kicker">Codem System Rule</p>
            <h1>Documentation built around the actual product.</h1>
            <p className="crs-lead">
              These docs cover the current CRS workflow: trade capture, imports, analytics,
              backend setup, and deployment.
            </p>
            <div className="crs-actions">
              <Link className="button button--primary button--lg" to="/getting-started/overview">
                Open docs
              </Link>
              <Link className="button button--secondary button--lg" to="/workflows/import-export">
                Import workflow
              </Link>
            </div>
          </div>
          <div className="crs-hero__panel">
            <div className="crs-terminal">
              <div className="crs-terminal__head">
                <span />
                <span />
                <span />
              </div>
              <pre>{`frontend  : http://localhost:5173
backend   : http://localhost:3000
postgres  : docker on 5433
adminer   : http://localhost:8080

mode      : CRS-only workflow
imports   : CRS-native + broker CSV
auth      : local + admin-capable`}</pre>
            </div>
          </div>
        </section>

        <section className="crs-feature-strip">
          {features.map((feature) => (
            <Link key={feature.title} className="crs-card" to={feature.to}>
              <div className="crs-card__icon">
                <feature.icon />
              </div>
              <p className="crs-card__eyebrow">{feature.eyebrow}</p>
              <h2>{feature.title}</h2>
              <p>{feature.body}</p>
            </Link>
          ))}
        </section>

        <section className="crs-proof">
          <div className="crs-proof__copy">
            <p className="crs-kicker">Why this docs site exists</p>
            <h2>Keep the documentation aligned with the product.</h2>
            <p>
              The repo still contains older markdown from the wider legacy platform. This site keeps
              the main CRS path in one place: setup, imports, persistence, repair scripts, and deployment.
            </p>
          </div>
          <div className="crs-proof__stats">
            <div>
              <strong>5</strong>
              <span>core app surfaces</span>
            </div>
            <div>
              <strong>CRS-first</strong>
              <span>import and export contract</span>
            </div>
            <div>
              <strong>Self-hosted</strong>
              <span>local-first deployment path</span>
            </div>
          </div>
        </section>

        <section className="crs-founder">
          <div className="crs-founder__image">
            <img src="/img/keith-odera.png" alt="Keith Odera" />
          </div>
          <div className="crs-founder__copy">
            <p className="crs-kicker">Created by {siteIdentity.creator.name}</p>
            <h2>{siteIdentity.creator.title}</h2>
            <p>
              {siteIdentity.creator.name} is a {siteIdentity.creator.location}-based builder focused on turning trading workflow ideas into
              clear, usable systems. CRS reflects that approach: iterate until the workflow is right,
              then refine it until it feels dependable.
            </p>
            <div className="crs-actions">
              <Link className="button button--primary button--lg" to="/getting-started/overview">
                Explore docs
              </Link>
              <a className="button button--secondary button--lg" href={siteIdentity.contact.portfolioUrl} target="_blank" rel="noreferrer">
                View portfolio
              </a>
            </div>
            <div className="crs-founder__links">
              <a href={`mailto:${siteIdentity.contact.supportEmail}`}>
                <MailIcon />
                <span>{siteIdentity.contact.supportEmail}</span>
              </a>
              <a href={siteIdentity.contact.portfolioUrl} target="_blank" rel="noreferrer">
                <GlobeIcon />
                <span>Portfolio</span>
              </a>
              <a href={siteIdentity.contact.repositoryUrl} target="_blank" rel="noreferrer">
                <GitHubIcon />
                <span>GitHub</span>
              </a>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
