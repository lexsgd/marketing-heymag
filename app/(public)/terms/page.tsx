import Link from 'next/link'
import { ArrowLeft, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Camera className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl">FoodSnap AI</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-orange-500 hover:bg-orange-600">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-muted-foreground mb-8">
            Last updated: December 16, 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using FoodSnap AI (&quot;Service&quot;), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use our Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p>
              FoodSnap AI provides AI-powered food photography enhancement and social media content generation tools.
              Our Service allows users to:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Upload and enhance food photos using AI technology</li>
              <li>Apply various style presets optimized for different platforms</li>
              <li>Generate AI-powered captions in multiple languages</li>
              <li>Post content to connected social media platforms</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <p>
              To access certain features, you must create an account. You are responsible for:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized access</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Usage Credits</h2>
            <p>
              Our Service operates on a credit-based system. Credits are used for AI enhancements and other premium features.
              Credits are non-refundable and expire according to your subscription plan terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Content Ownership</h2>
            <p>
              You retain ownership of all photos and content you upload. By using our Service, you grant us a
              limited license to process your content solely for providing our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Prohibited Uses</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Upload content that violates any laws or third-party rights</li>
              <li>Use the Service for fraudulent or deceptive purposes</li>
              <li>Attempt to reverse engineer or exploit our AI systems</li>
              <li>Exceed rate limits or abuse the Service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Payment Terms</h2>
            <p>
              Subscription fees are billed in advance on a monthly or annual basis.
              You may cancel at any time, but refunds are not provided for partial periods.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
            <p>
              FoodSnap AI is provided &quot;as is&quot; without warranties. We are not liable for any indirect,
              incidental, or consequential damages arising from your use of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. Continued use of the Service after changes
              constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at{' '}
              <a href="mailto:support@heymag.app" className="text-orange-500 hover:underline">
                support@heymag.app
              </a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 FoodSnap AI. All rights reserved.</p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/" className="hover:text-foreground">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
