'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  User,
  Building2,
  Mail,
  Phone,
  Globe,
  Palette,
  Bell,
  Shield,
  LogOut,
  Save,
  Loader2,
  Check,
  Settings,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react'
import { MainNavAuth } from '@/components/main-nav-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

type SettingsTab = 'profile' | 'preferences' | 'notifications' | 'account'

interface BusinessData {
  id: string
  business_name: string
  email: string
  phone: string | null
  website: string | null
  description: string | null
  default_language: string
  notification_preferences: {
    email_updates: boolean
    marketing_emails: boolean
  }
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [business, setBusiness] = useState<BusinessData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [formData, setFormData] = useState({
    business_name: '',
    email: '',
    phone: '',
    website: '',
    description: '',
    default_language: 'en',
  })
  const [notifications, setNotifications] = useState({
    email_updates: true,
    marketing_emails: false,
  })
  // Password change state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [passwordChanging, setPasswordChanging] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadBusiness = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        const { data: businessData } = await supabase
          .from('businesses')
          .select('*')
          .eq('auth_user_id', user.id)
          .single()

        if (businessData) {
          setBusiness(businessData)
          setFormData({
            business_name: businessData.business_name || '',
            email: businessData.email || user.email || '',
            phone: businessData.phone || '',
            website: businessData.website || '',
            description: businessData.description || '',
            default_language: businessData.default_language || 'en',
          })
          setNotifications(businessData.notification_preferences || {
            email_updates: true,
            marketing_emails: false,
          })
        }
      } catch (err) {
        console.error('Error loading business:', err)
      } finally {
        setLoading(false)
      }
    }
    loadBusiness()
  }, [router, supabase])

  const handleSave = async () => {
    if (!business) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('businesses')
        .update({
          business_name: formData.business_name,
          phone: formData.phone || null,
          website: formData.website || null,
          description: formData.description || null,
          default_language: formData.default_language,
          notification_preferences: notifications,
          updated_at: new Date().toISOString(),
        })
        .eq('id', business.id)

      if (error) throw error

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('Error saving:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const handlePasswordChange = async () => {
    setPasswordError(null)
    setPasswordSuccess(false)

    // Validate passwords
    if (!newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    setPasswordChanging(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      setPasswordSuccess(true)
      // Clear form
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      // Close dialog after 2 seconds
      setTimeout(() => {
        setPasswordDialogOpen(false)
        setPasswordSuccess(false)
      }, 2000)
    } catch (err) {
      console.error('Password change error:', err)
      setPasswordError((err as Error).message || 'Failed to change password')
    } finally {
      setPasswordChanging(false)
    }
  }

  const resetPasswordDialog = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError(null)
    setPasswordSuccess(false)
    setShowPasswords(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MainNavAuth />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNavAuth />
      <div className="pt-20 flex">
        {/* Left Sidebar */}
        <aside className="hidden lg:block w-64 border-r border-border h-[calc(100vh-80px)] sticky top-20 overflow-y-auto p-6">
          {/* Settings Navigation */}
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              SETTINGS
            </h3>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors',
                  activeTab === 'profile'
                    ? 'bg-muted text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Building2 className="h-4 w-4" />
                <span>Business Profile</span>
              </button>
              <button
                onClick={() => setActiveTab('preferences')}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors',
                  activeTab === 'preferences'
                    ? 'bg-muted text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Palette className="h-4 w-4" />
                <span>Preferences</span>
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors',
                  activeTab === 'notifications'
                    ? 'bg-muted text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Bell className="h-4 w-4" />
                <span>Notifications</span>
              </button>
              <button
                onClick={() => setActiveTab('account')}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors',
                  activeTab === 'account'
                    ? 'bg-muted text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Shield className="h-4 w-4" />
                <span>Account</span>
              </button>
            </nav>
          </div>

          {/* Account Info */}
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              ACCOUNT
            </h3>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {formData.business_name || 'Your Business'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {formData.email}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              DANGER ZONE
            </h3>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full text-destructive hover:bg-destructive/10">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sign out?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You'll need to sign in again to access your account.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSignOut}>
                    Sign Out
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {/* Mobile Tab Navigation */}
          <div className="lg:hidden mb-4 sm:mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {[
                { id: 'profile', label: 'Profile', icon: Building2 },
                { id: 'preferences', label: 'Prefs', icon: Palette },
                { id: 'notifications', label: 'Alerts', icon: Bell },
                { id: 'account', label: 'Account', icon: Shield },
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab(tab.id as SettingsTab)}
                  className={cn(
                    "shrink-0 text-xs sm:text-sm",
                    activeTab === tab.id && "bg-orange-500 hover:bg-orange-600"
                  )}
                >
                  <tab.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-bold">
              {activeTab === 'profile' && 'Business Profile'}
              {activeTab === 'preferences' && 'Preferences'}
              {activeTab === 'notifications' && 'Notifications'}
              {activeTab === 'account' && 'Account Security'}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {activeTab === 'profile' && 'Update your business details'}
              {activeTab === 'preferences' && 'Configure default options'}
              {activeTab === 'notifications' && 'Choose what emails you receive'}
              {activeTab === 'account' && 'Manage your security settings'}
            </p>
          </div>

          {/* Business Profile Content */}
          {activeTab === 'profile' && (
            <div className="space-y-4 sm:space-y-6 max-w-2xl">
              <Card>
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="text-base sm:text-lg">Business Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="business_name">Business Name</Label>
                      <Input
                        id="business_name"
                        value={formData.business_name}
                        onChange={(e) => setFormData(f => ({ ...f, business_name: e.target.value }))}
                        placeholder="Your Restaurant Name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        Contact support to change your email
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(f => ({ ...f, phone: e.target.value }))}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData(f => ({ ...f, website: e.target.value }))}
                        placeholder="https://yourrestaurant.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Business Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                      placeholder="Tell us about your restaurant, cuisine type, and specialties..."
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      This helps AI generate better captions tailored to your brand
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : saved ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Saved!
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Preferences Content */}
          {activeTab === 'preferences' && (
            <div className="space-y-4 sm:space-y-6 max-w-2xl">
              <Card>
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="text-base sm:text-lg">Default Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Default Caption Language</Label>
                    <Select
                      value={formData.default_language}
                      onValueChange={(value) => setFormData(f => ({ ...f, default_language: value }))}
                    >
                      <SelectTrigger className="w-full md:w-64">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="zh">简体中文 (Simplified Chinese)</SelectItem>
                        <SelectItem value="zh-tw">繁體中文 (Traditional Chinese)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      The default language for AI-generated captions
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="text-base sm:text-lg">AI Enhancement</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Automation features coming soon</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between opacity-50">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Label>Auto-enhance on upload</Label>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded">Coming Soon</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Automatically enhance images when uploaded
                      </p>
                    </div>
                    <Switch disabled />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between opacity-50">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Label>Generate caption automatically</Label>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded">Coming Soon</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Auto-generate captions after enhancement
                      </p>
                    </div>
                    <Switch disabled />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="text-base sm:text-lg">Export Settings</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Export customization coming soon</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between opacity-50">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Label>Add watermark</Label>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded">Coming Soon</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Add your business name watermark to exports
                      </p>
                    </div>
                    <Switch disabled />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between opacity-50">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Label>High-resolution export</Label>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded">Coming Soon</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Export at maximum resolution (uses more credits)
                      </p>
                    </div>
                    <Switch disabled />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Notifications Content */}
          {activeTab === 'notifications' && (
            <div className="space-y-4 sm:space-y-6 max-w-2xl">
              <Card>
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="text-base sm:text-lg">Email Notifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Product Updates</Label>
                      <p className="text-xs text-muted-foreground">
                        News about new features and improvements
                      </p>
                    </div>
                    <Switch
                      checked={notifications.email_updates}
                      onCheckedChange={(checked) =>
                        setNotifications(n => ({ ...n, email_updates: checked }))
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Marketing Emails</Label>
                      <p className="text-xs text-muted-foreground">
                        Tips, tutorials, and promotional offers
                      </p>
                    </div>
                    <Switch
                      checked={notifications.marketing_emails}
                      onCheckedChange={(checked) =>
                        setNotifications(n => ({ ...n, marketing_emails: checked }))
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between opacity-50">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Label>Credit Alerts</Label>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded">Coming Soon</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Notifications when credits are running low
                      </p>
                    </div>
                    <Switch disabled defaultChecked />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between opacity-50">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Label>Post Confirmations</Label>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded">Coming Soon</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Email when scheduled posts are published
                      </p>
                    </div>
                    <Switch disabled defaultChecked />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Notifications
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Account Content */}
          {activeTab === 'account' && (
            <div className="space-y-4 sm:space-y-6 max-w-2xl">
              <Card>
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="text-base sm:text-lg">Password & Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                    <div>
                      <p className="font-medium text-sm sm:text-base">Password</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Update your account password
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        resetPasswordDialog()
                        setPasswordDialogOpen(true)
                      }}
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      Change Password
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Password Change Dialog */}
              <Dialog
                open={passwordDialogOpen}
                onOpenChange={(open) => {
                  setPasswordDialogOpen(open)
                  if (!open) resetPasswordDialog()
                }}
              >
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-orange-500" />
                      Change Password
                    </DialogTitle>
                    <DialogDescription>
                      Enter your new password below. Password must be at least 8 characters.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    {/* New Password */}
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={showPasswords ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          className="pr-10"
                          disabled={passwordChanging || passwordSuccess}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(!showPasswords)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showPasswords ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type={showPasswords ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        disabled={passwordChanging || passwordSuccess}
                      />
                    </div>

                    {/* Error message */}
                    {passwordError && (
                      <Alert variant="destructive">
                        <AlertDescription>{passwordError}</AlertDescription>
                      </Alert>
                    )}

                    {/* Success message */}
                    {passwordSuccess && (
                      <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
                        <Check className="h-4 w-4 text-green-500" />
                        <AlertDescription className="text-green-700 dark:text-green-300">
                          Password changed successfully!
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setPasswordDialogOpen(false)}
                      disabled={passwordChanging}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-orange-500 hover:bg-orange-600"
                      onClick={handlePasswordChange}
                      disabled={passwordChanging || passwordSuccess || !newPassword || !confirmPassword}
                    >
                      {passwordChanging ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Changing...
                        </>
                      ) : (
                        'Change Password'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Card>
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="text-base sm:text-lg">Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                        <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm sm:text-base">Current Session</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Active now
                        </p>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto text-destructive">
                          <LogOut className="mr-2 h-4 w-4" />
                          Sign Out
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Sign out?</AlertDialogTitle>
                          <AlertDialogDescription>
                            You'll need to sign in again to access your account.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleSignOut}>
                            Sign Out
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-destructive/50">
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="text-base sm:text-lg text-destructive">Danger Zone</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Irreversible and destructive actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-sm sm:text-base">Delete Account</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Permanently delete your account and all data
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto text-destructive hover:bg-destructive/10"
                      onClick={() => window.open('mailto:support@zazzles.ai?subject=Account Deletion Request', '_blank')}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Contact Support
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    To delete your account, please contact our support team. We'll help you export your data and process your request within 48 hours.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
