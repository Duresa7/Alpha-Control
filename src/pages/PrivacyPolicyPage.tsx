import { LegalShell } from '@/components/legal/LegalShell';
import { LEGAL_CONTACT_EMAIL, LEGAL_ENTITY_NAME, LEGAL_LAST_UPDATED } from '@/constants/legal';

export function PrivacyPolicyPage() {
  return (
    <LegalShell>
      <h1 className="legal-page__title">Privacy Policy</h1>
      <p className="legal-page__updated">Last updated: {LEGAL_LAST_UPDATED}</p>

      <section className="legal-page__section">
        <h2>1. Introduction and Scope</h2>
        <p>
          {LEGAL_ENTITY_NAME} is an unincorporated personal project operated by an individual based
          in the State of Maryland, United States. This Privacy Policy describes the types of
          information we collect from users of this web application (the &quot;Application&quot;),
          how we use and protect that information, the circumstances under which we may share it,
          and the rights you have regarding your personal information.
        </p>
        <p>
          This policy applies only to information collected through the Application itself. It does
          not apply to information collected through third-party services you use in connection with
          the Application, such as Supabase or PayPal, which have their own independent privacy
          policies.
        </p>
        <p>
          By creating an account or using the Application, you acknowledge that you have read and
          understood this Privacy Policy.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>2. Information We Collect</h2>

        <h3>Account Information</h3>
        <p>When you create an account, we collect the following information directly from you:</p>
        <ul>
          <li>
            <strong>Email address:</strong> Used to create and authenticate your account via
            Supabase Auth. Your email is stored securely by Supabase and is not displayed publicly
            within the Application.
          </li>
          <li>
            <strong>Display name:</strong> A name or username you provide at registration. This is
            displayed to you within the Application and may be visible to administrators.
          </li>
        </ul>

        <h3>Authentication Tokens</h3>
        <p>
          When you sign in, Supabase Auth issues a session token that is stored in your browser (via
          cookies or local storage). This token is used to maintain your authenticated session
          across page loads. We do not store or process this token independently; it is managed
          entirely by Supabase.
        </p>

        <h3>Server Log Data</h3>
        <p>
          When you access the Application, our hosting infrastructure automatically records standard
          server log data. This may include your IP address, browser type and version, operating
          system, the pages you access within the Application, referring URLs, and the date and time
          of your requests. This information is collected automatically and is used for security
          monitoring, abuse prevention, and infrastructure maintenance.
        </p>

        <h3>User-Generated Content (Administrator Accounts Only)</h3>
        <p>
          If you have been granted administrator access, any custom content you create within the
          Application (such as custom planets, custom fleets, or map modifications) is stored in our
          database together with your user ID. This association is used for attribution, audit
          logging, and accountability purposes.
        </p>

        <h3>Donation Information</h3>
        <p>
          We do not collect, receive, or store any financial or payment information. If you choose
          to make a voluntary donation through the PayPal link on our site, all payment processing
          is handled exclusively by PayPal. We have no access to your payment details, card numbers,
          bank account information, or PayPal account data.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>3. How We Collect Information</h2>
        <p>We collect information in the following ways:</p>
        <ul>
          <li>
            <strong>Directly from you:</strong> When you register for an account, you provide your
            email address and display name.
          </li>
          <li>
            <strong>Automatically:</strong> Server log data is collected automatically each time
            your browser makes a request to our hosting servers.
          </li>
          <li>
            <strong>Through your actions in the Application:</strong> If you are an authorized
            administrator and create or modify content, that content and your user ID are recorded
            in the database.
          </li>
        </ul>
      </section>

      <section className="legal-page__section">
        <h2>4. How We Use Your Information</h2>
        <p>We use the information we collect for the following purposes:</p>
        <ul>
          <li>To create and maintain your account and verify your identity when you sign in.</li>
          <li>
            To enforce role-based access controls, distinguishing between standard users and
            administrators.
          </li>
          <li>To display your chosen display name within the Application.</li>
          <li>
            To maintain audit logs of administrative actions for security and accountability
            purposes.
          </li>
          <li>
            To monitor server logs for signs of unauthorized access, abuse, or security threats.
          </li>
          <li>To respond to requests for account deletion or other user rights requests.</li>
        </ul>
        <p>
          We do not use your information for advertising, behavioral profiling, or marketing of any
          kind. We do not build profiles about you based on your usage of the Application.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>5. Information Sharing and Disclosure</h2>
        <p>
          We do not sell, rent, lease, or otherwise transfer your personal information to any third
          party for commercial purposes. We share your information only in the following limited
          circumstances:
        </p>

        <h3>Supabase</h3>
        <p>
          We use Supabase to provide authentication and database services for the Application. Your
          email address, display name, session data, and any user-generated content you create as an
          administrator are processed and stored by Supabase on our behalf. Supabase operates under
          its own{' '}
          <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>
          . Supabase has its own data processing and security practices, and we encourage you to
          review their policy.
        </p>

        <h3>Hosting Provider</h3>
        <p>
          The Application is hosted through a third-party infrastructure provider. That provider may
          process server log data (such as IP addresses and access timestamps) in the ordinary
          course of providing hosting services.
        </p>

        <h3>PayPal</h3>
        <p>
          If you choose to make a voluntary donation, you interact directly with PayPal through
          their platform. We do not receive any financial or personal data from PayPal as a result
          of donations. Your use of PayPal is governed by{' '}
          <a
            href="https://www.paypal.com/us/legalhub/privacy-full"
            target="_blank"
            rel="noopener noreferrer"
          >
            PayPal&apos;s Privacy Policy
          </a>
          .
        </p>

        <h3>Legal Requirements</h3>
        <p>
          We may disclose your information if required to do so by law, court order, or lawful
          request by government authorities, or when we believe in good faith that disclosure is
          necessary to protect our rights, protect your safety or the safety of others, investigate
          fraud or abuse, or comply with a legal obligation.
        </p>

        <h3>Successors</h3>
        <p>
          In the unlikely event that the Application or its assets are transferred to another
          individual or entity, user data may be included in that transfer. If this occurs, we will
          provide reasonable notice and the successor will be bound to honor this Privacy Policy or
          notify you of any material changes.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>6. Cookies and Tracking Technologies</h2>
        <p>
          We use only essential, strictly necessary cookies. Specifically, Supabase Auth places a
          session cookie in your browser when you sign in. This cookie is required for the
          Application to function correctly; without it, you cannot maintain an authenticated
          session.
        </p>
        <p>We do not use any of the following:</p>
        <ul>
          <li>Analytics cookies or tracking services (such as Google Analytics)</li>
          <li>Advertising or retargeting cookies</li>
          <li>Third-party tracking pixels or web beacons</li>
          <li>Social media tracking scripts</li>
          <li>Any cookies that track your behavior across other websites</li>
        </ul>
        <p>
          You may clear or block cookies through your browser settings at any time. Blocking or
          deleting the Supabase session cookie will sign you out of the Application and require you
          to sign in again.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>7. Data Storage and Security</h2>
        <p>
          Your account data and user-generated content are stored in a PostgreSQL database hosted by
          Supabase. Access to this database is governed by row-level security (RLS) policies, which
          ensure that each user can only access their own data. Administrator access is explicitly
          granted and logged.
        </p>
        <p>
          All data transmitted between your browser and our servers, and between our servers and
          Supabase, is protected using TLS/SSL encryption. We follow industry-standard security
          practices in our development and infrastructure configuration.
        </p>
        <p>
          However, no method of electronic transmission or storage is completely secure. We cannot
          guarantee the absolute security of your information. You use the Application at your own
          risk with respect to any data you choose to provide.
        </p>
        <p>
          In the event of a data breach that affects your personal information, we will notify
          affected users in compliance with the Maryland Personal Information Protection Act (MPIPA)
          and any other applicable federal or state breach notification laws. Notification will be
          sent to the email address associated with your account as promptly as practicable under
          the circumstances.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>8. Data Retention</h2>
        <p>
          We retain your account information (email address and display name) for as long as your
          account remains active. If you request deletion of your account, we will delete your
          personal information from our primary database within 30 days of verifying your request.
          Residual copies may remain in database backups for a limited period until those backups
          are overwritten or deleted in the normal course of operations.
        </p>
        <p>
          Server log data is retained for a rolling period determined by our hosting provider for
          security and operational purposes.
        </p>
        <p>
          User-generated content created by administrator accounts (such as custom planets or
          fleets) is associated with your user ID. Upon account deletion, we will also remove or
          disassociate that content from your user ID to the extent technically feasible.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>9. Your Privacy Rights</h2>
        <p>
          Depending on where you reside, you may have certain legal rights regarding your personal
          information. To exercise any of the rights described below, please contact us at{' '}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>. We will respond to
          verified requests within 30 days. We may ask you to verify your identity before processing
          a request.
        </p>

        <h3>All Users</h3>
        <ul>
          <li>
            <strong>Right to access:</strong> You may request a copy of the personal information we
            hold about you.
          </li>
          <li>
            <strong>Right to correction:</strong> You may request that we correct inaccurate or
            incomplete personal information.
          </li>
          <li>
            <strong>Right to deletion:</strong> You may request that we delete your account and
            associated personal data.
          </li>
        </ul>

        <h3>Maryland Residents</h3>
        <p>
          As a Maryland resident, you have rights under the Maryland Personal Information Protection
          Act (MPIPA), including the right to receive timely notification in the event that your
          personal information is compromised in a security breach. You also have the right to
          request correction or deletion of your personal information.
        </p>

        <h3>California Residents (CCPA / CPRA)</h3>
        <p>
          If you are a California resident, you have rights under the California Consumer Privacy
          Act (CCPA) as amended by the California Privacy Rights Act (CPRA), including:
        </p>
        <ul>
          <li>The right to know what personal information we collect and how we use it.</li>
          <li>The right to request deletion of your personal information.</li>
          <li>
            The right to opt out of the sale of your personal information. We do not sell personal
            information.
          </li>
          <li>The right to non-discrimination for exercising your CCPA/CPRA rights.</li>
          <li>The right to correct inaccurate personal information we hold about you.</li>
        </ul>

        <h3>Residents of Colorado, Virginia, Connecticut, Utah, and Other US States</h3>
        <p>
          Residents of states that have enacted comprehensive consumer privacy laws may have rights
          similar to those described above, including rights to access, correct, delete, and obtain
          a portable copy of their personal data. Contact us to exercise any of these rights.
        </p>

        <h3>Canadian Residents (PIPEDA)</h3>
        <p>
          If you are a Canadian resident, the Personal Information Protection and Electronic
          Documents Act (PIPEDA) provides you with the right to access personal information we hold
          about you, challenge its accuracy, and withdraw consent for the collection, use, or
          disclosure of your personal information, subject to certain legal limitations. Contact us
          to submit a request.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>10. Children&apos;s Privacy (COPPA)</h2>
        <p>
          The Application is not directed to, and is not intended for use by, children under the age
          of 13. We do not knowingly collect personal information from children under 13 years of
          age. If we become aware that a child under 13 has provided us with personal information
          without verifiable parental consent, we will delete that information from our records as
          quickly as possible.
        </p>
        <p>
          If you are a parent or guardian and believe that your child under 13 has provided personal
          information to us, please contact us immediately at{' '}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>11. Donations</h2>
        <p>
          The Application includes a link to a voluntary donation page hosted by PayPal. Donations
          are entirely optional and confer no additional rights, access, or benefits within the
          Application.
        </p>
        <p>
          We do not collect, process, or store any financial information, payment card data, or
          PayPal account information. All donation transactions are processed exclusively by PayPal
          under their own Privacy Policy and Terms of Service. Any questions regarding donation
          transactions should be directed to PayPal.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>12. Changes to This Privacy Policy</h2>
        <p>
          We may update this Privacy Policy from time to time to reflect changes in our practices,
          legal requirements, or the Application&apos;s features. When we make changes, we will
          update the &quot;Last updated&quot; date at the top of this page. For material changes, we
          will place a notice on this page for a reasonable period following the update.
        </p>
        <p>
          Your continued use of the Application after any changes to this Privacy Policy constitutes
          your acceptance of the updated policy. If you do not agree with the changes, you should
          discontinue use of the Application and may request deletion of your account.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>13. Contact Information</h2>
        <p>
          If you have questions about this Privacy Policy, wish to exercise your privacy rights, or
          need to report a concern regarding the collection or use of your personal information,
          please contact us:
        </p>
        <ul>
          <li>
            <strong>Project:</strong> {LEGAL_ENTITY_NAME}
          </li>
          <li>
            <strong>Email:</strong>{' '}
            <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>
          </li>
        </ul>
        <p>We will make every reasonable effort to respond to your inquiry within 30 days.</p>
      </section>
    </LegalShell>
  );
}
